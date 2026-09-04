using System.Windows.Input;
using System.Windows.Interop;
using AIRewriteAnywhere.Logging;

namespace AIRewriteAnywhere.WindowsIntegration;

public class GlobalHotkeyManager : IDisposable
{
    private readonly IAppLogger _logger;
    private HwndSource? _hwndSource;
    private int _currentHotkeyId = 9001;
    private bool _isRegistered = false;

    public event Action? HotkeyTriggered;

    public GlobalHotkeyManager(IAppLogger logger)
    {
        _logger = logger;
    }

    public void Initialize()
    {
        if (_hwndSource != null) return;

        var parameters = new HwndSourceParameters("AIRewriteAnywhere_HotkeyHook")
        {
            Width = 0,
            Height = 0,
            PositionX = 0,
            PositionY = 0,
            WindowStyle = 0
        };

        _hwndSource = new HwndSource(parameters);
        _hwndSource.AddHook(HwndHook);
    }

    public bool Register(ModifierKeys modifiers, Key key)
    {
        Initialize();
        if (_hwndSource == null) return false;

        Unregister();

        uint fsModifiers = NativeMethods.MOD_NOREPEAT;
        if ((modifiers & ModifierKeys.Alt) != 0) fsModifiers |= NativeMethods.MOD_ALT;
        if ((modifiers & ModifierKeys.Control) != 0) fsModifiers |= NativeMethods.MOD_CONTROL;
        if ((modifiers & ModifierKeys.Shift) != 0) fsModifiers |= NativeMethods.MOD_SHIFT;
        if ((modifiers & ModifierKeys.Windows) != 0) fsModifiers |= NativeMethods.MOD_WIN;

        uint vk = (uint)KeyInterop.VirtualKeyFromKey(key);

        var success = NativeMethods.RegisterHotKey(_hwndSource.Handle, _currentHotkeyId, fsModifiers, vk);
        if (success)
        {
            _isRegistered = true;
            _logger.LogInfo($"Registered global hotkey: {modifiers} + {key} (id={_currentHotkeyId})");
        }
        else
        {
            _logger.LogWarning($"Failed to register global hotkey: {modifiers} + {key}. May conflict with another app.");
        }

        return success;
    }

    public void Unregister()
    {
        if (_isRegistered && _hwndSource != null)
        {
            NativeMethods.UnregisterHotKey(_hwndSource.Handle, _currentHotkeyId);
            _isRegistered = false;
        }
    }

    private IntPtr HwndHook(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        if (msg == NativeMethods.WM_HOTKEY && wParam.ToInt32() == _currentHotkeyId)
        {
            _logger.LogInfo("Global hotkey triggered by user.");
            HotkeyTriggered?.Invoke();
            handled = true;
        }

        return IntPtr.Zero;
    }

    public void Dispose()
    {
        Unregister();
        if (_hwndSource != null)
        {
            _hwndSource.RemoveHook(HwndHook);
            _hwndSource.Dispose();
            _hwndSource = null;
        }
        GC.SuppressFinalize(this);
    }
}
