namespace AIRewriteAnywhere.Security;

public interface ISecureStorage
{
    void SaveSecret(string key, string secret);
    string? GetSecret(string key);
    bool DeleteSecret(string key);
    bool HasSecret(string key);
}
