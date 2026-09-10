'use client';

import { useState, useEffect } from 'react';
import CheckoutModal from '@/components/CheckoutModal';

export default function HomePage() {
  const [currency, setCurrency] = useState('usd'); // 'usd' or 'inr'
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    // 1. Instant check based on system timezone & offset (UTC+5:30 is India Standard Time)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const offset = new Date().getTimezoneOffset(); // -330 for IST
      if (tz.includes('Kolkata') || tz.includes('Calcutta') || offset === -330) {
        setCurrency('inr');
      }
    } catch (e) {}

    // 2. Network geolocation verification
    const checkGeo = async () => {
      try {
        const res = await fetch('/api/geo');
        if (res.ok) {
          const data = await res.json();
          if (data?.isIndia) {
            setCurrency('inr');
            return;
          } else if (data?.country && data.country !== 'IN') {
            setCurrency('usd');
            return;
          }
        }
      } catch (e) {}

      try {
        const extRes = await fetch('https://api.country.is/');
        if (extRes.ok) {
          const extData = await extRes.json();
          if (extData?.country === 'IN') {
            setCurrency('inr');
          } else if (extData?.country && extData.country !== 'IN') {
            setCurrency('usd');
          }
        }
      } catch (e) {}
    };

    checkGeo();
  }, []);
  const [selectedTone, setSelectedTone] = useState('Professional');
  const [sampleText, setSampleText] = useState(
    'sir tomorrow i will not able to attend office meeting because some urgent personal matter came up at home. please consider leave for me.'
  );
  const [outputText, setOutputText] = useState(
    'Dear Team,\n\nI am writing to inform you that I will be unable to attend tomorrow\'s office meeting due to an unexpected personal matter at home. Please excuse my absence and grant me leave for the day.\n\nWarm regards,\nNishant'
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const presets = {
    Professional: {
      input: 'sir tomorrow i will not able to attend office meeting because some urgent personal matter came up at home. please consider leave for me.',
      output: 'Dear Team,\n\nI am writing to inform you that I will be unable to attend tomorrow\'s office meeting due to an unexpected personal matter at home. Please excuse my absence and grant me leave for the day.\n\nBest regards,\nNishant'
    },
    Casual: {
      input: 'sir tomorrow i will not able to attend office meeting because some urgent personal matter came up at home. please consider leave for me.',
      output: 'Hey folks, something came up at home unexpectedly, so I won\'t be able to make tomorrow\'s meeting. I\'ll catch up on the notes as soon as I\'m back online!'
    },
    Direct: {
      input: 'I just wanted to drop a quick note to say that we might possibly need to rethink the project deadline if that is okay with everybody.',
      output: 'We need to extend the project deadline. Let\'s review revised milestones today.'
    },
    GrammarFix: {
      input: 'He do not has the file which was send by the client yesturday.',
      output: 'He does not have the file that was sent by the client yesterday.'
    }
  };

  const handleSelectTone = (tone) => {
    setSelectedTone(tone);
    if (presets[tone]) {
      setSampleText(presets[tone].input);
      setIsSimulating(true);
      setTimeout(() => {
        setOutputText(presets[tone].output);
        setIsSimulating(false);
      }, 350);
    }
  };

  const handleTriggerRewrite = () => {
    setIsSimulating(true);
    setTimeout(() => {
      if (selectedTone === 'Professional') {
        setOutputText(
          `Refined with AI Rewrite Anywhere:\n\n${sampleText
            .replace(/sir/gi, 'Dear Team')
            .replace(/will not able to/gi, 'will be unable to')
            .replace(/some urgent/gi, 'an urgent')}`
        );
      } else {
        setOutputText(`Polished version (${selectedTone}):\n\n${sampleText}`);
      }
      setIsSimulating(false);
    }, 400);
  };

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'Does AI Rewrite Anywhere work on macOS or Linux?',
      a: 'No. AI Rewrite Anywhere is engineered specifically for Windows 10 & 11 (64-bit). It integrates deeply with native Windows Win32 APIs, Global Hotkey Hooks, and the Windows UI Automation framework to provide seamless in-place text replacement in every Windows desktop software.'
    },
    {
      q: 'How does the single-user / 1 active license key policy work?',
      a: 'Each purchase grants a lifetime commercial license key (formatted as ARW-XXXX-XXXX-XXXX-XXXX). When you activate it in the app, it securely binds to your PC\'s unique Hardware ID (HWID). If you switch or format your computer, you can reach out to our support team anytime to reset your active device binding.'
    },
    {
      q: 'How does the 14-day money-back guarantee work?',
      a: 'We stand 100% behind our software. If AI Rewrite Anywhere does not save you hours every week, simply email support@rewriteanywhere.com within 14 days of purchase with your license key, and we will issue a full, unconditional refund immediately.'
    },
    {
      q: 'Do I have to pay ongoing monthly subscriptions for AI models?',
      a: 'No! Unlike tools that lock you into $15–$30/month recurring fees, AI Rewrite Anywhere uses a Bring-Your-Own-Key (BYOK) architecture. You can connect Google Gemini (which offers a generous 100% free tier of up to 1,500 requests/day), OpenAI, or Claude. Most users spend $0.00 each month using Google\'s free tier!'
    },
    {
      q: 'Is my data and clipboard private and secure?',
      a: 'Yes, 100%. Your API keys and license tokens are encrypted on your local computer using the Windows Data Protection API (DPAPI). Your keystrokes and rewritten texts are never logged, tracked, or sent to any intermediary server. All requests go directly from your PC to your chosen AI provider.'
    },
    {
      q: 'Which applications can I rewrite in?',
      a: 'Literally any application that accepts text: Google Chrome, Microsoft Edge, Slack, Microsoft Teams, WhatsApp Desktop, Outlook, Word, Notepad, Discord, VS Code, Notion, and more!'
    }
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Hero Section */}
      <section className="section hero">
        <div className="container">
          <div style={{ display: 'inline-flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="badge badge-windows">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.401H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.95-1.801"/>
              </svg>
              Exclusively for Windows 10 & 11 (64-bit)
            </span>
            <span className="badge badge-guarantee">
              🛡️ 14-Day Money-Back Guarantee
            </span>
          </div>

          <h1 className="heading-xl">
            AI-Powered Text Rewriting Anywhere in Windows.{' '}
            <span className="gradient-text">One Shortcut Away.</span>
          </h1>

          <p className="subheading">
            Highlight text in Chrome, Outlook, Slack, WhatsApp, Word, or any Windows app. Press{' '}
            <kbd className="hero-kbd">Ctrl+Shift+R</kbd>{' '}
            or tap the glowing assistant to instantly rewrite, polish, translate, or format your thoughts with Gemini, OpenAI, or Claude.
          </p>

          <div className="hero-cta-group">
            <a href="#pricing" className="btn btn-primary btn-large">
              <span>Get Lifetime License</span>
              <strong>– {currency === 'inr' ? '₹1,600 INR' : '$19 USD'}</strong>
            </a>
            <a href="/how-to-use" className="btn btn-secondary btn-large">
              <span>View Free Gemini API Guide</span>
              <span>→</span>
            </a>
          </div>

          <div className="hero-trust-row">
            <div className="trust-item">
              <span style={{ color: 'var(--accent-emerald)' }}>✓</span> 1 PC Lifetime License
            </div>
            <div className="trust-item">
              <span style={{ color: 'var(--accent-emerald)' }}>✓</span> Zero Monthly Fees
            </div>
            <div className="trust-item">
              <span style={{ color: 'var(--accent-emerald)' }}>✓</span> 100% Free Gemini Tier Supported
            </div>
            <div className="trust-item">
              <span style={{ color: 'var(--accent-emerald)' }}>✓</span> Windows DPAPI Hardware-Bound Security
            </div>
          </div>

          {/* Interactive Live Simulator */}
          <div id="simulator" className="simulator-wrapper">
            <div className="simulator-header">
              <div className="window-dots">
                <div className="window-dot dot-red"></div>
                <div className="window-dot dot-yellow"></div>
                <div className="window-dot dot-green"></div>
              </div>
              <div className="simulator-title">LIVE DEMO SIMULATOR • CTRL + SHIFT + R</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>Active Desktop Assistant</div>
            </div>

            <div className="simulator-body">
              <div className="simulator-grid">
                <div className="simulator-panel">
                  <div className="panel-label">
                    <span>1. Input Text (Type or Select Sample)</span>
                    <span style={{ color: 'var(--text-muted)' }}>Any Windows App</span>
                  </div>
                  <textarea
                    className="simulator-textarea"
                    value={sampleText}
                    onChange={(e) => setSampleText(e.target.value)}
                    placeholder="Type or paste any text here..."
                  />
                </div>

                <div className="simulator-panel">
                  <div className="panel-label">
                    <span>2. AI Rewritten Output</span>
                    <span style={{ color: 'var(--accent-secondary)' }}>Instant In-Place Replacement</span>
                  </div>
                  <div className="simulator-output">
                    {isSimulating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', height: '100%' }}>
                        <span>⚡ Rewriting in place...</span>
                      </div>
                    ) : (
                      outputText
                    )}
                  </div>
                </div>
              </div>

              <div className="simulator-controls">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tone Preset:</span>
                  <div className="preset-buttons">
                    {['Professional', 'Casual', 'Direct', 'GrammarFix'].map((tone) => (
                      <button
                        key={tone}
                        className={`btn-preset ${selectedTone === tone ? 'active' : ''}`}
                        onClick={() => handleSelectTone(tone)}
                      >
                        {tone === 'GrammarFix' ? 'Fix Grammar' : tone}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary" onClick={handleTriggerRewrite}>
                  ⚡ Trigger Rewrite Simulation
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section id="features" className="section section-surface">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '56px' }}>
            <span className="badge" style={{ marginBottom: '14px' }}>Engineered For Peak Productivity</span>
            <h2 className="heading-lg">Everything You Need to Write Faster, Anywhere</h2>
            <p className="subheading">No more copying and pasting into chat windows. Transform writing in place with native Windows velocity.</p>
          </div>

          <div className="grid-3">
            <div className="card">
              <div className="feature-icon-wrapper">⚡</div>
              <h3 className="heading-md">Universal In-Place Replacement</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Works across Microsoft Office, Chrome, Firefox, Slack, Teams, WhatsApp, Discord, and code editors. Highlight text and replace it automatically right where your cursor sits.
              </p>
            </div>

            <div className="card">
              <div className="feature-icon-wrapper">🔒</div>
              <h3 className="heading-md">Clipboard Safety Guard</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Never lose what you copied earlier. The app creates a temporary memory snapshot, carries out the transformation, and seamlessly restores your original clipboard within milliseconds.
              </p>
            </div>

            <div className="card">
              <div className="feature-icon-wrapper">🧠</div>
              <h3 className="heading-md">Triple AI Provider Support</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Connect your choice of Google Gemini (including its massive free tier), OpenAI (GPT-4o), or Anthropic Claude (3.5 Sonnet). Switch models with one click.
              </p>
            </div>

            <div className="card">
              <div className="feature-icon-wrapper">✍️</div>
              <h3 className="heading-md">Smart Personal Signatures</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Configure your name, title, and preferred email sign-offs. The AI automatically incorporates your professional persona when drafting or answering work emails.
              </p>
            </div>

            <div className="card">
              <div className="feature-icon-wrapper">💻</div>
              <h3 className="heading-md">Dual Activation Modes</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Trigger instantly via the customizable global hotkey (<kbd>Ctrl+Shift+R</kbd>) or enable the draggable, lightweight floating assist button that appears when you select text.
              </p>
            </div>

            <div className="card">
              <div className="feature-icon-wrapper">🛡️</div>
              <h3 className="heading-md">Hardware-Bound DPAPI Security</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Your API keys are encrypted locally using Windows Data Protection API (DPAPI). Your prompts never touch our servers, guaranteeing 100% privacy for sensitive enterprise work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '40px' }}>
            <span className="badge" style={{ marginBottom: '14px' }}>Stop Paying Monthly Rent for AI</span>
            <h2 className="heading-lg">Why Pay $140–$240/Year When You Can Pay Once?</h2>
            <p className="subheading">See how AI Rewrite Anywhere obliterates expensive monthly cloud subscriptions.</p>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Feature / Capability</th>
                  <th className="table-highlight">AI Rewrite Anywhere</th>
                  <th>Grammarly Premium</th>
                  <th>ChatGPT Plus</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Pricing Model</strong></td>
                  <td className="table-highlight" style={{ color: 'var(--accent-emerald)' }}>$19 / ₹1,600 (One-Time Lifetime)</td>
                  <td>$144 / year ($12/mo recurring)</td>
                  <td>$240 / year ($20/mo recurring)</td>
                </tr>
                <tr>
                  <td><strong>In-Place Desktop Text Replacement</strong></td>
                  <td className="table-highlight">✓ Everywhere in Windows</td>
                  <td>Limited plugin integrations</td>
                  <td>✗ Requires browser tab switching</td>
                </tr>
                <tr>
                  <td><strong>AI Model Choice</strong></td>
                  <td className="table-highlight">✓ Gemini, OpenAI & Claude</td>
                  <td>Proprietary fixed model</td>
                  <td>OpenAI models only</td>
                </tr>
                <tr>
                  <td><strong>Free AI Tier Support</strong></td>
                  <td className="table-highlight">✓ Yes (Gemini 100% Free Tier)</td>
                  <td>✗ Strictly paid subscription</td>
                  <td>✗ Paid subscription for desktop speed</td>
                </tr>
                <tr>
                  <td><strong>Privacy & Zero Data Tracking</strong></td>
                  <td className="table-highlight">✓ Hardware DPAPI Local Storage</td>
                  <td>Stores text on corporate cloud</td>
                  <td>Subject to cloud retention terms</td>
                </tr>
                <tr>
                  <td><strong>14-Day Money-Back Guarantee</strong></td>
                  <td className="table-highlight">✓ 100% Unconditional Refund</td>
                  <td>Varies / non-refundable</td>
                  <td>Non-refundable</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section section-surface">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '32px' }}>
            <span className="badge badge-guarantee" style={{ marginBottom: '14px' }}>
              14-Day Money-Back Guarantee
            </span>
            <h2 className="heading-lg">Simple, Transparent Lifetime Pricing</h2>
            <p className="subheading">Pay once, own it forever. One license key covers your primary Windows PC with free updates.</p>

            <div className="currency-toggle">
              <button
                className={`currency-btn ${currency === 'usd' ? 'active' : ''}`}
                onClick={() => setCurrency('usd')}
              >
                USD ($19 International)
              </button>
              <button
                className={`currency-btn ${currency === 'inr' ? 'active' : ''}`}
                onClick={() => setCurrency('inr')}
              >
                INR (₹1,600 India Special)
              </button>
            </div>
          </div>

          <div className="pricing-card">
            <span className="badge badge-windows" style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)' }}>
              Lifetime Commercial License • 1 Active PC
            </span>

            <div className="price-display">
              <span className="price-amount">
                {currency === 'inr' ? '₹1,600' : '$19'}
              </span>
              <span className="price-sub">/ one-time payment</span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Zero subscriptions. Zero hidden charges. Lifetime desktop access.
            </p>

            <ul className="pricing-features">
              <li className="pricing-feature">
                <span className="feature-check">✓</span>
                <span><strong>1 Active Windows 10/11 Device</strong> (Hardware-bound)</span>
              </li>
              <li className="pricing-feature">
                <span className="feature-check">✓</span>
                <span><strong>Instant Secret License Key</strong> (<kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>ARW-XXXX-XXXX-XXXX-XXXX</kbd>)</span>
              </li>
              <li className="pricing-feature">
                <span className="feature-check">✓</span>
                <span><strong>Triple AI Provider Support</strong> (Gemini, OpenAI, Claude)</span>
              </li>
              <li className="pricing-feature">
                <span className="feature-check">✓</span>
                <span><strong>Step-by-Step API Key Manual</strong> (Use Gemini 100% Free)</span>
              </li>
              <li className="pricing-feature">
                <span className="feature-check">✓</span>
                <span><strong>Clipboard Safety Guard & Email Signatures</strong></span>
              </li>
              <li className="pricing-feature">
                <span className="feature-check">✓</span>
                <span><strong>14-Day 100% Money-Back Guarantee</strong>, no questions asked</span>
              </li>
              <li className="pricing-feature">
                <span className="feature-check">✓</span>
                <span><strong>All future v1.x desktop app updates included</strong></span>
              </li>
            </ul>

            <button
              className="btn btn-primary btn-large"
              style={{ width: '100%', marginBottom: '16px' }}
              onClick={() => setIsCheckoutOpen(true)}
            >
              Get License Key ({currency === 'inr' ? '₹1,600 INR' : '$19 USD'})
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span>🔒 256-Bit Encrypted Checkout</span>
              <span>•</span>
              <span>⚡ Instant License Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '40px' }}>
            <span className="badge" style={{ marginBottom: '14px' }}>Got Questions?</span>
            <h2 className="heading-lg">Frequently Asked Questions</h2>
            <p className="subheading">Everything you need to know about the product, licensing, and setup.</p>
          </div>

          <div className="faq-grid">
            {faqs.map((faq, idx) => (
              <div key={idx} className="faq-item" onClick={() => toggleFaq(idx)}>
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <span style={{ color: 'var(--accent-primary)', fontSize: '1.2rem' }}>
                    {openFaq === idx ? '−' : '+'}
                  </span>
                </div>
                {openFaq === idx && <div className="faq-answer">{faq.a}</div>}
              </div>
            ))}
          </div>

          <div className="text-center" style={{ marginTop: '48px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Still have questions? Our support engineers are ready to help.
            </p>
            <a href="/support" className="btn btn-secondary">
              Contact Support Team →
            </a>
          </div>
        </div>
      </section>

      {/* Checkout Modal with Cashfree and Coupon Support */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        initialCurrency={currency.toUpperCase()}
      />
    </div>
  );
}
