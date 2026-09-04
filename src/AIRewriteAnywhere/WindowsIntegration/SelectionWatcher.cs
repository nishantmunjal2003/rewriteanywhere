using System.Windows;
using System.Windows.Threading;
using AIRewriteAnywhere.Logging;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.Selection;

namespace AIRewriteAnywhere.WindowsIntegration;

public class SelectionWatcher : IDisposable
{
    private readonly ISelectionService _selectionService;
    private readonly IAppLogger _logger;
    private readonly DispatcherTimer _timer;
    private IntPtr _lastHwnd = IntPtr.Zero;
    private string _lastText = string.Empty;
    private bool _isEnabled = true;

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

    public SelectionWatcher(ISelectionService selectionService, IAppLogger logger)
    {
        _selectionService = selectionService;
        _logger = logger;

        _timer = new DispatcherTimer(DispatcherPriority.Background)
        {
            Interval = TimeSpan.FromMilliseconds(450)
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

        try
        {
            // UI Automation inspect only during background tick
            // (Do not synthesize Ctrl+C keystrokes in background watcher, only UI Automation!)
            var uia = new UIAutomationSelectionProvider(_logger);
            var selection = uia.TryGetSelection(currentHwnd);

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
                _lastText = string.Empty;
                SelectionCleared?.Invoke();
            }
        }
        catch
        {
            // Ignore background tick exceptions
        }
    }

    public void Dispose()
    {
        _timer.Stop();
        GC.SuppressFinalize(this);
    }
}
