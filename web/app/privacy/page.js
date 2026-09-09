export const metadata = {
  title: 'Privacy Policy - AI Rewrite Anywhere',
  description: 'Our privacy commitment: zero telemetry on text rewrites, Windows DPAPI encryption, and local-first architecture.',
};

export default function PrivacyPage() {
  return (
    <div className="section">
      <div className="container" style={{ maxWidth: '840px' }}>
        <div className="text-center" style={{ marginBottom: '48px' }}>
          <span className="badge badge-guarantee" style={{ marginBottom: '14px' }}>
            Zero Telemetry • Privacy First
          </span>
          <h1 className="heading-xl">Privacy Policy</h1>
          <p className="subheading">
            We believe your writing, emails, documents, and credentials belong exclusively to you.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: 1.7 }}>
          <section>
            <h2 className="heading-md" style={{ color: 'var(--accent-primary)' }}>1. What We Never Collect</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              AI Rewrite Anywhere does not log, record, monitor, or transmit:
            </p>
            <ul style={{ color: 'var(--text-secondary)', marginLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Your highlighted text or rewritten output:</strong> Rewriting operations are sent directly from your Windows machine to the AI endpoint (Google, OpenAI, Anthropic) over encrypted HTTPS. Our servers never see your content.</li>
              <li><strong>Your keystrokes:</strong> The Windows keyboard hook only listens for the specific hotkey combination you configured (<kbd>Ctrl+Shift+R</kbd>). No other keystrokes are recorded.</li>
              <li><strong>Your clipboard history:</strong> The clipboard backup feature only temporarily stores the immediate item in local memory during the rewrite cycle and restores it instantly.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-md" style={{ color: 'var(--accent-primary)' }}>2. How Your API Keys Are Protected</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Your Google Gemini, OpenAI, or Claude API keys are stored solely on your local computer. They are encrypted using the native <strong>Windows Data Protection API (DPAPI)</strong> with user-scope machine binding. They cannot be decrypted by unauthorized user accounts or exported outside your Windows profile.
            </p>
          </section>

          <section>
            <h2 className="heading-md" style={{ color: 'var(--accent-primary)' }}>3. License Activation & Hardware Identifiers (HWID)</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              To enforce the single-active-device policy per commercial license, the app generates an irreversible SHA-256 cryptographic hash of your system identifiers (Windows Cryptography MachineGuid and computer metadata). This non-reversible string (e.g. <kbd>HWID-XXXX-XXXX-XXXX-XXXX</kbd>) is transmitted to our activation server solely to verify that a license key is not actively utilized on multiple computers simultaneously.
            </p>
          </section>

          <section>
            <h2 className="heading-md" style={{ color: 'var(--accent-primary)' }}>4. Third-Party AI Data Policies</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              When you trigger a rewrite, text is transmitted directly to your selected AI provider (Google AI Studio, OpenAI, or Anthropic). Each provider maintains their own data retention and privacy policies for API usage. Generally, commercial API endpoints do not train foundational models on API customer data. Please review their respective privacy notices for details.
            </p>
          </section>

          <section>
            <h2 className="heading-md" style={{ color: 'var(--accent-primary)' }}>5. Contact Us Regarding Privacy</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              If you have any questions or data inquiries regarding this policy, contact our data protection team at <a href="mailto:privacy@rewriteanywhere.com" style={{ color: 'var(--accent-secondary)', textDecoration: 'underline' }}>privacy@rewriteanywhere.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
