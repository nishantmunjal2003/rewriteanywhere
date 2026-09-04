using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.Settings;

public interface ISettingsService
{
    AppSettings Settings { get; }
    event EventHandler<AppSettings>? SettingsChanged;
    Task LoadAsync();
    Task SaveAsync();
}
