namespace AIRewriteAnywhere.Models;

public class WritingStyleProfile
{
    public bool Enabled { get; set; } = false;
    public string Tone { get; set; } = "Professional";
    public string Length { get; set; } = "Concise";
    public string Formality { get; set; } = "High";
    public string Language { get; set; } = "English";
    public bool PreserveTechnicalTerms { get; set; } = true;
    public string AdditionalInstructions { get; set; } = "Use clear professional English. Avoid unnecessary greetings. Avoid unnecessarily complex vocabulary. Preserve technical terminology. Keep the original meaning.";

    public WritingStyleProfile Clone()
    {
        return new WritingStyleProfile
        {
            Enabled = this.Enabled,
            Tone = this.Tone,
            Length = this.Length,
            Formality = this.Formality,
            Language = this.Language,
            PreserveTechnicalTerms = this.PreserveTechnicalTerms,
            AdditionalInstructions = this.AdditionalInstructions
        };
    }
}
