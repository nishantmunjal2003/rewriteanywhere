'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BrandIcon from '@/components/BrandIcon';

export default function DashboardPage() {
  const [authStage, setAuthStage] = useState('CHECKING'); // 'CHECKING', 'ENTER_EMAIL', 'ENTER_OTP', 'AUTHENTICATED'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  // Check if session cookie is already valid
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/user/licenses');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUserData(data);
            setAuthStage('AUTHENTICATED');
            return;
          }
        }
      } catch (err) {
        // Not logged in
      }
      setAuthStage('ENTER_EMAIL');
    }

    checkAuth();
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/user/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message || `A verification code has been sent to ${email}.`);
        setAuthStage('ENTER_OTP');
      } else {
        setError(data.message || 'Failed to send verification code.');
      }
    } catch {
      setError('Network error while requesting verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/user/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Fetch licenses
        const licRes = await fetch('/api/user/licenses');
        const licData = await licRes.json();
        setUserData(licData);
        setAuthStage('AUTHENTICATED');
      } else {
        setError(data.message || 'Invalid verification code.');
      }
    } catch {
      setError('Network error during verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/user/auth/logout', { method: 'POST' });
    } catch {}
    setUserData(null);
    setOtp('');
    setAuthStage('ENTER_EMAIL');
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  return (
    <div className="dashboard-wrapper">
      {authStage === 'CHECKING' && (
        <div className="dashboard-auth-card" style={{ padding: '60px 20px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading customer portal...</p>
        </div>
      )}

      {/* LOGIN FORM: ENTER EMAIL */}
      {authStage === 'ENTER_EMAIL' && (
        <div className="dashboard-auth-card">
          <div className="dashboard-icon-badge">
            <BrandIcon width={36} height={36} />
          </div>
          <h1 className="dashboard-title">Customer Dashboard</h1>
          <p className="dashboard-subtitle">
            Access your purchased license keys, hardware bindings & updated software downloads.
          </p>

          {error && <div className="dashboard-alert-error">{error}</div>}

          <form onSubmit={handleSendOtp} className="dashboard-form">
            <div>
              <label className="dashboard-label">Purchase Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="dashboard-input"
              />
              <p className="dashboard-input-hint">
                We will send a 6-digit one-time code to verify your identity. No password needed.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="dashboard-submit-btn"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code →'}
            </button>
          </form>

          <div className="dashboard-auth-footer">
            Need to purchase a license?{' '}
            <Link href="/#pricing" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
              Get Lifetime License
            </Link>
          </div>
        </div>
      )}

      {/* LOGIN FORM: ENTER OTP */}
      {authStage === 'ENTER_OTP' && (
        <div className="dashboard-auth-card">
          <div className="dashboard-icon-badge" style={{ fontSize: '1.75rem' }}>
            ✉️
          </div>
          <h2 className="dashboard-title">Enter Verification Code</h2>
          <p className="dashboard-subtitle">
            We sent a 6-digit code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
          </p>

          {message && <div className="dashboard-alert-success">{message}</div>}
          {error && <div className="dashboard-alert-error">{error}</div>}

          <form onSubmit={handleVerifyOtp} className="dashboard-form">
            <div>
              <label className="dashboard-label" style={{ textAlign: 'center' }}>6-Digit OTP Code</label>
              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                className="dashboard-input dashboard-otp-input"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="dashboard-submit-btn"
            >
              {loading ? 'Verifying...' : 'Verify Code & Sign In →'}
            </button>
          </form>

          <div className="dashboard-otp-actions">
            <button
              type="button"
              onClick={() => setAuthStage('ENTER_EMAIL')}
              className="dashboard-text-btn"
            >
              ← Change Email
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="dashboard-link-btn"
            >
              Resend Code
            </button>
          </div>
        </div>
      )}

      {/* AUTHENTICATED CUSTOMER DASHBOARD */}
      {authStage === 'AUTHENTICATED' && userData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Top user bar */}
          <div className="dashboard-user-bar">
            <div>
              <span className="dashboard-user-tag">Customer Account</span>
              <h1 className="dashboard-user-email">{userData.email}</h1>
              <p className="dashboard-user-desc">
                Single PC hardware binding active • Free lifetime updates included
              </p>
            </div>

            <div className="dashboard-user-actions">
              <Link
                href="/#pricing"
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                + Buy Another License
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Software Downloads Card */}
          <div className="dashboard-download-card">
            <div>
              <span className="dashboard-download-badge">
                Latest Windows Release • {userData.downloads?.version || 'v1.0.0-PROD'}
              </span>
              <h2 className="dashboard-download-title">Download AI Rewrite Anywhere</h2>
              <p className="dashboard-download-desc">
                Run anywhere across Windows 10 & 11. Press <kbd className="hero-kbd" style={{ padding: '2px 6px', fontSize: '0.8rem' }}>Ctrl+Shift+R</kbd> in any app (Chrome, Word, Slack, Notion) to rewrite instantly in place.
              </p>
            </div>

            <div className="dashboard-download-actions">
              <a
                href={userData.downloads?.exeUrl || 'https://rewriteanywhere.nishantmunjal.com/downloads/AI-Rewrite-Anywhere-Setup.exe'}
                className="btn btn-primary"
                style={{ padding: '12px 24px' }}
              >
                <span>⬇️ Download Installer (.exe)</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>(3.1 MB)</span>
              </a>
              <a
                href={userData.downloads?.zipUrl || 'https://rewriteanywhere.nishantmunjal.com/downloads/installer.zip'}
                className="btn btn-secondary"
                style={{ padding: '12px 18px', fontSize: '0.88rem' }}
              >
                <span>📦 Portable ZIP</span>
              </a>
            </div>
          </div>

          {/* License Keys Section */}
          <div className="dashboard-licenses-section">
            <div className="dashboard-section-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  Your Commercial License Keys
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Each key can be activated on 1 active Windows PC at a time.
                </p>
              </div>
              <span style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-secondary)'
              }}>
                {userData.licenses?.length || 0} Total
              </span>
            </div>

            {!userData.licenses || userData.licenses.length === 0 ? (
              <div style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '36px',
                textAlign: 'center'
              }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 6px' }}>
                  No commercial license keys found associated with <strong style={{ color: 'var(--text-primary)' }}>{userData.email}</strong>.
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 18px' }}>
                  If you purchased with a different email address, sign out and sign in using that email.
                </p>
                <Link
                  href="/#pricing"
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                >
                  Purchase Lifetime License (₹1,600 / $19)
                </Link>
              </div>
            ) : (
              <div>
                {userData.licenses.map((lic) => (
                  <div key={lic.id || lic.licenseKey} className="dashboard-license-item">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span
                          className={`license-status-badge ${
                            lic.status === 'active'
                              ? 'license-status-active'
                              : lic.status === 'revoked'
                              ? 'license-status-revoked'
                              : 'license-status-ready'
                          }`}
                        >
                          {lic.status === 'active'
                            ? 'Active & Bound'
                            : lic.status === 'revoked'
                            ? 'Revoked'
                            : 'Issued / Ready'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Tier: {lic.tier || 'COMMERCIAL'}
                        </span>
                      </div>

                      <div className="license-key-row">
                        <span>{lic.licenseKey}</span>
                        <button
                          type="button"
                          onClick={() => copyKey(lic.licenseKey)}
                          className="license-copy-small-btn"
                        >
                          {copiedKey === lic.licenseKey ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                      <div style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.78rem' }}>Hardware ID (HWID):</div>
                      <div style={{ fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                        {lic.activeMachineId ? (
                          <span style={{ color: 'var(--accent-emerald)' }}>
                            🖥️ {lic.activeMachineId.substring(0, 16)}...
                          </span>
                        ) : (
                          <span style={{ color: 'var(--accent-amber)' }}>Unbound (Ready for PC)</span>
                        )}
                      </div>
                      {lic.createdAt && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Issued: {new Date(lic.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
