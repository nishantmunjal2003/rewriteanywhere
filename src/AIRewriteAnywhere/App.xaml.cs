using System.IO;
using System.IO.Pipes;
using System.Threading;
using System.Windows;
using System.Windows.Forms;
using AIRewriteAnywhere.AI;
using AIRewriteAnywhere.Clipboard;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Core;
using AIRewriteAnywhere.Logging;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.Replacement;
using AIRewriteAnywhere.Security;
using AIRewriteAnywhere.Selection;
using AIRewriteAnywhere.Settings;
using AIRewriteAnywhere.UI;
using AIRewriteAnywhere.WindowsIntegration;
using Application = System.Windows.Application;

namespace AIRewriteAnywhere;

public partial class App : Application
{
    private const string MutexName = "AIRewriteAnywhere_SingleInstance_Mutex";
    private const string PipeName = "AIRewriteAnywhere_IPC_Pipe";

    private Mutex? _singleInstanceMutex;
    private CancellationTokenSource? _ipcServerCts;
    private IAppLogger? _logger;
    private ISecureStorage? _secureStorage;
    private ISettingsService? _settingsService;
    private IClipboardManager? _clipboardManager;
    private AIProviderFactory? _providerFactory;
    private ISelectionService? _selectionService;
    private ITextReplacementService? _replacementService;
    private StartupManager? _startupManager;
    private RewriteOrchestrator? _orchestrator;
    private GlobalHotkeyManager? _hotkeyManager;
    private SelectionWatcher? _selectionWatcher;
    private FloatingButtonWindow? _floatingButtonWindow;
    private TrayIconManager? _trayIconManager;

    protected override async void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        _logger = new FileLogger();

        bool isPrimary = false;
        try
        {
            _singleInstanceMutex = new Mutex(true, MutexName, out isPrimary);
        }
        catch (AbandonedMutexException)
        {
            isPrimary = true;
        }
        catch (Exception ex)
        {
            _logger?.LogWarning($"Mutex check encountered: {ex.Message}");
            var currentProc = System.Diagnostics.Process.GetCurrentProcess();
            var existingProcs = System.Diagnostics.Process.GetProcessesByName(currentProc.ProcessName)
                .Where(p => p.Id != currentProc.Id)
                .ToList();
            isPrimary = existingProcs.Count == 0;
        }

        if (!isPrimary)
        {
            _logger?.LogInfo("Another instance of AI Rewrite Anywhere is already running. Signaling it to open UI...");
            try
            {
                NativeMethods.AllowSetForegroundWindow(NativeMethods.ASFW_ANY);

                using var pipeClient = new NamedPipeClientStream(".", PipeName, PipeDirection.Out);
                pipeClient.Connect(2000);
                using var writer = new StreamWriter(pipeClient) { AutoFlush = true };
                writer.WriteLine("SHOW");
                pipeClient.WaitForPipeDrain();
            }
            catch (Exception pipeEx)
            {
                _logger?.LogWarning($"Could not signal running instance: {pipeEx.Message}");
            }

            Shutdown();
            return;
        }

        StartIpcServer();

        DispatcherUnhandledException += (s, args) =>
        {
            _logger?.LogError("Unhandled Dispatcher Exception caught and prevented from closing app", args.Exception);
            args.Handled = true;
        };

        AppDomain.CurrentDomain.UnhandledException += (s, args) =>
        {
            if (args.ExceptionObject is Exception ex)
            {
                _logger?.LogError("Unhandled AppDomain Exception", ex);
            }
        };

