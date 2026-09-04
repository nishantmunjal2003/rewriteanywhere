using AIRewriteAnywhere.Common;

namespace AIRewriteAnywhere.Models;

public class RewriteResponse
{
    public bool Success { get; set; }
    public string RewrittenText { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public TimeSpan Duration { get; set; }
    public ProviderType Provider { get; set; }
    public string Model { get; set; } = string.Empty;

    public static RewriteResponse CreateSuccess(string rewrittenText, ProviderType provider, string model, TimeSpan duration)
    {
        return new RewriteResponse
        {
            Success = true,
            RewrittenText = rewrittenText,
            Provider = provider,
            Model = model,
            Duration = duration
        };
    }

    public static RewriteResponse CreateFailure(string errorMessage, ProviderType provider, string model, TimeSpan duration = default)
    {
        return new RewriteResponse
        {
            Success = false,
            ErrorMessage = errorMessage,
            Provider = provider,
            Model = model,
            Duration = duration
        };
    }
}
