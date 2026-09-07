using System.Windows;
using System.Windows.Interop;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.WindowsIntegration;
using Point = System.Windows.Point;
using Rect = System.Windows.Rect;

namespace AIRewriteAnywhere.UI;

public partial class FloatingButtonWindow : Window
{
    private SelectionInfo? _currentSelection;

    public event Action<SelectionInfo>? ButtonClicked;

    public FloatingButtonWindow()
    {
        InitializeComponent();
    }

    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);

        // Apply WS_EX_NOACTIVATE and WS_EX_TOOLWINDOW so the window never steals focus
        var helper = new WindowInteropHelper(this);
        var exStyle = NativeMethods.GetWindowLongPtr(helper.Handle, NativeMethods.GWL_EXSTYLE).ToInt64();
        exStyle |= NativeMethods.WS_EX_NOACTIVATE | NativeMethods.WS_EX_TOPMOST | NativeMethods.WS_EX_TOOLWINDOW;
        NativeMethods.SetWindowLongPtr(helper.Handle, NativeMethods.GWL_EXSTYLE, new IntPtr(exStyle));
    }

    public void ShowNear(SelectionInfo selection, FloatingButtonSize buttonSize = FloatingButtonSize.Medium)
    {
        _currentSelection = selection;

        // Apply button size
        var diameter = (double)buttonSize;
        ActionButton.Width = diameter;
        ActionButton.Height = diameter;

        double totalSize = diameter + 12;

        MonitorWorkAreaInfo monInfo;
        double targetX;
        double targetY;

        if (selection.HasValidBounds)
        {
            monInfo = DisplayHelper.GetMonitorInfoForRect(selection.ScreenBounds);
            var selDip = DisplayHelper.ConvertPhysicalRectToDip(
                selection.ScreenBounds,
                monInfo.DpiScaleX,
                monInfo.DpiScaleY);

            targetX = selDip.Right + 8;
            targetY = selDip.Top - 12;
        }
        else
        {
            NativeMethods.GetCursorPos(out var pt);
            monInfo = DisplayHelper.GetMonitorInfoForPoint(pt.X, pt.Y);
            var dipPt = DisplayHelper.ConvertPhysicalPointToDip(
                pt.X,
                pt.Y,
                monInfo.DpiScaleX,
                monInfo.DpiScaleY);

            targetX = dipPt.X + 16;
            targetY = dipPt.Y - 24;
        }

        var work = monInfo.WorkAreaDip;

        // Keep strictly within monitor working area bounds
        if (targetX + totalSize + 4 > work.Right)
            targetX = work.Right - totalSize - 4;
        if (targetX < work.Left + 4)
            targetX = work.Left + 4;

        if (targetY + totalSize + 4 > work.Bottom)
            targetY = work.Bottom - totalSize - 4;
        if (targetY < work.Top + 4)
            targetY = work.Top + 4;

        this.Left = targetX;
        this.Top = targetY;

        this.Show();
    }

    public void HideButton()
    {
        this.Hide();
        _currentSelection = null;
    }

    private void ActionButton_Click(object sender, RoutedEventArgs e)
    {
        if (_currentSelection != null)
        {
            var sel = _currentSelection;
            HideButton();
            ButtonClicked?.Invoke(sel);
        }
    }
}
