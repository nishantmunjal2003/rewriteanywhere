using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using AIRewriteAnywhere.AI;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.Security;
using AIRewriteAnywhere.Settings;
using AIRewriteAnywhere.WindowsIntegration;
using Color = System.Windows.Media.Color;

namespace AIRewriteAnywhere.UI;

public partial class SettingsWindow : Window
{
    private readonly ISettingsService _settingsService;
    private readonly ISecureStorage _secureStorage;
    private readonly IAIProviderFactory _providerFactory;
    private readonly StartupManager _startupManager;
    private bool _isKeyVisible = false;

    public SettingsWindow(
        ISettingsService settingsService,
        ISecureStorage secureStorage,
        IAIProviderFactory providerFactory,
        StartupManager startupManager)
    {
        InitializeComponent();

        _settingsService = settingsService;
        _secureStorage = secureStorage;
        _providerFactory = providerFactory;
        _startupManager = startupManager;

        PopulateDropdowns();
        LoadSettingsIntoUI();

        this.MouseDown += (s, e) =>
        {
            if (e.ChangedButton == MouseButton.Left && e.ButtonState == MouseButtonState.Pressed)
            {
                this.DragMove();
            }
        };
    }

    private void PopulateDropdowns()
    {
        ComboButtonSize.Items.Add(FloatingButtonSize.Small);
        ComboButtonSize.Items.Add(FloatingButtonSize.Medium);
        ComboButtonSize.Items.Add(FloatingButtonSize.Large);

        foreach (var key in new[] { Key.R, Key.A, Key.E, Key.W, Key.F9, Key.F10, Key.F11, Key.F12 })
        {
            ComboShortcutKey.Items.Add(key);
        }

        foreach (var provider in Enum.GetValues<ProviderType>())
        {
            ComboActiveProvider.Items.Add(provider);
        }

        foreach (var theme in Enum.GetValues<AppTheme>())
        {
            ComboTheme.Items.Add(theme);
        }

        foreach (var tone in new[] { "Professional", "Friendly", "Direct", "Confident", "Casual", "Warm" })
        {
            ComboTone.Items.Add(tone);
        }

        foreach (var length in new[] { "Concise", "Balanced", "Detailed" })
        {
            ComboLength.Items.Add(length);
        }

        foreach (var formality in new[] { "High", "Medium", "Casual" })
        {
            ComboFormality.Items.Add(formality);
        }
    }

    private void LoadSettingsIntoUI()
    {
        var s = _settingsService.Settings;

        ChkStartWithWindows.IsChecked = s.StartWithWindows;
        ChkShowFloatingButton.IsChecked = s.ShowFloatingButton;
        ComboButtonSize.SelectedItem = s.FloatingButtonSize;

        ChkModCtrl.IsChecked = (s.HotkeyModifiers & ModifierKeys.Control) != 0;
        ChkModShift.IsChecked = (s.HotkeyModifiers & ModifierKeys.Shift) != 0;
        ChkModAlt.IsChecked = (s.HotkeyModifiers & ModifierKeys.Alt) != 0;
        ComboShortcutKey.SelectedItem = s.HotkeyKey;

        ChkPreviewBeforeReplace.IsChecked = s.PreviewBeforeReplace;
        ChkRestoreClipboard.IsChecked = s.RestoreClipboard;
        ChkEnableNotifications.IsChecked = s.EnableNotifications;

        ComboActiveProvider.SelectedItem = s.ActiveProvider;
        UpdateModelDropdownForProvider(s.ActiveProvider);

        ComboTheme.SelectedItem = s.Theme;

        // Writing style
        ChkEnableWritingStyle.IsChecked = s.WritingStyle.Enabled;
        ComboTone.SelectedItem = s.WritingStyle.Tone;
        ComboLength.SelectedItem = s.WritingStyle.Length;
        ComboFormality.SelectedItem = s.WritingStyle.Formality;
        ChkPreserveTechnicalTerms.IsChecked = s.WritingStyle.PreserveTechnicalTerms;
        TxtAdditionalInstructions.Text = s.WritingStyle.AdditionalInstructions;

        UpdateKeyStatusLabel();
    }

    private void UpdateModelDropdownForProvider(ProviderType provider)
    {
        ComboModel.Items.Clear();
        var models = provider switch
        {
            ProviderType.OpenAI => Constants.AvailableOpenAIModels,
            ProviderType.Gemini => Constants.AvailableGeminiModels,
            ProviderType.Claude => Constants.AvailableClaudeModels,
            _ => Constants.AvailableMockModels
        };

        foreach (var m in models)
        {
            ComboModel.Items.Add(m);
        }

        var currentSelected = provider switch
        {
            ProviderType.OpenAI => _settingsService.Settings.OpenAIModel,
            ProviderType.Gemini => _settingsService.Settings.GeminiModel,
            ProviderType.Claude => _settingsService.Settings.ClaudeModel,
            _ => _settingsService.Settings.MockModel
        };

        if (ComboModel.Items.Contains(currentSelected))
        {
            ComboModel.SelectedItem = currentSelected;
        }
        else if (ComboModel.Items.Count > 0)
        {
            ComboModel.SelectedIndex = 0;
        }

        UpdateKeyStatusLabel();
    }

