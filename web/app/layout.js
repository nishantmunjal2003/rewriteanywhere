import './globals.css';
import Navbar from '../components/Navbar';
import BrandIcon from '../components/BrandIcon';

export const metadata = {
  metadataBase: new URL('https://rewriteanywhere.nishantmunjal.com'),
  title: {
    default: 'AI Rewrite Anywhere | Universal Windows AI Text Assistant',
    template: '%s | AI Rewrite Anywhere',
  },
  description:
    'Highlight any text in any Windows app, press Ctrl+Shift+R or click the floating assistant, and rewrite with Google Gemini, OpenAI, or Claude. Lifetime commercial license ($19 USD / ₹1,600 INR) with 14-day money-back guarantee.',
  keywords: [
    'AI Rewrite Anywhere',
    'Windows AI text assistant',
    'in-place text rewriting Windows',
    'Ctrl+Shift+R AI shortcut',
    'Google Gemini Windows desktop',
    'Grammarly alternative lifetime license',
    'Bring your own key AI Windows',
    'ChatGPT shortcut Windows 11',
    'Claude 3.5 Sonnet desktop tool',
    'Windows 10 AI productivity software',
    'AI text rewriter BYOK',
    'desktop writing assistant without subscription',
  ],
  authors: [{ name: 'Nishant Munjal', url: 'https://nishantmunjal.com' }],
  creator: 'Nishant Munjal',
  publisher: 'AI Rewrite Anywhere',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://rewriteanywhere.nishantmunjal.com',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/app_icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.ico',
    apple: '/app_icon.png',
  },
  openGraph: {
    title: 'AI Rewrite Anywhere | Universal Windows AI Text Assistant',
    description:
      'Highlight any text in any Windows app, press Ctrl+Shift+R, and rewrite with Google Gemini (100% Free tier), OpenAI, or Claude. Single $19 lifetime license.',
    url: 'https://rewriteanywhere.nishantmunjal.com',
    siteName: 'AI Rewrite Anywhere',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'AI Rewrite Anywhere - In-Place AI Rewriting in Every Windows Application',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Rewrite Anywhere | Universal Windows AI Text Assistant',
    description:
      'Highlight text in any Windows app, press Ctrl+Shift+R, and rewrite with Gemini, OpenAI, or Claude. Zero recurring subscriptions.',
    creator: '@nishantmunjal',
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
};

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://rewriteanywhere.nishantmunjal.com/#software',
      name: 'AI Rewrite Anywhere',
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'Writing & Productivity',
      operatingSystem: 'Windows 10, Windows 11 (64-bit)',
      description:
        'Universal Windows desktop assistant for instant in-place AI text rewriting, tone polishing, and grammar fixing with Google Gemini, OpenAI, and Anthropic Claude.',
      url: 'https://rewriteanywhere.nishantmunjal.com',
      screenshot: 'https://rewriteanywhere.nishantmunjal.com/og-image.svg',
      softwareVersion: '1.0.0',
      offers: [
        {
          '@type': 'Offer',
          price: '19.00',
          priceCurrency: 'USD',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          category: 'Lifetime Commercial License',
          seller: {
            '@type': 'Organization',
            name: 'AI Rewrite Anywhere',
          },
        },
        {
          '@type': 'Offer',
          price: '1600.00',
          priceCurrency: 'INR',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          category: 'Lifetime Commercial License',
          seller: {
            '@type': 'Organization',
            name: 'AI Rewrite Anywhere',
          },
        },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '128',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Universal in-place text replacement in every Windows application',
        'Customizable global shortcut (Ctrl+Shift+R)',
        'Floating glowing desktop assistant button',
        'Triple AI Provider support (Google Gemini, OpenAI GPT-4o, Anthropic Claude 3.5)',
        'Full support for Google Gemini 100% Free API Tier',
        'Windows DPAPI local encrypted key storage',
        'Hardware-bound single PC lifetime commercial license',
        'Clipboard memory safety snapshot and auto-restore',
      ],
      author: {
        '@type': 'Person',
        name: 'Nishant Munjal',
        url: 'https://nishantmunjal.com',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://rewriteanywhere.nishantmunjal.com/#website',
      url: 'https://rewriteanywhere.nishantmunjal.com',
      name: 'AI Rewrite Anywhere',
      description: 'Instant AI Text Rewriting for Windows 10 & 11',
      publisher: {
        '@type': 'Organization',
        name: 'AI Rewrite Anywhere',
        url: 'https://rewriteanywhere.nishantmunjal.com',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://rewriteanywhere.nishantmunjal.com/#organization',
      name: 'AI Rewrite Anywhere',
      url: 'https://rewriteanywhere.nishantmunjal.com',
      founder: {
        '@type': 'Person',
        name: 'Nishant Munjal',
        url: 'https://nishantmunjal.com',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@rewriteanywhere.com',
        url: 'https://rewriteanywhere.nishantmunjal.com/support',
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Documentation" />
        <link rel="help" href="/how-to-use" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('arw_theme');
                if (saved) {
                  document.documentElement.setAttribute('data-theme', saved);
                } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                  document.documentElement.setAttribute('data-theme', 'light');
                } else {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <Navbar />

        <main>{children}</main>

        <footer className="footer" role="contentinfo">
          <div className="container">
            <div className="footer-grid">
              <div>
                <div className="logo" style={{ marginBottom: '16px' }}>
                  <div className="logo-icon">
                    <BrandIcon size={38} />
                  </div>
                  <span>AI Rewrite Anywhere</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '320px', marginBottom: '16px' }}>
                  The universal Windows desktop assistant that brings state-of-the-art AI rewriting to every application on your PC.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="badge badge-windows" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.401H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.95-1.801"/>
                    </svg>
                    Windows Only &bull; Windows 10 & 11 (64-bit)
                  </span>
                  <span className="badge badge-guarantee">🛡️ 14-Day Money-Back Guarantee</span>
                </div>
              </div>

              <div>
                <h4 className="footer-heading">Product</h4>
                <ul className="footer-links">
                  <li><a href="/#features" className="footer-link">Core Features</a></li>
                  <li><a href="/#simulator" className="footer-link">Interactive Simulator</a></li>
                  <li><a href="/#comparison" className="footer-link">Why Not Subscriptions?</a></li>
                  <li><a href="/#pricing" className="footer-link">Lifetime Pricing</a></li>
                  <li><a href="/#faq" className="footer-link">Frequently Asked Questions</a></li>
                </ul>
              </div>

              <div>
                <h4 className="footer-heading">Documentation</h4>
                <ul className="footer-links">
                  <li><a href="/how-to-use" className="footer-link">Quickstart Guide</a></li>
                  <li><a href="/how-to-use#gemini-guide" className="footer-link">Free Gemini API Guide</a></li>
                  <li><a href="/how-to-use#openai-guide" className="footer-link">OpenAI Setup</a></li>
                  <li><a href="/how-to-use#claude-guide" className="footer-link">Claude Setup</a></li>
                  <li><a href="/how-to-use#license-guide" className="footer-link">License Key Activation</a></li>
                  <li><a href="/llms.txt" className="footer-link" target="_blank">LLM Machine Docs (llms.txt)</a></li>
                </ul>
              </div>

              <div>
                <h4 className="footer-heading">Support & Legal</h4>
                <ul className="footer-links">
                  <li><a href="/support" className="footer-link">Help & Contact Support</a></li>
                  <li><a href="/terms" className="footer-link">Terms of Service</a></li>
                  <li><a href="/privacy" className="footer-link">Privacy Policy</a></li>
                  <li><a href="/admin" className="footer-link">Admin Licensing Portal</a></li>
                  <li><a href="mailto:support@rewriteanywhere.com" className="footer-link">support@rewriteanywhere.com</a></li>
                </ul>
              </div>
            </div>

            <div className="footer-bottom">
              <div>
                © {new Date().getFullYear()} AI Rewrite Anywhere. All rights reserved. Exclusively for Windows 10 & 11.
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <a href="/terms" className="footer-link">Terms</a>
                <a href="/privacy" className="footer-link">Privacy</a>
                <a href="/support" className="footer-link">Refunds</a>
                <a href="/sitemap.xml" className="footer-link">Sitemap</a>
                <a href="/llms.txt" className="footer-link">llms.txt</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
