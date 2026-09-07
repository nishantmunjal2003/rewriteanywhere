using System.Windows;
using AIRewriteAnywhere.WindowsIntegration;

namespace AIRewriteAnywhere.Tests;

public class DisplayHelperTests
{
    [Theory]
    [InlineData(1.0, 100, 200, 300, 400, 100, 200, 300, 400)]
    [InlineData(1.25, 125, 250, 500, 375, 100, 200, 400, 300)]
    [InlineData(1.5, 150, 300, 450, 600, 100, 200, 300, 400)]
    [InlineData(1.75, 175, 350, 525, 700, 100, 200, 300, 400)]
    [InlineData(2.0, 200, 400, 600, 800, 100, 200, 300, 400)]
    public void ConvertPhysicalRectToDip_ScalesCorrectly(
        double scale,
        double px, double py, double pw, double ph,
        double expectedX, double expectedY, double expectedW, double expectedH)
    {
        var physical = new Rect(px, py, pw, ph);
        var dip = DisplayHelper.ConvertPhysicalRectToDip(physical, scale, scale);

        Assert.Equal(expectedX, dip.X, 3);
        Assert.Equal(expectedY, dip.Y, 3);
        Assert.Equal(expectedW, dip.Width, 3);
        Assert.Equal(expectedH, dip.Height, 3);
    }

    [Fact]
    public void ConvertPhysicalRectToDip_HandlesEmptyRect()
    {
        var dip = DisplayHelper.ConvertPhysicalRectToDip(Rect.Empty, 1.75, 1.75);
        Assert.True(dip.IsEmpty);
    }

    [Fact]
    public void ConvertPhysicalPointToDip_ScalesCorrectly()
    {
        var dip = DisplayHelper.ConvertPhysicalPointToDip(350, 700, 1.75, 1.75);
        Assert.Equal(200.0, dip.X, 3);
        Assert.Equal(400.0, dip.Y, 3);
    }

    [Fact]
    public void CalculateOptimalMenuPosition_PositionsBelow_WhenSufficientSpace()
    {
        // Work area: 0,0 to 1097, 638 (typical 1200p at 175%)
        var workArea = new Rect(0, 0, 1097, 638);
        var targetBounds = new Rect(100, 50, 200, 30);
        double menuWidth = 290;
        double menuHeight = 350;

        var pos = DisplayHelper.CalculateOptimalMenuPosition(
            targetBounds, menuWidth, menuHeight, workArea, out double maxAllowedHeight);

        // Should be placed below: targetBounds.Bottom + 6 = 80 + 6 = 86
        Assert.Equal(86.0, pos.Y);
        Assert.Equal(100.0, pos.X);
        Assert.True(pos.Y + menuHeight <= workArea.Bottom);
    }

    [Fact]
    public void CalculateOptimalMenuPosition_FlipsAbove_WhenNearScreenBottom()
    {
        // Near the bottom (like WhatsApp input bar at Y=580 in 638 DIP height)
        var workArea = new Rect(0, 0, 1097, 638);
        var targetBounds = new Rect(100, 580, 200, 30); // bottom is 610
        double menuWidth = 290;
        double menuHeight = 440;

        var pos = DisplayHelper.CalculateOptimalMenuPosition(
            targetBounds, menuWidth, menuHeight, workArea, out double maxAllowedHeight);

        // Must flip above! Space below is only 638 - 616 = 22 DIPs. Space above is 580 - 6 = 574 DIPs.
        // targetY = 580 - 440 - 6 = 134
        Assert.Equal(134.0, pos.Y);
        Assert.Equal(100.0, pos.X);

        // Entire menu must remain within work area
        Assert.True(pos.Y >= workArea.Top + 8);
        Assert.True(pos.Y + menuHeight <= workArea.Bottom - 8);
    }

    [Fact]
    public void CalculateOptimalMenuPosition_ClampsHorizontally_WhenNearRightEdge()
    {
        var workArea = new Rect(0, 0, 1097, 638);
        var targetBounds = new Rect(1000, 100, 80, 30); // right near 1097
        double menuWidth = 290;
        double menuHeight = 300;

        var pos = DisplayHelper.CalculateOptimalMenuPosition(
            targetBounds, menuWidth, menuHeight, workArea, out double maxAllowedHeight);

        // targetX + menuWidth + 8 must be <= workArea.Right (1097)
        // targetX = 1097 - 290 - 8 = 799
        Assert.Equal(799.0, pos.X);
        Assert.True(pos.X + menuWidth <= workArea.Right);
    }

    [Fact]
    public void CalculateOptimalMenuPosition_ClampsHorizontally_WhenNearLeftEdge()
    {
        var workArea = new Rect(0, 0, 1097, 638);
        var targetBounds = new Rect(-20, 100, 50, 30);
        double menuWidth = 290;
        double menuHeight = 300;

        var pos = DisplayHelper.CalculateOptimalMenuPosition(
            targetBounds, menuWidth, menuHeight, workArea, out double maxAllowedHeight);

        Assert.Equal(8.0, pos.X); // Clamped to workArea.Left + 8
    }

    [Fact]
    public void CalculateOptimalMenuPosition_ConstrainsMaxHeight_WhenScreenIsExtremelySmall()
    {
        // Very small work area: height = 300 DIPs
        var workArea = new Rect(0, 0, 800, 300);
        var targetBounds = new Rect(100, 140, 200, 30);
        double menuWidth = 290;
        double menuHeight = 500; // menu is taller than entire screen!

        var pos = DisplayHelper.CalculateOptimalMenuPosition(
            targetBounds, menuWidth, menuHeight, workArea, out double maxAllowedHeight);

        // Max height must be constrained so that the window fits on screen
        Assert.True(maxAllowedHeight <= workArea.Height);
        Assert.True(pos.Y >= workArea.Top);
        double effectiveHeight = Math.Min(menuHeight, maxAllowedHeight);
        Assert.True(pos.Y + effectiveHeight <= workArea.Bottom);
    }

    [Fact]
    public void GetMonitorInfoForPoint_ReturnsValidMonitorBounds()
    {
        var monInfo = DisplayHelper.GetMonitorInfoForPoint(100, 100);

        Assert.NotNull(monInfo);
        Assert.False(monInfo.WorkAreaDip.IsEmpty);
        Assert.True(monInfo.WorkAreaDip.Width > 0);
        Assert.True(monInfo.WorkAreaDip.Height > 0);
        Assert.True(monInfo.DpiScaleX > 0);
        Assert.True(monInfo.DpiScaleY > 0);
    }
}
