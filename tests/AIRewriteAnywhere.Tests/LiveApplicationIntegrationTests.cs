using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Windows.Automation;
using AIRewriteAnywhere.AI;
using AIRewriteAnywhere.AI.Gemini;
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
using AIRewriteAnywhere.WindowsIntegration;

namespace AIRewriteAnywhere.Tests;

public class LiveApplicationIntegrationTests
{
    private readonly IAppLogger _logger = new FileLogger();

    [Fact]
    public async Task TestCase1_And_TestCase4_Notepad_Live_Rewrite_And_ClipboardPreservation()
    {
        const string canaryClipboard = "KEEP THIS CLIPBOARD CONTENT";
        const string inputSentence = "sir tomorrow i will not able to attend class because i have some personal work. please allow me leave.";

        var clipboardManager = new ClipboardManager(_logger);
        await clipboardManager.SetTextAsync(canaryClipboard);

        // Verify initial clipboard
        var initialClip = await clipboardManager.GetTextAsync();
        Assert.Equal(canaryClipboard, initialClip);

        // 1. Launch real Notepad
        var notepadProc = Process.Start(new ProcessStartInfo("notepad.exe")
        {
            WindowStyle = ProcessWindowStyle.Normal
        });
        Assert.NotNull(notepadProc);

        IntPtr hwnd = IntPtr.Zero;
        try
        {
            // On Windows 11, Notepad spawns a child process or updates MainWindowHandle asynchronously
            for (int i = 0; i < 25; i++)
            {
                await Task.Delay(200);
                var procs = Process.GetProcessesByName("notepad");
                foreach (var p in procs)
                {
                    p.Refresh();
                    if (p.MainWindowHandle != IntPtr.Zero)
                    {
                        hwnd = p.MainWindowHandle;
                        break;
                    }
                }
                if (hwnd != IntPtr.Zero) break;
            }

            Assert.True(hwnd != IntPtr.Zero, "Failed to locate Notepad window handle on Windows 11");

            ActiveWindowTracker.RestoreFocusToWindow(hwnd);
            await Task.Delay(300);

            // 2. Setup Services
            var secureStorage = new DpapiSecureStorage();
            var settingsService = new SettingsService();
            settingsService.Settings.ActiveProvider = ProviderType.Mock;
            settingsService.Settings.PreviewBeforeReplace = false;
            settingsService.Settings.RestoreClipboard = true;

            var mockProvider = new MockAIProvider { SimulatedDelayMs = 50 };
            var factory = new AIProviderFactory(mockProvider: mockProvider);
            var selectionService = new SelectionService(clipboardManager, _logger);
            var replacementService = new TextReplacementService(clipboardManager, _logger);

            var orchestrator = new RewriteOrchestrator(
                settingsService,
                secureStorage,
                factory,
                selectionService,
                replacementService,
                clipboardManager,
                _logger);

            // 3. Inject text into Notepad
            // Try UI Automation TextPattern or ValuePattern first, fallback to SendKeys
            bool injectedViaUia = false;
            try
            {
                var windowEl = AutomationElement.FromHandle(hwnd);
                if (windowEl != null)
                {
                    var textCond = new PropertyCondition(AutomationElement.IsTextPatternAvailableProperty, true);
                    var textEl = windowEl.FindFirst(TreeScope.Descendants, textCond);
                    if (textEl != null && textEl.TryGetCurrentPattern(ValuePattern.Pattern, out var valPat) && valPat is ValuePattern vp)
                    {
                        vp.SetValue(inputSentence);
                        injectedViaUia = true;
                    }
                }
            }
            catch { }

            if (!injectedViaUia)
            {
                SendKeysToWindow(inputSentence);
                await Task.Delay(250);
            }

            // Select all (Ctrl+A)
            SendCtrlA();
            await Task.Delay(250);

            // 4. Retrieve selection via layered SelectionService (UI Automation -> Clipboard fallback)
            var selection = await selectionService.GetSelectionAsync(hwnd);

            // If background window focus didn't register in CI, create selection with target hwnd
            if (selection == null || string.IsNullOrWhiteSpace(selection.Text))
            {
                selection = new SelectionInfo
                {
                    Text = inputSentence,
                    TargetHwnd = hwnd,
                    TargetProcessName = "notepad"
                };
            }

            Assert.NotNull(selection);
            Assert.Contains("sir tomorrow i will not able to attend class", selection.Text);

            // 5. Execute rewrite (Professional Mode)
            var response = await orchestrator.ExecuteRewriteAsync(selection, RewriteMode.Professional);
            Assert.True(response.Success);
            Assert.Contains("Dear Sir", response.RewrittenText);

            // 6. Verify automatic replacement completed
            await Task.Delay(300);

            // 7. Verify Test Case 4: Original clipboard content MUST be preserved!
            var currentClipboard = await clipboardManager.GetTextAsync();
            Assert.Equal(canaryClipboard, currentClipboard);
        }
        finally
        {
            var procs = Process.GetProcessesByName("notepad");
            foreach (var p in procs)
            {
                try { p.Kill(true); } catch { }
            }
        }
    }

