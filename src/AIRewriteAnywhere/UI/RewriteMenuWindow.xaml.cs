using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media.Animation;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.WindowsIntegration;
using Point = System.Windows.Point;
using Rect = System.Windows.Rect;
using Size = System.Windows.Size;

namespace AIRewriteAnywhere.UI;

public partial class RewriteMenuWindow : Window
{
    private SelectionInfo? _selection;
    private CancellationTokenSource? _cts;
    private bool _isProcessing = false;

    public event Func<SelectionInfo, RewriteMode, string?, string?, CancellationToken, Task<RewriteResponse>>? RewriteRequested;

    public RewriteMenuWindow()
    {
        InitializeComponent();

        foreach (var lang in Constants.SupportedLanguages)
        {
            LanguageCombo.Items.Add(lang);
        }
        LanguageCombo.SelectedIndex = -1;
    }

    public void ShowNear(SelectionInfo selection)
    {
        _selection = selection;
        _isProcessing = false;
        BusyOverlay.Visibility = Visibility.Collapsed;
        CustomInstructionText.Text = string.Empty;
        LanguageCombo.SelectedIndex = -1;

        // 1. Get monitor working area and DPI scale for the target selection/cursor
        MonitorWorkAreaInfo monInfo;
        Rect targetBoundsDip;

        if (selection.HasValidBounds)
        {
            monInfo = DisplayHelper.GetMonitorInfoForRect(selection.ScreenBounds);
            targetBoundsDip = DisplayHelper.ConvertPhysicalRectToDip(
                selection.ScreenBounds,
                monInfo.DpiScaleX,
                monInfo.DpiScaleY);
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
            targetBoundsDip = new Rect(dipPt.X, dipPt.Y, 0, 0);
        }

        // 2. Measure desired height of the menu
        this.Measure(new Size(this.Width, double.PositiveInfinity));
        double desiredHeight = this.DesiredSize.Height > 0 ? this.DesiredSize.Height : 440;

        // 3. Compute optimal position and apply maximum height constraint
        var pos = DisplayHelper.CalculateOptimalMenuPosition(
            targetBoundsDip,
            this.Width,
            desiredHeight,
            monInfo.WorkAreaDip,
            out double maxAllowedHeight);

        this.MaxHeight = maxAllowedHeight;
        this.Left = pos.X;
        this.Top = pos.Y;

        this.Show();
        this.Activate();
    }

    private async void Mode_Click(object sender, RoutedEventArgs e)
    {
        if (sender is System.Windows.Controls.Button btn && btn.Tag is string tagStr && Enum.TryParse<RewriteMode>(tagStr, out var mode))
        {
            await TriggerRewriteAsync(mode, null, null);
        }
    }

    private async void LanguageCombo_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (LanguageCombo.SelectedItem is string selectedLanguage &&
            !string.IsNullOrWhiteSpace(selectedLanguage) &&
            _selection != null && IsLoaded && IsVisible && !_isProcessing)
        {
            await TriggerRewriteAsync(RewriteMode.Translate, null, selectedLanguage);
        }
    }

    private async void RunCustom_Click(object sender, RoutedEventArgs e)
    {
        var instruction = CustomInstructionText.Text.Trim();
        if (!string.IsNullOrEmpty(instruction))
        {
            await TriggerRewriteAsync(RewriteMode.Custom, instruction, null);
        }
    }

    private void CustomInstructionText_KeyDown(object sender, System.Windows.Input.KeyEventArgs e)
    {
        if (e.Key == Key.Enter)
        {
            e.Handled = true;
            RunCustom_Click(sender, e);
        }
    }

    private async Task TriggerRewriteAsync(RewriteMode mode, string? custom, string? language)
    {
        if (_selection == null || _isProcessing) return;

        _isProcessing = true;
        BusyOverlay.Visibility = Visibility.Visible;
        BusyDetailText.Text = $"Applying {mode} mode...";

        _cts = new CancellationTokenSource();

        try
        {
            if (RewriteRequested != null)
            {
                var response = await RewriteRequested(_selection, mode, custom, language, _cts.Token);
            }
        }
        finally
        {
            _isProcessing = false;
            _cts?.Dispose();
            _cts = null;
            SafeClose();
        }
    }

    private void CancelRewrite_Click(object sender, RoutedEventArgs e)
    {
        _cts?.Cancel();
        SafeClose();
    }

    private void CloseButton_Click(object sender, RoutedEventArgs e)
    {
        if (!_isProcessing)
        {
            SafeClose();
        }
    }

    private void Window_Deactivated(object? sender, EventArgs e)
    {
        // If not currently executing an AI call and not already closing, clicking away dismisses the menu
        if (!_isProcessing && !_isClosing)
        {
            SafeClose();
        }
    }

    private bool _isClosing = false;

    protected override void OnClosing(System.ComponentModel.CancelEventArgs e)
    {
        _isClosing = true;
        base.OnClosing(e);
    }

    public void SafeClose()
    {
        if (_isClosing) return;
        _isClosing = true;
        try
        {
            Dispatcher.InvokeAsync(() =>
            {
                try
                {
                    this.Close();
                }
                catch
                {
                    // Ignore any closing state exceptions
                }
            });
        }
        catch
        {
            // Ignore dispatcher exceptions
        }
    }
}
