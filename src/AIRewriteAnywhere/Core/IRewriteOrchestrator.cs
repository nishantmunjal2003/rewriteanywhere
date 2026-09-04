using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.Core;

public interface IRewriteOrchestrator
{
    Task TriggerRewriteFlowFromHotkeyAsync();
    void TriggerRewriteFlowFromSelection(SelectionInfo selection);
    Task<RewriteResponse> ExecuteRewriteAsync(SelectionInfo selection, RewriteMode mode, string? customInstruction = null, string? targetLanguage = null, CancellationToken cancellationToken = default);
    Task<bool> UndoLastRewriteAsync();
}
