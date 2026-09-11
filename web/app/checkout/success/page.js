'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided in URL.');
      setLoading(false);
      return;
    }

    async function verify() {
      try {
        const res = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setDetails(data);
        } else {
          setError(
            data.message ||
              'Payment verification failed. If your account was debited, please contact support.'
          );
        }
      } catch {
        setError('Network error verifying payment.');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [orderId]);

  const copyLicense = () => {
    if (!details?.licenseKey) return;
    navigator.clipboard.writeText(details.licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="success-page-wrapper">
      {loading ? (
        <div className="card text-center" style={{ padding: '60px 20px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              border: '3px solid rgba(99, 102, 241, 0.2)',
              borderTopColor: 'var(--accent-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px',
            }}
          />
          <h2 className="heading-md">Verifying Payment & Minting Your License...</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
            Connecting with Cashfree & ZeptoMail...
          </p>
        </div>
      ) : error ? (
        <div className="card text-center" style={{ padding: '44px 24px', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            ✕
          </div>
          <h2 className="heading-md" style={{ color: '#ef4444' }}>Payment Status Notice</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '12px auto 24px', maxWidth: '480px' }}>
            {error}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn-secondary">
              Back to Home
            </Link>
            <a href="mailto:support@rewriteanywhere.com" className="btn btn-primary">
              Contact Support
            </a>
          </div>
        </div>
      ) : (
        <div className="success-card">
          {/* Header */}
          <div className="success-header">
            <div className="success-icon-badge">✓</div>
            <span className="success-status-tag">
              {details.amount === 0 || details.isFree ? 'License Activated' : 'Payment Confirmed'}
            </span>
            <h1 className="success-title">
              {details.amount === 0 || details.isFree ? 'Your Free Commercial License is Ready!' : 'Thank you for your purchase!'}
            </h1>
            <p className="success-subtitle">
              Your lifetime commercial license has been activated and sent to{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{details.email}</strong>.
            </p>
          </div>

          {/* License Key Box */}
          <div className="license-key-box">
            <div className="license-key-label">Your Lifetime Commercial License Key</div>
            <div>
              <span className="license-key-value">{details.licenseKey}</span>
            </div>
            <button
              type="button"
              onClick={copyLicense}
              className="btn btn-primary"
              style={{ fontSize: '0.9rem', padding: '10px 22px' }}
            >
              {copied ? '✓ Copied to Clipboard!' : '📋 Copy License Key'}
            </button>
          </div>

          {/* Download Box */}
          <div className="success-download-box">
            <h2 className="success-download-title">Step 1: Download & Install AI Rewrite Anywhere</h2>
            <p className="success-download-desc">
              Compatible with Windows 10 and 11 (64-bit). Standalone native desktop application.
            </p>
            <div className="success-download-buttons">
              <a
                href={details?.downloadUrl || 'https://rewriteanywhere.nishantmunjal.com/downloads/AI-Rewrite-Anywhere-Setup.exe'}
                className="btn btn-primary btn-large"
              >
                <span>⬇️ Download Windows Installer (.exe)</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.9, fontWeight: 400 }}>(3.1 MB)</span>
              </a>
            </div>
          </div>

          {/* Activation Guide */}
          <div className="success-guide-box">
            <h3 className="success-guide-title">
              <span>🚀</span>
              <span>Quick Activation Guide (30 Seconds)</span>
            </h3>
            <ol className="success-guide-list">
              <li className="success-guide-item">
                <span className="success-step-number">1</span>
                <span>Run <strong>AI-Rewrite-Anywhere-Setup.exe</strong> on your Windows PC.</span>
              </li>
              <li className="success-guide-item">
                <span className="success-step-number">2</span>
                <span>
                  Look for the glowing <strong>app icon in your Windows System Tray</strong> (near the taskbar clock).
                </span>
              </li>
              <li className="success-guide-item">
                <span className="success-step-number">3</span>
                <span>Right-click the tray icon and select <strong>Settings → License</strong>.</span>
              </li>
              <li className="success-guide-item">
                <span className="success-step-number">4</span>
                <span>
                  Paste your license key: <kbd className="hero-kbd">{details.licenseKey}</kbd> and click <strong>Activate</strong>.
                </span>
              </li>
              <li className="success-guide-item">
                <span className="success-step-number">5</span>
                <span>
                  Highlight any text in Chrome, Slack, Word, Outlook, or Notion and press <kbd className="hero-kbd">Ctrl+Shift+R</kbd>!
                </span>
              </li>
            </ol>
          </div>

          {/* Footer Info & Dashboard Link */}
          <div className="success-footer-row">
            <div>
              Order ID: <span className="hero-kbd" style={{ marginLeft: '6px' }}>{details.orderId}</span>
            </div>
            <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '0.88rem' }}>
              <span>Go to Customer Dashboard</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="success-page-wrapper text-center" style={{ padding: '80px 20px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading order details...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
