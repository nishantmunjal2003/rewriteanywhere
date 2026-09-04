using System.Text;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.AI;

public static class PromptBuilder
{
    public const string BaseSystemPrompt =
@"You are an expert writing assistant.
Rewrite the user's text according to the requested style and instructions.

Rules:
1. Preserve the original meaning and core intent.
2. Do not invent facts, claims, statistics, or citations.
3. Do not remove essential information.
4. Do not add conversational commentary, explanations, greetings, or meta-talk (e.g. do not say 'Here is your rewritten text:').
5. Return ONLY the rewritten text itself.
6. Preserve technical terminology, code snippets, and proper nouns where appropriate.
7. Preserve names, numbers, monetary figures, dates, and URLs accurately.
8. Correct grammar, spelling, and sentence flow naturally.";

    public static string BuildSystemPrompt(RewriteRequest request)
    {
        var sb = new StringBuilder();
        sb.AppendLine(BaseSystemPrompt);
        sb.AppendLine();

        // Mode-specific instructions
        sb.AppendLine("Mode Instructions:");
        switch (request.Mode)
        {
            case RewriteMode.Improve:
                sb.AppendLine("Improve grammar, clarity, readability, flow, and naturalness while preserving original meaning.");
                break;

            case RewriteMode.Professional:
                sb.AppendLine("Rewrite professionally, clearly, and concisely. Use an executive, articulate, and polished business tone.");
                break;

            case RewriteMode.Academic:
                sb.AppendLine("Rewrite in clear, formal academic English. Preserve technical terminology and factual meaning. Do not fabricate citations, references, empirical findings, or theoretical claims.");
                break;

            case RewriteMode.Email:
                sb.AppendLine("Rewrite as a well-structured, clear, polite, and professional email message. Maintain an appropriate courteous sign-off if present in original text.");
                break;

            case RewriteMode.Friendly:
                sb.AppendLine("Make the writing warm, welcoming, natural, and personable while keeping the core message intact.");
                break;

            case RewriteMode.Polite:
                sb.AppendLine("Make the writing respectful, courteous, considerate, and diplomatic.");
                break;

            case RewriteMode.Shorten:
                sb.AppendLine("Make the text significantly more concise, eliminating fluff and wordiness while retaining all essential facts and meaning.");
                break;

            case RewriteMode.Expand:
                sb.AppendLine("Elaborate on the ideas with helpful clarity, depth, and smoother transitions without fabricating unsupported facts.");
                break;

            case RewriteMode.Grammar:
                sb.AppendLine("Correct all spelling, grammar, punctuation, and syntax errors with minimal alteration to original phrasing.");
                break;

            case RewriteMode.Translate:
                var targetLang = string.IsNullOrWhiteSpace(request.TargetLanguage) ? "English" : request.TargetLanguage;
                sb.AppendLine($"Translate the text accurately and fluently into {targetLang}. Preserve formatting, proper nouns, and technical vocabulary.");
                break;

            case RewriteMode.Custom:
                var custom = string.IsNullOrWhiteSpace(request.CustomInstruction) ? "Improve clarity and style." : request.CustomInstruction;
                sb.AppendLine($"Follow this user-specified instruction: {custom}");
                break;
        }

        // Incorporate Writing Style Profile if enabled
        if (request.WritingStyle != null && request.WritingStyle.Enabled)
        {
            sb.AppendLine();
            sb.AppendLine("User Writing Style Profile Preferences:");
            if (!string.IsNullOrWhiteSpace(request.WritingStyle.Tone))
                sb.AppendLine($"- Preferred Tone: {request.WritingStyle.Tone}");
            if (!string.IsNullOrWhiteSpace(request.WritingStyle.Length))
                sb.AppendLine($"- Preferred Length: {request.WritingStyle.Length}");
            if (!string.IsNullOrWhiteSpace(request.WritingStyle.Formality))
                sb.AppendLine($"- Formality Level: {request.WritingStyle.Formality}");
            if (!string.IsNullOrWhiteSpace(request.WritingStyle.Language))
                sb.AppendLine($"- Preferred Language: {request.WritingStyle.Language}");
            if (request.WritingStyle.PreserveTechnicalTerms)
                sb.AppendLine("- Strictly preserve specialized technical terms and jargon.");
            if (!string.IsNullOrWhiteSpace(request.WritingStyle.AdditionalInstructions))
                sb.AppendLine($"- Extra Instructions: {request.WritingStyle.AdditionalInstructions}");
        }

        return sb.ToString().TrimEnd();
    }

    public static string BuildUserMessage(string originalText)
    {
        return originalText;
    }
}
