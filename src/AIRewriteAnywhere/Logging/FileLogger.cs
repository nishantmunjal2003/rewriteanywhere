using System.IO;
using System.Text.RegularExpressions;

namespace AIRewriteAnywhere.Logging;

public class FileLogger : IAppLogger
{
    private readonly string _logFilePath;
    private readonly object _lock = new();

    // Regex to scrub any API key patterns or sensitive headers
    private static readonly Regex KeySanitizer = new(
        @"(sk-[a-zA-Z0-9_-]{10,}|key=[a-zA-Z0-9_-]{10,}|Bearer\s+[a-zA-Z0-9_.-]+|x-api-key:\s*[a-zA-Z0-9_-]+)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public string LogFilePath => _logFilePath;

    public FileLogger(string? customLogPath = null)
    {
        if (string.IsNullOrWhiteSpace(customLogPath))
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            var logDir = Path.Combine(appData, "AIRewriteAnywhere", "logs");
            Directory.CreateDirectory(logDir);
            _logFilePath = Path.Combine(logDir, "rewrite_anywhere.log");
        }
        else
        {
            var logDir = Path.GetDirectoryName(customLogPath);
            if (!string.IsNullOrEmpty(logDir))
            {
                Directory.CreateDirectory(logDir);
            }
            _logFilePath = customLogPath;
        }
    }

    public void LogInfo(string message) => WriteEntry("INFO", message);
    public void LogWarning(string message) => WriteEntry("WARN", message);
    public void LogError(string message, Exception? ex = null)
    {
        var formatted = message;
        if (ex != null)
        {
            // Sanitize exception messages and stack traces
            formatted += $" | Exception: {ex.GetType().Name} - {ex.Message}";
        }
        WriteEntry("ERROR", formatted);
    }

    private void WriteEntry(string level, string message)
    {
        var sanitized = Sanitize(message);
        var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
        var line = $"[{timestamp}] [{level}] {sanitized}";

        lock (_lock)
        {
            try
            {
                File.AppendAllText(_logFilePath, line + Environment.NewLine);
            }
            catch
            {
                // Never crash application because of logging failure
            }
        }
    }

    private static string Sanitize(string input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;

        return KeySanitizer.Replace(input, "[REDACTED_CREDENTIAL]");
    }
}
