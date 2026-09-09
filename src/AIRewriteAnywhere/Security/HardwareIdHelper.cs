using System.Security.Cryptography;
using System.Text;
using Microsoft.Win32;

namespace AIRewriteAnywhere.Security;

public static class HardwareIdHelper
{
    private static string? _cachedHwid;

    public static string GetMachineHardwareId()
    {
        if (!string.IsNullOrEmpty(_cachedHwid))
        {
            return _cachedHwid;
        }

        try
        {
            // 1. Primary: Windows Cryptography MachineGuid
            var machineGuid = Registry.GetValue(
                @"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography",
                "MachineGuid",
                null)?.ToString();

            // 2. Secondary fallback attributes
            var userName = Environment.UserName;
            var machineName = Environment.MachineName;
            var osVersion = Environment.OSVersion.VersionString;

            var rawSeed = $"{machineGuid ?? "NO_GUID"}_{machineName}_{userName}_{osVersion}";

            using var sha256 = SHA256.Create();
            var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawSeed));
            var hex = Convert.ToHexString(hashBytes).ToUpperInvariant();

            // Format as readable HWID: HWID-XXXX-XXXX-XXXX-XXXX
            _cachedHwid = $"HWID-{hex[..4]}-{hex.Substring(4, 4)}-{hex.Substring(8, 4)}-{hex.Substring(12, 4)}";
            return _cachedHwid;
        }
        catch
        {
            // Graceful fallback if registry is restricted
            var fallback = $"{Environment.MachineName}_{Environment.UserName}".ToUpperInvariant();
            using var sha256 = SHA256.Create();
            var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(fallback));
            var hex = Convert.ToHexString(hashBytes).ToUpperInvariant();
            _cachedHwid = $"HWID-{hex[..4]}-{hex.Substring(4, 4)}-{hex.Substring(8, 4)}-{hex.Substring(12, 4)}";
            return _cachedHwid;
        }
    }
}
