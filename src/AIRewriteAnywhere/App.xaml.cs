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
                IsEnabled = _settingsService.Settings.ShowFloatingButton
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

    private void OpenSettingsWindow(int tabIndex = 0)
    {
        // Prevent opening multiple settings windows
        foreach (Window w in Current.Windows)
        {
            if (w is SettingsWindow sw)
            {
                sw.Activate();
                return;
            }
        }

        if (_settingsService != null && _secureStorage != null && _providerFactory != null && _startupManager != null)
        {
            var settingsWin = new SettingsWindow(_settingsService, _secureStorage, _providerFactory, _startupManager);
            if (tabIndex == 5)
            {
                settingsWin.TabAbout.IsChecked = true;
            }
            settingsWin.Show();
        }
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _logger?.LogInfo("Application shutting down.");
        _hotkeyManager?.Dispose();
        _selectionWatcher?.Dispose();
        _trayIconManager?.Dispose();
        _floatingButtonWindow?.Close();

        base.OnExit(e);
    }
}
