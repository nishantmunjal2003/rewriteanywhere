export const metadata = {
  title: 'How to Use & API Key Setup Manual | AI Rewrite Anywhere',
  description:
    'Complete setup guide for AI Rewrite Anywhere. Learn how to install on Windows 10/11, activate your 1-PC license key, and get free Google Gemini, OpenAI, or Claude API keys.',
  alternates: {
    canonical: 'https://rewriteanywhere.nishantmunjal.com/how-to-use',
  },
  openGraph: {
    title: 'How to Use & API Key Setup Manual | AI Rewrite Anywhere',
    description:
      'Complete setup guide for AI Rewrite Anywhere. Learn how to install on Windows 10/11, activate your 1-PC license key, and get free Google Gemini, OpenAI, or Claude API keys.',
    url: 'https://rewriteanywhere.nishantmunjal.com/how-to-use',
  },
};

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Install and Setup AI Rewrite Anywhere on Windows 10 & 11',
  description:
    'Step-by-step instructions to install AI Rewrite Anywhere, activate your single-PC license key, configure free Google Gemini or OpenAI/Claude API keys, and trigger in-place rewrites in any Windows app.',
  totalTime: 'PT3M',
  step: [
    {
      '@type': 'HowToStep',
      name: 'System Requirements & Installation',
      text: 'Ensure Windows 10 (Build 19041+) or Windows 11 64-bit is installed. Download and launch AIRewriteAnywhere-Setup.msi to install the software.',
      url: 'https://rewriteanywhere.nishantmunjal.com/how-to-use#step-1',
    },
    {
      '@type': 'HowToStep',
      name: 'Activate Your 1-PC License Key',
      text: 'Right-click the system tray icon, navigate to Settings > License & Protection, enter your ARW-XXXX-XXXX-XXXX-XXXX license key, and click Activate License.',
      url: 'https://rewriteanywhere.nishantmunjal.com/how-to-use#license-guide',
    },
    {
      '@type': 'HowToStep',
      name: 'Acquire Your AI API Key (Free Gemini or OpenAI/Claude)',
      text: 'Visit Google AI Studio to grab a free Gemini API key (up to 1,500 requests/day at zero cost), or get OpenAI / Claude API keys. Paste into Settings > AI Provider.',
      url: 'https://rewriteanywhere.nishantmunjal.com/how-to-use#gemini-guide',
    },
    {
      '@type': 'HowToStep',
      name: 'Trigger Rewrites in Any Windows Software',
      text: 'Highlight any text in Chrome, Slack, Word, Outlook, or WhatsApp, then press Ctrl+Shift+R or tap the floating assistant widget to rewrite text instantly in place.',
      url: 'https://rewriteanywhere.nishantmunjal.com/how-to-use#step-4',
    },
  ],
};

