using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.Selection;

public interface ISelectionService
{
    Task<SelectionInfo?> GetSelectionAsync(IntPtr targetHwnd);
}
