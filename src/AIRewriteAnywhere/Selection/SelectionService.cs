using AIRewriteAnywhere.Clipboard;
using AIRewriteAnywhere.Logging;
using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.Selection;

public class SelectionService : ISelectionService
{
    private readonly UIAutomationSelectionProvider _uiAutomationProvider;
    private readonly ClipboardSelectionProvider _clipboardProvider;
    private readonly IClipboardManager _clipboardManager;
    private readonly IAppLogger _logger;

    public SelectionService(
        IClipboardManager clipboardManager,
        IAppLogger logger,
        UIAutomationSelectionProvider? uiAutomationProvider = null,
        ClipboardSelectionProvider? clipboardProvider = null)
    {
        _clipboardManager = clipboardManager;
        _logger = logger;
        _uiAutomationProvider = uiAutomationProvider ?? new UIAutomationSelectionProvider(logger);
        _clipboardProvider = clipboardProvider ?? new ClipboardSelectionProvider(clipboardManager, logger);
    }

    public async Task<SelectionInfo?> GetSelectionAsync(IntPtr targetHwnd)
    {
        // Strategy A: UI Automation
        var selection = _uiAutomationProvider.TryGetSelection(targetHwnd);
        if (selection != null && !string.IsNullOrWhiteSpace(selection.Text))
        {
            return selection;
        }

        // Strategy B: Clipboard fallback
        _logger.LogInfo("UI Automation yielded no text; attempting Clipboard fallback.");
        selection = await _clipboardProvider.TryGetSelectionAsync(targetHwnd);
        return selection;
    }
}
