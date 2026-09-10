'use client';

import { useState, useEffect } from 'react';
import BrandIcon from '../../components/BrandIcon';

const AUTHORIZED_EMAIL = 'nishantmunjal2003@gmail.com';
const DEFAULT_GOOGLE_CLIENT_ID = '698709002321-lhmhulia304qiqqj55lhehk5tn70k753.apps.googleusercontent.com';

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  // Google OAuth Client ID setup
  const [activeGoogleClientId, setActiveGoogleClientId] = useState('');
  const [customClientId, setCustomClientId] = useState('');
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);

  const [licenses, setLicenses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Tab & Coupon States
  const [activeTab, setActiveTab] = useState('licenses'); // 'licenses' | 'coupons' | 'settings'
  const [coupons, setCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('percentage');
  const [couponValue, setCouponValue] = useState('20');
  const [couponMaxUses, setCouponMaxUses] = useState('');
  const [couponExpires, setCouponExpires] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Issue Key Form State
  const [issueTier, setIssueTier] = useState('USD_19');
  const [issueEmail, setIssueEmail] = useState('');
  const [issueCustomerName, setIssueCustomerName] = useState('');
  const [issueNotes, setIssueNotes] = useState('');
  const [issueInitialHwid, setIssueInitialHwid] = useState('');
  const [createdLicense, setCreatedLicense] = useState(null);

  // Quick Release State
  const [releaseInput, setReleaseInput] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Helper for authenticated fetch with credentials (cookie) and Bearer token
  const authFetch = async (url, options = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('arw_admin_token') : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (res.status === 401 || res.status === 403) {
      setIsAuthenticated(false);
      setAdminUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('arw_admin_token');
      }
    }

    return res;
  };

  // 1. Initialize Client ID & Check Session on mount
  useEffect(() => {
    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const storedClientId = localStorage.getItem('arw_google_client_id') || '';
    const selectedClientId = envClientId || storedClientId || DEFAULT_GOOGLE_CLIENT_ID;
    setActiveGoogleClientId(selectedClientId);
    if (storedClientId) {
      setCustomClientId(storedClientId);
    }

    checkSession();
  }, []);

  const checkSession = async () => {
    setIsInitializing(true);
    try {
      const res = await authFetch('/api/admin/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          setAdminUser(data.user);
          loadLicenses();
        } else {
          setIsAuthenticated(false);
          setAdminUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setAdminUser(null);
      }
    } catch (err) {
      console.error('Session check failed:', err);
      setIsAuthenticated(false);
    } finally {
      setIsInitializing(false);
    }
  };

  // 2. Load Google Identity Services Script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.google?.accounts?.id) {
      setIsGoogleScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGoogleScriptLoaded(true);
    };
    script.onerror = () => {
      setAuthError('Failed to load Google Sign-In SDK. Please check your network connection.');
    };
    document.body.appendChild(script);
  }, []);

  // 3. Render Google Sign-In button when script & client ID are ready
  useEffect(() => {
    if (!isAuthenticated && activeGoogleClientId && isGoogleScriptLoaded && !isInitializing) {
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: activeGoogleClientId,
            callback: handleGoogleCallback,
            auto_select: false
          });

          const btnEl = document.getElementById('googleSignInBtn');
          if (btnEl) {
            btnEl.innerHTML = '';
            window.google.accounts.id.renderButton(btnEl, {
              theme: 'filled_blue',
              size: 'large',
              type: 'standard',
              shape: 'pill',
              text: 'signin_with',
              logo_alignment: 'left',
              width: 320
            });
          }
        }
      } catch (err) {
        console.error('Google Sign-In render error:', err);
      }
    }
  }, [isAuthenticated, activeGoogleClientId, isGoogleScriptLoaded, isInitializing]);

  const handleGoogleCallback = async (response) => {
    if (!response || !response.credential) {
      setAuthError('Google sign in did not return valid credentials.');
      return;
    }

    setLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminUser(data.user);
        if (data.token) {
          localStorage.setItem('arw_admin_token', data.token);
        }
        showToast(`Signed in as ${data.user.email}`);
        loadLicenses();
      } else {
        setIsAuthenticated(false);
        setAuthError(data.message || 'Access denied: Account is not authorized.');
      }
    } catch (err) {
      setAuthError('Network error connecting to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomClientId = (e) => {
    e.preventDefault();
    const cleanId = customClientId.trim();
    if (!cleanId) {
      setAuthError('Please enter a valid Google OAuth Client ID.');
      return;
    }
    localStorage.setItem('arw_google_client_id', cleanId);
    setActiveGoogleClientId(cleanId);
    setAuthError('');
    showToast('Google Client ID configured.');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('arw_admin_token');
    localStorage.removeItem('arw_admin_passcode');
    setIsAuthenticated(false);
    setAdminUser(null);
    setLicenses([]);
    showToast('Logged out of Admin Portal.');
  };

  const loadLicenses = async () => {
    try {
      const res = await authFetch('/api/admin/licenses');
      if (res.ok) {
        const data = await res.json();
        setLicenses(data.licenses || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLicenses = async () => {
    try {
      const res = await authFetch(`/api/admin/licenses?search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setLicenses(data.licenses || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await authFetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim() || !couponValue) return;
    setCouponLoading(true);
    try {
      const res = await authFetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: couponCode.trim(),
          discountType: couponType,
          discountValue: parseFloat(couponValue),
          maxUses: couponMaxUses ? parseInt(couponMaxUses, 10) : null,
          expiresAt: couponExpires ? new Date(couponExpires).toISOString() : null
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Coupon saved successfully!');
        setCouponCode('');
        setCouponValue('20');
        setCouponMaxUses('');
        setCouponExpires('');
        fetchCoupons();
      } else {
        showToast(data.message || 'Failed to save coupon.', 'error');
      }
    } catch (err) {
      showToast('Error saving coupon.', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleDeleteCoupon = async (code) => {
    if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    try {
      const res = await authFetch(`/api/admin/coupons?code=${encodeURIComponent(code)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Coupon ${code} deleted.`);
        fetchCoupons();
      } else {
        showToast(data.message || 'Failed to delete coupon.', 'error');
      }
    } catch (err) {
      showToast('Error deleting coupon.', 'error');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const timeout = setTimeout(() => {
        fetchLicenses();
      }, 250);
      return () => clearTimeout(timeout);
    }
  }, [searchQuery]);

  // Issue License
  const handleIssueKey = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/licenses', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          tier: issueTier,
          email: issueEmail,
          customerName: issueCustomerName,
          notes: issueNotes,
          initialHwid: issueInitialHwid
        })
      });

      const data = await res.json();
      if (data.success) {
        setCreatedLicense(data.license);
        showToast(`Key ${data.license.licenseKey} generated successfully!`);
        setIssueEmail('');
        setIssueCustomerName('');
        setIssueNotes('');
        setIssueInitialHwid('');
        fetchLicenses();
      } else {
        showToast(data.message || 'Failed to issue key.', 'error');
      }
    } catch (err) {
      showToast('Network error while issuing key.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick Release by HWID or License Key
  const handleQuickRelease = async (e) => {
    e.preventDefault();
    if (!releaseInput.trim()) return;

    setIsReleasing(true);
    const isHwid = releaseInput.trim().toUpperCase().startsWith('HWID-');

    try {
      const res = await authFetch('/api/admin/licenses', {
        method: 'POST',
        body: JSON.stringify({
          action: 'release',
          licenseKey: isHwid ? null : releaseInput.trim(),
          hwid: isHwid ? releaseInput.trim() : null,
          reason: 'Quick Release via Admin Panel'
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setReleaseInput('');
        fetchLicenses();
      } else {
        showToast(data.message || 'Could not find matching key or HWID.', 'error');
      }
    } catch (err) {
      showToast('Error executing release action.', 'error');
    } finally {
      setIsReleasing(false);
    }
  };

  // Row Action: Release Key
  const handleReleaseRow = async (licenseKey) => {
    if (!confirm(`Are you sure you want to release the hardware binding for ${licenseKey}? The customer will be able to activate it on a new PC.`)) {
      return;
    }

    try {
      const res = await authFetch('/api/admin/licenses', {
        method: 'POST',
        body: JSON.stringify({ action: 'release', licenseKey })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchLicenses();
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Failed to release hardware binding.', 'error');
    }
  };

  // Row Action: Revoke Key
  const handleRevokeRow = async (licenseKey) => {
    const reason = prompt(`Enter reason for revoking ${licenseKey} (e.g., 14-day refund issued):`, '14-Day Full Refund Processed');
    if (reason === null) return;

    try {
      const res = await authFetch('/api/admin/licenses', {
        method: 'POST',
        body: JSON.stringify({ action: 'revoke', licenseKey, reason })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchLicenses();
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Failed to revoke license.', 'error');
    }
  };

  // Copy helper
  const copyToClipboard = (text, label = 'Copied!') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard.`);
  };

  // Filtered list
  const filteredLicenses = licenses.filter((l) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return l.status === 'active' && l.activeMachineId;
    if (filterStatus === 'unactivated') return l.status === 'unactivated' || !l.activeMachineId;
    if (filterStatus === 'revoked') return l.status === 'revoked';
    return true;
  });

  // Stats calculation
  const totalCount = licenses.length;
  const activeCount = licenses.filter((l) => l.status === 'active' && l.activeMachineId).length;
  const availableCount = licenses.filter((l) => l.status === 'unactivated' || !l.activeMachineId).length;
  const revokedCount = licenses.filter((l) => l.status === 'revoked').length;

  // Unauthenticated Login Screen
  if (!isAuthenticated) {
    if (isInitializing) {
      return (
        <div className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>⚡</span>
            <span>Verifying administrative session...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '460px' }}>
          <div className="card" style={{ padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)' }}>
            <div className="text-center" style={{ marginBottom: '28px' }}>
              <div className="logo-icon" style={{ margin: '0 auto 16px', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BrandIcon size={28} />
              </div>
              <h1 className="heading-md" style={{ marginBottom: '8px' }}>License Administration</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Access is restricted to the authorized administrator.
              </p>
            </div>

            {authError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '20px', lineHeight: '1.4' }}>
                {authError}
              </div>
            )}

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '6px' }}>
                Authorized Administrator
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 600, fontSize: '0.95rem' }}>
                <span>🔒</span>
                <span>{AUTHORIZED_EMAIL}</span>
              </div>
            </div>

            {/* Google Sign-In Button Container */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
              {activeGoogleClientId ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div id="googleSignInBtn" style={{ minHeight: '44px', display: 'flex', justifyContent: 'center', width: '100%' }}></div>
                  {loading && (
                    <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Authenticating Google credentials...
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: '100%', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Google OAuth Web Client ID
                  </label>
                  <input
                    type="text"
                    value={customClientId}
                    onChange={(e) => setCustomClientId(e.target.value)}
                    placeholder="Enter Client ID (...apps.googleusercontent.com)"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(10, 13, 20, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      marginBottom: '10px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleSaveCustomClientId}
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '0.88rem' }}
                  >
                    Configure Google Client ID →
                  </button>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '8px', lineHeight: '1.4' }}>
                    Or set <code style={{ color: '#38bdf8' }}>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in your server environment variables.
                  </p>
                </div>
              )}
            </div>

            {activeGoogleClientId && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={() => {
                    localStorage.removeItem('arw_google_client_id');
                    setActiveGoogleClientId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '');
                    setCustomClientId('');
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Configure a different Google Client ID
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section" style={{ padding: '48px 0' }}>
      <div className="container">
        {/* Toast Notification */}
        {notification && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
              color: '#ffffff',
              padding: '14px 20px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              fontWeight: 600,
              fontSize: '0.92rem'
            }}
          >
            {notification.msg}
          </div>
        )}

        {/* Dashboard Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-windows">Admin Control Panel</span>
              <span className="badge badge-guarantee">Google Verified</span>
            </div>
            <h1 className="heading-lg" style={{ marginTop: '8px', marginBottom: '4px' }}>
              Product Key & Hardware ID Administration
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Issue commercial licenses, release hardware locks, and manage single-PC bindings.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {adminUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
                {adminUser.picture ? (
                  <img src={adminUser.picture} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                ) : (
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>
                    {adminUser.name?.[0] || 'N'}
                  </span>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{adminUser.name || 'Admin'}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{adminUser.email}</span>
                </div>
              </div>
            )}
            <button onClick={fetchLicenses} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
              🔄 Refresh
            </button>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.88rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '32px', paddingBottom: '4px' }}>
          <button
            onClick={() => setActiveTab('licenses')}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              background: activeTab === 'licenses' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'licenses' ? '#ffffff' : 'var(--text-muted)',
              borderBottom: activeTab === 'licenses' ? '2px solid var(--accent-primary)' : '2px solid transparent'
            }}
          >
            🔑 Licenses & Devices ({totalCount})
          </button>
          <button
            onClick={() => {
              setActiveTab('coupons');
              fetchCoupons();
            }}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              background: activeTab === 'coupons' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'coupons' ? '#ffffff' : 'var(--text-muted)',
              borderBottom: activeTab === 'coupons' ? '2px solid var(--accent-primary)' : '2px solid transparent'
            }}
          >
            🎟️ Discount Coupons ({coupons.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              background: activeTab === 'settings' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'settings' ? '#ffffff' : 'var(--text-muted)',
              borderBottom: activeTab === 'settings' ? '2px solid var(--accent-primary)' : '2px solid transparent'
            }}
          >
            ⚙️ Gateway & API Settings
          </button>
        </div>

        {activeTab === 'licenses' && (
          <>
            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '36px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Issued Keys
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '6px', color: '#ffffff' }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Database records
            </div>
          </div>

          <div className="card" style={{ padding: '24px', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Bound Devices
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '6px', color: '#34d399' }}>
              {activeCount}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Currently locked to a PC HWID
            </div>
          </div>

          <div className="card" style={{ padding: '24px', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Available / Unbound Keys
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '6px', color: '#a5b4fc' }}>
              {availableCount}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Ready for customer activation
            </div>
          </div>

          <div className="card" style={{ padding: '24px', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <span style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 600, textTransform: 'uppercase' }}>
              Revoked / Refunded
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '6px', color: '#f87171' }}>
              {revokedCount}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Blocked from further use
            </div>
          </div>
        </div>

        {/* Action Panel: Quick Release by Hardware Key & Issue New Key */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '40px' }}>
          {/* Box 1: Quick Release by Hardware Key */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🔓</span>
                <h2 className="heading-md" style={{ margin: 0 }}>Release Hardware Lock</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Customer formatted their PC or bought a new laptop? Paste their <strong>Hardware ID (HWID)</strong> or <strong>License Key</strong> below to unlock the key immediately.
              </p>

              <form onSubmit={handleQuickRelease} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Hardware Key (HWID-XXXX...) OR Product Key (ARW-XXXX...)
                  </label>
                  <input
                    type="text"
                    required
                    value={releaseInput}
                    onChange={(e) => setReleaseInput(e.target.value)}
                    placeholder="e.g. HWID-A4F2-81B3-99E0-47CD or ARW-..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(10, 13, 20, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isReleasing}
                  className="btn btn-secondary"
                  style={{
                    background: 'rgba(6, 182, 212, 0.15)',
                    borderColor: 'rgba(6, 182, 212, 0.4)',
                    color: '#67e8f9',
                    fontWeight: 600
                  }}
                >
                  {isReleasing ? 'Releasing Binding...' : '🔓 Release Hardware Binding Now'}
                </button>
              </form>
            </div>

            <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              💡 <strong>Tip:</strong> When released, the active machine ID is erased (`null`), and the key can be activated on the customer\'s new computer without issuing a new order.
            </div>
          </div>

          {/* Box 2: Issue New Product Key */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>✨</span>
              <h2 className="heading-md" style={{ margin: 0 }}>Issue New Product Key</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Generate a unique, cryptographically random key formatted as <kbd>ARW-XXXX-XXXX-XXXX-XXXX</kbd>.
            </p>

            <form onSubmit={handleIssueKey} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Pricing Tier
                  </label>
                  <select
                    value={issueTier}
                    onChange={(e) => setIssueTier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(10, 13, 20, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="USD_19">$19 USD (International Lifetime)</option>
                    <option value="INR_1600">₹1,600 INR (India Special Lifetime)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Customer Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={issueEmail}
                    onChange={(e) => setIssueEmail(e.target.value)}
                    placeholder="user@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(10, 13, 20, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Customer Name / Org
                  </label>
                  <input
                    type="text"
                    value={issueCustomerName}
                    onChange={(e) => setIssueCustomerName(e.target.value)}
                    placeholder="Dr. Nishant Munjal"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(10, 13, 20, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Pre-Bind HWID (Optional)
                  </label>
                  <input
                    type="text"
                    value={issueInitialHwid}
                    onChange={(e) => setIssueInitialHwid(e.target.value)}
                    placeholder="Leave empty for auto-bind on first use"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(10, 13, 20, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                {loading ? 'Generating Key...' : '⚡ Generate & Issue Commercial Key'}
              </button>
            </form>

            {/* Newly Created Key Alert Box */}
            {createdLicense && (
              <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', color: '#a5b4fc', marginBottom: '6px', fontWeight: 600 }}>
                  Generated Product Key:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <code style={{ fontSize: '1.15rem', color: '#ffffff', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {createdLicense.licenseKey}
                  </code>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => copyToClipboard(createdLicense.licenseKey, 'License Key')}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                      Copy Key
                    </button>
                    <button
                      onClick={() => {
                        const emailSnippet = `Hi ${createdLicense.customerName || 'there'},\n\nThank you for purchasing AI Rewrite Anywhere!\n\nHere is your lifetime commercial product key:\n${createdLicense.licenseKey}\n\nPrice: ${createdLicense.price}\nEnvironment: Windows 10 & 11 (64-bit)\nPolicy: 1 Active Windows PC\nGuarantee: 14-Day Money-Back Guarantee\n\nHow to activate:\n1. Open AI Rewrite Anywhere on your Windows PC.\n2. Right-click the tray icon -> Settings -> License & Protection.\n3. Paste your key and click Activate License.\n\nEnjoy rewriting!\nAI Rewrite Anywhere Team`;
                        copyToClipboard(emailSnippet, 'Customer Email Template');
                      }}
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                      Copy Email Template
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* License Database Table */}
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <h2 className="heading-md" style={{ margin: 0 }}>License Catalog & HWID Records</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Showing {filteredLicenses.length} of {totalCount} total keys
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Search Bar */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search key, HWID, email, name..."
                style={{
                  padding: '8px 14px',
                  background: 'rgba(10, 13, 20, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  minWidth: '260px'
                }}
              />

              {/* Status Filter */}
              <div style={{ display: 'flex', background: 'rgba(10, 13, 20, 0.8)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', padding: '3px' }}>
                {['all', 'active', 'unactivated', 'revoked'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: filterStatus === st ? 'var(--accent-primary)' : 'transparent',
                      color: filterStatus === st ? '#ffffff' : 'var(--text-muted)'
                    }}
                  >
                    {st === 'all' ? 'All' : st === 'active' ? 'Active' : st === 'unactivated' ? 'Available' : 'Revoked'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper" style={{ margin: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product License Key</th>
                  <th>Customer Info</th>
                  <th>Tier</th>
                  <th>Bound Hardware ID (HWID)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No license records found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLicenses.map((lic) => {
                    const isBound = lic.activeMachineId && lic.status === 'active';
                    return (
                      <tr key={lic.licenseKey}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                              {lic.licenseKey}
                            </code>
                            <button
                              title="Copy License Key"
                              onClick={() => copyToClipboard(lic.licenseKey, 'License Key')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                fontSize: '0.9rem'
                              }}
                            >
                              📋
                            </button>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Issued: {new Date(lic.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td>
                          {lic.customerName && <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{lic.customerName}</div>}
                          {lic.assignedEmail ? (
                            <a href={`mailto:${lic.assignedEmail}`} style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>
                              {lic.assignedEmail}
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Unassigned</span>
                          )}
                        </td>

                        <td>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {lic.price || (lic.tier?.startsWith('INR') ? '₹1,600 INR' : '$19 USD')}
                          </span>
                        </td>

                        <td>
                          {lic.activeMachineId ? (
                            <div>
                              <code style={{ fontSize: '0.85rem', color: '#7dd3fc', background: 'rgba(14, 165, 233, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                {lic.activeMachineId}
                              </code>
                              {lic.activatedAt && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  Activated: {new Date(lic.activatedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              Not bound to any PC
                            </span>
                          )}
                        </td>

                        <td>
                          {lic.status === 'revoked' ? (
                            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: '#f87171' }}>
                              Revoked
                            </span>
                          ) : isBound ? (
                            <span className="badge badge-guarantee">
                              Active (1 PC)
                            </span>
                          ) : (
                            <span className="badge badge-windows">
                              Available
                            </span>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                            {lic.activeMachineId && lic.status !== 'revoked' && (
                              <button
                                onClick={() => handleReleaseRow(lic.licenseKey)}
                                title="Release HWID binding so user can activate on another PC"
                                className="btn btn-secondary"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.8rem',
                                  borderColor: 'rgba(6, 182, 212, 0.4)',
                                  color: '#67e8f9'
                                }}
                              >
                                🔓 Release HWID
                              </button>
                            )}

                            {lic.status !== 'revoked' && (
                              <button
                                onClick={() => handleRevokeRow(lic.licenseKey)}
                                title="Revoke key (e.g. for refund)"
                                className="btn btn-secondary"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.8rem',
                                  borderColor: 'rgba(239, 68, 68, 0.3)',
                                  color: '#fca5a5'
                                }}
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Coupons Management Tab */}
      {activeTab === 'coupons' && (
        <div>
          {/* Create Coupon Card & Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '36px' }}>
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🎟️</span>
                <h2 className="heading-md" style={{ margin: 0 }}>Create Discount Coupon</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Generate promo codes for campaigns, influencers, or special offers.
              </p>

              <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Coupon Code
                    </label>
                    <input
                      type="text"
                      required
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. LAUNCH50"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(10, 13, 20, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Discount Type
                    </label>
                    <select
                      value={couponType}
                      onChange={(e) => setCouponType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(10, 13, 20, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹ or $)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Discount Value {couponType === 'percentage' ? '(%)' : '(Amount)'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={couponType === 'percentage' ? 100 : 2000}
                      value={couponValue}
                      onChange={(e) => setCouponValue(e.target.value)}
                      placeholder="20"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(10, 13, 20, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Max Usage Limit (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={couponMaxUses}
                      onChange={(e) => setCouponMaxUses(e.target.value)}
                      placeholder="Unlimited"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(10, 13, 20, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={couponExpires}
                    onChange={(e) => setCouponExpires(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(10, 13, 20, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={couponLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '6px' }}
                >
                  {couponLoading ? 'Saving Coupon...' : '🎟️ Save & Activate Coupon'}
                </button>
              </form>
            </div>

            {/* Coupon Info / Guide */}
            <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 className="heading-md" style={{ marginBottom: '12px' }}>How Coupons Work</h3>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.8' }}>
                  <li>Customers enter coupon codes directly in the Checkout modal.</li>
                  <li>Discount is calculated and deducted in real-time before Cashfree payment initiation.</li>
                  <li>Usage count increments automatically upon successful payment.</li>
                  <li>Expired or maxed-out coupons are automatically rejected.</li>
                </ul>
              </div>

              <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 600, color: '#a5b4fc', fontSize: '0.85rem' }}>Active Coupons:</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                  {coupons.length}
                </div>
              </div>
            </div>
          </div>

          {/* Coupons Table */}
          <div className="card" style={{ padding: '28px' }}>
            <h2 className="heading-md" style={{ marginBottom: '16px' }}>All Promotional Coupons</h2>
            <div className="table-wrapper" style={{ margin: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Coupon Code</th>
                    <th>Discount</th>
                    <th>Usage</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No coupons created yet. Use the form above to create your first discount code.
                      </td>
                    </tr>
                  ) : (
                    coupons.map((c) => (
                      <tr key={c.code}>
                        <td>
                          <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#facc15', fontSize: '1rem' }}>
                            {c.code}
                          </code>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>
                            {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `Fixed ${c.discountValue} OFF`}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {c.usedCount || 0} {c.maxUses ? `/ ${c.maxUses}` : 'uses'}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: c.active !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: c.active !== false ? '#34d399' : '#f87171'
                            }}
                          >
                            {c.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteCoupon(c.code)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <h2 className="heading-md" style={{ marginBottom: '16px' }}>Payment & Email Gateway Integration Status</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>Cashfree Payment Gateway</span>
                  <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontWeight: 600 }}>
                    API v2023-08-01
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  Configured via <code>CASHFREE_APP_ID</code> and <code>CASHFREE_SECRET_KEY</code> in environment variables. Supports UPI, Cards, NetBanking, and Wallets.
                </p>
              </div>

              <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>ZeptoMail Transactional Email</span>
                  <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 600 }}>
                    Zoho REST API v1.1
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  Configured via <code>ZEPTOMAIL_API_TOKEN</code> in environment variables. Automatically dispatches license key receipts and 6-digit dashboard login OTPs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
