namespace AIRewriteAnywhere.Common;

public static class Constants
{
    public const string AppName = "AI Rewrite Anywhere";
    public const string AppVersion = "0.1.0";
    public const string AppCompany = "AI Rewrite Anywhere";
    public const string AppRegistryKey = @"Software\AIRewriteAnywhere";
    public const string WindowsRunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";

    public static class DefaultModels
    {
        public const string OpenAI = "gpt-4o-mini";
        public const string Gemini = "gemini-3.6-flash";
        public const string Claude = "claude-3-5-haiku-20241022";
        public const string Mock = "mock-turbo";
    }

    public static readonly string[] SupportedLanguages = new[]
    {
        "English",
        "Hindi",
        "Spanish",
        "French",
        "German",
        "Chinese",
        "Japanese",
        "Italian",
        "Portuguese",
        "Russian",
        "Arabic"
    };

    public static readonly string[] AvailableOpenAIModels = new[]
    {
        "gpt-4o-mini",
        "gpt-4o",
        "gpt-4-turbo",
        "gpt-3.5-turbo"
    };

    public static readonly string[] AvailableGeminiModels = new[]
    {
        "gemini-3.6-flash",
        "gemini-flash-latest",
        "gemini-3.7-flash",
        "gemini-3.8-flash",
        "gemini-pro-latest",
        "gemini-3.1-pro-preview",
        "gemini-2.5-flash"
    };

    public static readonly string[] AvailableClaudeModels = new[]
    {
        "claude-3-5-haiku-20241022",
        "claude-3-5-sonnet-20241022",
        "claude-3-opus-20240229"
    };

    public static readonly string[] AvailableMockModels = new[]
    {
        "mock-turbo",
        "mock-professional",
        "mock-academic"
    };
}
