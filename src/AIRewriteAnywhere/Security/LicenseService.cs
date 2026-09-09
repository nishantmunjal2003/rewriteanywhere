using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AIRewriteAnywhere.Logging;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.Settings;

namespace AIRewriteAnywhere.Security;

public class LicenseService : ILicenseService
{
    private static readonly Regex KeyRegex = new(@"^ARW-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private readonly ISettingsService _settingsService;
    private readonly ISecureStorage _secureStorage;
    private readonly IAppLogger _logger;
    private readonly HttpClient _httpClient;

    private const string LicenseStorageKey = "App_License_Token";

    public static readonly string[] ActivationEndpoints = new[]
    {
        "http://localhost:3000/api/license/activate",
        "http://127.0.0.1:3000/api/license/activate",
        "https://rewriteanywhere.com/api/license/activate"
    };

    public static readonly string[] VerificationEndpoints = new[]
    {
        "http://localhost:3000/api/license/verify",
        "http://127.0.0.1:3000/api/license/verify",
        "https://rewriteanywhere.com/api/license/verify"
    };

    public LicenseService(
        ISettingsService settingsService,
        ISecureStorage secureStorage,
        IAppLogger logger,
        HttpClient? httpClient = null)
    {
        _settingsService = settingsService;
        _secureStorage = secureStorage;
        _logger = logger;
        _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
    }

    public string MachineId => HardwareIdHelper.GetMachineHardwareId();

    public bool IsLicensed
    {
        get
        {
            var settings = _settingsService.Settings;
            if (!settings.IsLicenseActive || string.IsNullOrWhiteSpace(settings.LicenseKey))
            {
                return false;
            }

            // Verify stored machine binding matches this PC
            if (!string.Equals(settings.LicenseMachineId, MachineId, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning($"License machine ID mismatch: Stored={settings.LicenseMachineId}, Current={MachineId}");
                return false;
            }

            // Verify key format
            if (!KeyRegex.IsMatch(settings.LicenseKey.Trim()))
            {
                return false;
            }

            // Verify secure DPAPI storage token
            var token = _secureStorage.GetSecret(LicenseStorageKey);
            if (string.IsNullOrWhiteSpace(token))
            {
                return false;
            }

            return true;
        }
    }

    public string ActiveLicenseKey => _settingsService.Settings.LicenseKey;

    public async Task<LicenseActivationResult> ActivateLicenseAsync(string licenseKey)
    {
        var cleanKey = licenseKey.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(cleanKey))
        {
            return new LicenseActivationResult(false, "Please enter a valid license key.");
        }

        if (!KeyRegex.IsMatch(cleanKey))
        {
            return new LicenseActivationResult(false, "Invalid license key format. Expected: ARW-XXXX-XXXX-XXXX-XXXX");
        }

        var machineId = MachineId;

        // Try online activation against configured endpoints (localhost:3000 first)
        bool serverReached = false;
        string? serverErrorMessage = null;

        foreach (var endpoint in ActivationEndpoints)
        {
            try
            {
                var payload = new
                {
                    licenseKey = cleanKey,
                    machineId = machineId,
                    machineName = Environment.MachineName,
                    userName = Environment.UserName
                };

                _logger.LogInfo($"Attempting license activation with server endpoint: {endpoint}");
                var response = await _httpClient.PostAsJsonAsync(endpoint, payload);
                serverReached = true;

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<JsonElement>();
                    if (result.TryGetProperty("success", out var successProp) && successProp.GetBoolean())
                    {
                        var signature = result.TryGetProperty("signature", out var sigProp) ? sigProp.GetString() : null;
                        var tier = result.TryGetProperty("tier", out var tierProp) ? tierProp.GetString() : "USD_19";

                        SaveActivation(cleanKey, machineId, signature, tier);
                        return new LicenseActivationResult(true, "License successfully verified and activated online for this PC!", cleanKey);
                    }
                    else
                    {
                        var msg = result.TryGetProperty("message", out var m) ? m.GetString() : "Activation rejected by server.";
                        return new LicenseActivationResult(false, msg ?? "Activation rejected.");
                    }
                }
                else if ((int)response.StatusCode == 404)
                {
                    // Server responded that key DOES NOT EXIST in database
                    var errObj = await response.Content.ReadFromJsonAsync<JsonElement>();
                    var errorMsg = errObj.TryGetProperty("message", out var m)
                        ? m.GetString()
                        : "Invalid license key. This key does not exist in our licensing records.";
                    _logger.LogWarning($"License key {cleanKey} not found in database: {errorMsg}");
                    return new LicenseActivationResult(false, errorMsg ?? "License key not found in records.");
                }
                else if ((int)response.StatusCode == 403 || (int)response.StatusCode == 409)
                {
                    // Server responded that key is already bound to another PC or revoked
                    var errObj = await response.Content.ReadFromJsonAsync<JsonElement>();
                    var errorMsg = errObj.TryGetProperty("message", out var m)
                        ? m.GetString()
                        : "License activation failed. Key may be active on another PC or revoked.";
                    _logger.LogWarning($"License activation forbidden for {cleanKey}: {errorMsg}");
                    return new LicenseActivationResult(false, errorMsg ?? "License activation forbidden.");
                }
                else
                {
                    serverErrorMessage = $"Server returned HTTP {(int)response.StatusCode}";
                }
            }
            catch (Exception ex)
            {
                _logger.LogInfo($"Could not reach {endpoint}: {ex.Message}");
            }
        }

        // Offline demo key check (only for specific demo key if offline)
        if (!serverReached && cleanKey == "ARW-COMM-DEMO-2026-PASS")
        {
            SaveActivation(cleanKey, machineId, "OFFLINE_DEMO_SIGNATURE", "DEMO");
            return new LicenseActivationResult(true, "Offline demo license activated.", cleanKey);
        }

        if (serverReached && !string.IsNullOrEmpty(serverErrorMessage))
        {
            return new LicenseActivationResult(false, serverErrorMessage);
        }

        return new LicenseActivationResult(false, "Could not connect to online licensing server (http://localhost:3000). Please ensure your web server is running and try again.");
    }

