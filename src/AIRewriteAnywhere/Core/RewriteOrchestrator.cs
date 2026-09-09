using System.Windows;
using AIRewriteAnywhere.AI;
using AIRewriteAnywhere.Clipboard;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Logging;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.Replacement;
using AIRewriteAnywhere.Security;
using AIRewriteAnywhere.Selection;
using AIRewriteAnywhere.Settings;
using AIRewriteAnywhere.WindowsIntegration;

namespace AIRewriteAnywhere.Core;

public class RewriteOrchestrator : IRewriteOrchestrator
{
    private readonly ISettingsService _settingsService;
    private readonly ISecureStorage _secureStorage;
    private readonly IAIProviderFactory _providerFactory;
    private readonly ISelectionService _selectionService;
    private readonly ITextReplacementService _textReplacementService;
    private readonly IClipboardManager _clipboardManager;
    private readonly IAppLogger _logger;
    private readonly ILicenseService? _licenseService;

    public event Action<SelectionInfo>? ShowRewriteMenuRequested;
    public event Action<string, bool>? NotificationRequested;
    public event Action? GenerationCompleted;
    public Func<string, string, Task<bool>>? ShowPreviewRequested { get; set; }

    public RewriteOrchestrator(
        ISettingsService settingsService,
        ISecureStorage secureStorage,
        IAIProviderFactory providerFactory,
        ISelectionService selectionService,
        ITextReplacementService textReplacementService,
        IClipboardManager clipboardManager,
        IAppLogger logger,
        ILicenseService? licenseService = null)
    {
        _settingsService = settingsService;
        _secureStorage = secureStorage;
        _providerFactory = providerFactory;
        _selectionService = selectionService;
        _textReplacementService = textReplacementService;
        _clipboardManager = clipboardManager;
        _logger = logger;
        _licenseService = licenseService;
    }

    public async Task TriggerRewriteFlowFromHotkeyAsync()
    {
        var targetHwnd = NativeMethods.GetForegroundWindow();
        if (targetHwnd == IntPtr.Zero)
        {
            NotificationRequested?.Invoke("Please select some text first.", true);
            return;
        }

        var selection = await _selectionService.GetSelectionAsync(targetHwnd);
        if (selection == null || string.IsNullOrWhiteSpace(selection.Text))
        {
            _logger.LogInfo("Hotkey triggered but no text was selected.");
            NotificationRequested?.Invoke("Please select some text first.", true);
            return;
        }

        TriggerRewriteFlowFromSelection(selection);
    }

    public void TriggerRewriteFlowFromSelection(SelectionInfo selection)
    {
        ShowRewriteMenuRequested?.Invoke(selection);
    }

    public async Task<RewriteResponse> ExecuteRewriteAsync(
        SelectionInfo selection,
        RewriteMode mode,
        string? customInstruction = null,
        string? targetLanguage = null,
        CancellationToken cancellationToken = default)
    {
        var settings = _settingsService.Settings;
        var providerType = settings.ActiveProvider;
        var provider = _providerFactory.GetProvider(providerType);

        var model = providerType switch
        {
            ProviderType.OpenAI => settings.OpenAIModel,
            ProviderType.Gemini => settings.GeminiModel,
            ProviderType.Claude => settings.ClaudeModel,
            _ => settings.MockModel
        };

        // Check license protection
        if (_licenseService != null && !_licenseService.IsLicensed)
        {
            var licenseMsg = "Product license required. Please activate your product key in Settings (License & Protection).";
            _logger.LogWarning(licenseMsg);
            NotificationRequested?.Invoke(licenseMsg, true);
            return RewriteResponse.CreateFailure(licenseMsg, providerType, model);
        }

        var apiKey = _secureStorage.GetSecret(providerType.ToString()) ?? string.Empty;

        if (providerType != ProviderType.Mock && string.IsNullOrWhiteSpace(apiKey))
        {
            var msg = "Please configure an AI provider and API key in Settings.";
            _logger.LogWarning(msg);
            NotificationRequested?.Invoke(msg, true);
            return RewriteResponse.CreateFailure(msg, providerType, model);
        }

        var request = new RewriteRequest
        {
            OriginalText = selection.Text,
            Mode = mode,
            TargetLanguage = targetLanguage ?? settings.DefaultLanguage,
            CustomInstruction = customInstruction,
            WritingStyle = settings.WritingStyle,
            UserName = settings.UserName,
            UserPosition = settings.UserPosition,
            IncludeEmailSignature = settings.IncludeEmailSignature,
            CustomSignature = settings.CustomSignature
        };

        _logger.LogInfo($"Rewrite requested: Provider={providerType}, Model={model}, Mode={mode}");

        var response = await provider.RewriteAsync(request, apiKey, model, cancellationToken);
        GenerationCompleted?.Invoke();

        if (!response.Success)
        {
            _logger.LogWarning($"Rewrite failed: {response.ErrorMessage} (Duration: {response.Duration.TotalSeconds:F2}s)");
            NotificationRequested?.Invoke(response.ErrorMessage ?? "Rewrite failed.", true);
            return response;
        }

        _logger.LogInfo($"Rewrite successful. Duration: {response.Duration.TotalSeconds:F2}s");

        // If preview mode is enabled, show preview
        if (settings.PreviewBeforeReplace && ShowPreviewRequested != null)
        {
            var confirmed = await ShowPreviewRequested(selection.Text, response.RewrittenText);
            if (!confirmed)
            {
                _logger.LogInfo("User cancelled replacement in preview dialog.");
                return response;
            }
        }

        // Automatic Replacement
        var replaced = await _textReplacementService.ReplaceSelectionAsync(selection, response.RewrittenText);
        if (!replaced)
        {
            NotificationRequested?.Invoke("Failed to automatically replace text.", true);
        }

        return response;
    }

    public async Task<bool> UndoLastRewriteAsync()
    {
        return await _textReplacementService.UndoLastRewriteAsync();
    }
}