    private void UpdateKeyStatusLabel()
    {
        if (ComboActiveProvider.SelectedItem is ProviderType provider)
        {
            if (provider == ProviderType.Mock)
            {
                KeyStatusLabel.Text = "[Mock Mode Active — No Key Needed]";
                KeyStatusLabel.Foreground = new SolidColorBrush(Color.FromRgb(16, 185, 129));
                KeyPasswordBox.Password = "mock-key";
                KeyPlainTextBox.Text = "mock-key";
                return;
            }

            var hasSecret = _secureStorage.HasSecret(provider.ToString());
            if (hasSecret)
            {
                KeyStatusLabel.Text = "✓ Key Securely Saved (DPAPI)";
                KeyStatusLabel.Foreground = new SolidColorBrush(Color.FromRgb(16, 185, 129));
                var secret = _secureStorage.GetSecret(provider.ToString()) ?? string.Empty;
                KeyPasswordBox.Password = secret;
                KeyPlainTextBox.Text = secret;
            }
            else
            {
                KeyStatusLabel.Text = "⚠ No Key Configured";
                KeyStatusLabel.Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11));
                KeyPasswordBox.Password = string.Empty;
                KeyPlainTextBox.Text = string.Empty;
            }
        }
    }

    private void Tab_Checked(object sender, RoutedEventArgs e)
    {
        if (PanelGeneral == null || PanelAiProvider == null || PanelWritingStyle == null ||
            PanelAppearance == null || PanelPrivacy == null || PanelAbout == null)
            return;

        PanelGeneral.Visibility = (TabGeneral.IsChecked == true) ? Visibility.Visible : Visibility.Collapsed;
        PanelAiProvider.Visibility = (TabAiProvider.IsChecked == true) ? Visibility.Visible : Visibility.Collapsed;
        PanelWritingStyle.Visibility = (TabWritingStyle.IsChecked == true) ? Visibility.Visible : Visibility.Collapsed;
        PanelAppearance.Visibility = (TabAppearance.IsChecked == true) ? Visibility.Visible : Visibility.Collapsed;
        PanelPrivacy.Visibility = (TabPrivacy.IsChecked == true) ? Visibility.Visible : Visibility.Collapsed;
        PanelAbout.Visibility = (TabAbout.IsChecked == true) ? Visibility.Visible : Visibility.Collapsed;
    }

    private void ComboActiveProvider_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (ComboActiveProvider.SelectedItem is ProviderType provider)
        {
            UpdateModelDropdownForProvider(provider);
        }
    }

    private void ToggleKeyVisibility_Click(object sender, RoutedEventArgs e)
    {
        _isKeyVisible = !_isKeyVisible;
        if (_isKeyVisible)
        {
            KeyPlainTextBox.Text = KeyPasswordBox.Password;
            KeyPasswordBox.Visibility = Visibility.Collapsed;
            KeyPlainTextBox.Visibility = Visibility.Visible;
            ToggleKeyVisibilityBtn.Content = "🔒";
        }
        else
        {
            KeyPasswordBox.Password = KeyPlainTextBox.Text;
            KeyPlainTextBox.Visibility = Visibility.Collapsed;
            KeyPasswordBox.Visibility = Visibility.Visible;
            ToggleKeyVisibilityBtn.Content = "👁";
        }
    }

    private void SaveKey_Click(object sender, RoutedEventArgs e)
    {
        var key = _isKeyVisible ? KeyPlainTextBox.Text.Trim() : KeyPasswordBox.Password.Trim();
        if (ComboActiveProvider.SelectedItem is ProviderType provider)
        {
            if (!string.IsNullOrEmpty(key))
            {
                _secureStorage.SaveSecret(provider.ToString(), key);
                UpdateKeyStatusLabel();
                TestConnectionStatusText.Text = $"✓ Secret for {provider} successfully saved via DPAPI.";
                TestConnectionStatusText.Foreground = new SolidColorBrush(Color.FromRgb(16, 185, 129));
            }
        }
    }

    private void ClearKey_Click(object sender, RoutedEventArgs e)
    {
        if (ComboActiveProvider.SelectedItem is ProviderType provider)
        {
            _secureStorage.DeleteSecret(provider.ToString());
            KeyPasswordBox.Password = string.Empty;
            KeyPlainTextBox.Text = string.Empty;
            UpdateKeyStatusLabel();
            TestConnectionStatusText.Text = $"Key for {provider} has been removed.";
            TestConnectionStatusText.Foreground = new SolidColorBrush(Color.FromRgb(245, 158, 11));
        }
    }

    private async void TestConnection_Click(object sender, RoutedEventArgs e)
    {
        if (ComboActiveProvider.SelectedItem is ProviderType provider)
        {
            var key = _isKeyVisible ? KeyPlainTextBox.Text.Trim() : KeyPasswordBox.Password.Trim();
            if (string.IsNullOrWhiteSpace(key))
            {
                key = _secureStorage.GetSecret(provider.ToString()) ?? string.Empty;
            }

            var model = ComboModel.SelectedItem as string ?? string.Empty;

            TestConnectionStatusText.Text = $"Testing connection to {provider}...";
            TestConnectionStatusText.Foreground = new SolidColorBrush(Color.FromRgb(156, 163, 175));

            var p = _providerFactory.GetProvider(provider);
            var success = await p.ValidateCredentialsAsync(key, model);

            if (success)
            {
                TestConnectionStatusText.Text = $"✓ Success: Connected to {provider} successfully using model '{model}'.";
                TestConnectionStatusText.Foreground = new SolidColorBrush(Color.FromRgb(16, 185, 129));
            }
            else
            {
                TestConnectionStatusText.Text = $"✗ Connection failed: {provider} rejected the credentials or could not be reached.";
                TestConnectionStatusText.Foreground = new SolidColorBrush(Color.FromRgb(239, 68, 68));
            }
        }
    }

    private async void SaveAndClose_Click(object sender, RoutedEventArgs e)
    {
        var s = _settingsService.Settings;

        s.StartWithWindows = ChkStartWithWindows.IsChecked == true;
        _startupManager.SetStartupEnabled(s.StartWithWindows);

        s.ShowFloatingButton = ChkShowFloatingButton.IsChecked == true;
        if (ComboButtonSize.SelectedItem is FloatingButtonSize size)
            s.FloatingButtonSize = size;

        ModifierKeys mods = ModifierKeys.None;
        if (ChkModCtrl.IsChecked == true) mods |= ModifierKeys.Control;
        if (ChkModShift.IsChecked == true) mods |= ModifierKeys.Shift;
        if (ChkModAlt.IsChecked == true) mods |= ModifierKeys.Alt;
        s.HotkeyModifiers = mods == ModifierKeys.None ? (ModifierKeys.Control | ModifierKeys.Shift) : mods;

        if (ComboShortcutKey.SelectedItem is Key k)
            s.HotkeyKey = k;

        s.PreviewBeforeReplace = ChkPreviewBeforeReplace.IsChecked == true;
        s.RestoreClipboard = ChkRestoreClipboard.IsChecked == true;
        s.EnableNotifications = ChkEnableNotifications.IsChecked == true;

        if (ComboActiveProvider.SelectedItem is ProviderType prov)
            s.ActiveProvider = prov;

        if (ComboModel.SelectedItem is string selectedModel)
        {
            switch (s.ActiveProvider)
            {
                case ProviderType.OpenAI: s.OpenAIModel = selectedModel; break;
                case ProviderType.Gemini: s.GeminiModel = selectedModel; break;
                case ProviderType.Claude: s.ClaudeModel = selectedModel; break;
                case ProviderType.Mock: s.MockModel = selectedModel; break;
            }
        }

        if (ComboTheme.SelectedItem is AppTheme theme)
            s.Theme = theme;

        s.WritingStyle.Enabled = ChkEnableWritingStyle.IsChecked == true;
        s.WritingStyle.Tone = ComboTone.SelectedItem as string ?? "Professional";
        s.WritingStyle.Length = ComboLength.SelectedItem as string ?? "Concise";
        s.WritingStyle.Formality = ComboFormality.SelectedItem as string ?? "High";
        s.WritingStyle.PreserveTechnicalTerms = ChkPreserveTechnicalTerms.IsChecked == true;
        s.WritingStyle.AdditionalInstructions = TxtAdditionalInstructions.Text;

        // Auto-save any key currently in the field
        var enteredKey = _isKeyVisible ? KeyPlainTextBox.Text.Trim() : KeyPasswordBox.Password.Trim();
        if (!string.IsNullOrEmpty(enteredKey) && s.ActiveProvider != ProviderType.Mock)
        {
            _secureStorage.SaveSecret(s.ActiveProvider.ToString(), enteredKey);
        }

        await _settingsService.SaveAsync();
        this.Close();
    }

    private void CloseWindow_Click(object sender, RoutedEventArgs e)
    {
        this.Close();
    }
}
