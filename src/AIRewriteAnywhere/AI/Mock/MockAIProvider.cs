using System.Diagnostics;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Models;

namespace AIRewriteAnywhere.AI.Mock;

public class MockAIProvider : IAIProvider
{
    public ProviderType ProviderType => ProviderType.Mock;

    // Test simulation switches
    public bool SimulateNetworkFailure { get; set; } = false;
    public bool SimulateRateLimit { get; set; } = false;
    public bool SimulateInvalidKey { get; set; } = false;
    public bool SimulateEmptyResponse { get; set; } = false;
    public int SimulatedDelayMs { get; set; } = 300;

    public Task<IReadOnlyList<string>> GetModelsAsync()
    {
        IReadOnlyList<string> models = Constants.AvailableMockModels;
        return Task.FromResult(models);
    }

    public Task<bool> ValidateCredentialsAsync(string apiKey, string model)
    {
        if (SimulateInvalidKey || string.IsNullOrWhiteSpace(apiKey))
            return Task.FromResult(false);

        return Task.FromResult(true);
    }

    public async Task<RewriteResponse> RewriteAsync(RewriteRequest request, string apiKey, string model, CancellationToken cancellationToken = default)
    {
        var targetModel = string.IsNullOrWhiteSpace(model) ? Constants.DefaultModels.Mock : model;
        var sw = Stopwatch.StartNew();

        if (SimulateInvalidKey)
        {
            await Task.Delay(100, cancellationToken);
            sw.Stop();
            return RewriteResponse.CreateFailure("The API key was rejected. Please check your provider settings.", ProviderType.Mock, targetModel, sw.Elapsed);
        }

        if (SimulateRateLimit)
        {
            await Task.Delay(100, cancellationToken);
            sw.Stop();
            return RewriteResponse.CreateFailure("The AI provider has temporarily rate-limited this request.", ProviderType.Mock, targetModel, sw.Elapsed);
        }

        if (SimulateNetworkFailure)
        {
            await Task.Delay(100, cancellationToken);
            sw.Stop();
            return RewriteResponse.CreateFailure("Unable to contact the AI provider. Please check your internet connection.", ProviderType.Mock, targetModel, sw.Elapsed);
        }

        if (SimulatedDelayMs > 0)
        {
            await Task.Delay(SimulatedDelayMs, cancellationToken);
        }

        sw.Stop();

        if (SimulateEmptyResponse)
        {
            return RewriteResponse.CreateFailure("AI provider returned an empty response.", ProviderType.Mock, targetModel, sw.Elapsed);
        }

        var rewritten = GenerateMockRewrite(request);
        return RewriteResponse.CreateSuccess(rewritten, ProviderType.Mock, targetModel, sw.Elapsed);
    }

