using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Forms;
using System.Windows.Threading;
using AIRewriteAnywhere.Logging;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.Selection;

namespace AIRewriteAnywhere.WindowsIntegration;

public class SelectionWatcher : IDisposable
{
    private readonly ISelectionService _selectionService;
    private readonly IAppLogger _logger;
    private readonly UIAutomationSelectionProvider _uiaProvider;
    private readonly DispatcherTimer _timer;

    private IntPtr _lastHwnd = IntPtr.Zero;
    private string _lastText = string.Empty;
    private bool _isEnabled = true;
    private bool _powerEfficiencyEnabled = true;

    public event Action<SelectionInfo>? SelectionDetected;
    public event Action? SelectionCleared;

    public bool IsEnabled
    {
        get => _isEnabled;
        set
        {
            _isEnabled = value;
            if (!_isEnabled)
            {
                SelectionCleared?.Invoke();
            }
        }
    }

    public bool PowerEfficiencyEnabled
    {
        get => _powerEfficiencyEnabled;
        set => _powerEfficiencyEnabled = value;
    }

    public SelectionWatcher(ISelectionService selectionService, IAppLogger logger)
    {
        _selectionService = selectionService;
        _logger = logger;
        _uiaProvider = new UIAutomationSelectionProvider(_logger);

        _timer = new DispatcherTimer(DispatcherPriority.Background)
        {
            Interval = TimeSpan.FromMilliseconds(350)
        };
        _timer.Tick += OnTick;
    }

    public void Start()
    {
        _timer.Start();
    }

    public void Stop()
    {
        _timer.Stop();
        SelectionCleared?.Invoke();
    }

    private void OnTick(object? sender, EventArgs e)
    {
        if (!_isEnabled) return;

        var currentHwnd = NativeMethods.GetForegroundWindow();
        if (currentHwnd == IntPtr.Zero) return;

        // Skip our own windows
        NativeMethods.GetWindowThreadProcessId(currentHwnd, out var procId);
        if (procId == Environment.ProcessId) return;

        // Power efficiency logic: adapt polling frequency and skip COM calls when idle
        if (_powerEfficiencyEnabled)
        {
            uint idleTimeMs = GetIdleTimeMs();
            bool isOnBattery = SystemInformation.PowerStatus.PowerLineStatus == System.Windows.Forms.PowerLineStatus.Offline;

            // Compute dynamic adaptive interval based on user activity and power source
            TimeSpan targetInterval;
            if (idleTimeMs < 2000)
            {
                targetInterval = isOnBattery ? TimeSpan.FromMilliseconds(500) : TimeSpan.FromMilliseconds(350);
            }
            else if (idleTimeMs < 8000)
            {
                targetInterval = isOnBattery ? TimeSpan.FromMilliseconds(2000) : TimeSpan.FromMilliseconds(1200);
            }
            else
            {
                targetInterval = isOnBattery ? TimeSpan.FromMilliseconds(5000) : TimeSpan.FromMilliseconds(3000);
            }

            if (_timer.Interval != targetInterval)
            {
                _timer.Interval = targetInterval;
            }

            // If user has not moved mouse or touched keyboard in >2s and window hasn't changed,
            // text selection cannot have changed. Skip expensive UI Automation COM traversal.
            if (currentHwnd == _lastHwnd && idleTimeMs > 2000)
            {
                return;
            }
        }

        try
        {
            // UI Automation inspect only during background tick
            // (Do not synthesize Ctrl+C keystrokes in background watcher, only UI Automation!)
            var selection = _uiaProvider.TryGetSelection(currentHwnd);

            if (selection != null && !string.IsNullOrWhiteSpace(selection.Text))
            {
                if (selection.Text != _lastText || currentHwnd != _lastHwnd)
                {
                    _lastHwnd = currentHwnd;
                    _lastText = selection.Text;
                    SelectionDetected?.Invoke(selection);
                }
            }
            else if (!string.IsNullOrEmpty(_lastText))
            {
                _lastHwnd = currentHwnd;
                _lastText = string.Empty;
                SelectionCleared?.Invoke();
            }
            else
            {
                _lastHwnd = currentHwnd;
            }
        }
        catch
        {
            // Ignore background tick exceptions
        }
    }

    private static uint GetIdleTimeMs()
    {
        var lii = new NativeMethods.LASTINPUTINFO();
        lii.cbSize = (uint)Marshal.SizeOf(lii);
        if (NativeMethods.GetLastInputInfo(ref lii))
        {
            return unchecked((uint)Environment.TickCount) - lii.dwTime;
        }
        return 0;
    }

    public void Dispose()
    {
        _timer.Stop();
        GC.SuppressFinalize(this);
    }
}
