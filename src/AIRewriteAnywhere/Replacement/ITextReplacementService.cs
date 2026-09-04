using AIRewriteAnywhere.Clipboard;
using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.Replacement;

public record UndoRecord(string OriginalText, string RewrittenText, IntPtr TargetHwnd, DateTime Timestamp);

public interface ITextReplacementService
{
    bool CanUndo { get; }
    UndoRecord? LastUndoRecord { get; }
    Task<bool> ReplaceSelectionAsync(SelectionInfo selection, string rewrittenText, ClipboardBackup? preservedClipboard = null);
    Task<bool> UndoLastRewriteAsync();
}
