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
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 w-full">
      {authStage === 'CHECKING' && (
          <div className="text-center py-24">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-4" />
            <p className="text-sm text-slate-400">Loading customer portal...</p>
          </div>
        )}

        {/* LOGIN FORM: ENTER EMAIL */}
        {authStage === 'ENTER_EMAIL' && (
          <div className="max-w-md mx-auto rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 shadow-inner">
                <BrandIcon className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-white">Customer Dashboard</h1>
              <p className="mt-1 text-xs text-slate-400">
                Access your purchased license keys, hardware bindings & updated software downloads.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-950/50 border border-red-500/30 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Purchase Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  We will send a 6-digit one-time code to verify your identity. No password needed.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition disabled:opacity-60"
              >
                {loading ? 'Sending Code...' : 'Send Verification Code →'}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
              Need to purchase a license?{' '}
              <Link href="/#pricing" className="text-indigo-400 hover:underline font-semibold">
                Get Lifetime License
              </Link>
            </div>
          </div>
        )}

        {/* LOGIN FORM: ENTER OTP */}
        {authStage === 'ENTER_OTP' && (
          <div className="max-w-md mx-auto rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-2xl text-indigo-400">
                ✉️
              </div>
              <h2 className="text-2xl font-black text-white">Enter Verification Code</h2>
              <p className="mt-1 text-xs text-slate-400">
                We sent a 6-digit code to <strong className="text-slate-200">{email}</strong>
              </p>
            </div>

            {message && (
              <div className="mb-4 rounded-xl bg-indigo-950/50 border border-indigo-500/30 p-3 text-xs text-indigo-300">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-xl bg-red-950/50 border border-red-500/30 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-[12px] font-mono text-2xl font-bold rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition disabled:opacity-60"
              >
                {loading ? 'Verifying...' : 'Verify Code & Sign In →'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setAuthStage('ENTER_EMAIL')}
                className="hover:text-white transition"
              >
                ← Change Email
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="text-indigo-400 hover:underline font-semibold"
              >
                Resend Code
              </button>
            </div>
          </div>
        )}

        {/* AUTHENTICATED CUSTOMER DASHBOARD */}
        {authStage === 'AUTHENTICATED' && userData && (
          <div className="space-y-8">
            {/* Top user bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Customer Account
                </span>
                <h1 className="text-2xl font-black text-white mt-1">{userData.email}</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Single PC hardware binding active • Free lifetime updates included
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/#pricing"
                  className="rounded-xl border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/40 px-4 py-2 text-xs font-semibold text-indigo-300 transition"
                >
                  + Buy Another License
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Software Downloads Card */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="inline-block rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
                    Latest Windows Release • {userData.downloads?.version || 'v1.0.0-PROD'}
                  </span>
                  <h2 className="text-xl font-bold text-white">Download AI Rewrite Anywhere</h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Run anywhere across Windows 10 & 11. Press <strong>Ctrl+Shift+R</strong> in any app (Chrome, Word, Slack, Notion) to rewrite instantly in place.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={userData.downloads?.exeUrl || 'https://rewriteanywhere.nishantmunjal.com/downloads/AI-Rewrite-Anywhere-Setup.exe'}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:scale-105"
                  >
                    <span>⬇️ Download Installer (.exe)</span>
                    <span className="text-xs text-amber-200">(3.1 MB)</span>
                  </a>
                  <a
                    href={userData.downloads?.zipUrl || 'https://rewriteanywhere.nishantmunjal.com/downloads/installer.zip'}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-4 py-3 text-xs font-medium text-slate-300 transition"
                  >
                    <span>📦 Portable ZIP</span>
                  </a>
                </div>
              </div>
            </div>

            {/* License Keys Section */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Your Commercial License Keys</h2>
                  <p className="text-xs text-slate-400">
                    Each key can be activated on 1 active Windows PC at a time.
                  </p>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                  {userData.licenses?.length || 0} Total
                </span>
              </div>

              {!userData.licenses || userData.licenses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
                  <p className="text-slate-400 text-sm">
                    No commercial license keys found associated with <strong>{userData.email}</strong>.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    If you purchased with a different email address, sign out and sign in using that email.
                  </p>
                  <Link
                    href="/#pricing"
                    className="mt-4 inline-block rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white transition"
                  >
                    Purchase Lifetime License (₹2,000 / $19)
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userData.licenses.map((lic) => (
                    <div
                      key={lic.id || lic.licenseKey}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition hover:border-slate-700"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                lic.status === 'active'
                                  ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                                  : lic.status === 'revoked'
                                  ? 'bg-red-950 border border-red-500/40 text-red-400'
                                  : 'bg-indigo-950 border border-indigo-500/40 text-indigo-400'
                              }`}
                            >
                              {lic.status === 'active'
                                ? 'Active & Bound'
                                : lic.status === 'revoked'
                                ? 'Revoked'
                                : 'Issued / Ready'}
                            </span>
                            <span className="text-xs text-slate-400">
                              Tier: {lic.tier || 'COMMERCIAL'}
                            </span>
                          </div>

                          {/* License Key with Copy Button */}
                          <div className="flex items-center gap-3 font-mono text-lg sm:text-xl font-bold text-amber-400 tracking-wider">
                            <span>{lic.licenseKey}</span>
                            <button
                              type="button"
                              onClick={() => copyKey(lic.licenseKey)}
                              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1 text-xs font-sans font-semibold text-slate-200 transition"
                            >
                              {copiedKey === lic.licenseKey ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        {/* Machine binding status */}
                        <div className="text-left sm:text-right text-xs">
                          <div className="text-slate-400 font-medium">Hardware ID (HWID):</div>
                          <div className="font-mono text-slate-300 mt-0.5">
                            {lic.activeMachineId ? (
                              <span className="text-emerald-400">
                                🖥️ {lic.activeMachineId.substring(0, 16)}...
                              </span>
                            ) : (
                              <span className="text-amber-400/80">Unbound (Ready for PC)</span>
                            )}
                          </div>
                          {lic.createdAt && (
                            <div className="text-[11px] text-slate-400 mt-1">
                              Issued: {new Date(lic.createdAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
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
