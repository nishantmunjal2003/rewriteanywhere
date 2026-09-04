using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.AI.Claude;

public class ClaudeProvider : IAIProvider
{
    private readonly HttpClient _httpClient;
    private const string MessagesEndpoint = "https://api.anthropic.com/v1/messages";

    public ProviderType ProviderType => ProviderType.Claude;

    public ClaudeProvider(HttpClient? httpClient = null)
    {
        _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    public Task<IReadOnlyList<string>> GetModelsAsync()
    {
        IReadOnlyList<string> models = Constants.AvailableClaudeModels;
        return Task.FromResult(models);
    }

    public async Task<bool> ValidateCredentialsAsync(string apiKey, string model)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return false;

        try
        {
            var targetModel = string.IsNullOrWhiteSpace(model) ? Constants.DefaultModels.Claude : model;
            var payload = new
            {
                model = targetModel,
                max_tokens = 1,
                messages = new object[]
                {
                    new { role = "user", content = "hi" }
                }
            };

            var json = JsonSerializer.Serialize(payload);
            using var request = new HttpRequestMessage(HttpMethod.Post, MessagesEndpoint)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            request.Headers.Add("x-api-key", apiKey.Trim());
            request.Headers.Add("anthropic-version", "2023-06-01");

            using var response = await _httpClient.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<RewriteResponse> RewriteAsync(RewriteRequest request, string apiKey, string model, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return RewriteResponse.CreateFailure(
                "Please configure an AI provider and API key in Settings.",
                ProviderType.Claude,
                model);
        }

        var targetModel = string.IsNullOrWhiteSpace(model) ? Constants.DefaultModels.Claude : model;
        var sw = Stopwatch.StartNew();

        try
        {
            var systemPrompt = PromptBuilder.BuildSystemPrompt(request);
            var userMessage = PromptBuilder.BuildUserMessage(request.OriginalText);

            var payload = new
            {
                model = targetModel,
                max_tokens = 4096,
                system = systemPrompt,
                messages = new object[]
                {
                    new { role = "user", content = userMessage }
                },
                temperature = 0.3
            };

            var json = JsonSerializer.Serialize(payload);
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, MessagesEndpoint)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            httpRequest.Headers.Add("x-api-key", apiKey.Trim());
            httpRequest.Headers.Add("anthropic-version", "2023-06-01");

            using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            sw.Stop();

            if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden)
            {
                return RewriteResponse.CreateFailure(
                    "The API key was rejected. Please check your provider settings.",
                    ProviderType.Claude,
                    targetModel,
                    sw.Elapsed);
            }

            if (response.StatusCode == (HttpStatusCode)429)
            {
                return RewriteResponse.CreateFailure(
                    "The AI provider has temporarily rate-limited this request.",
                    ProviderType.Claude,
                    targetModel,
                    sw.Elapsed);
            }

            if (!response.IsSuccessStatusCode)
            {
                return RewriteResponse.CreateFailure(
                    $"AI provider returned error ({response.StatusCode}). Please verify your settings.",
                    ProviderType.Claude,
                    targetModel,
                    sw.Elapsed);
            }

            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(responseBody);
            if (!doc.RootElement.TryGetProperty("content", out var content) || content.GetArrayLength() == 0)
            {
                return RewriteResponse.CreateFailure("AI provider returned an empty response.", ProviderType.Claude, targetModel, sw.Elapsed);
            }

            var firstContent = content[0];
            var text = firstContent.GetProperty("text").GetString()?.Trim();
            if (string.IsNullOrWhiteSpace(text))
            {
                return RewriteResponse.CreateFailure("AI provider returned an empty rewrite.", ProviderType.Claude, targetModel, sw.Elapsed);
            }

            return RewriteResponse.CreateSuccess(text, ProviderType.Claude, targetModel, sw.Elapsed);
        }
        catch (OperationCanceledException)
        {
            sw.Stop();
            return RewriteResponse.CreateFailure("The rewrite request was cancelled or timed out.", ProviderType.Claude, targetModel, sw.Elapsed);
        }
        catch (HttpRequestException)
        {
            sw.Stop();
            return RewriteResponse.CreateFailure("Unable to contact the AI provider. Please check your internet connection.", ProviderType.Claude, targetModel, sw.Elapsed);
        }
        catch (Exception ex)
        {
            sw.Stop();
            return RewriteResponse.CreateFailure($"Unexpected error during rewrite: {ex.Message}", ProviderType.Claude, targetModel, sw.Elapsed);
        }
    }
}
