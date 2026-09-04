using System.Windows;

namespace AIRewriteAnywhere.Clipboard;

public class ClipboardBackup
{
    public Dictionary<string, object> DataEntries { get; } = new(StringComparer.OrdinalIgnoreCase);
    public string? PlainText { get; set; }
    public bool IsEmpty => DataEntries.Count == 0 && string.IsNullOrEmpty(PlainText);
}

public interface IClipboardManager
{
    ClipboardBackup Backup();
    void Restore(ClipboardBackup backup);
    Task<string> GetTextAsync();
    Task SetTextAsync(string text);
    Task ClearAsync();
}
