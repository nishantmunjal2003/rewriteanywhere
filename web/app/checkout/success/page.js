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
          body: JSON.stringify({ orderId })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setDetails(data);
        } else {
          setError(data.message || 'Payment verification failed. If your account was debited, please contact support.');
        }
      } catch (err) {
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
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 w-full">
      {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-4" />
            <h2 className="text-xl font-bold text-white">Verifying Payment & Minting Your License...</h2>
            <p className="text-sm text-slate-400 mt-2">Connecting with Cashfree & ZeptoMail...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-900/60 text-2xl text-red-300">
              ✕
            </div>
            <h2 className="text-2xl font-bold text-white">Payment Status Notice</h2>
            <p className="mt-2 text-red-300 text-sm">{error}</p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                href="/"
                className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
              >
                Back to Home
              </Link>
              <a
                href="mailto:support@rewriteanywhere.com"
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
              >
                Contact Support
              </a>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
            {/* Success badge */}
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl border border-emerald-500/40">
                ✓
              </div>
              <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                Payment Confirmed
              </span>
              <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
                Thank you for your purchase!
              </h1>
              <p className="mt-2 text-slate-400 text-sm">
                Your lifetime commercial license has been activated and sent to{' '}
                <strong className="text-white">{details.email}</strong>.
              </p>
            </div>

            {/* License Key Box */}
            <div className="mb-8 rounded-2xl border-2 border-dashed border-indigo-500/50 bg-indigo-950/40 p-6 text-center">
              <div className="text-xs uppercase font-bold tracking-widest text-indigo-400 mb-2">
                Your Lifetime Commercial License Key
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-amber-400 tracking-wider select-all break-all py-2">
                {details.licenseKey}
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={copyLicense}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-lg transition active:scale-95"
                >
                  {copied ? '✓ Copied to Clipboard!' : '📋 Copy License Key'}
                </button>
              </div>
            </div>

            {/* Download Application Call-To-Action */}
            <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/60 p-6 text-center">
              <h2 className="text-lg font-bold text-white mb-2">Step 1: Download & Install AI Rewrite Anywhere</h2>
              <p className="text-xs text-slate-400 mb-5">
                Compatible with Windows 10 and 11 (64-bit). No cloud dependencies.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                <a
                  href="https://rewriteanywhere.nishantmunjal.com/downloads/AI-Rewrite-Anywhere-Setup.exe"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:scale-105"
                >
                  <span>⬇️ Download Windows Installer (.exe)</span>
                  <span className="text-xs text-amber-200 font-normal">(3.1 MB)</span>
                </a>
                <a
                  href="https://rewriteanywhere.nishantmunjal.com/downloads/installer.zip"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-5 py-3 text-xs font-medium text-slate-300 transition"
                >
                  <span>📦 Portable ZIP (.zip)</span>
                </a>
              </div>
            </div>

            {/* Activation Guide */}
            <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>🚀 Quick Activation Guide (30 Seconds)</span>
              </h3>
              <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                <li>Run <strong>AI-Rewrite-Anywhere-Setup.exe</strong> on your Windows PC.</li>
                <li>Find the glowing <strong>⚡ icon in your Windows System Tray</strong> (near the taskbar clock).</li>
                <li>Right-click the tray icon and select <strong>Settings → License</strong>.</li>
                <li>Paste your license key: <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded">{details.licenseKey}</code> and click <strong>Activate</strong>.</li>
                <li>Select any text in Chrome, Slack, Notion, Word or Outlook and press <strong>Ctrl+Shift+R</strong>!</li>
              </ol>
            </div>

            {/* Customer Dashboard Link */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 pt-6 text-xs text-slate-400 gap-4">
              <div>
                Order ID: <span className="text-slate-300 font-mono">{details.orderId}</span>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          Loading order details...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
