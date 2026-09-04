using System.IO;
using AIRewriteAnywhere.Security;

namespace AIRewriteAnywhere.Tests;

public class DpapiSecureStorageTests : IDisposable
{
    private readonly string _tempFilePath;

    public DpapiSecureStorageTests()
    {
        _tempFilePath = Path.Combine(Path.GetTempPath(), $"secrets_test_{Guid.NewGuid():N}.dat");
    }

    public void Dispose()
    {
        if (File.Exists(_tempFilePath))
        {
            try { File.Delete(_tempFilePath); } catch { }
        }
    }

    [Fact]
    public void SaveAndGetSecret_RoundtripsSuccessfully()
    {
        var storage = new DpapiSecureStorage(_tempFilePath);
        storage.SaveSecret("OpenAI", "sk-test-secret-key-12345");

        var retrieved = storage.GetSecret("OpenAI");
        Assert.Equal("sk-test-secret-key-12345", retrieved);
    }

    [Fact]
    public void GetSecret_ReturnsNullForNonExistentKey()
    {
        var storage = new DpapiSecureStorage(_tempFilePath);
        var retrieved = storage.GetSecret("NonExistent");
        Assert.Null(retrieved);
    }

    [Fact]
    public void DeleteSecret_RemovesSecretCorrectly()
    {
        var storage = new DpapiSecureStorage(_tempFilePath);
        storage.SaveSecret("Claude", "sk-claude-test");
        Assert.True(storage.HasSecret("Claude"));

        var deleted = storage.DeleteSecret("Claude");
        Assert.True(deleted);
        Assert.False(storage.HasSecret("Claude"));
        Assert.Null(storage.GetSecret("Claude"));
    }

    [Fact]
    public void StoredFile_IsEncryptedAndDoesNotContainPlaintext()
    {
        var secret = "super-confidential-api-key-999";
        var storage = new DpapiSecureStorage(_tempFilePath);
        storage.SaveSecret("Gemini", secret);

        var fileBytes = File.ReadAllBytes(_tempFilePath);
        var fileString = System.Text.Encoding.UTF8.GetString(fileBytes);

        Assert.DoesNotContain(secret, fileString);
    }

    [Fact]
    public void CorruptedFile_DoesNotThrowException()
    {
        File.WriteAllBytes(_tempFilePath, new byte[] { 0x12, 0x34, 0x56, 0x78 });
        var storage = new DpapiSecureStorage(_tempFilePath);

        var retrieved = storage.GetSecret("OpenAI");
        Assert.Null(retrieved);
    }
}
