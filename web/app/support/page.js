'use client';

import { useState } from 'react';

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    licenseKey: '',
    issueType: 'general',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: '840px' }}>
        <div className="text-center" style={{ marginBottom: '48px' }}>
          <span className="badge" style={{ marginBottom: '14px' }}>Customer Care & Tech Support</span>
          <h1 className="heading-xl">How Can We Help You?</h1>
          <p className="subheading">
            Need help with license activation, moving to a new Windows PC, or setting up API keys? We respond within 12 hours.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--accent-primary)' }}>
              🛡️ 14-Day Money-Back Guarantee
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              If you are unsatisfied for any reason within 14 days of purchase, send us your license key or order number and we will process a 100% full refund immediately.
            </p>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--accent-secondary)' }}>
              🔄 Switching to a New Windows PC?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Each license key is bound to 1 active PC hardware ID. If you bought a new computer or replaced your motherboard, let us know your license key and we will reset your binding free of charge.
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: '36px' }}>
          {submitted ? (
            <div className="text-center" style={{ padding: '32px 16px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
              <h2 className="heading-md">Support Request Received</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Thank you, {formData.name || 'valued customer'}. Our engineering team has received your ticket and will follow up at <strong>{formData.email}</strong> shortly.
              </p>
              <a href="/" className="btn btn-primary">
                Return to Home
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 className="heading-md" style={{ marginBottom: '4px' }}>Send Us a Message</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '16px' }}>
                Or contact us directly via email at <a href="mailto:nishant.eth2@gmail.com" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>nishant.eth2@gmail.com</a>.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    License Key (if purchased)
                  </label>
                  <input
                    type="text"
                    value={formData.licenseKey}
                    onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                    placeholder="ARW-XXXX-XXXX-XXXX-XXXX"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Topic
                  </label>
                  <select
                    value={formData.issueType}
                    onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="general">General Inquiry</option>
                    <option value="license_reset">Hardware ID / Device Reset</option>
                    <option value="refund">14-Day Refund Request</option>
                    <option value="api_setup">API Key Assistance (Gemini/OpenAI/Claude)</option>
                    <option value="bug">Windows Desktop Bug Report</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  How can we help?
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  placeholder="Describe your question or issue in detail..."
                />
              </div>

              <button type="submit" className="btn btn-primary btn-large">
                Submit Support Request →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
