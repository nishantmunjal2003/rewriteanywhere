using AIRewriteAnywhere.AI.Claude;
using AIRewriteAnywhere.AI.Gemini;
using AIRewriteAnywhere.AI.Mock;
using AIRewriteAnywhere.AI.OpenAI;
using AIRewriteAnywhere.Common;

namespace AIRewriteAnywhere.AI;

public class AIProviderFactory : IAIProviderFactory
{
    private readonly OpenAIProvider _openAiProvider;
    private readonly GeminiProvider _geminiProvider;
    private readonly ClaudeProvider _claudeProvider;
    private readonly MockAIProvider _mockProvider;

    public MockAIProvider MockProvider => _mockProvider;

    public AIProviderFactory(
        OpenAIProvider? openAiProvider = null,
        GeminiProvider? geminiProvider = null,
        ClaudeProvider? claudeProvider = null,
        MockAIProvider? mockProvider = null)
    {
        _openAiProvider = openAiProvider ?? new OpenAIProvider();
        _geminiProvider = geminiProvider ?? new GeminiProvider();
        _claudeProvider = claudeProvider ?? new ClaudeProvider();
        _mockProvider = mockProvider ?? new MockAIProvider();
    }

    public IAIProvider GetProvider(ProviderType providerType)
    {
        return providerType switch
        {
            ProviderType.OpenAI => _openAiProvider,
            ProviderType.Gemini => _geminiProvider,
            ProviderType.Claude => _claudeProvider,
            ProviderType.Mock => _mockProvider,
            _ => throw new ArgumentOutOfRangeException(nameof(providerType), $"Unsupported provider: {providerType}")
        };
    }
}
