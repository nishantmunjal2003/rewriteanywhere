using System.IO;
using System.Windows.Input;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Settings;

namespace AIRewriteAnywhere.Tests;

public class SettingsServiceTests : IDisposable
{
    private readonly string _tempSettingsPath;

    public SettingsServiceTests()
    {
        _tempSettingsPath = Path.Combine(Path.GetTempPath(), $"settings_test_{Guid.NewGuid():N}.json");
    }

    public void Dispose()
    {
        if (File.Exists(_tempSettingsPath))
        {
            try { File.Delete(_tempSettingsPath); } catch { }
        }
    }

    [Fact]
    public async Task LoadAsync_CreatesDefaultSettings_WhenFileDoesNotExist()
    {
        var service = new SettingsService(_tempSettingsPath);
        await service.LoadAsync();

        Assert.NotNull(service.Settings);
        Assert.True(service.Settings.ShowFloatingButton);
        Assert.Equal(ProviderType.OpenAI, service.Settings.ActiveProvider);
        Assert.Equal(ModifierKeys.Control | ModifierKeys.Shift, service.Settings.HotkeyModifiers);
        Assert.Equal(Key.R, service.Settings.HotkeyKey);
        Assert.False(service.Settings.PreviewBeforeReplace);
        Assert.True(service.Settings.RestoreClipboard);
        Assert.True(service.Settings.EnablePowerEfficiency);
    }

    [Fact]
    public async Task SaveAndLoad_PersistsCustomSettings()
    {
        var service = new SettingsService(_tempSettingsPath);
        await service.LoadAsync();

        service.Settings.ActiveProvider = ProviderType.Gemini;
        service.Settings.PreviewBeforeReplace = true;
        service.Settings.FloatingButtonSize = FloatingButtonSize.Large;
        service.Settings.EnablePowerEfficiency = false;
        service.Settings.WritingStyle.Enabled = true;
        service.Settings.WritingStyle.Tone = "Direct";

        await service.SaveAsync();

        var reloadedService = new SettingsService(_tempSettingsPath);
        await reloadedService.LoadAsync();

        Assert.Equal(ProviderType.Gemini, reloadedService.Settings.ActiveProvider);
        Assert.True(reloadedService.Settings.PreviewBeforeReplace);
        Assert.Equal(FloatingButtonSize.Large, reloadedService.Settings.FloatingButtonSize);
        Assert.False(reloadedService.Settings.EnablePowerEfficiency);
        Assert.True(reloadedService.Settings.WritingStyle.Enabled);
        Assert.Equal("Direct", reloadedService.Settings.WritingStyle.Tone);
    }

    [Fact]
    public async Task SaveAndLoad_PersistsPersonalProfileAndEmailSettings()
    {
        var service = new SettingsService(_tempSettingsPath);
        await service.LoadAsync();

        service.Settings.UserName = "Dr. Nishant Munjal";
        service.Settings.UserPosition = "Lead AI Researcher";
        service.Settings.IncludeEmailSignature = false;
        service.Settings.CustomSignature = "Regards,\nNishant";

        await service.SaveAsync();

        var reloadedService = new SettingsService(_tempSettingsPath);
        await reloadedService.LoadAsync();

        Assert.Equal("Dr. Nishant Munjal", reloadedService.Settings.UserName);
        Assert.Equal("Lead AI Researcher", reloadedService.Settings.UserPosition);
        Assert.False(reloadedService.Settings.IncludeEmailSignature);
        Assert.Equal("Regards,\nNishant", reloadedService.Settings.CustomSignature);
    }

    [Fact]
    public async Task SettingsChanged_FiresOnSave()
    {
        var service = new SettingsService(_tempSettingsPath);
        await service.LoadAsync();

        bool eventFired = false;
        service.SettingsChanged += (s, settings) =>
        {
            eventFired = true;
        };

        service.Settings.Theme = AppTheme.Dark;
        await service.SaveAsync();

        Assert.True(eventFired);
    }
}
