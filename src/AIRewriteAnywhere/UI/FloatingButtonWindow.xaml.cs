using System.Windows;
using System.Windows.Interop;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.WindowsIntegration;

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

        double targetX;
        double targetY;

        if (selection.HasValidBounds)
        {
            targetX = selection.ScreenBounds.Right + 8;
            targetY = selection.ScreenBounds.Top - 12;
        }
        else
        {
            NativeMethods.GetCursorPos(out var pt);
            targetX = pt.X + 16;
            targetY = pt.Y - 24;
        }

        // Keep within virtual screen bounds
        var screenWidth = SystemParameters.VirtualScreenWidth;
        var screenHeight = SystemParameters.VirtualScreenHeight;

        if (targetX + 60 > screenWidth)
            targetX = screenWidth - 65;
        if (targetY < 10)
            targetY = 10;
        if (targetY + 60 > screenHeight)
            targetY = screenHeight - 65;

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
