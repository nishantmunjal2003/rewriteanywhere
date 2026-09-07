using System.Runtime.InteropServices;
using System.Windows;
using Point = System.Windows.Point;
using Rect = System.Windows.Rect;

namespace AIRewriteAnywhere.WindowsIntegration;

public record MonitorWorkAreaInfo(
    Rect WorkAreaDip,
    Rect MonitorDip,
    double DpiScaleX,
    double DpiScaleY
);

public static class DisplayHelper
{
    public static MonitorWorkAreaInfo GetMonitorInfoForPoint(double physicalX, double physicalY)
    {
        var pt = new NativeMethods.POINT { X = (int)Math.Round(physicalX), Y = (int)Math.Round(physicalY) };
        var hMonitor = NativeMethods.MonitorFromPoint(pt, NativeMethods.MONITOR_DEFAULTTONEAREST);

        return ExtractMonitorInfo(hMonitor);
    }

    public static MonitorWorkAreaInfo GetMonitorInfoForRect(Rect physicalRect)
    {
        if (!physicalRect.IsEmpty && physicalRect.Width > 0 && physicalRect.Height > 0)
        {
            var centerPoint = new Point(physicalRect.Left + physicalRect.Width / 2.0, physicalRect.Top + physicalRect.Height / 2.0);
            return GetMonitorInfoForPoint(centerPoint.X, centerPoint.Y);
        }

        if (NativeMethods.GetCursorPos(out var pt))
        {
            return GetMonitorInfoForPoint(pt.X, pt.Y);
        }

        // Ultimate fallback: primary screen work area
        var work = SystemParameters.WorkArea;
        return new MonitorWorkAreaInfo(work, work, 1.0, 1.0);
    }

    private static MonitorWorkAreaInfo ExtractMonitorInfo(IntPtr hMonitor)
    {
        if (hMonitor != IntPtr.Zero)
        {
            var mi = new NativeMethods.MONITORINFO();
            mi.cbSize = Marshal.SizeOf(typeof(NativeMethods.MONITORINFO));
            if (NativeMethods.GetMonitorInfo(hMonitor, ref mi))
            {
                double scaleX = 1.0;
                double scaleY = 1.0;

                try
                {
                    if (NativeMethods.GetDpiForMonitor(hMonitor, 0, out var dpiX, out var dpiY) == 0 && dpiX > 0 && dpiY > 0)
                    {
                        scaleX = dpiX / 96.0;
                        scaleY = dpiY / 96.0;
                    }
                }
                catch
                {
                    // Fallback to default scale 1.0 if GetDpiForMonitor is unavailable
                }

                if (scaleX <= 0.1) scaleX = 1.0;
                if (scaleY <= 0.1) scaleY = 1.0;

                var workDip = new Rect(
                    mi.rcWork.Left / scaleX,
                    mi.rcWork.Top / scaleY,
                    mi.rcWork.Width / scaleX,
                    mi.rcWork.Height / scaleY);

                var monDip = new Rect(
                    mi.rcMonitor.Left / scaleX,
                    mi.rcMonitor.Top / scaleY,
                    mi.rcMonitor.Width / scaleX,
                    mi.rcMonitor.Height / scaleY);

                return new MonitorWorkAreaInfo(workDip, monDip, scaleX, scaleY);
            }
        }

        var fallbackWork = SystemParameters.WorkArea;
        return new MonitorWorkAreaInfo(fallbackWork, fallbackWork, 1.0, 1.0);
    }

    public static Rect ConvertPhysicalRectToDip(Rect physicalRect, double scaleX, double scaleY)
    {
        if (physicalRect.IsEmpty) return Rect.Empty;
        if (scaleX <= 0.1) scaleX = 1.0;
        if (scaleY <= 0.1) scaleY = 1.0;

        return new Rect(
            physicalRect.Left / scaleX,
            physicalRect.Top / scaleY,
            physicalRect.Width / scaleX,
            physicalRect.Height / scaleY);
    }

    public static Point ConvertPhysicalPointToDip(double physicalX, double physicalY, double scaleX, double scaleY)
    {
        if (scaleX <= 0.1) scaleX = 1.0;
        if (scaleY <= 0.1) scaleY = 1.0;

        return new Point(physicalX / scaleX, physicalY / scaleY);
    }

    public static Point CalculateOptimalMenuPosition(
        Rect targetBoundsDip,
        double menuWidth,
        double menuHeight,
        Rect workAreaDip,
        out double maxAllowedHeight)
    {
        // Default max height is bounded by the screen work area
        maxAllowedHeight = Math.Max(200, workAreaDip.Height - 16);

        double spaceBelow = workAreaDip.Bottom - (targetBoundsDip.Bottom + 6);
        double spaceAbove = (targetBoundsDip.Top - 6) - workAreaDip.Top;

        double targetY;

        if (spaceBelow >= menuHeight)
        {
            // Plenty of room below target
            targetY = targetBoundsDip.Bottom + 6;
        }
        else if (spaceAbove >= menuHeight)
        {
            // More comfortable room above target
            targetY = targetBoundsDip.Top - menuHeight - 6;
        }
        else
        {
            // Neither side fits the full requested menu height without clipping
            if (spaceAbove > spaceBelow)
            {
                // Place above with constrained height
                maxAllowedHeight = Math.Max(160, spaceAbove - 8);
                targetY = targetBoundsDip.Top - maxAllowedHeight - 6;
            }
            else
            {
                // Place below with constrained height
                maxAllowedHeight = Math.Max(160, spaceBelow - 8);
                targetY = targetBoundsDip.Bottom + 6;
            }
        }

        // Align horizontally with the left of the selection
        double targetX = targetBoundsDip.Left;

        // Apply strict boundary clamping to ensure 100% on-screen visibility
        double effectiveHeight = Math.Min(menuHeight, maxAllowedHeight);

        if (targetX + menuWidth + 8 > workAreaDip.Right)
        {
            targetX = workAreaDip.Right - menuWidth - 8;
        }
        if (targetX < workAreaDip.Left + 8)
        {
            targetX = workAreaDip.Left + 8;
        }

        if (targetY + effectiveHeight + 8 > workAreaDip.Bottom)
        {
            targetY = workAreaDip.Bottom - effectiveHeight - 8;
        }
        if (targetY < workAreaDip.Top + 8)
        {
            targetY = workAreaDip.Top + 8;
        }

        return new Point(targetX, targetY);
    }

    public static void CenterOnActiveMonitor(Window window)
    {
        if (window == null) return;

        var monitorInfo = GetMonitorInfoForRect(Rect.Empty);
        var workArea = monitorInfo.WorkAreaDip;

        double width = window.Width;
        if (double.IsNaN(width) || width <= 0) width = window.ActualWidth;
        if (double.IsNaN(width) || width <= 0) width = 800;

        double height = window.Height;
        if (double.IsNaN(height) || height <= 0) height = window.ActualHeight;
        if (double.IsNaN(height) || height <= 0) height = 600;

        window.WindowStartupLocation = WindowStartupLocation.Manual;
        window.Left = workArea.Left + Math.Max(0, (workArea.Width - width) / 2.0);
        window.Top = workArea.Top + Math.Max(0, (workArea.Height - height) / 2.0);
    }
}
