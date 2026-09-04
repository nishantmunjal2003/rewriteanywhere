using System.Windows;

namespace AIRewriteAnywhere.Models;

public class SelectionInfo
{
    public string Text { get; set; } = string.Empty;
    public Rect ScreenBounds { get; set; } = Rect.Empty;
    public IntPtr TargetHwnd { get; set; } = IntPtr.Zero;
    public string TargetProcessName { get; set; } = string.Empty;
    public string TargetWindowTitle { get; set; } = string.Empty;
    public bool IsFromClipboardFallback { get; set; } = false;

    public bool HasValidBounds => !ScreenBounds.IsEmpty && ScreenBounds.Width > 0 && ScreenBounds.Height > 0;
}
