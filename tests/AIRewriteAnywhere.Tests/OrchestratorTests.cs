using System.IO;
using System.Windows;
using AIRewriteAnywhere.AI;
using AIRewriteAnywhere.AI.Mock;
using AIRewriteAnywhere.Clipboard;
using AIRewriteAnywhere.Common;
using AIRewriteAnywhere.Core;
using AIRewriteAnywhere.Logging;
using AIRewriteAnywhere.Models;
using AIRewriteAnywhere.Replacement;
using AIRewriteAnywhere.Security;
using AIRewriteAnywhere.Selection;
using AIRewriteAnywhere.Settings;

namespace AIRewriteAnywhere.Tests;

public class OrchestratorTests
{
    private class FakeReplacementService : ITextReplacementService
    {
        public bool ReplaceCalled { get; private set; }
        public string? ReplacedText { get; private set; }
        public bool UndoCalled { get; private set; }
        public bool CanUndo => true;
        public UndoRecord? LastUndoRecord => null;

        public Task<bool> ReplaceSelectionAsync(SelectionInfo selection, string rewrittenText, ClipboardBackup? preservedClipboard = null)
        {
            ReplaceCalled = true;
            ReplacedText = rewrittenText;
            return Task.FromResult(true);
        }

        public Task<bool> UndoLastRewriteAsync()
        {
            UndoCalled = true;
            return Task.FromResult(true);
        }
    }

    [Fact]
    public async Task ExecuteRewriteAsync_ReplacesText_WhenSuccessful()
    {
        var logger = new FileLogger();
        var secureStorage = new DpapiSecureStorage();
        var settingsService = new SettingsService();
        settingsService.Settings.ActiveProvider = ProviderType.Mock;
        settingsService.Settings.PreviewBeforeReplace = false;

        var mockProvider = new MockAIProvider { SimulatedDelayMs = 0 };
        var factory = new AIProviderFactory(mockProvider: mockProvider);
        var clipboardManager = new ClipboardManager(logger);
        var selectionService = new SelectionService(clipboardManager, logger);
        var replacementService = new FakeReplacementService();

        var orchestrator = new RewriteOrchestrator(
            settingsService,
            secureStorage,
            factory,
            selectionService,
            replacementService,
            clipboardManager,
            logger);

        var selection = new SelectionInfo
        {
            Text = "sir tomorrow i will not able to attend class because i have some personal work. please allow me leave."
        };

        var response = await orchestrator.ExecuteRewriteAsync(selection, RewriteMode.Professional);

        Assert.True(response.Success);
        Assert.True(replacementService.ReplaceCalled);
        Assert.NotNull(replacementService.ReplacedText);
        Assert.Contains("Dear Sir", replacementService.ReplacedText);
    }

    [Fact]
    public async Task ExecuteRewriteAsync_SkipsReplacement_WhenPreviewCancelled()
    {
        var logger = new FileLogger();
        var secureStorage = new DpapiSecureStorage();
        var settingsService = new SettingsService();
        settingsService.Settings.ActiveProvider = ProviderType.Mock;
        settingsService.Settings.PreviewBeforeReplace = true; // Preview enabled

        var mockProvider = new MockAIProvider { SimulatedDelayMs = 0 };
        var factory = new AIProviderFactory(mockProvider: mockProvider);
        var clipboardManager = new ClipboardManager(logger);
        var selectionService = new SelectionService(clipboardManager, logger);
        var replacementService = new FakeReplacementService();

        var orchestrator = new RewriteOrchestrator(
            settingsService,
            secureStorage,
            factory,
            selectionService,
            replacementService,
            clipboardManager,
            logger)
        {
            // Simulate user clicking "Cancel" in preview dialog
            ShowPreviewRequested = (orig, rew) => Task.FromResult(false)
        };

        var selection = new SelectionInfo { Text = "Test sentence" };
        var response = await orchestrator.ExecuteRewriteAsync(selection, RewriteMode.Improve);

        Assert.True(response.Success);
        // Replacement must NOT have been called because user cancelled in preview!
        Assert.False(replacementService.ReplaceCalled);
    }

    [Fact]
    public async Task ExecuteRewriteAsync_PromptsForMissingKey_WhenNonMockProviderHasNoKey()
    {
        var logger = new FileLogger();
        var tempStoragePath = Path.Combine(Path.GetTempPath(), $"sec_orch_{Guid.NewGuid():N}.dat");
        var secureStorage = new DpapiSecureStorage(tempStoragePath);
        var settingsService = new SettingsService();
        settingsService.Settings.ActiveProvider = ProviderType.OpenAI; // OpenAI without key configured

        var factory = new AIProviderFactory();
        var clipboardManager = new ClipboardManager(logger);
        var selectionService = new SelectionService(clipboardManager, logger);
        var replacementService = new FakeReplacementService();

        string? notificationMessage = null;
        var orchestrator = new RewriteOrchestrator(
            settingsService,
            secureStorage,
            factory,
            selectionService,
            replacementService,
            clipboardManager,
            logger);

        orchestrator.NotificationRequested += (msg, isErr) =>
        {
            notificationMessage = msg;
        };

        var selection = new SelectionInfo { Text = "Test text" };
        var response = await orchestrator.ExecuteRewriteAsync(selection, RewriteMode.Improve);

        Assert.False(response.Success);
        Assert.Contains("Please configure an AI provider and API key in Settings", response.ErrorMessage);
        Assert.Equal(response.ErrorMessage, notificationMessage);
        Assert.False(replacementService.ReplaceCalled);

        if (File.Exists(tempStoragePath)) File.Delete(tempStoragePath);
    }
}
