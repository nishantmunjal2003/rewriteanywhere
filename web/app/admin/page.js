'use client';
import { useState, useEffect, useRef } from 'react';
import BrandIcon from '../../components/BrandIcon';

const DEFAULT_GOOGLE_CLIENT_ID = '698709002321-lhmhulia304qiqqj55lhehk5tn70k753.apps.googleusercontent.com';

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  // Google OAuth Client ID setup
  const [activeGoogleClientId, setActiveGoogleClientId] = useState('');
  const [customClientId, setCustomClientId] = useState('');
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);

  const [licenses, setLicenses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all'); // 'all' | 'INR_1600' | 'USD_19' | 'INR_2000'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'key' | 'name'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        setAuthError(data.message || 'Access Denied.');
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLicenses();
    setIsRefreshing(false);
    showToast('Licenses refreshed from database.');
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

  // Copy helper with feedback
  const copyToClipboard = (text, label = 'Copied!') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2500);
    showToast(`${label} copied to clipboard.`);
  };

  // Format Tier Price properly
  const formatTierPrice = (lic) => {
    if (lic.price && typeof lic.price === 'string' && (lic.price.includes('₹') || lic.price.includes('$'))) {
      return lic.price;
    }
    if (lic.price && typeof lic.price === 'number') {
      return lic.currency === 'USD' ? `$${lic.price} USD` : `₹${lic.price.toLocaleString('en-IN')} INR`;
    }
    if (lic.tier === 'INR_1600' || lic.tier === 'COMMERCIAL_INR') {
      return '₹1,600 INR';
    }
    if (lic.tier === 'INR_2000') {
      return '₹2,000 INR';
    }
    return '$19 USD';
  };

  // Export filtered licenses to CSV
  const handleExportCsv = () => {
    if (!filteredLicenses.length) {
      showToast('No licenses to export.', 'error');
      return;
    }
    const headers = ['License Key', 'Customer Name', 'Customer Email', 'Tier', 'Price', 'Status', 'Machine ID (HWID)', 'Order ID', 'Created At', 'Activated At'];
    const rows = filteredLicenses.map(lic => [
      lic.licenseKey,
      lic.customerName || '',
      lic.assignedEmail || lic.email || '',
      lic.tier || '',
      formatTierPrice(lic),
      lic.status || '',
      lic.activeMachineId || '',
      lic.orderId || '',
      lic.createdAt ? new Date(lic.createdAt).toISOString() : '',
      lic.activatedAt ? new Date(lic.activatedAt).toISOString() : ''
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `arw-licenses-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredLicenses.length} licenses to CSV.`);
  };

  // Filtered and Sorted list
  const filteredLicenses = licenses
    .filter((l) => {
      // 1. Status Filter
      if (filterStatus === 'active' && !(l.status === 'active' && l.activeMachineId)) return false;
      if (filterStatus === 'unactivated' && !(l.status === 'unactivated' || !l.activeMachineId)) return false;
      if (filterStatus === 'revoked' && l.status !== 'revoked') return false;

      // 2. Tier Filter
      if (filterTier !== 'all') {
        const t = (l.tier || '').toUpperCase();
        if (filterTier === 'INR_1600' && t !== 'INR_1600' && t !== 'COMMERCIAL_INR') return false;
        if (filterTier === 'USD_19' && t !== 'USD_19' && t !== 'COMMERCIAL_USD') return false;
        if (filterTier === 'INR_2000' && t !== 'INR_2000') return false;
      }

      // 3. Search Query Filter (key, HWID, email, name, orderId, notes, price)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const key = (l.licenseKey || '').toLowerCase();
        const hwid = (l.activeMachineId || '').toLowerCase();
        const email = (l.assignedEmail || l.email || '').toLowerCase();
        const name = (l.customerName || '').toLowerCase();
        const order = (l.orderId || '').toLowerCase();
        const notes = (l.notes || '').toLowerCase();
        const price = (l.price || '').toString().toLowerCase();

        const matches =
          key.includes(q) ||
          hwid.includes(q) ||
          email.includes(q) ||
          name.includes(q) ||
          order.includes(q) ||
          notes.includes(q) ||
          price.includes(q);

        if (!matches) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'key') {
        return (a.licenseKey || '').localeCompare(b.licenseKey || '');
      }
      if (sortBy === 'name') {
        return (a.customerName || 'zzz').localeCompare(b.customerName || 'zzz');
      }
      if (sortBy === 'status') {
        return (a.status || '').localeCompare(b.status || '');
      }
      return 0;
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
              <h1 className="heading-md" style={{ marginBottom: '8px' }}>Admin Portal</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Sign in to continue.
              </p>
            </div>

            {authError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '20px', lineHeight: '1.4' }}>
                {authError}
              </div>
            )}

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
                    className="admin-field-input"
                    style={{ marginBottom: '10px' }}
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
              <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)', color: 'var(--accent-emerald)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }}></span>
                Live Database Active
              </span>
            </div>
            <h1 className="heading-lg" style={{ marginTop: '8px', marginBottom: '4px' }}>
              Product Key & Hardware ID Administration
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Issue commercial licenses, release hardware locks, and manage single-PC bindings.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Profile Icon with Dropdown */}
            <div ref={profileDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                aria-label="Account menu"
                aria-expanded={profileDropdownOpen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: profileDropdownOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 10px 4px 4px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease'
                }}
              >
                {adminUser?.picture ? (
                  <img
                    src={adminUser.picture}
                    alt="Profile"
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-indigo))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#ffffff'
                    }}
                  >
                    {adminUser?.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style={{
                    color: 'var(--text-muted)',
                    transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    background: 'var(--bg-surface-elevated, var(--bg-card))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                    padding: '8px',
                    zIndex: 100,
                    backdropFilter: 'blur(16px)',
                    animation: 'fadeIn 0.15s ease-out'
                  }}
                >
                  {/* User Info Header */}
                  <div
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '4px'
                    }}
                  >
                    {adminUser?.picture ? (
                      <img
                        src={adminUser.picture}
                        alt="Profile"
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-indigo))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: '#ffffff'
                        }}
                      >
                        {adminUser?.name?.[0]?.toUpperCase() || 'A'}
                      </div>
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}
                      >
                        {adminUser?.name || 'Administrator'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          marginTop: '2px'
                        }}
                      >
                        {adminUser?.email || ''}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      fetchLicenses();
                      showToast('Refreshing license data...');
                      setProfileDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>🔄</span>
                    <span>Refresh Data</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginTop: '2px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-nav-tabs-wrapper">
          <button
            onClick={() => setActiveTab('licenses')}
            className={`admin-nav-tab-btn ${activeTab === 'licenses' ? 'active' : ''}`}
          >
            <span>🔑</span>
            <span>Licenses & Devices</span>
            <span className="admin-pill-count">{totalCount}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('coupons');
              fetchCoupons();
            }}
            className={`admin-nav-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
          >
            <span>🎟️</span>
            <span>Discount Coupons</span>
            <span className="admin-pill-count">{coupons.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`admin-nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <span>⚙️</span>
            <span>Gateway & API Settings</span>
          </button>
        </div>

        {activeTab === 'licenses' && (
          <>
            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '36px' }}>
              <div className="admin-metric-card">
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Issued Keys
                </span>
                <div className="admin-metric-num" style={{ color: 'var(--text-primary)' }}>
                  {totalCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Catalog database records
                </div>
              </div>

              <div className="admin-metric-card" style={{ borderColor: 'rgba(16, 185, 129, 0.35)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active Bound Devices
                </span>
                <div className="admin-metric-num" style={{ color: 'var(--accent-emerald)' }}>
                  {activeCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Locked to 1 Windows PC
                </div>
              </div>

              <div className="admin-metric-card" style={{ borderColor: 'rgba(99, 102, 241, 0.35)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Available / Unbound
                </span>
                <div className="admin-metric-num" style={{ color: 'var(--accent-primary)' }}>
                  {availableCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Ready for customer PC activation
                </div>
              </div>

              <div className="admin-metric-card" style={{ borderColor: 'rgba(239, 68, 68, 0.35)' }}>
                <span style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Revoked / Refunded
                </span>
                <div className="admin-metric-num" style={{ color: '#ef4444' }}>
                  {revokedCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Blocked from activation
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
                    className="admin-field-input"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isReleasing}
                  className="btn btn-secondary"
                  style={{
                    background: 'rgba(2, 132, 199, 0.1)',
                    borderColor: 'rgba(2, 132, 199, 0.35)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isReleasing ? 'Releasing Binding...' : '🔓 Release Hardware Binding Now'}
                </button>
              </form>
            </div>

            <div className="admin-tip-box" style={{ marginTop: '20px' }}>
              💡 <strong>Tip:</strong> When released, the active machine ID is erased (<code>null</code>), and the key can be activated on the customer's new computer without issuing a new order.
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
                    className="admin-field-select"
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
                    className="admin-field-input"
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
                    className="admin-field-input"
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
                    className="admin-field-input"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                {loading ? 'Generating Key...' : '⚡ Generate & Issue Commercial Key'}
              </button>
            </form>

            {/* Newly Created Key Alert Box */}
            {createdLicense && (
              <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '6px', fontWeight: 600 }}>
                  Generated Product Key:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <code className="admin-key-code" style={{ fontSize: '1.15rem' }}>
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
                        const emailSnippet = `Hi ${createdLicense.customerName || 'there'},\n\nThank you for purchasing AI Rewrite Anywhere!\n\nHere is your lifetime commercial product key:\n${createdLicense.licenseKey}\n\nPrice: ${formatTierPrice(createdLicense)}\nEnvironment: Windows 10 & 11 (64-bit)\nPolicy: 1 Active Windows PC\nGuarantee: 14-Day Money-Back Guarantee\n\nHow to activate:\n1. Open AI Rewrite Anywhere on your Windows PC.\n2. Right-click the tray icon -> Settings -> License & Protection.\n3. Paste your key and click Activate License.\n\nEnjoy rewriting!\nAI Rewrite Anywhere Team`;
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
          {/* Top Header with title, count, and export / refresh */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 className="heading-md" style={{ margin: 0 }}>License Catalog & HWID Records</h2>
                <span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                  Live DB
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px', marginBottom: 0 }}>
                Showing <strong>{filteredLicenses.length}</strong> of <strong>{totalCount}</strong> total keys
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Reload fresh data from database"
              >
                <span style={{ display: 'inline-block', transform: isRefreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.6s ease' }}>
                  🔄
                </span>
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Export filtered records to CSV"
              >
                <span>📥</span>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '24px', padding: '16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            {/* Search Input Box */}
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem', pointerEvents: 'none' }}>
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by key, HWID, email, name..."
                className="admin-field-input"
                style={{ paddingLeft: '36px', paddingRight: searchQuery ? '36px' : '14px' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', padding: '2px 6px' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="admin-filter-pill-container">
              {[
                { id: 'all', label: 'All', count: totalCount },
                { id: 'active', label: 'Active', count: activeCount },
                { id: 'unactivated', label: 'Available', count: availableCount },
                { id: 'revoked', label: 'Revoked', count: revokedCount }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setFilterStatus(st.id)}
                  className={`admin-filter-pill-btn ${filterStatus === st.id ? 'active' : ''}`}
                >
                  <span>{st.label}</span>
                  <span className="admin-pill-count">{st.count}</span>
                </button>
              ))}
            </div>

            {/* Tier Filter Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Tier:
              </label>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="admin-field-select"
                style={{ width: 'auto', minWidth: '130px', padding: '7px 12px', fontSize: '0.85rem' }}
              >
                <option value="all">All Tiers</option>
                <option value="INR_1600">₹1,600 INR</option>
                <option value="USD_19">$19 USD</option>
              </select>
            </div>

            {/* Sort By Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Sort:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="admin-field-select"
                style={{ width: 'auto', minWidth: '140px', padding: '7px 12px', fontSize: '0.85rem' }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="customer">Customer Name</option>
                <option value="status">Status</option>
              </select>
            </div>

            {/* Reset Filters button if any active filter */}
            {(searchQuery || filterStatus !== 'all' || filterTier !== 'all' || sortBy !== 'newest') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterTier('all');
                  setSortBy('newest');
                }}
                className="btn btn-secondary"
                style={{ padding: '7px 12px', fontSize: '0.82rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.35)' }}
              >
                Reset Filters
              </button>
            )}
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
                            <code className="admin-key-code">
                              {lic.licenseKey}
                            </code>
                            <button
                              title="Copy License Key"
                              onClick={() => copyToClipboard(lic.licenseKey, 'License Key')}
                              className="admin-quick-btn"
                            >
                              {copiedKey === lic.licenseKey ? '✓' : '📋'}
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
                            {formatTierPrice(lic)}
                          </span>
                        </td>

                        <td>
                          {lic.activeMachineId ? (
                            <div>
                              <code style={{ fontSize: '0.85rem', color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.25)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
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
                            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: '#ef4444', fontWeight: 700 }}>
                              Revoked
                            </span>
                          ) : isBound ? (
                            <span className="badge badge-guarantee" style={{ fontWeight: 700 }}>
                              Active (1 PC)
                            </span>
                          ) : (
                            <span className="badge badge-windows" style={{ fontWeight: 700 }}>
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
                                  borderColor: 'rgba(2, 132, 199, 0.4)',
                                  color: '#0284c7',
                                  fontWeight: 600
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
                                  borderColor: 'rgba(239, 68, 68, 0.35)',
                                  color: '#ef4444',
                                  fontWeight: 600
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
                      className="admin-field-input"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        fontWeight: 700
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
                      className="admin-field-select"
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
                      className="admin-field-input"
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
                      className="admin-field-input"
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
                    className="admin-field-input"
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

              <div style={{ padding: '16px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.85rem' }}>Active Coupons:</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
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
                          <code className="admin-key-code" style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '0.95rem' }}>
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
                              color: c.active !== false ? '#10b981' : '#ef4444'
                            }}
                          >
                            {c.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteCoupon(c.code)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#ef4444' }}
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
              <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Cashfree Payment Gateway</span>
                  <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    API v2023-08-01
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  Configured via <code>CASHFREE_APP_ID</code> and <code>CASHFREE_SECRET_KEY</code> in environment variables. Supports UPI, Cards, NetBanking, and Wallets.
                </p>
              </div>

              <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>ZeptoMail Transactional Email</span>
                  <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 600 }}>
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
