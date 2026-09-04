using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media.Animation;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.WindowsIntegration;

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
        LanguageCombo.SelectedIndex = 0;
    }

    public void ShowNear(SelectionInfo selection)
    {
        _selection = selection;
        _isProcessing = false;
        BusyOverlay.Visibility = Visibility.Collapsed;
        CustomInstructionText.Text = string.Empty;

        double targetX;
        double targetY;

        if (selection.HasValidBounds)
        {
            targetX = selection.ScreenBounds.Left;
            targetY = selection.ScreenBounds.Bottom + 6;
        }
        else
        {
            NativeMethods.GetCursorPos(out var pt);
            targetX = pt.X + 8;
            targetY = pt.Y + 8;
        }

        var workArea = SystemParameters.WorkArea;
        var menuWidth = this.Width;
        var estimatedHeight = 440;

        if (targetX + menuWidth > workArea.Right)
            targetX = workArea.Right - menuWidth - 10;
        if (targetX < workArea.Left)
            targetX = workArea.Left + 10;

        if (targetY + estimatedHeight > workArea.Bottom)
            targetY = (selection.HasValidBounds ? selection.ScreenBounds.Top : targetY) - estimatedHeight - 10;
        if (targetY < workArea.Top)
            targetY = workArea.Top + 10;

        this.Left = targetX;
        this.Top = targetY;

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
        if (LanguageCombo.SelectedItem is string selectedLanguage && _selection != null && IsLoaded && IsVisible && !_isProcessing)
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

    private async void CustomInstructionText_KeyDown(object sender, System.Windows.Input.KeyEventArgs e)
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

    private void SafeClose()
    {
        if (_isClosing) return;
        _isClosing = true;
        try
        {
            this.Close();
        }
        catch
        {
            // Ignore any closing state exceptions
        }
    }
}
