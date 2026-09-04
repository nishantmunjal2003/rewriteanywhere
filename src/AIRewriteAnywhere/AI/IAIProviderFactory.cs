using AIRewriteAnywhere.Common;

namespace AIRewriteAnywhere.AI;

public interface IAIProviderFactory
{
    IAIProvider GetProvider(ProviderType providerType);
}
