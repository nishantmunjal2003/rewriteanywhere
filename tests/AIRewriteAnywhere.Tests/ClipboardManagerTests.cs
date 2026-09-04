using AIRewriteAnywhere.Clipboard;
using AIRewriteAnywhere.Logging;

namespace AIRewriteAnywhere.Tests;

public class ClipboardManagerTests
{
    [Fact]
    public async Task Clipboard_BackupAndRestore_PreservesOriginalContent()
    {
        var logger = new FileLogger();
        var manager = new ClipboardManager(logger);

        const string originalContent = "KEEP THIS CLIPBOARD CONTENT";

        // Step 1: Set initial clipboard
        await manager.SetTextAsync(originalContent);
        var initialText = await manager.GetTextAsync();
        Assert.Equal(originalContent, initialText);

        // Step 2: Backup
        var backup = manager.Backup();

        // Step 3: Mutate clipboard (as happens during AI rewrite operation)
        await manager.SetTextAsync("TEMPORARY AI REWRITTEN TEXT");
        var tempText = await manager.GetTextAsync();
        Assert.Equal("TEMPORARY AI REWRITTEN TEXT", tempText);

        // Step 4: Restore
        manager.Restore(backup);

        // Step 5: Verify original content remains intact
        var restoredText = await manager.GetTextAsync();
        Assert.Equal(originalContent, restoredText);
    }
}
