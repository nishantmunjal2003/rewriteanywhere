using AIRewriteAnywhere.AI.Mock;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.Tests;

public class MockAIProviderTests
{
    [Fact]
    public async Task TestCase1_NotepadAbsenceRequest_Professional()
    {
        var provider = new MockAIProvider { SimulatedDelayMs = 0 };
        const string input = "sir tomorrow i will not able to attend class because i have some personal work. please allow me leave.";

        var request = new RewriteRequest(input, RewriteMode.Professional);
        var response = await provider.RewriteAsync(request, "mock-key", "mock-turbo");

        Assert.True(response.Success);
        Assert.Contains("Dear Sir", response.RewrittenText);
        Assert.Contains("unable to attend class tomorrow", response.RewrittenText);
        Assert.Contains("personal commitments", response.RewrittenText);
    }

    [Fact]
    public async Task TestCase2_NotepadAbsenceRequest_Academic()
    {
        var provider = new MockAIProvider { SimulatedDelayMs = 0 };
        const string input = "sir tomorrow i will not able to attend class because i have some personal work. please allow me leave.";

        var request = new RewriteRequest(input, RewriteMode.Academic);
        var response = await provider.RewriteAsync(request, "mock-key", "mock-turbo");

        Assert.True(response.Success);
        Assert.Contains("excused absence", response.RewrittenText);
        Assert.DoesNotContain("fabricated", response.RewrittenText);
    }

    [Fact]
    public async Task TestCase3_NotepadAbsenceRequest_Shorten()
    {
        var provider = new MockAIProvider { SimulatedDelayMs = 0 };
        const string input = "sir tomorrow i will not able to attend class because i have some personal work. please allow me leave.";

        var request = new RewriteRequest(input, RewriteMode.Shorten);
        var response = await provider.RewriteAsync(request, "mock-key", "mock-turbo");

        Assert.True(response.Success);
        Assert.True(response.RewrittenText.Length <= input.Length);
    }

    [Fact]
    public async Task TestC_TestSentence_NeedsImprovement()
    {
        var provider = new MockAIProvider { SimulatedDelayMs = 0 };
        const string input = "this is a test sentence which needs improvement";

        var request = new RewriteRequest(input, RewriteMode.Professional);
        var response = await provider.RewriteAsync(request, "mock-key", "mock-turbo");

        Assert.True(response.Success);
        Assert.Contains("professional enhancement", response.RewrittenText);
    }

    [Fact]
    public async Task SimulateInvalidKey_ReturnsActionableError()
    {
        var provider = new MockAIProvider { SimulateInvalidKey = true, SimulatedDelayMs = 0 };
        var request = new RewriteRequest("Sample text", RewriteMode.Improve);

        var response = await provider.RewriteAsync(request, "bad-key", "mock-turbo");

        Assert.False(response.Success);
        Assert.Equal("The API key was rejected. Please check your provider settings.", response.ErrorMessage);
    }

    [Fact]
    public async Task SimulateRateLimit_ReturnsRateLimitError()
    {
        var provider = new MockAIProvider { SimulateRateLimit = true, SimulatedDelayMs = 0 };
        var request = new RewriteRequest("Sample text", RewriteMode.Improve);

        var response = await provider.RewriteAsync(request, "mock-key", "mock-turbo");

        Assert.False(response.Success);
        Assert.Equal("The AI provider has temporarily rate-limited this request.", response.ErrorMessage);
    }

    [Fact]
    public async Task SimulateNetworkFailure_ReturnsNetworkError()
    {
        var provider = new MockAIProvider { SimulateNetworkFailure = true, SimulatedDelayMs = 0 };
        var request = new RewriteRequest("Sample text", RewriteMode.Improve);

        var response = await provider.RewriteAsync(request, "mock-key", "mock-turbo");

        Assert.False(response.Success);
        Assert.Equal("Unable to contact the AI provider. Please check your internet connection.", response.ErrorMessage);
    }

    [Fact]
    public async Task SimulateEmptyResponse_ReturnsEmptyResponseError()
    {
        var provider = new MockAIProvider { SimulateEmptyResponse = true, SimulatedDelayMs = 0 };
        var request = new RewriteRequest("Sample text", RewriteMode.Improve);

        var response = await provider.RewriteAsync(request, "mock-key", "mock-turbo");

        Assert.False(response.Success);
        Assert.Equal("AI provider returned an empty response.", response.ErrorMessage);
    }
}
