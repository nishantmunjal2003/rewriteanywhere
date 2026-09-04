using System.Windows;
using System.Windows.Input;

namespace AIRewriteAnywhere.UI;

public partial class PreviewWindow : Window
{
    public bool UserAccepted { get; private set; } = false;
    public string FinalRewrittenText => RewrittenTextBox.Text;

    public PreviewWindow(string originalText, string rewrittenText)
    {
        InitializeComponent();

        OriginalTextBox.Text = originalText;
        RewrittenTextBox.Text = rewrittenText;

        this.MouseDown += (s, e) =>
        {
            if (e.ChangedButton == MouseButton.Left && e.ButtonState == MouseButtonState.Pressed)
            {
                this.DragMove();
            }
        };
    }

    private void Replace_Click(object sender, RoutedEventArgs e)
    {
        UserAccepted = true;
        this.DialogResult = true;
        this.Close();
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        UserAccepted = false;
        this.DialogResult = false;
        this.Close();
    }
}