        try
        {
            // Initialize Core Infrastructure
            _logger = new FileLogger();
            _logger.LogInfo($"=== Starting {Constants.AppName} v{Constants.AppVersion} ===");

            _secureStorage = new DpapiSecureStorage();
            _settingsService = new SettingsService();
            await _settingsService.LoadAsync();

            _clipboardManager = new ClipboardManager(_logger);
            _providerFactory = new AIProviderFactory();
            _selectionService = new SelectionService(_clipboardManager, _logger);
            _replacementService = new TextReplacementService(_clipboardManager, _logger);
            _startupManager = new StartupManager(_logger);

            // Initialize Orchestrator
            _orchestrator = new RewriteOrchestrator(
                _settingsService,
                _secureStorage,
                _providerFactory,
                _selectionService,
                _replacementService,
                _clipboardManager,
                _logger);

            // Setup Floating Button Window
            _floatingButtonWindow = new FloatingButtonWindow();
            _floatingButtonWindow.ButtonClicked += selection =>
            {
                _orchestrator.TriggerRewriteFlowFromSelection(selection);
            };

            // Setup Selection Watcher
            _selectionWatcher = new SelectionWatcher(_selectionService, _logger)
            {
                IsEnabled = _settingsService.Settings.ShowFloatingButton,
                PowerEfficiencyEnabled = _settingsService.Settings.EnablePowerEfficiency
            };
            _selectionWatcher.SelectionDetected += sel =>
            {
                if (_settingsService.Settings.ShowFloatingButton && _floatingButtonWindow != null)
                {
                    _floatingButtonWindow.ShowNear(sel, _settingsService.Settings.FloatingButtonSize);
                }
            };
            _selectionWatcher.SelectionCleared += () =>
            {
                _floatingButtonWindow?.HideButton();
            };
            _selectionWatcher.Start();

            // Wire Orchestrator Events
            _orchestrator.ShowRewriteMenuRequested += selection =>
            {
                var menu = new RewriteMenuWindow();
                Action closeHandler = () =>
                {
                    Dispatcher.InvokeAsync(() => menu.SafeClose());
                };
                _orchestrator.GenerationCompleted += closeHandler;
                menu.Closed += (s, e) =>
                {
                    _orchestrator.GenerationCompleted -= closeHandler;
                };

                menu.RewriteRequested += async (sel, mode, custom, lang, ct) =>
                {
                    return await _orchestrator.ExecuteRewriteAsync(sel, mode, custom, lang, ct);
                };
                menu.ShowNear(selection);
            };

            _orchestrator.ShowPreviewRequested = (original, rewritten) =>
            {
                var preview = new PreviewWindow(original, rewritten);
                var result = preview.ShowDialog();
                return Task.FromResult(result == true && preview.UserAccepted);
            };

            _orchestrator.NotificationRequested += (msg, isError) =>
            {
                _trayIconManager?.ShowNotification(
                    Constants.AppName,
                    msg,
                    isError ? ToolTipIcon.Warning : ToolTipIcon.Info);
            };

            // Setup Tray Icon
            _trayIconManager = new TrayIconManager(
                _settingsService,
                _orchestrator,
                _logger,
                openSettingsAction: () => OpenSettingsWindow(),
                openAboutAction: () => OpenSettingsWindow(tabIndex: 5));

            _trayIconManager.FloatingButtonToggled += enabled =>
            {
                if (_selectionWatcher != null)
                {
                    _selectionWatcher.IsEnabled = enabled;
                }
                if (!enabled)
                {
                    _floatingButtonWindow?.HideButton();
                }
            };

            // Setup Global Hotkey
            _hotkeyManager = new GlobalHotkeyManager(_logger);
            _hotkeyManager.HotkeyTriggered += async () =>
            {
                await _orchestrator.TriggerRewriteFlowFromHotkeyAsync();
            };
            _hotkeyManager.Register(_settingsService.Settings.HotkeyModifiers, _settingsService.Settings.HotkeyKey);

            // React to settings changes
            _settingsService.SettingsChanged += (s, newSettings) =>
            {
                _hotkeyManager?.Register(newSettings.HotkeyModifiers, newSettings.HotkeyKey);
                if (_selectionWatcher != null)
                {
                    _selectionWatcher.IsEnabled = newSettings.ShowFloatingButton;
                    _selectionWatcher.PowerEfficiencyEnabled = newSettings.EnablePowerEfficiency;
                }
                if (!newSettings.ShowFloatingButton)
                {
                    _floatingButtonWindow?.HideButton();
                }
            };

            _trayIconManager.ShowNotification(
                Constants.AppName,
                "Ready in system tray. Press Ctrl+Shift+R or select text to rewrite with AI.",
                ToolTipIcon.Info);

            _logger.LogInfo("Application initialized and running in system tray.");

            // Show settings window on interactive launch (unless started with --minimized / --silent)
            bool startMinimized = e.Args.Any(a =>
                string.Equals(a, "--minimized", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(a, "--silent", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(a, "-minimized", StringComparison.OrdinalIgnoreCase));

            if (!startMinimized)
            {
                OpenSettingsWindow();
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError("Application startup failure.", ex);
            System.Windows.MessageBox.Show(
                $"Failed to start {Constants.AppName}:\n{ex.Message}",
                Constants.AppName,
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            Shutdown(1);
        }
    }

    private void StartIpcServer()
    {
        _ipcServerCts = new CancellationTokenSource();
        var ct = _ipcServerCts.Token;

        Task.Run(async () =>
        {
            while (!ct.IsCancellationRequested)
            {
                try
                {
                    using var server = new NamedPipeServerStream(
                        PipeName,
                        PipeDirection.In,
                        NamedPipeServerStream.MaxAllowedServerInstances,
                        PipeTransmissionMode.Byte,
                        PipeOptions.Asynchronous);

                    await server.WaitForConnectionAsync(ct);

                    using var reader = new StreamReader(server);
                    var cmd = await reader.ReadLineAsync(ct);
                    _logger?.LogInfo($"Received IPC command: '{cmd}' from second instance.");

                    if (cmd == "SHOW" || string.IsNullOrEmpty(cmd))
                    {
                        Dispatcher.Invoke(() =>
                        {
                            OpenSettingsWindow();
                            _trayIconManager?.ShowNotification(
                                Constants.AppName,
                                "AI Rewrite Anywhere is active! Press Ctrl+Shift+R or select text.",
                                ToolTipIcon.Info);
                        });
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger?.LogError("IPC server exception", ex);
                    try { await Task.Delay(1000, ct); } catch { break; }
                }
            }
        }, ct);
    }

    private void BringWindowToForeground(Window window)
    {
        if (window == null) return;

        try
        {
            if (window.WindowState == WindowState.Minimized)
            {
                window.WindowState = WindowState.Normal;
            }

            DisplayHelper.CenterOnActiveMonitor(window);

            window.Show();

            var hwnd = new System.Windows.Interop.WindowInteropHelper(window).EnsureHandle();
            if (hwnd != IntPtr.Zero)
            {
                NativeMethods.ShowWindow(hwnd, NativeMethods.SW_RESTORE);

                var foregroundHwnd = NativeMethods.GetForegroundWindow();
                uint foregroundThreadId = NativeMethods.GetWindowThreadProcessId(foregroundHwnd, out _);
                uint currentThreadId = NativeMethods.GetCurrentThreadId();

                if (foregroundThreadId != currentThreadId && foregroundThreadId != 0)
                {
                    NativeMethods.AttachThreadInput(currentThreadId, foregroundThreadId, true);
                    NativeMethods.BringWindowToTop(hwnd);
                    NativeMethods.SetForegroundWindow(hwnd);
                    NativeMethods.AttachThreadInput(currentThreadId, foregroundThreadId, false);
                }
                else
                {
                    NativeMethods.BringWindowToTop(hwnd);
                    NativeMethods.SetForegroundWindow(hwnd);
                }
            }

            window.Activate();
            window.Topmost = true;
            window.Focus();

            // Defer clearing Topmost so window establishes its foreground z-order reliably
            Dispatcher.BeginInvoke(System.Windows.Threading.DispatcherPriority.ApplicationIdle, new Action(() =>
            {
                window.Topmost = false;
            }));
        }
        catch (Exception ex)
        {
            _logger?.LogWarning($"BringWindowToForeground encountered exception: {ex.Message}");
        }
    }

    private void OpenSettingsWindow(int tabIndex = 0)
    {
        try
        {
            _logger?.LogInfo($"OpenSettingsWindow invoked. tabIndex={tabIndex}, settingsServiceNull={_settingsService == null}, startupManagerNull={_startupManager == null}");

            // Prevent opening multiple settings windows
            foreach (Window w in Current.Windows)
            {
                if (w is SettingsWindow sw)
                {
                    _logger?.LogInfo("Existing SettingsWindow found in Current.Windows. Activating existing instance.");
                    if (tabIndex == 5)
                    {
                        sw.TabAbout.IsChecked = true;
                    }
                    BringWindowToForeground(sw);
                    return;
                }
            }

            if (_settingsService != null && _secureStorage != null && _providerFactory != null && _startupManager != null)
            {
                _logger?.LogInfo("Creating and showing new SettingsWindow...");
                var settingsWin = new SettingsWindow(_settingsService, _secureStorage, _providerFactory, _startupManager);
                if (tabIndex == 5)
                {
                    settingsWin.TabAbout.IsChecked = true;
                }

                settingsWin.Closed += (s, e) =>
                {
                    _logger?.LogInfo("SettingsWindow closed by user.");
                    _trayIconManager?.ShowNotification(
                        Constants.AppName,
                        "AI Rewrite Anywhere is running in your system tray. Press Ctrl+Shift+R anytime!",
                        ToolTipIcon.Info);
                };

                BringWindowToForeground(settingsWin);
                _logger?.LogInfo($"SettingsWindow displayed successfully. IsVisible={settingsWin.IsVisible}");
            }
            else
            {
                _logger?.LogWarning("OpenSettingsWindow called before dependencies were initialized.");
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError("Failed to open SettingsWindow", ex);
        }
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _logger?.LogInfo("Application shutting down.");
        _ipcServerCts?.Cancel();
        try
        {
            _singleInstanceMutex?.ReleaseMutex();
        }
        catch { }
        _singleInstanceMutex?.Dispose();
        _hotkeyManager?.Dispose();
        _selectionWatcher?.Dispose();
        _trayIconManager?.Dispose();
        _floatingButtonWindow?.Close();

        base.OnExit(e);
    }
}
