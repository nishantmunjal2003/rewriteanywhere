namespace AIRewriteAnywhere.Security;

public record LicenseActivationResult(bool Success, string Message, string? LicenseKey = null);

public interface ILicenseService
{
    bool IsLicensed { get; }
    string ActiveLicenseKey { get; }
    string MachineId { get; }
    Task<LicenseActivationResult> ActivateLicenseAsync(string licenseKey);
    Task<bool> VerifyLicenseOnlineAsync();
    void DeactivateLicense();
}
