using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace AIRewriteAnywhere.Security;

public class DpapiSecureStorage : ISecureStorage
{
    private readonly string _storageFilePath;
    private readonly byte[] _entropy;
    private readonly object _lock = new();

    // App-specific entropy byte sequence
    private static readonly byte[] DefaultEntropy = new byte[] { 0xA1, 0x5C, 0x89, 0x33, 0xEF, 0x12, 0x47, 0x9B, 0xCD, 0x78, 0x24, 0x61, 0x88, 0x3E, 0x90, 0x15 };

    public DpapiSecureStorage(string? customFilePath = null, byte[]? customEntropy = null)
    {
        if (string.IsNullOrWhiteSpace(customFilePath))
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            var dir = Path.Combine(appData, "AIRewriteAnywhere");
            Directory.CreateDirectory(dir);
            _storageFilePath = Path.Combine(dir, "secrets.dat");
        }
        else
        {
            var dir = Path.GetDirectoryName(customFilePath);
            if (!string.IsNullOrEmpty(dir))
            {
                Directory.CreateDirectory(dir);
            }
            _storageFilePath = customFilePath;
        }

        _entropy = customEntropy ?? DefaultEntropy;
    }

    public void SaveSecret(string key, string secret)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Secret key cannot be null or empty", nameof(key));

        lock (_lock)
        {
            var secrets = LoadSecretsInternal();
            secrets[key] = secret ?? string.Empty;
            SaveSecretsInternal(secrets);
        }
    }

    public string? GetSecret(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return null;

        lock (_lock)
        {
            var secrets = LoadSecretsInternal();
            return secrets.TryGetValue(key, out var secret) ? secret : null;
        }
    }

    public bool DeleteSecret(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return false;

        lock (_lock)
        {
            var secrets = LoadSecretsInternal();
            if (secrets.Remove(key))
            {
                SaveSecretsInternal(secrets);
                return true;
            }
            return false;
        }
    }

    public bool HasSecret(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return false;

        lock (_lock)
        {
            var secrets = LoadSecretsInternal();
            return secrets.ContainsKey(key) && !string.IsNullOrEmpty(secrets[key]);
        }
    }

    private Dictionary<string, string> LoadSecretsInternal()
    {
        if (!File.Exists(_storageFilePath))
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        try
        {
            var encryptedBytes = File.ReadAllBytes(_storageFilePath);
            if (encryptedBytes.Length == 0)
                return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            var decryptedBytes = ProtectedData.Unprotect(encryptedBytes, _entropy, DataProtectionScope.CurrentUser);
            var json = Encoding.UTF8.GetString(decryptedBytes);
            var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
            return dict ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }
        catch
        {
            // If decryption fails (e.g. machine change, file corruption), return empty to avoid crash
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }
    }

    private void SaveSecretsInternal(Dictionary<string, string> secrets)
    {
        var json = JsonSerializer.Serialize(secrets);
        var plainBytes = Encoding.UTF8.GetBytes(json);
        var encryptedBytes = ProtectedData.Protect(plainBytes, _entropy, DataProtectionScope.CurrentUser);
        File.WriteAllBytes(_storageFilePath, encryptedBytes);
    }
}