    public static string GenerateMockRewrite(RewriteRequest request)
    {
        var input = request.OriginalText.Trim();

        // Exact match heuristics for known test cases from AGENT.md & BUILD_INSTRUCTIONS.md
        if (input.IndexOf("sir tomorrow i will not able to attend class", StringComparison.OrdinalIgnoreCase) >= 0)
        {
            return request.Mode switch
            {
                RewriteMode.Professional => "Dear Sir, I am writing to inform you that I will be unable to attend class tomorrow due to personal commitments. Please grant me leave for the day. Thank you for your understanding.",
                RewriteMode.Academic => "Due to unavoidable personal obligations, I will be unable to attend tomorrow's scheduled session. I respectfully request an excused absence.",
                RewriteMode.Email => "Subject: Absence Request - Class Attendance\n\nDear Sir,\n\nI am writing to formally request a leave of absence for tomorrow's class due to unforeseen personal obligations. I will ensure all coursework is reviewed promptly.\n\nSincerely,",
                RewriteMode.Friendly => "Hi Sir, I won't be able to make it to class tomorrow because of some personal work. Hope it's okay for me to take the day off. Thanks!",
                RewriteMode.Polite => "Dear Sir, I kindly request your permission to be excused from tomorrow's class due to important personal matters. Thank you very much for your understanding.",
                RewriteMode.Shorten => "I will be unable to attend class tomorrow due to personal reasons. Please grant me leave.",
                RewriteMode.Expand => "Dear Sir, I am writing to respectfully inform you that due to prior personal commitments, I will not be able to participate in tomorrow's scheduled class. I will coordinate with a classmate to catch up on all material covered. Please grant me leave of absence.",
                RewriteMode.Grammar => "Sir, tomorrow I will not be able to attend class because I have some personal work. Please allow me leave.",
                RewriteMode.Translate => (request.TargetLanguage?.ToLowerInvariant()) switch
                {
                    "hindi" => "महोदय, कल कुछ व्यक्तिगत कार्यों के कारण मैं कक्षा में उपस्थित नहीं हो पाऊंगा। कृपया मुझे अवकाश प्रदान करें।",
                    "spanish" => "Estimado señor, mañana no podré asistir a clase debido a asuntos personales. Por favor, concédame permiso.",
                    "french" => "Monsieur, demain je ne pourrai pas assister au cours en raison d'obligations personnelles. Veuillez m'accorder une autorisation d'absence.",
                    "german" => "Sehr geehrter Herr, morgen werde ich aus persönlichen Gründen nicht am Unterricht teilnehmen können. Bitte bewilligen Sie meine Abwesenheit.",
                    _ => "Dear Sir, I will be unable to attend class tomorrow due to personal obligations. Please grant me leave."
                },
                RewriteMode.LinkedIn => "Balancing commitments is key to long-term success. Due to personal obligations tomorrow, I will be stepping away from class to recharge and refocus. How do you maintain balance during busy weeks? #Productivity #LifelongLearning #WorkLifeBalance",
                RewriteMode.Twitter => "Taking tomorrow off from class to attend to personal commitments. Back and ready the next day! 📚⚡ #Priorities",
                RewriteMode.Facebook => "Hey everyone! Just a quick update: I won't be able to attend class tomorrow due to some personal work. Wishing everyone a wonderful and productive day! What's everyone working on this week?",
                RewriteMode.Instagram => "Taking a mindful pause tomorrow for personal commitments! ✨ Remember that taking time when needed helps you return stronger. Drop a ❤️ if you believe in balance! 📚🌱\n\n#Balance #SelfCare #Focus #DailyLife #Growth",
                _ => "Dear Sir, I will be unable to attend tomorrow's class due to personal commitments. Please grant me leave for the day."
            };
        }

        if (input.IndexOf("this is a test sentence which needs improvement", StringComparison.OrdinalIgnoreCase) >= 0)
        {
            return request.Mode switch
            {
                RewriteMode.Professional => "This test sentence requires professional enhancement and refinement.",
                RewriteMode.Academic => "The present test sentence necessitates formal syntactic and stylistic improvement.",
                RewriteMode.Shorten => "This test sentence needs improvement.",
                RewriteMode.Grammar => "This is a test sentence that needs improvement.",
                RewriteMode.Friendly => "Here is a test sentence that could use a little polish!",
                RewriteMode.Translate => (request.TargetLanguage?.ToLowerInvariant()) switch
                {
                    "hindi" => "यह एक परीक्षण वाक्य है जिसमें सुधार की आवश्यकता है।",
                    "spanish" => "Esta es una oración de prueba que necesita mejoras.",
                    "french" => "Ceci est une phrase de test qui nécessite une amélioration.",
                    "german" => "Dies ist ein Testsatz, der verbessert werden muss.",
                    _ => "This is a test sentence that requires improvement."
                },
                RewriteMode.LinkedIn => "Clear, effective communication is the foundation of high-performing teams. This test sentence demonstrates precision and impactful phrasing.\n\n#Communication #Excellence #ProfessionalDevelopment",
                RewriteMode.Twitter => "Clear writing equals clear thinking. Polishing this test sentence for maximum impact! ✍️🚀 #WritingTips",
                RewriteMode.Facebook => "Just testing out some creative writing today! Here is an improved test sentence that reads much better. Hope you all are having a great week! 😊",
                RewriteMode.Instagram => "Elevating words, one sentence at a time! ✨ Here is a refined test sentence designed for clarity and aesthetic flow.\n\n#WritingCommunity #Creativity #Inspiration #Aesthetic",
                _ => "This is a refined test sentence with improved clarity and flow."
            };
        }

        // Generic intelligent fallback for arbitrary text
        return request.Mode switch
        {
            RewriteMode.Improve => CapitalizeFirst(input) + (input.EndsWith('.') ? "" : "."),
            RewriteMode.Professional => $"With regards to your request: {input.TrimEnd('.')}.",
            RewriteMode.Academic => $"Empirical analysis indicates that {input.ToLowerInvariant().TrimEnd('.')}.",
            RewriteMode.Email => $"Dear Team,\n\n{input}\n\nBest regards,",
            RewriteMode.Friendly => $"Hey! Just wanted to share: {input}",
            RewriteMode.Polite => $"Kindly note that {input.ToLowerInvariant().TrimEnd('.')}. Thank you.",
            RewriteMode.Shorten => input.Length > 20 ? input[..(input.Length / 2)] + "..." : input,
            RewriteMode.Expand => $"{input} Furthermore, additional considerations support this perspective.",
            RewriteMode.Grammar => CapitalizeFirst(input),
            RewriteMode.Translate => $"[Translated to {request.TargetLanguage ?? "English"}]: {input}",
            RewriteMode.Custom => $"[Custom: {request.CustomInstruction}]: {input}",
            RewriteMode.LinkedIn => $"💡 Key Takeaway:\n\n{input}\n\nWhat are your thoughts on this? Let's connect and discuss in the comments below.\n\n#Leadership #Innovation #Growth",
            RewriteMode.Twitter => input.Length > 200 ? $"{input[..200]}... 🚀 #Insights" : $"{input} 🚀 #Insights",
            RewriteMode.Facebook => $"Just wanted to share this thought: {input} 😊 What do you think about this?",
            RewriteMode.Instagram => $"✨ Inspiration of the day:\n\n{input}\n\nDouble tap if this resonates with you! 👇\n\n#DailyInspiration #Mindset #Vibes #Creativity",
            _ => input
        };
    }

    private static string CapitalizeFirst(string s)
    {
        if (string.IsNullOrEmpty(s)) return s;
        return char.ToUpper(s[0]) + s[1..];
    }
}