    public async Task<bool> VerifyLicenseOnlineAsync()
    {
        var settings = _settingsService.Settings;
        if (!settings.IsLicenseActive || string.IsNullOrWhiteSpace(settings.LicenseKey))
        {
            return false;
        }

        var machineId = MachineId;
        var cleanKey = settings.LicenseKey.Trim().ToUpperInvariant();

        foreach (var endpoint in VerificationEndpoints)
        {
            try
            {
                var payload = new
                {
                    licenseKey = cleanKey,
                    machineId = machineId
                };

                var response = await _httpClient.PostAsJsonAsync(endpoint, payload);
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<JsonElement>();
                    if (result.TryGetProperty("valid", out var validProp) && validProp.GetBoolean())
                    {
                        return true;
                    }
                    else
                    {
                        _logger.LogWarning($"Online verification failed for key {cleanKey}. Deactivating local license.");
                        DeactivateLicense();
                        return false;
                    }
                }
                else if ((int)response.StatusCode == 403 || (int)response.StatusCode == 404)
                {
                    _logger.LogWarning($"Server revoked or released key {cleanKey}. Deactivating local license.");
                    DeactivateLicense();
                    return false;
                }
            }
            catch
            {
                // Network failure: allow grace period if DPAPI token is intact
            }
        }

        // If offline, check local DPAPI state
        return IsLicensed;
    }

    public void DeactivateLicense()
    {
        _settingsService.Settings.IsLicenseActive = false;
        _settingsService.Settings.LicenseKey = string.Empty;
        _settingsService.Settings.LicenseActivatedAt = string.Empty;
        _settingsService.Settings.LicenseMachineId = string.Empty;
        _secureStorage.DeleteSecret(LicenseStorageKey);
        _ = _settingsService.SaveAsync();
        _logger.LogInfo("License deactivated on this machine.");
    }

    private void SaveActivation(string key, string machineId, string? signature = null, string? tier = null)
    {
        var settings = _settingsService.Settings;
        settings.IsLicenseActive = true;
        settings.LicenseKey = key;
        settings.LicenseMachineId = machineId;
        settings.LicenseActivatedAt = DateTime.UtcNow.ToString("O");

        // Save encrypted token in DPAPI storage
        var token = JsonSerializer.Serialize(new
        {
            key,
            machineId,
            activatedAt = settings.LicenseActivatedAt,
            signature = signature ?? "LOCAL_AUTH",
            tier = tier ?? "USD_19"
        });
        _secureStorage.SaveSecret(LicenseStorageKey, token);

        _ = _settingsService.SaveAsync();
        _logger.LogInfo($"License key {key[..7]}... activated for machine {machineId}.");
    }
}
