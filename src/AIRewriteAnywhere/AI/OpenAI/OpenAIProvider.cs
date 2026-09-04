using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.AI.OpenAI;

public class OpenAIProvider : IAIProvider
{
    private readonly HttpClient _httpClient;
    private const string ChatCompletionsEndpoint = "https://api.openai.com/v1/chat/completions";
    private const string ModelsEndpoint = "https://api.openai.com/v1/models";

    public ProviderType ProviderType => ProviderType.OpenAI;

    public OpenAIProvider(HttpClient? httpClient = null)
    {
        _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    public Task<IReadOnlyList<string>> GetModelsAsync()
    {
        IReadOnlyList<string> models = Constants.AvailableOpenAIModels;
        return Task.FromResult(models);
    }

    public async Task<bool> ValidateCredentialsAsync(string apiKey, string model)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return false;

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, ModelsEndpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim());

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
                ProviderType.OpenAI,
                model);
        }

        var targetModel = string.IsNullOrWhiteSpace(model) ? Constants.DefaultModels.OpenAI : model;
        var sw = Stopwatch.StartNew();

        try
        {
            var systemPrompt = PromptBuilder.BuildSystemPrompt(request);
            var userMessage = PromptBuilder.BuildUserMessage(request.OriginalText);

            var payload = new
            {
                model = targetModel,
                messages = new object[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userMessage }
                },
                temperature = 0.3
            };

            var json = JsonSerializer.Serialize(payload);
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, ChatCompletionsEndpoint)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim());

            using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            sw.Stop();

            if (response.StatusCode == HttpStatusCode.Unauthorized)
            {
                return RewriteResponse.CreateFailure(
                    "The API key was rejected. Please check your provider settings.",
                    ProviderType.OpenAI,
                    targetModel,
                    sw.Elapsed);
            }

            if (response.StatusCode == (HttpStatusCode)429)
            {
                return RewriteResponse.CreateFailure(
                    "The AI provider has temporarily rate-limited this request.",
                    ProviderType.OpenAI,
                    targetModel,
                    sw.Elapsed);
            }

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                return RewriteResponse.CreateFailure(
                    $"AI provider returned error ({response.StatusCode}). Please verify your settings.",
                    ProviderType.OpenAI,
                    targetModel,
                    sw.Elapsed);
            }

            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(responseBody);
            var choices = doc.RootElement.GetProperty("choices");
            if (choices.GetArrayLength() == 0)
            {
                return RewriteResponse.CreateFailure("AI provider returned an empty response.", ProviderType.OpenAI, targetModel, sw.Elapsed);
            }

            var message = choices[0].GetProperty("message");
            var content = message.GetProperty("content").GetString()?.Trim();

            if (string.IsNullOrWhiteSpace(content))
            {
                return RewriteResponse.CreateFailure("AI provider returned an empty rewrite.", ProviderType.OpenAI, targetModel, sw.Elapsed);
            }

            return RewriteResponse.CreateSuccess(content, ProviderType.OpenAI, targetModel, sw.Elapsed);
        }
        catch (OperationCanceledException)
        {
            sw.Stop();
            return RewriteResponse.CreateFailure("The rewrite request was cancelled or timed out.", ProviderType.OpenAI, targetModel, sw.Elapsed);
        }
        catch (HttpRequestException)
        {
            sw.Stop();
            return RewriteResponse.CreateFailure("Unable to contact the AI provider. Please check your internet connection.", ProviderType.OpenAI, targetModel, sw.Elapsed);
        }
        catch (Exception ex)
        {
            sw.Stop();
            return RewriteResponse.CreateFailure($"Unexpected error during rewrite: {ex.Message}", ProviderType.OpenAI, targetModel, sw.Elapsed);
        }
    }
}
