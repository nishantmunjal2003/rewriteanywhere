using System.Runtime.InteropServices;
using AIRewriteAnywhere.Clipboard;
using AIRewriteAnywhere.Logging;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.WindowsIntegration;

namespace AIRewriteAnywhere.Replacement;

public class TextReplacementService : ITextReplacementService
{
    private readonly IClipboardManager _clipboardManager;
    private readonly IAppLogger _logger;
    private UndoRecord? _lastUndoRecord;

    public bool CanUndo => _lastUndoRecord != null && !string.IsNullOrEmpty(_lastUndoRecord.OriginalText);
    public UndoRecord? LastUndoRecord => _lastUndoRecord;

    public TextReplacementService(IClipboardManager clipboardManager, IAppLogger logger)
    {
        _clipboardManager = clipboardManager;
        _logger = logger;
    }

    public async Task<bool> ReplaceSelectionAsync(SelectionInfo selection, string rewrittenText, ClipboardBackup? preservedClipboard = null)
    {
        if (selection == null || string.IsNullOrWhiteSpace(rewrittenText))
        {
            _logger.LogWarning("Cannot replace text: empty selection or empty rewritten text.");
            return false;
        }

        // Backup existing clipboard if not already provided
        var backup = preservedClipboard ?? _clipboardManager.Backup();

        try
        {
            // Restore focus to original target window
            if (selection.TargetHwnd != IntPtr.Zero)
            {
                ActiveWindowTracker.RestoreFocusToWindow(selection.TargetHwnd);
                await Task.Delay(50);
            }

            // Put rewritten text onto clipboard
            await _clipboardManager.SetTextAsync(rewrittenText);
            await Task.Delay(30);

            // Synthesize Ctrl+V (Paste)
            SendCtrlV();

            // Wait brief moment for the target window to accept the paste
            await Task.Delay(60);

            // Record undo entry
            _lastUndoRecord = new UndoRecord(selection.Text, rewrittenText, selection.TargetHwnd, DateTime.Now);

            // Restore user's previous clipboard contents
            _clipboardManager.Restore(backup);

            _logger.LogInfo("Text successfully replaced in target application and user clipboard restored.");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError("Error during text replacement.", ex);
            _clipboardManager.Restore(backup);
            return false;
        }
    }

    public async Task<bool> UndoLastRewriteAsync()
    {
        if (!CanUndo || _lastUndoRecord == null)
        {
            _logger.LogWarning("Undo requested but no undo record is available.");
            return false;
        }

        var record = _lastUndoRecord;
        var backup = _clipboardManager.Backup();

        try
        {
            if (record.TargetHwnd != IntPtr.Zero)
            {
                ActiveWindowTracker.RestoreFocusToWindow(record.TargetHwnd);
                await Task.Delay(50);
            }

            // Put original text onto clipboard
            await _clipboardManager.SetTextAsync(record.OriginalText);
            await Task.Delay(30);

            // Send Ctrl+Z or Ctrl+V with original text
            SendCtrlV();
            await Task.Delay(60);

            _clipboardManager.Restore(backup);
            _lastUndoRecord = null;
            _logger.LogInfo("Undo rewrite completed successfully.");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError("Failed to undo last rewrite.", ex);
            _clipboardManager.Restore(backup);
            return false;
        }
    }

    private static void SendCtrlV()
    {
        var inputs = new NativeMethods.INPUT[4];

        // Ctrl DOWN
        inputs[0].type = NativeMethods.INPUT_KEYBOARD;
        inputs[0].u.ki.wVk = NativeMethods.VK_CONTROL;
        inputs[0].u.ki.dwFlags = 0;

        // V DOWN
        inputs[1].type = NativeMethods.INPUT_KEYBOARD;
        inputs[1].u.ki.wVk = NativeMethods.VK_V;
        inputs[1].u.ki.dwFlags = 0;

        // V UP
        inputs[2].type = NativeMethods.INPUT_KEYBOARD;
        inputs[2].u.ki.wVk = NativeMethods.VK_V;
        inputs[2].u.ki.dwFlags = NativeMethods.KEYEVENTF_KEYUP;

        // Ctrl UP
        inputs[3].type = NativeMethods.INPUT_KEYBOARD;
        inputs[3].u.ki.wVk = NativeMethods.VK_CONTROL;
        inputs[3].u.ki.dwFlags = NativeMethods.KEYEVENTF_KEYUP;

        NativeMethods.SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(NativeMethods.INPUT)));
    }
}
