using AIRewriteAnywhere.AI;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.Tests;

public class PromptBuilderTests
{
    [Fact]
    public void BuildSystemPrompt_ContainsBaseRules()
    {
        var request = new RewriteRequest("Test text", RewriteMode.Improve);
        var prompt = PromptBuilder.BuildSystemPrompt(request);

        Assert.Contains("Preserve the original meaning", prompt);
        Assert.Contains("Do not invent facts", prompt);
        Assert.Contains("Return ONLY the rewritten text", prompt);
        Assert.Contains("Preserve technical terminology", prompt);
        Assert.Contains("Preserve names, numbers, monetary figures", prompt);
    }

    [Theory]
    [InlineData(RewriteMode.Improve, "Improve grammar, clarity, readability")]
    [InlineData(RewriteMode.Professional, "executive, articulate, and polished business tone")]
    [InlineData(RewriteMode.Academic, "Do not fabricate citations")]
    [InlineData(RewriteMode.Email, "clear, polite, and professional email message")]
    [InlineData(RewriteMode.Friendly, "warm, welcoming, natural")]
    [InlineData(RewriteMode.Polite, "respectful, courteous, considerate")]
    [InlineData(RewriteMode.Shorten, "significantly more concise")]
    [InlineData(RewriteMode.Expand, "Elaborate on the ideas")]
    [InlineData(RewriteMode.Grammar, "Correct all spelling, grammar")]
    public void BuildSystemPrompt_IncludesSpecificModeInstructions(RewriteMode mode, string expectedPhrase)
    {
        var request = new RewriteRequest("Sample text", mode);
        var prompt = PromptBuilder.BuildSystemPrompt(request);

        Assert.Contains(expectedPhrase, prompt);
    }

    [Fact]
    public void BuildSystemPrompt_TranslatesToSpecifiedLanguage()
    {
        var request = new RewriteRequest("Good morning", RewriteMode.Translate)
        {
            TargetLanguage = "French"
        };
        var prompt = PromptBuilder.BuildSystemPrompt(request);

        Assert.Contains("Translate the text accurately and fluently into French", prompt);
    }

    [Fact]
    public void BuildSystemPrompt_IncludesCustomInstruction()
    {
        var request = new RewriteRequest("Sample text", RewriteMode.Custom)
        {
            CustomInstruction = "Convert this text into bullet points and make it punchy."
        };
        var prompt = PromptBuilder.BuildSystemPrompt(request);

        Assert.Contains("Convert this text into bullet points and make it punchy.", prompt);
    }

    [Fact]
    public void BuildSystemPrompt_InjectsWritingStyleWhenEnabled()
    {
        var request = new RewriteRequest("Sample text", RewriteMode.Professional)
        {
            WritingStyle = new WritingStyleProfile
            {
                Enabled = true,
                Tone = "Executive",
                Length = "Concise",
                Formality = "High",
                Language = "English",
                PreserveTechnicalTerms = true,
                AdditionalInstructions = "No jargon."
            }
        };

        var prompt = PromptBuilder.BuildSystemPrompt(request);

        Assert.Contains("User Writing Style Profile Preferences:", prompt);
        Assert.Contains("- Preferred Tone: Executive", prompt);
        Assert.Contains("- Preferred Length: Concise", prompt);
        Assert.Contains("- Formality Level: High", prompt);
        Assert.Contains("- Strictly preserve specialized technical terms", prompt);
        Assert.Contains("- Extra Instructions: No jargon.", prompt);
    }

    [Fact]
    public void BuildSystemPrompt_DoesNotInjectWritingStyleWhenDisabled()
    {
        var request = new RewriteRequest("Sample text", RewriteMode.Professional)
        {
            WritingStyle = new WritingStyleProfile
            {
                Enabled = false,
                Tone = "Executive"
            }
        };

        var prompt = PromptBuilder.BuildSystemPrompt(request);

        Assert.DoesNotContain("User Writing Style Profile Preferences:", prompt);
    }
}
