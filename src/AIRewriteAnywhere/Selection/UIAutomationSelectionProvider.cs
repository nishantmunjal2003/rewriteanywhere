using System.Windows;
using System.Windows.Automation;
using AIRewriteAnywhere.Logging;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.WindowsIntegration;

namespace AIRewriteAnywhere.Selection;

public class UIAutomationSelectionProvider
{
    private readonly IAppLogger _logger;

    public UIAutomationSelectionProvider(IAppLogger logger)
    {
        _logger = logger;
    }

    public SelectionInfo? TryGetSelection(IntPtr targetHwnd)
    {
        try
        {
            var candidates = new List<AutomationElement>();

            // 1. Check focused element
            try
            {
                var focused = AutomationElement.FocusedElement;
                if (focused != null)
                {
                    candidates.Add(focused);
                }
            }
            catch { }

            // 2. Check handle-based element
            if (targetHwnd != IntPtr.Zero)
            {
                try
                {
                    var windowEl = AutomationElement.FromHandle(targetHwnd);
                    if (windowEl != null)
                    {
                        candidates.Add(windowEl);

                        // Find descendant that supports text pattern
                        var textCond = new PropertyCondition(AutomationElement.IsTextPatternAvailableProperty, true);
                        var textChild = windowEl.FindFirst(TreeScope.Descendants, textCond);
                        if (textChild != null)
                        {
                            candidates.Add(textChild);
                        }
                    }
                }
                catch { }
            }

            foreach (var target in candidates)
            {
                if (target.TryGetCurrentPattern(TextPattern.Pattern, out var patternObj) && patternObj is TextPattern textPattern)
                {
                    var selectionRanges = textPattern.GetSelection();
                    if (selectionRanges != null && selectionRanges.Length > 0)
                    {
                        var range = selectionRanges[0];
                        var text = range.GetText(-1);

                        if (!string.IsNullOrWhiteSpace(text))
                        {
                            var bounds = Rect.Empty;
                            var rects = range.GetBoundingRectangles();
                            if (rects != null && rects.Length > 0)
                            {
                                bounds = rects[0];
                            }

                            _logger.LogInfo("Successfully retrieved selection via UI Automation TextPattern.");
                            return new SelectionInfo
                            {
                                Text = text,
                                ScreenBounds = bounds,
                                TargetHwnd = targetHwnd,
                                TargetProcessName = ActiveWindowTracker.GetProcessName(targetHwnd),
                                TargetWindowTitle = ActiveWindowTracker.GetWindowTitle(targetHwnd),
                                IsFromClipboardFallback = false
                            };
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning($"UI Automation selection query failed: {ex.Message}");
        }

        return null;
    }
}
