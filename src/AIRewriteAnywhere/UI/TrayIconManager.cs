using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.Windows.Forms;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Core;
using AIRewriteAnywhere.Logging;
using AIRewriteAnywhere.Settings;

namespace AIRewriteAnywhere.UI;

public class TrayIconManager : IDisposable
{
    private readonly NotifyIcon _notifyIcon;
    private readonly ISettingsService _settingsService;
    private readonly IRewriteOrchestrator _orchestrator;
    private readonly IAppLogger _logger;
    private readonly Action _openSettingsAction;
    private readonly Action _openAboutAction;

    public event Action<bool>? FloatingButtonToggled;

    public TrayIconManager(
        ISettingsService settingsService,
        IRewriteOrchestrator orchestrator,
        IAppLogger logger,
        Action openSettingsAction,
        Action openAboutAction)
    {
        _settingsService = settingsService;
        _orchestrator = orchestrator;
        _logger = logger;
        _openSettingsAction = openSettingsAction;
        _openAboutAction = openAboutAction;

        _notifyIcon = new NotifyIcon
        {
            Text = Constants.AppName,
            Visible = true,
            Icon = CreateAppIcon()
        };

        BuildContextMenu();

        _notifyIcon.DoubleClick += (s, e) => _openSettingsAction();
    }

    private void BuildContextMenu()
    {
        var contextMenu = new ContextMenuStrip();

        var titleItem = new ToolStripMenuItem($"{Constants.AppName} v{Constants.AppVersion}")
        {
            Enabled = false,
            Font = new Font(contextMenu.Font, System.Drawing.FontStyle.Bold)
        };
        contextMenu.Items.Add(titleItem);
        contextMenu.Items.Add(new ToolStripSeparator());

        // Rewrite selection
        var rewriteItem = new ToolStripMenuItem("✨ Rewrite Selected Text", null, async (s, e) =>
        {
            await _orchestrator.TriggerRewriteFlowFromHotkeyAsync();
        });
        contextMenu.Items.Add(rewriteItem);

        // Undo Last Rewrite
        var undoItem = new ToolStripMenuItem("↺ Undo Last Rewrite", null, async (s, e) =>
        {
            await _orchestrator.UndoLastRewriteAsync();
        });
        contextMenu.Items.Add(undoItem);

        contextMenu.Items.Add(new ToolStripSeparator());

        // Floating button toggle
        var toggleFloatingItem = new ToolStripMenuItem("Show Floating AI Button")
        {
            CheckOnClick = true,
            Checked = _settingsService.Settings.ShowFloatingButton
        };
        toggleFloatingItem.Click += async (s, e) =>
        {
            _settingsService.Settings.ShowFloatingButton = toggleFloatingItem.Checked;
            await _settingsService.SaveAsync();
            FloatingButtonToggled?.Invoke(toggleFloatingItem.Checked);
        };
        contextMenu.Items.Add(toggleFloatingItem);

        // Settings
        var settingsItem = new ToolStripMenuItem("⚙ Settings...", null, (s, e) => _openSettingsAction());
        contextMenu.Items.Add(settingsItem);

        // View Logs
        var viewLogsItem = new ToolStripMenuItem("📄 View Logs", null, (s, e) =>
        {
            try
            {
                if (System.IO.File.Exists(_logger.LogFilePath))
                {
                    System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = _logger.LogFilePath,
                        UseShellExecute = true
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Could not open log file: {ex.Message}");
            }
        });
        contextMenu.Items.Add(viewLogsItem);

        // About
        var aboutItem = new ToolStripMenuItem("ℹ About", null, (s, e) => _openAboutAction());
        contextMenu.Items.Add(aboutItem);

        contextMenu.Items.Add(new ToolStripSeparator());

        // Exit
        var exitItem = new ToolStripMenuItem("Exit", null, (s, e) =>
        {
            System.Windows.Application.Current.Shutdown();
        });
        contextMenu.Items.Add(exitItem);

        _notifyIcon.ContextMenuStrip = contextMenu;
    }

    public void ShowNotification(string title, string message, ToolTipIcon icon = ToolTipIcon.Info)
    {
        if (_settingsService.Settings.EnableNotifications)
        {
            _notifyIcon.ShowBalloonTip(3000, title, message, icon);
        }
    }

    private static Icon CreateAppIcon()
    {
        using var bmp = new Bitmap(32, 32);
        using var g = Graphics.FromImage(bmp);
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.TextRenderingHint = TextRenderingHint.ClearTypeGridFit;

        // Draw a dark purple rounded background badge
        using var brush = new SolidBrush(System.Drawing.Color.FromArgb(124, 58, 237));
        g.FillEllipse(brush, 1, 1, 29, 29);

        // Draw the ✨ spark
        using var textBrush = new SolidBrush(System.Drawing.Color.White);
        using var font = new Font("Segoe UI Emoji", 14, System.Drawing.FontStyle.Bold);
        var sf = new StringFormat
        {
            Alignment = StringAlignment.Center,
            LineAlignment = StringAlignment.Center
        };
        g.DrawString("✨", font, textBrush, new RectangleF(0, 0, 32, 32), sf);

        var hIcon = bmp.GetHicon();
        return Icon.FromHandle(hIcon);
    }

    public void Dispose()
    {
        _notifyIcon.Visible = false;
        _notifyIcon.Dispose();
        GC.SuppressFinalize(this);
    }
}
