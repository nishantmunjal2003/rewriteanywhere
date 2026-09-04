using System.IO;
using System.Text.Json;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.Settings;

public class SettingsService : ISettingsService
{
    private readonly string _settingsFilePath;
    private AppSettings _settings;
    private readonly object _lock = new();

    public AppSettings Settings => _settings;

    public event EventHandler<AppSettings>? SettingsChanged;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true
    };

    public SettingsService(string? customFilePath = null)
    {
        if (string.IsNullOrWhiteSpace(customFilePath))
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            var dir = Path.Combine(appData, "AIRewriteAnywhere");
            Directory.CreateDirectory(dir);
            _settingsFilePath = Path.Combine(dir, "settings.json");
        }
        else
        {
            var dir = Path.GetDirectoryName(customFilePath);
            if (!string.IsNullOrEmpty(dir))
            {
                Directory.CreateDirectory(dir);
            }
            _settingsFilePath = customFilePath;
        }

        _settings = new AppSettings();
    }

    public async Task LoadAsync()
    {
        if (!File.Exists(_settingsFilePath))
        {
            _settings = new AppSettings();
            await SaveAsync();
            return;
        }

        try
        {
            string json;
            lock (_lock)
            {
                json = File.ReadAllText(_settingsFilePath);
            }

            var loaded = JsonSerializer.Deserialize<AppSettings>(json, JsonOptions);
            _settings = loaded ?? new AppSettings();

            // Auto-migrate retired or problematic Gemini models to current high-speed active model
            if (_settings.GeminiModel == "gemini-flash-latest" || _settings.GeminiModel == "gemini-2.5-flash" || _settings.GeminiModel == "gemini-1.5-flash" || _settings.GeminiModel == "gemini-3.6-flash" || string.IsNullOrWhiteSpace(_settings.GeminiModel))
            {
                _settings.GeminiModel = Constants.DefaultModels.Gemini;
            }

            SettingsChanged?.Invoke(this, _settings);
        }
        catch
        {
            _settings = new AppSettings();
        }
    }

    public async Task SaveAsync()
    {
        try
        {
            string json;
            lock (_lock)
            {
                json = JsonSerializer.Serialize(_settings, JsonOptions);
                File.WriteAllText(_settingsFilePath, json);
            }

            SettingsChanged?.Invoke(this, _settings);
        }
        catch
        {
            // Do not crash on disk save error
        }

        await Task.CompletedTask;
    }
}
