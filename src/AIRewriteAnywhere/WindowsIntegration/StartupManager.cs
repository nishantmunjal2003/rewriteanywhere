using Microsoft.Win32;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Logging;

namespace AIRewriteAnywhere.WindowsIntegration;

public class StartupManager
{
    private readonly IAppLogger _logger;

    public StartupManager(IAppLogger logger)
    {
        _logger = logger;
    }

    public bool IsStartupEnabled()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(Constants.WindowsRunKey, false);
            var value = key?.GetValue(Constants.AppName) as string;
            return !string.IsNullOrEmpty(value);
        }
        catch (Exception ex)
        {
            _logger.LogWarning($"Failed to query startup registry: {ex.Message}");
            return false;
        }
    }

    public bool SetStartupEnabled(bool enable)
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(Constants.WindowsRunKey, true);
            if (key == null) return false;

            if (enable)
            {
                var exePath = Environment.ProcessPath;
                if (!string.IsNullOrEmpty(exePath))
                {
                    key.SetValue(Constants.AppName, $"\"{exePath}\" --minimized");
                    _logger.LogInfo("Configured app to start with Windows.");
                    return true;
                }
            }
            else
            {
                key.DeleteValue(Constants.AppName, false);
                _logger.LogInfo("Removed app from Windows startup.");
                return true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError("Failed to update startup registry.", ex);
        }
        return false;
    }
}
