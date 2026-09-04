using AIRewriteAnywhere.Common;

namespace AIRewriteAnywhere.Models;

public class RewriteRequest
{
    public string OriginalText { get; set; } = string.Empty;
    public RewriteMode Mode { get; set; } = RewriteMode.Improve;
    public string? TargetLanguage { get; set; }
    public string? CustomInstruction { get; set; }
    public WritingStyleProfile? WritingStyle { get; set; }

    public RewriteRequest() { }

    public RewriteRequest(string text, RewriteMode mode)
    {
        OriginalText = text;
        Mode = mode;
    }
}
