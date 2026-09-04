using System.Diagnostics;
using System.Text;

namespace AIRewriteAnywhere.WindowsIntegration;

public static class ActiveWindowTracker
{
    public static (IntPtr Hwnd, string Title, string ProcessName) GetActiveWindowDetails()
    {
        var hwnd = NativeMethods.GetForegroundWindow();
        if (hwnd == IntPtr.Zero)
            return (IntPtr.Zero, string.Empty, string.Empty);

        var title = GetWindowTitle(hwnd);
        var processName = GetProcessName(hwnd);

        return (hwnd, title, processName);
    }

    public static string GetWindowTitle(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero) return string.Empty;
        var sb = new StringBuilder(256);
        // Using Win32 GetWindowText via P/Invoke
        GetWindowText(hwnd, sb, sb.Capacity);
        return sb.ToString();
    }

    public static string GetProcessName(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero) return string.Empty;
        try
        {
            NativeMethods.GetWindowThreadProcessId(hwnd, out var processId);
            if (processId > 0)
            {
                using var proc = Process.GetProcessById((int)processId);
                return proc.ProcessName;
            }
        }
        catch
        {
            // Ignore access denied or terminated process
        }
        return string.Empty;
    }

    public static void RestoreFocusToWindow(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero) return;

        var foregroundHwnd = NativeMethods.GetForegroundWindow();
        if (foregroundHwnd == hwnd) return;

        var currentThread = NativeMethods.GetCurrentThreadId();
        var targetThread = NativeMethods.GetWindowThreadProcessId(hwnd, out _);

        if (targetThread != 0 && currentThread != targetThread)
        {
            NativeMethods.AttachThreadInput(currentThread, targetThread, true);
            NativeMethods.BringWindowToTop(hwnd);
            NativeMethods.SetForegroundWindow(hwnd);
            NativeMethods.AttachThreadInput(currentThread, targetThread, false);
        }
        else
        {
            NativeMethods.BringWindowToTop(hwnd);
            NativeMethods.SetForegroundWindow(hwnd);
        }
    }

    [System.Runtime.InteropServices.DllImport("user32.dll", CharSet = System.Runtime.InteropServices.CharSet.Auto, SetLastError = true)]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
}
