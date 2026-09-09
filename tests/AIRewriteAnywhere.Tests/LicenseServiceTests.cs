using System;
using System.IO;
using System.Threading.Tasks;
using AIRewriteAnywhere.Logging;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.Security;
using AIRewriteAnywhere.Settings;
using Xunit;

namespace AIRewriteAnywhere.Tests;

public class LicenseServiceTests : IDisposable
{
    private readonly string _tempSettingsPath;
    private readonly SettingsService _settingsService;
    private readonly ISecureStorage _secureStorage;
    private readonly IAppLogger _logger;
    private readonly LicenseService _licenseService;

    public LicenseServiceTests()
    {
        _tempSettingsPath = Path.Combine(Path.GetTempPath(), $"test_license_settings_{Guid.NewGuid():N}.json");
        _settingsService = new SettingsService(_tempSettingsPath);
        _secureStorage = new DpapiSecureStorage();
        _logger = new FileLogger();
        _licenseService = new LicenseService(_settingsService, _secureStorage, _logger);
    }

    public void Dispose()
    {
        try { File.Delete(_tempSettingsPath); } catch { }
    }

    [Fact]
    public void HardwareIdHelper_ReturnsValidHardwareIdentifier()
    {
        var hwid = HardwareIdHelper.GetMachineHardwareId();
        Assert.NotNull(hwid);
        Assert.StartsWith("HWID-", hwid);
        Assert.True(hwid.Length >= 15);
    }

    [Fact]
    public async Task ActivateLicenseAsync_RejectsInvalidFormat()
    {
        await _settingsService.LoadAsync();
        var result = await _licenseService.ActivateLicenseAsync("INVALID-KEY");
        Assert.False(result.Success);
        Assert.Contains("ARW-XXXX-XXXX-XXXX-XXXX", result.Message);
    }

    [Fact]
    public async Task ActivateLicenseAsync_RejectsArbitraryUnregisteredKey()
    {
        await _settingsService.LoadAsync();
        var result = await _licenseService.ActivateLicenseAsync("ARW-FAKE-9999-ABCD-EFGH");
        Assert.False(result.Success);
    }

    [Fact]
    public async Task ActivateLicenseAsync_ActivatesOfflineDemoKey()
    {
        await _settingsService.LoadAsync();
        var result = await _licenseService.ActivateLicenseAsync("ARW-COMM-DEMO-2026-PASS");

        Assert.True(result.Success);
        Assert.True(_settingsService.Settings.IsLicenseActive);
        Assert.Equal("ARW-COMM-DEMO-2026-PASS", _settingsService.Settings.LicenseKey);
        Assert.NotNull(_settingsService.Settings.LicenseMachineId);
        Assert.False(string.IsNullOrEmpty(_settingsService.Settings.LicenseActivatedAt));
        Assert.True(_licenseService.IsLicensed);
    }

    [Fact]
    public async Task DeactivateLicense_ClearsLicenseState()
    {
        await _settingsService.LoadAsync();
        await _licenseService.ActivateLicenseAsync("ARW-COMM-DEMO-2026-PASS");
        Assert.True(_licenseService.IsLicensed);

        _licenseService.DeactivateLicense();
        Assert.False(_licenseService.IsLicensed);
        Assert.False(_settingsService.Settings.IsLicenseActive);
        Assert.Empty(_settingsService.Settings.LicenseKey);
    }
}
