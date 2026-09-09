export const metadata = {
  title: 'Terms of Service - AI Rewrite Anywhere',
  description: 'Commercial terms of service for AI Rewrite Anywhere. 1-PC lifetime license, 14-day money-back guarantee, and usage policies.',
};

export default function TermsPage() {
  return (
    <div className="section">
      <div className="container" style={{ maxWidth: '840px' }}>
        <div className="text-center" style={{ marginBottom: '48px' }}>
          <span className="badge" style={{ marginBottom: '14px' }}>Legal & Commercial Agreement</span>
          <h1 className="heading-xl">Terms of Service</h1>
          <p className="subheading">
            Last updated: September 2026. Please read these terms carefully before purchasing or using AI Rewrite Anywhere.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: 1.7 }}>
          <section>
            <h2 className="heading-md" style={{ color: 'var(--accent-primary)' }}>1. License Grant & Single-PC Policy</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Upon payment of the one-time license fee ($19 USD or ₹2,000 INR), AI Rewrite Anywhere grants you a non-exclusive, non-transferable, perpetual license to install and execute the desktop application on <strong>one (1) active Windows personal computer</strong> at any given time.
            </p>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
              Each commercial license key (<kbd>ARW-XXXX-XXXX-XXXX-XXXX</kbd>) is hardware-bound to your PC\'s unique Hardware ID (HWID). If you purchase a new PC or replace system components, you may request a free hardware ID reset by contacting our support team with your proof of purchase. Simultaneous use on multiple active computers is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="heading-md" style={{ color: 'var(--accent-primary)' }}>2. 14-Day Money-Back Guarantee</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              We offer a no-risk <strong>14-day 100% money-back guarantee</strong>. If you are unsatisfied with AI Rewrite Anywhere for any reason within fourteen (14) calendar days of your purchase date, email <a href="mailto:support@rewriteanywhere.com" style={{ color: 'var(--accent-secondary)', textDecoration: 'underline' }}>support@rewriteanywhere.com</a> with your order details. We will deactivate the license key and issue a full refund to your original payment method with no questions asked.
            </p>
          </section>

          <section>
            <h2 className="heading-md" style={{ color: 'var(--accent-primary)' }}>3. Operating Environment</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              AI Rewrite Anywhere is specifically designed and certified solely for <strong>Windows 10 and Windows 11 (64-bit)</strong> environments. The software is neither offered nor supported for macOS, Linux, Android, or iOS.
            </p>
          </section>

          <section>
            <h2 className="heading-md" style={{ color: 'var(--accent-primary)' }}>4. Third-Party AI Services (BYOK)</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              AI Rewrite Anywhere operates on a Bring-Your-Own-Key (BYOK) model. Users supply their own API credentials for third-party AI platforms (Google Gemini, OpenAI, or Anthropic Claude). You agree to abide by the applicable acceptable use policies and terms of service of each respective provider. We do not charge ongoing fees for token consumption and are not liable for third-party API downtime, billing changes, or quota restrictions.
            </p>
          </section>

          <section>
            <h2 className="heading-md" style={{ color: 'var(--accent-primary)' }}>5. Intellectual Property & Prohibited Uses</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              All software binaries, UI designs, codebases, and branding remain the proprietary intellectual property of AI Rewrite Anywhere. You may not reverse-engineer, decompile, redistribute, sublicense, or resell the software or license keys without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="heading-md" style={{ color: 'var(--accent-primary)' }}>6. Disclaimer of Warranties & Limitation of Liability</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              The software is provided &quot;as is&quot; without warranties of any kind, express or implied. Under no circumstances shall AI Rewrite Anywhere be held liable for any incidental, indirect, or consequential damages resulting from the use or inability to use the software.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