export default function HowToUsePage() {
  return (
    <div className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <div className="container" style={{ maxWidth: '900px' }}>
        <div className="text-center" style={{ marginBottom: '56px' }}>
          <span className="badge badge-windows" style={{ marginBottom: '14px' }}>
            Windows 10 & 11 (64-bit) Manual
          </span>
          <h1 className="heading-xl">How to Use & API Key Guide</h1>
          <p className="subheading">
            Follow this quick step-by-step setup guide to get AI Rewrite Anywhere running on your PC in under 3 minutes.
          </p>
        </div>

        {/* Step 1: System Requirements & Installation */}
        <div className="step-card">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3 className="heading-md">System Requirements & Installation</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>
              AI Rewrite Anywhere is built natively for <strong>Windows 10 and Windows 11 (64-bit)</strong>.
            </p>
            <ul style={{ color: 'var(--text-secondary)', marginLeft: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Operating System:</strong> Windows 10 (Build 19041+) or Windows 11 (all versions).</li>
              <li><strong>Architecture:</strong> x64 (64-bit).</li>
              <li><strong>Runtime:</strong> Microsoft .NET 8.0 Desktop Runtime (installed automatically by setup if missing).</li>
            </ul>
            <p style={{ color: 'var(--text-secondary)' }}>
              Download the installer (<kbd>AIRewriteAnywhere-Setup.msi</kbd>) from your purchase email or order confirmation, run the setup wizard, and launch the application from your Start Menu or system tray.
            </p>
          </div>
        </div>

        {/* Step 2: License Key Activation */}
        <div id="license-guide" className="step-card">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3 className="heading-md">Activate Your License Key (1 Active PC Policy)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Your commercial license key arrives formatted as <kbd>ARW-XXXX-XXXX-XXXX-XXXX</kbd>.
            </p>
            <ol style={{ color: 'var(--text-secondary)', marginLeft: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Right-click the ⚡ icon in your Windows System Tray and select <strong>Settings</strong>.</li>
              <li>Click the <strong>License & Protection</strong> tab on the left navigation bar.</li>
              <li>You will see your PC\'s unique <strong>Machine Hardware ID (HWID)</strong> generated automatically.</li>
              <li>Paste your license key into the input field and click <strong>Activate License</strong>.</li>
            </ol>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: '#c7d2fe' }}>
              🔒 <strong>Single Active PC Protection:</strong> Each license key binds to exactly one active PC hardware ID. If you change your computer or reinstall Windows, simply email <a href="mailto:support@rewriteanywhere.com" style={{ textDecoration: 'underline' }}>support@rewriteanywhere.com</a> and we will gladly reset your device binding.
            </div>
          </div>
        </div>

        {/* Step 3: Grabbing API Keys (Gemini, OpenAI, Claude) */}
        <div id="gemini-guide" className="step-card">
          <div className="step-number">3</div>
          <div className="step-content" style={{ width: '100%' }}>
            <h3 className="heading-md">How to Grab Your AI API Keys</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              AI Rewrite Anywhere uses a Bring-Your-Own-Key (BYOK) architecture. You have complete control over which AI model powers your rewrites. All keys are encrypted locally with Windows DPAPI.
            </p>

            {/* Provider 1: Gemini */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '1.1rem', color: '#34d399' }}>Option A: Google Gemini (Recommended – 100% Free Tier)</h4>
                <span className="badge badge-guarantee">Free Tier Available</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '12px' }}>
                Google AI Studio provides a free API tier that includes up to 15 requests per minute and 1,500 requests per day at zero charge.
              </p>
              <ol style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)', textDecoration: 'underline' }}>Google AI Studio (aistudio.google.com)</a>.</li>
                <li>Sign in with your Google account.</li>
                <li>Click <strong>&quot;Create API key&quot;</strong> and choose a Google Cloud project (or let it auto-create a default one).</li>
                <li>Copy the key (starts with <kbd>AIzaSy...</kbd>).</li>
                <li>Open AI Rewrite Anywhere <strong>Settings → AI Provider</strong>, select <strong>Google Gemini</strong>, paste your key, and click <strong>Save Settings</strong>.</li>
              </ol>
            </div>

            {/* Provider 2: OpenAI */}
            <div id="openai-guide" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>Option B: OpenAI (GPT-4o / GPT-4o-mini)</h4>
                <span className="badge">Pay-As-You-Go</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '12px' }}>
                Standard pay-per-token pricing with zero monthly recurring base charge.
              </p>
              <ol style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)', textDecoration: 'underline' }}>OpenAI Platform (platform.openai.com)</a>.</li>
                <li>Log in or create an account, then navigate to <strong>API Keys</strong>.</li>
                <li>Click <strong>&quot;Create new secret key&quot;</strong>, name it (e.g. &quot;RewriteAnywhere&quot;), and copy the key (starts with <kbd>sk-proj-...</kbd>).</li>
                <li>In AI Rewrite Anywhere Settings, select <strong>OpenAI</strong>, paste your key, select model (GPT-4o or GPT-4o-mini), and save.</li>
              </ol>
            </div>

            {/* Provider 3: Claude */}
            <div id="claude-guide" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>Option C: Anthropic Claude (Claude 3.5 Sonnet / Haiku)</h4>
                <span className="badge">Pay-As-You-Go</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '12px' }}>
                Ideal for articulate prose, nuanced tone rewriting, and academic writing.
              </p>
              <ol style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Visit <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)', textDecoration: 'underline' }}>Anthropic Console (console.anthropic.com)</a>.</li>
                <li>Log in to your Anthropic console account.</li>
                <li>Click <strong>&quot;Create Key&quot;</strong> and copy the token (starts with <kbd>sk-ant-...</kbd>).</li>
                <li>In AI Rewrite Anywhere Settings, select <strong>Anthropic Claude</strong>, paste your key, choose Claude 3.5 Sonnet or Haiku, and save.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Step 4: Using the App */}
        <div className="step-card">
          <div className="step-number">4</div>
          <div className="step-content">
            <h3 className="heading-md">How to Trigger Rewrites in Any Windows Software</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              You have two ultra-fast methods to rewrite text in real-time:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(10, 13, 20, 0.7)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ color: 'var(--accent-primary)', marginBottom: '8px' }}>Method 1: Global Shortcut</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  1. Highlight any text with your mouse or keyboard.<br/>
                  2. Press <kbd>Ctrl+Shift+R</kbd> (or your custom hotkey).<br/>
                  3. The text transforms in-place instantly!
                </p>
              </div>
              <div style={{ background: 'rgba(10, 13, 20, 0.7)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ color: 'var(--accent-secondary)', marginBottom: '8px' }}>Method 2: Floating Assistant Button</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  1. Select text in any window.<br/>
                  2. A small, non-intrusive glowing ⚡ button appears near your cursor.<br/>
                  3. Click the button to rewrite with one tap.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Personal Profile & Email Signatures */}
        <div className="step-card">
          <div className="step-number">5</div>
          <div className="step-content">
            <h3 className="heading-md">Customizing Personal Profile & Email Signatures</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>
              When replying to business emails, you can instruct the AI to always incorporate your sender information.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Open <strong>Settings → Writing Style & Tone</strong>, enter your <strong>Full Name</strong> (e.g. &quot;Dr. Nishant Munjal&quot;), your <strong>Position/Title</strong> (e.g. &quot;Senior Director of Engineering&quot;), and configure whether to append a custom signature automatically whenever you rewrite email drafts!
            </p>
          </div>
        </div>

        <div className="text-center" style={{ marginTop: '48px' }}>
          <a href="/#pricing" className="btn btn-primary btn-large">
            Get Your Lifetime License Now ($19 / ₹1,600) →
          </a>
        </div>
      </div>
    </div>
  );
}
