'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';

export default function CheckoutModal({ isOpen, onClose, initialCurrency = 'INR' }) {
  const router = useRouter();
  const [currency, setCurrency] = useState(initialCurrency);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cfLoaded, setCfLoaded] = useState(false);

  useEffect(() => {
    setCurrency(initialCurrency);
  }, [initialCurrency]);

  if (!isOpen) return null;

  const basePrice = currency === 'USD' ? 19 : 1600;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          amount: basePrice,
          currency
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedCoupon(data.data);
      } else {
        setCouponError(data.message || 'Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('Network error while validating coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleProceedPayment = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address to receive your license key.');
      return;
    }

    setSubmitting(true);

    try {
      const orderRes = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Customer',
          email: email.trim().toLowerCase(),
          phone: phone.trim() || '9999999999',
          currency,
          couponCode: appliedCoupon ? appliedCoupon.code : ''
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Failed to initialize payment order');
      }

      // If mock simulation mode
      if (orderData.isMock || !window.Cashfree) {
        // Direct auto-verify in test/simulation mode
        const verifyRes = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: orderData.orderId })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          onClose();
          router.push(`/checkout/success?order_id=${orderData.orderId}`);
          return;
        }
      }

      // Initialize Cashfree Drop / Checkout
      if (window.Cashfree && orderData.paymentSessionId) {
        const cashfree = window.Cashfree({
          mode: 'production' // or sandbox
        });
        cashfree.checkout({
          paymentSessionId: orderData.paymentSessionId,
          redirectTarget: '_self'
        });
      } else {
        // Fallback redirection to success page
        onClose();
        router.push(`/checkout/success?order_id=${orderData.orderId}`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Payment initiation failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="lazyOnload"
        onLoad={() => setCfLoaded(true)}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />

        {/* Modal Window */}
        <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10 text-slate-100">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 shadow-md shadow-amber-500/20">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Lifetime Commercial License</h3>
              <p className="text-xs text-slate-400">Single PC hardware-bound • Free updates included</p>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="mb-5 rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Total Payable
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-white">
                    {currency === 'USD' ? `$${finalPrice}` : `₹${finalPrice.toLocaleString('en-IN')}`}
                  </span>
                  {appliedCoupon && (
                    <span className="text-sm line-through text-slate-500">
                      {currency === 'USD' ? `$${basePrice}` : `₹${basePrice.toLocaleString('en-IN')}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Currency toggle */}
              <div className="flex rounded-lg border border-slate-700 bg-slate-800/80 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('INR');
                    setAppliedCoupon(null);
                  }}
                  className={`rounded px-2.5 py-1 transition ${
                    currency === 'INR' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  INR (₹)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('USD');
                    setAppliedCoupon(null);
                  }}
                  className={`rounded px-2.5 py-1 transition ${
                    currency === 'USD' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>

            {appliedCoupon && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-950/50 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400">
                <span>🎉 Coupon <strong>{appliedCoupon.code}</strong> applied!</span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-red-400 hover:underline font-semibold ml-2"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleProceedPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address <span className="text-amber-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Your license key and login OTP will be delivered here instantly.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mobile (UPI/SMS)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Coupon field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Discount Coupon</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LAUNCH50"
                  disabled={Boolean(appliedCoupon)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-white uppercase placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={couponLoading || !couponCode.trim() || Boolean(appliedCoupon)}
                  onClick={handleApplyCoupon}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-200 transition disabled:opacity-50"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="mt-1 text-xs text-red-400">{couponError}</p>}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-cyan-500 p-[1px] shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 active:scale-[0.99] disabled:opacity-60"
            >
              <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-950/80 px-4 py-3 text-sm font-bold text-white backdrop-blur hover:bg-transparent transition">
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Securing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Pay {currency === 'USD' ? `$${finalPrice}` : `₹${finalPrice.toLocaleString('en-IN')}`}</span>
                    <span className="text-xs font-normal text-slate-300">(Cashfree / UPI / Cards)</span>
                    <span>→</span>
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">🔒 256-Bit SSL Encrypted</span>
            <span>•</span>
            <span>⚡ Instant License Delivery</span>
            <span>•</span>
            <span>14-Day Refund Guarantee</span>
          </div>
        </div>
      </div>
    </>
  );
}
