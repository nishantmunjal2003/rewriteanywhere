using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.AI;

public interface IAIProvider
{
    ProviderType ProviderType { get; }
    Task<IReadOnlyList<string>> GetModelsAsync();
    Task<bool> ValidateCredentialsAsync(string apiKey, string model);
    Task<RewriteResponse> RewriteAsync(RewriteRequest request, string apiKey, string model, CancellationToken cancellationToken = default);
}
