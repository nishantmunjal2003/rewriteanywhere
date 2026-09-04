using Xunit;

// Disable parallel test execution because tests manipulate shared Windows OS singleton resources (Clipboard, Notepad focus)
[assembly: CollectionBehavior(DisableTestParallelization = true)]
