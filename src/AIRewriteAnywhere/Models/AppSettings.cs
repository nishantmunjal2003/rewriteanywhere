using System.Windows.Input;
using AIRewriteAnywhere.Common;

namespace AIRewriteAnywhere.Models;

public class AppSettings
{
    // General Settings
    public bool StartWithWindows { get; set; } = false;
    public bool ShowFloatingButton { get; set; } = true;
    public FloatingButtonSize FloatingButtonSize { get; set; } = FloatingButtonSize.Medium;
    public ModifierKeys HotkeyModifiers { get; set; } = ModifierKeys.Control | ModifierKeys.Shift;
    public Key HotkeyKey { get; set; } = Key.R;
    public bool PreviewBeforeReplace { get; set; } = false;
    public bool RestoreClipboard { get; set; } = true;
    public bool EnableNotifications { get; set; } = true;
    public bool EnablePowerEfficiency { get; set; } = true;

    // AI Provider Settings
    public ProviderType ActiveProvider { get; set; } = ProviderType.OpenAI;
    public string OpenAIModel { get; set; } = Constants.DefaultModels.OpenAI;
    public string GeminiModel { get; set; } = Constants.DefaultModels.Gemini;
    public string ClaudeModel { get; set; } = Constants.DefaultModels.Claude;
    public string MockModel { get; set; } = Constants.DefaultModels.Mock;

    // Writing Settings
    public RewriteMode DefaultMode { get; set; } = RewriteMode.Improve;
    public string DefaultLanguage { get; set; } = "English";
    public WritingStyleProfile WritingStyle { get; set; } = new();

    // Personal Profile & Email Context Settings
    public string UserName { get; set; } = string.Empty;
    public string UserPosition { get; set; } = string.Empty;
    public bool IncludeEmailSignature { get; set; } = true;
    public string CustomSignature { get; set; } = string.Empty;

    // Appearance Settings
    public AppTheme Theme { get; set; } = AppTheme.System;

    public AppSettings Clone()
    {
        return new AppSettings
        {
            StartWithWindows = this.StartWithWindows,
            ShowFloatingButton = this.ShowFloatingButton,
            FloatingButtonSize = this.FloatingButtonSize,
            HotkeyModifiers = this.HotkeyModifiers,
            HotkeyKey = this.HotkeyKey,
            PreviewBeforeReplace = this.PreviewBeforeReplace,
            RestoreClipboard = this.RestoreClipboard,
            EnableNotifications = this.EnableNotifications,
            EnablePowerEfficiency = this.EnablePowerEfficiency,
            ActiveProvider = this.ActiveProvider,
            OpenAIModel = this.OpenAIModel,
            GeminiModel = this.GeminiModel,
            ClaudeModel = this.ClaudeModel,
            MockModel = this.MockModel,
            DefaultMode = this.DefaultMode,
            DefaultLanguage = this.DefaultLanguage,
            WritingStyle = this.WritingStyle.Clone(),
            UserName = this.UserName,
            UserPosition = this.UserPosition,
            IncludeEmailSignature = this.IncludeEmailSignature,
            CustomSignature = this.CustomSignature,
            Theme = this.Theme
        };
    }
}
