'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import BrandIcon from './BrandIcon';

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

      // If free license (100% discount coupon)
      if (orderData.isFree || orderData.orderAmount === 0) {
        onClose();
        router.push(`/checkout/success?order_id=${orderData.orderId}`);
        return;
      }

      // If mock simulation mode (only when explicitly mock)
      if (orderData.isMock) {
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

      // Initialize Cashfree Production Checkout
      if (orderData.paymentSessionId) {
        const launchCheckout = () => {
          if (typeof window !== 'undefined' && window.Cashfree) {
            const cashfree = window.Cashfree({
              mode: 'production'
            });
            cashfree.checkout({
              paymentSessionId: orderData.paymentSessionId,
              redirectTarget: '_self'
            });
            return true;
          }
          return false;
        };

        if (!launchCheckout()) {
          // If SDK hasn't finished loading yet, dynamically wait for it
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (launchCheckout() || attempts > 20) {
              clearInterval(interval);
              if (attempts > 20) {
                setError('Payment gateway SDK loading timed out. Please refresh and try again.');
                setSubmitting(false);
              }
            }
          }, 200);
        }
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
        strategy="afterInteractive"
        onLoad={() => setCfLoaded(true)}
      />

      <div
        className="modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Window */}
        <div className="modal-dialog">
          {/* Close button */}
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal"
          >
            ✕
          </button>

          <div className="modal-header">
            <div className="modal-header-icon">
              <BrandIcon size={44} />
            </div>
            <div>
              <h3 className="modal-title">Lifetime Commercial License</h3>
              <p className="modal-subtitle">Single PC hardware-bound • Free updates included</p>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="modal-price-box">
            <div className="modal-price-row">
              <div>
                <span className="modal-price-label">
                  Total Payable
                </span>
                <div className="modal-price-val">
                  <span className="modal-amount">
                    {currency === 'USD' ? `$${finalPrice}` : `₹${finalPrice.toLocaleString('en-IN')}`}
                  </span>
                  {appliedCoupon && (
                    <span className="modal-strikethrough">
                      {currency === 'USD' ? `$${basePrice}` : `₹${basePrice.toLocaleString('en-IN')}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Currency toggle */}
              <div className="currency-toggle-group">
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('INR');
                    setAppliedCoupon(null);
                  }}
                  className={`currency-btn ${currency === 'INR' ? 'active' : ''}`}
                >
                  INR (₹)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('USD');
                    setAppliedCoupon(null);
                  }}
                  className={`currency-btn ${currency === 'USD' ? 'active' : ''}`}
                >
                  USD ($)
                </button>
              </div>
            </div>

            {appliedCoupon && (
              <div className="modal-coupon-banner">
                <span>🎉 Coupon <strong>{appliedCoupon.code}</strong> applied!</span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="modal-coupon-remove"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="modal-alert-error">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleProceedPayment} className="modal-form">
            <div className="modal-field">
              <label className="modal-field-label">
                Email Address <span style={{ color: 'var(--accent-amber)' }}>*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="modal-input"
              />
              <p className="modal-field-hint">
                Your license key and login OTP will be delivered here instantly.
              </p>
            </div>

            <div className="modal-grid-2">
              <div className="modal-field">
                <label className="modal-field-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="modal-input"
                />
              </div>
              <div className="modal-field">
                <label className="modal-field-label">Mobile (UPI/SMS)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="modal-input"
                />
              </div>
            </div>

            {/* Coupon field */}
            <div className="modal-field">
              <label className="modal-field-label">Discount Coupon</label>
              <div className="modal-coupon-row">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LAUNCH50"
                  disabled={Boolean(appliedCoupon)}
                  className="modal-input"
                  style={{ textTransform: 'uppercase' }}
                />
                <button
                  type="button"
                  disabled={couponLoading || !couponCode.trim() || Boolean(appliedCoupon)}
                  onClick={handleApplyCoupon}
                  className="modal-coupon-btn"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && (
                <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px' }}>
                  {couponError}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="modal-submit-btn"
            >
              {submitting ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{finalPrice === 0 ? 'Activating License...' : 'Securing Payment...'}</span>
                </>
              ) : (
                <>
                  <span>
                    {finalPrice === 0
                      ? 'Claim Free License'
                      : `Pay ${currency === 'USD' ? `$${finalPrice}` : `₹${finalPrice.toLocaleString('en-IN')}`}`}
                  </span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="modal-trust-footer">
            <span>🔒 256-Bit SSL Encrypted</span>
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