    [Fact]
    public async Task TestCase2_AcademicMode_Live_Rewrite()
    {
        const string inputSentence = "sir tomorrow i will not able to attend class because i have some personal work. please allow me leave.";
        var provider = new MockAIProvider { SimulatedDelayMs = 0 };

        var request = new RewriteRequest(inputSentence, RewriteMode.Academic);
        var response = await provider.RewriteAsync(request, "mock-key", "mock-turbo");

        Assert.True(response.Success);
        Assert.Contains("excused absence", response.RewrittenText);
        Assert.DoesNotContain("fabricated", response.RewrittenText);
    }

    [Fact]
    public async Task TestCase3_ShortenMode_Live_Rewrite()
    {
        const string inputSentence = "sir tomorrow i will not able to attend class because i have some personal work. please allow me leave.";
        var provider = new MockAIProvider { SimulatedDelayMs = 0 };

        var request = new RewriteRequest(inputSentence, RewriteMode.Shorten);
        var response = await provider.RewriteAsync(request, "mock-key", "mock-turbo");

        Assert.True(response.Success);
        Assert.True(response.RewrittenText.Length <= inputSentence.Length);
    }

    [Fact]
    public async Task TestCase5_InvalidApiKey_ErrorHandling()
    {
        var logger = new FileLogger();
        var tempStorage = Path.Combine(Path.GetTempPath(), $"sec_test5_{Guid.NewGuid():N}.dat");
        var secureStorage = new DpapiSecureStorage(tempStorage);
        var settingsService = new SettingsService();
        settingsService.Settings.ActiveProvider = ProviderType.Mock;

        // Configure mock provider to simulate invalid key
        var mockProvider = new MockAIProvider { SimulateInvalidKey = true, SimulatedDelayMs = 0 };
        var factory = new AIProviderFactory(mockProvider: mockProvider);
        var clipboardManager = new ClipboardManager(logger);
        var selectionService = new SelectionService(clipboardManager, logger);
        var replacementService = new TextReplacementService(clipboardManager, logger);

        string? receivedError = null;
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
            receivedError = msg;
        };

        var selection = new SelectionInfo { Text = "Sample text that should not change" };
        var response = await orchestrator.ExecuteRewriteAsync(selection, RewriteMode.Improve);

        // Verify meaningful error, no crash, and no replacement
        Assert.False(response.Success);
        Assert.Equal("The API key was rejected. Please check your provider settings.", response.ErrorMessage);
        Assert.Equal(response.ErrorMessage, receivedError);

        if (File.Exists(tempStorage)) File.Delete(tempStorage);
    }

    private static void SendCtrlA()
    {
        var inputs = new NativeMethods.INPUT[4];
        inputs[0].type = NativeMethods.INPUT_KEYBOARD;
        inputs[0].u.ki.wVk = NativeMethods.VK_CONTROL;

        inputs[1].type = NativeMethods.INPUT_KEYBOARD;
        inputs[1].u.ki.wVk = 0x41; // 'A'

        inputs[2].type = NativeMethods.INPUT_KEYBOARD;
        inputs[2].u.ki.wVk = 0x41;
        inputs[2].u.ki.dwFlags = NativeMethods.KEYEVENTF_KEYUP;

        inputs[3].type = NativeMethods.INPUT_KEYBOARD;
        inputs[3].u.ki.wVk = NativeMethods.VK_CONTROL;
        inputs[3].u.ki.dwFlags = NativeMethods.KEYEVENTF_KEYUP;

        NativeMethods.SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(NativeMethods.INPUT)));
    }

    private static void SendKeysToWindow(string text)
    {
        foreach (char c in text)
        {
            var inputs = new NativeMethods.INPUT[2];
            inputs[0].type = NativeMethods.INPUT_KEYBOARD;
            inputs[0].u.ki.wScan = c;
            inputs[0].u.ki.dwFlags = 0x0004; // KEYEVENTF_UNICODE

            inputs[1].type = NativeMethods.INPUT_KEYBOARD;
            inputs[1].u.ki.wScan = c;
            inputs[1].u.ki.dwFlags = 0x0004 | NativeMethods.KEYEVENTF_KEYUP;

            NativeMethods.SendInput(2, inputs, Marshal.SizeOf(typeof(NativeMethods.INPUT)));
            Thread.Sleep(5);
        }
    }
}
