using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.AI.Gemini;

public class GeminiProvider : IAIProvider
{
    private readonly HttpClient _httpClient;
    private const string BaseEndpoint = "https://generativelanguage.googleapis.com/v1beta/models";

    public ProviderType ProviderType => ProviderType.Gemini;

    public GeminiProvider(HttpClient? httpClient = null)
    {
        _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    public Task<IReadOnlyList<string>> GetModelsAsync()
    {
        IReadOnlyList<string> models = Constants.AvailableGeminiModels;
        return Task.FromResult(models);
    }

    public async Task<bool> ValidateCredentialsAsync(string apiKey, string model)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return false;

        try
        {
            // Validate key against the official Gemini models catalog endpoint
            var url = $"{BaseEndpoint}?key={apiKey.Trim()}";
            using var request = new HttpRequestMessage(HttpMethod.Get, url);

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
                ProviderType.Gemini,
                model);
        }

        var targetModel = string.IsNullOrWhiteSpace(model) ? Constants.DefaultModels.Gemini : model;

        // Auto-upgrade retired/deprecated models to latest available
        if (targetModel.Equals("gemini-2.5-flash", StringComparison.OrdinalIgnoreCase) ||
            targetModel.Equals("gemini-1.5-flash", StringComparison.OrdinalIgnoreCase) ||
            targetModel.Equals("gemini-1.5-pro", StringComparison.OrdinalIgnoreCase))
        {
            targetModel = "gemini-3.6-flash";
        }

        var sw = Stopwatch.StartNew();

        try
        {
            var systemPrompt = PromptBuilder.BuildSystemPrompt(request);
            var userMessage = PromptBuilder.BuildUserMessage(request.OriginalText);

            var response = await SendGenerateContentAsync(targetModel, apiKey, systemPrompt, userMessage, cancellationToken);

            // If 404 (model unavailable) or 503 (service overloaded), attempt fallback to gemini-flash-latest
            if ((response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.ServiceUnavailable) && targetModel != "gemini-flash-latest")
            {
                targetModel = "gemini-flash-latest";
                response = await SendGenerateContentAsync(targetModel, apiKey, systemPrompt, userMessage, cancellationToken);
            }

            sw.Stop();

            if (response.StatusCode == HttpStatusCode.Forbidden || response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.BadRequest)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                if (errorBody.Contains("API_KEY_INVALID", StringComparison.OrdinalIgnoreCase) || response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden)
                {
                    return RewriteResponse.CreateFailure(
                        "The API key was rejected. Please check your provider settings.",
                        ProviderType.Gemini,
                        targetModel,
                        sw.Elapsed);
                }
            }

            if (response.StatusCode == (HttpStatusCode)429)
            {
                return RewriteResponse.CreateFailure(
                    "The AI provider has temporarily rate-limited this request.",
                    ProviderType.Gemini,
                    targetModel,
                    sw.Elapsed);
            }

            if (!response.IsSuccessStatusCode)
            {
                return RewriteResponse.CreateFailure(
                    $"AI provider returned error ({response.StatusCode}). Please verify your settings.",
                    ProviderType.Gemini,
                    targetModel,
                    sw.Elapsed);
            }

            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(responseBody);
            if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
            {
                return RewriteResponse.CreateFailure("AI provider returned an empty response.", ProviderType.Gemini, targetModel, sw.Elapsed);
            }

            var firstCandidate = candidates[0];
            if (!firstCandidate.TryGetProperty("content", out var content) ||
                !content.TryGetProperty("parts", out var parts) ||
                parts.GetArrayLength() == 0)
            {
                return RewriteResponse.CreateFailure("AI provider returned no text.", ProviderType.Gemini, targetModel, sw.Elapsed);
            }

            var text = parts[0].GetProperty("text").GetString()?.Trim();
            if (string.IsNullOrWhiteSpace(text))
            {
                return RewriteResponse.CreateFailure("AI provider returned an empty rewrite.", ProviderType.Gemini, targetModel, sw.Elapsed);
            }

            return RewriteResponse.CreateSuccess(text, ProviderType.Gemini, targetModel, sw.Elapsed);
        }
        catch (OperationCanceledException)
        {
            sw.Stop();
            return RewriteResponse.CreateFailure("The rewrite request was cancelled or timed out.", ProviderType.Gemini, targetModel, sw.Elapsed);
        }
        catch (HttpRequestException)
        {
            sw.Stop();
            return RewriteResponse.CreateFailure("Unable to contact the AI provider. Please check your internet connection.", ProviderType.Gemini, targetModel, sw.Elapsed);
        }
        catch (Exception ex)
        {
            sw.Stop();
            return RewriteResponse.CreateFailure($"Unexpected error during rewrite: {ex.Message}", ProviderType.Gemini, targetModel, sw.Elapsed);
        }
    }

    private async Task<HttpResponseMessage> SendGenerateContentAsync(string model, string apiKey, string systemPrompt, string userMessage, CancellationToken ct)
    {
        var url = $"{BaseEndpoint}/{model}:generateContent?key={apiKey.Trim()}";

        var payload = new
        {
            system_instruction = new
            {
                parts = new object[] { new { text = systemPrompt } }
            },
            contents = new object[]
            {
                new
                {
                    parts = new object[] { new { text = userMessage } }
                }
            },
            generationConfig = new
            {
                temperature = 0.3
            }
        };

        var json = JsonSerializer.Serialize(payload);
        var httpRequest = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

        return await _httpClient.SendAsync(httpRequest, ct);
    }
}
