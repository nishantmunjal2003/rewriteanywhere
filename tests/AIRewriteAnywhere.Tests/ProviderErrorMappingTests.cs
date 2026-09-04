using System.Net;
using System.Net.Http;
using AIRewriteAnywhere.AI.Claude;
using AIRewriteAnywhere.AI.Gemini;
using AIRewriteAnywhere.AI.OpenAI;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.Tests;

public class ProviderErrorMappingTests
{
    private class MockHttpMessageHandler : HttpMessageHandler
    {
        public HttpStatusCode StatusCodeToReturn { get; set; } = HttpStatusCode.OK;
        public string ContentToReturn { get; set; } = string.Empty;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var response = new HttpResponseMessage(StatusCodeToReturn)
            {
                Content = new StringContent(ContentToReturn)
            };
            return Task.FromResult(response);
        }
    }

    [Fact]
    public async Task OpenAI_401Unauthorized_MapsToRejectedKeyMessage()
    {
        var handler = new MockHttpMessageHandler
        {
            StatusCodeToReturn = HttpStatusCode.Unauthorized,
            ContentToReturn = "{\"error\":{\"message\":\"Incorrect API key provided\"}}"
        };
        var client = new HttpClient(handler);
        var provider = new OpenAIProvider(client);

        var request = new RewriteRequest("Sample text", RewriteMode.Improve);
        var response = await provider.RewriteAsync(request, "invalid-key", "gpt-4o-mini");

        Assert.False(response.Success);
        Assert.Equal("The API key was rejected. Please check your provider settings.", response.ErrorMessage);
    }

    [Fact]
    public async Task OpenAI_429RateLimit_MapsToRateLimitMessage()
    {
        var handler = new MockHttpMessageHandler
        {
            StatusCodeToReturn = (HttpStatusCode)429,
            ContentToReturn = "{\"error\":{\"message\":\"Rate limit exceeded\"}}"
        };
        var client = new HttpClient(handler);
        var provider = new OpenAIProvider(client);

        var request = new RewriteRequest("Sample text", RewriteMode.Improve);
        var response = await provider.RewriteAsync(request, "valid-key", "gpt-4o-mini");

        Assert.False(response.Success);
        Assert.Equal("The AI provider has temporarily rate-limited this request.", response.ErrorMessage);
    }

    [Fact]
    public async Task Claude_401Unauthorized_MapsToRejectedKeyMessage()
    {
        var handler = new MockHttpMessageHandler
        {
            StatusCodeToReturn = HttpStatusCode.Unauthorized,
            ContentToReturn = "{\"type\":\"error\",\"error\":{\"type\":\"authentication_error\",\"message\":\"invalid x-api-key\"}}"
        };
        var client = new HttpClient(handler);
        var provider = new ClaudeProvider(client);

        var request = new RewriteRequest("Sample text", RewriteMode.Improve);
        var response = await provider.RewriteAsync(request, "invalid-key", "claude-3-5-haiku-20241022");

        Assert.False(response.Success);
        Assert.Equal("The API key was rejected. Please check your provider settings.", response.ErrorMessage);
    }

    [Fact]
    public async Task Gemini_403Forbidden_MapsToRejectedKeyMessage()
    {
        var handler = new MockHttpMessageHandler
        {
            StatusCodeToReturn = HttpStatusCode.Forbidden,
            ContentToReturn = "{\"error\":{\"code\":403,\"message\":\"API_KEY_INVALID\"}}"
        };
        var client = new HttpClient(handler);
        var provider = new GeminiProvider(client);

        var request = new RewriteRequest("Sample text", RewriteMode.Improve);
        var response = await provider.RewriteAsync(request, "invalid-key", "gemini-2.5-flash");

        Assert.False(response.Success);
        Assert.Equal("The API key was rejected. Please check your provider settings.", response.ErrorMessage);
    }

    [Fact]
    public async Task OpenAI_ValidResponse_ParsesSuccessfully()
    {
        var jsonResponse = @"{
            ""choices"": [
                {
                    ""message"": {
                        ""role"": ""assistant"",
                        ""content"": ""Refined polished text here.""
                    }
                }
            ]
        }";

        var handler = new MockHttpMessageHandler
        {
            StatusCodeToReturn = HttpStatusCode.OK,
            ContentToReturn = jsonResponse
        };
        var client = new HttpClient(handler);
        var provider = new OpenAIProvider(client);

        var request = new RewriteRequest("Original input text", RewriteMode.Professional);
        var response = await provider.RewriteAsync(request, "good-key", "gpt-4o-mini");

        Assert.True(response.Success);
        Assert.Equal("Refined polished text here.", response.RewrittenText);
    }
}
