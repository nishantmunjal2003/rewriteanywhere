using System.Runtime.InteropServices;
using System.Windows;
using AIRewriteAnywhere.Logging;

namespace AIRewriteAnywhere.Clipboard;

public class ClipboardManager : IClipboardManager
{
    private readonly IAppLogger _logger;
    private const int MaxRetries = 10;
    private const int RetryDelayMs = 25;

    public ClipboardManager(IAppLogger logger)
    {
        _logger = logger;
    }

    public ClipboardBackup Backup()
    {
        var backup = new ClipboardBackup();

        ExecuteOnSta(() =>
        {
            for (int attempt = 0; attempt < MaxRetries; attempt++)
            {
                try
                {
                    var dataObj = System.Windows.Clipboard.GetDataObject();
                    if (dataObj != null)
                    {
                        var formats = dataObj.GetFormats(autoConvert: false);
                        foreach (var format in formats)
                        {
                            try
                            {
                                var data = dataObj.GetData(format, autoConvert: false);
                                if (data != null)
                                {
                                    backup.DataEntries[format] = data;
                                }
                            }
                            catch
                            {
                                // Skip non-serializable format if any
                            }
                        }

                        if (System.Windows.Clipboard.ContainsText())
                        {
                            backup.PlainText = System.Windows.Clipboard.GetText();
                        }
                    }
                    break;
                }
                catch (COMException)
                {
                    Thread.Sleep(RetryDelayMs);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Could not backup clipboard format: {ex.Message}");
                    break;
                }
            }
        });

        return backup;
    }

    public void Restore(ClipboardBackup backup)
    {
        if (backup == null) return;

        ExecuteOnSta(() =>
        {
            for (int attempt = 0; attempt < MaxRetries; attempt++)
            {
                try
                {
                    if (backup.IsEmpty)
                    {
                        System.Windows.Clipboard.Clear();
                        return;
                    }

                    var dataObj = new System.Windows.DataObject();
                    foreach (var kvp in backup.DataEntries)
                    {
                        try
                        {
                            dataObj.SetData(kvp.Key, kvp.Value, autoConvert: false);
                        }
                        catch
                        {
                            // Skip problematic format
                        }
                    }

                    // Ensure plain text is preserved
                    if (!string.IsNullOrEmpty(backup.PlainText) && !dataObj.GetDataPresent(System.Windows.DataFormats.UnicodeText))
                    {
                        dataObj.SetText(backup.PlainText);
                    }

                    System.Windows.Clipboard.SetDataObject(dataObj, copy: true);
                    return;
                }
                catch (COMException)
                {
                    Thread.Sleep(RetryDelayMs);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Failed to restore clipboard: {ex.Message}");
                    break;
                }
            }
        });
    }

    public Task<string> GetTextAsync()
    {
        string text = string.Empty;
        ExecuteOnSta(() =>
        {
            for (int attempt = 0; attempt < MaxRetries; attempt++)
            {
                try
                {
                    if (System.Windows.Clipboard.ContainsText())
                    {
                        text = System.Windows.Clipboard.GetText();
                    }
                    return;
                }
                catch (COMException)
                {
                    Thread.Sleep(RetryDelayMs);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Failed to read clipboard text: {ex.Message}");
                    break;
                }
            }
        });

        return Task.FromResult(text);
    }

    public Task SetTextAsync(string text)
    {
        ExecuteOnSta(() =>
        {
            for (int attempt = 0; attempt < MaxRetries; attempt++)
            {
                try
                {
                    System.Windows.Clipboard.SetText(text ?? string.Empty);
                    return;
                }
                catch (COMException)
                {
                    Thread.Sleep(RetryDelayMs);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Failed to set clipboard text: {ex.Message}");
                    break;
                }
            }
        });

        return Task.CompletedTask;
    }

    public Task ClearAsync()
    {
        ExecuteOnSta(() =>
        {
            for (int attempt = 0; attempt < MaxRetries; attempt++)
            {
                try
                {
                    System.Windows.Clipboard.Clear();
                    return;
                }
                catch (COMException)
                {
                    Thread.Sleep(RetryDelayMs);
                }
                catch
                {
                    break;
                }
            }
        });

        return Task.CompletedTask;
    }

    private static void ExecuteOnSta(Action action)
    {
        if (Thread.CurrentThread.GetApartmentState() == ApartmentState.STA)
        {
            action();
            return;
        }

        var tcs = new TaskCompletionSource<bool>();
        var thread = new Thread(() =>
        {
            try
            {
                action();
                tcs.SetResult(true);
            }
            catch (Exception ex)
            {
                tcs.SetException(ex);
            }
        });

        thread.SetApartmentState(ApartmentState.STA);
        thread.IsBackground = true;
        thread.Start();
        tcs.Task.GetAwaiter().GetResult();
    }
}
