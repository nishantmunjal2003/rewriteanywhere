using System.Runtime.InteropServices;
using System.Windows;
using AIRewriteAnywhere.Clipboard;
using AIRewriteAnywhere.Logging;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.WindowsIntegration;

namespace AIRewriteAnywhere.Selection;

public class ClipboardSelectionProvider
{
    private readonly IClipboardManager _clipboardManager;
    private readonly IAppLogger _logger;

    public ClipboardSelectionProvider(IClipboardManager clipboardManager, IAppLogger logger)
    {
        _clipboardManager = clipboardManager;
        _logger = logger;
    }

    public async Task<SelectionInfo?> TryGetSelectionAsync(IntPtr targetHwnd, ClipboardBackup? sharedBackup = null)
    {
        var backup = sharedBackup ?? _clipboardManager.Backup();

        try
        {
            if (targetHwnd != IntPtr.Zero)
            {
                ActiveWindowTracker.RestoreFocusToWindow(targetHwnd);
                await Task.Delay(40);
            }

            // Clear clipboard briefly so we know if new text arrived
            await _clipboardManager.ClearAsync();
            await Task.Delay(20);

            // Release physical modifier keys (Shift, Alt, Win) from hotkey invocation
            ReleaseModifierKeys();
            await Task.Delay(25);

            // Send simulated Ctrl+C
            SendCtrlC();

            // Wait up to 300ms for clipboard text to populate
            string text = string.Empty;
            for (int i = 0; i < 12; i++)
            {
                await Task.Delay(25);
                text = await _clipboardManager.GetTextAsync();
                if (!string.IsNullOrWhiteSpace(text))
                {
                    break;
                }
            }

            if (string.IsNullOrWhiteSpace(text))
            {
                // No selection was made or app didn't respond to copy
                // Immediately restore the user's previous clipboard
                _clipboardManager.Restore(backup);
                return null;
            }

            // Immediately restore original clipboard contents so the user's clipboard is preserved
            _clipboardManager.Restore(backup);

            _logger.LogInfo("Successfully retrieved selection via Clipboard copy fallback.");

            // Calculate approximate bounding box near caret / mouse cursor
            var bounds = GetEstimatedSelectionBounds(targetHwnd);

            return new SelectionInfo
            {
                Text = text,
                ScreenBounds = bounds,
                TargetHwnd = targetHwnd,
                TargetProcessName = ActiveWindowTracker.GetProcessName(targetHwnd),
                TargetWindowTitle = ActiveWindowTracker.GetWindowTitle(targetHwnd),
                IsFromClipboardFallback = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError("Clipboard selection fallback encountered an error.", ex);
            _clipboardManager.Restore(backup);
            return null;
        }
    }

    private static void ReleaseModifierKeys()
    {
        var inputs = new NativeMethods.INPUT[4];
        inputs[0].type = NativeMethods.INPUT_KEYBOARD;
        inputs[0].u.ki.wVk = NativeMethods.VK_SHIFT;
        inputs[0].u.ki.dwFlags = NativeMethods.KEYEVENTF_KEYUP;

        inputs[1].type = NativeMethods.INPUT_KEYBOARD;
        inputs[1].u.ki.wVk = NativeMethods.VK_MENU;
        inputs[1].u.ki.dwFlags = NativeMethods.KEYEVENTF_KEYUP;

        inputs[2].type = NativeMethods.INPUT_KEYBOARD;
        inputs[2].u.ki.wVk = NativeMethods.VK_CONTROL;
        inputs[2].u.ki.dwFlags = NativeMethods.KEYEVENTF_KEYUP;

        inputs[3].type = NativeMethods.INPUT_KEYBOARD;
        inputs[3].u.ki.wVk = 0x5B; // VK_LWIN
        inputs[3].u.ki.dwFlags = NativeMethods.KEYEVENTF_KEYUP;

        NativeMethods.SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(NativeMethods.INPUT)));
    }

    private static void SendCtrlC()
    {
        var inputs = new NativeMethods.INPUT[4];

        // Ctrl DOWN
        inputs[0].type = NativeMethods.INPUT_KEYBOARD;
        inputs[0].u.ki.wVk = NativeMethods.VK_CONTROL;
        inputs[0].u.ki.dwFlags = 0;

        // C DOWN
        inputs[1].type = NativeMethods.INPUT_KEYBOARD;
        inputs[1].u.ki.wVk = NativeMethods.VK_C;
        inputs[1].u.ki.dwFlags = 0;

        // C UP
        inputs[2].type = NativeMethods.INPUT_KEYBOARD;
        inputs[2].u.ki.wVk = NativeMethods.VK_C;
        inputs[2].u.ki.dwFlags = NativeMethods.KEYEVENTF_KEYUP;

        // Ctrl UP
        inputs[3].type = NativeMethods.INPUT_KEYBOARD;
        inputs[3].u.ki.wVk = NativeMethods.VK_CONTROL;
        inputs[3].u.ki.dwFlags = NativeMethods.KEYEVENTF_KEYUP;

        NativeMethods.SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(NativeMethods.INPUT)));
    }

    private static Rect GetEstimatedSelectionBounds(IntPtr targetHwnd)
    {
        // Try GUIThreadInfo caret first
        if (targetHwnd != IntPtr.Zero)
        {
            var threadId = NativeMethods.GetWindowThreadProcessId(targetHwnd, out _);
            if (threadId != 0)
            {
                var guiInfo = new NativeMethods.GUITHREADINFO();
                guiInfo.cbSize = Marshal.SizeOf(guiInfo);
                if (NativeMethods.GetGUIThreadInfo(threadId, ref guiInfo) && guiInfo.hwndCaret != IntPtr.Zero)
                {
                    if (NativeMethods.GetWindowRect(guiInfo.hwndCaret, out var caretRect))
                    {
                        var x = caretRect.Left + guiInfo.rcCaret.Left;
                        var y = caretRect.Top + guiInfo.rcCaret.Top;
                        return new Rect(x, y, 20, 20);
                    }
                }
            }
        }

        // Fallback: mouse cursor position
        NativeMethods.GetCursorPos(out var pt);
        return new Rect(pt.X, pt.Y - 20, 24, 24);
    }
}
