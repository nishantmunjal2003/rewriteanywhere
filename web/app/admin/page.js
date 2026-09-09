'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const [licenses, setLicenses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

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

  // Check saved session
  useEffect(() => {
    const saved = localStorage.getItem('arw_admin_passcode');
    if (saved) {
      setPasscode(saved);
      verifyAndLoad(saved);
    }
  }, []);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const verifyAndLoad = async (codeToTest) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/licenses', {
        headers: { 'x-admin-passcode': codeToTest }
      });
      if (res.ok) {
        const data = await res.json();
        setLicenses(data.licenses || []);
        setIsAuthenticated(true);
        localStorage.setItem('arw_admin_passcode', codeToTest);
        setAuthError('');
      } else {
        setIsAuthenticated(false);
        setAuthError('Invalid passcode. Default is admin2026.');
      }
    } catch (err) {
      setAuthError('Network error connecting to admin service.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!passcode) return;
    verifyAndLoad(passcode);
  };

  const handleLogout = () => {
    localStorage.removeItem('arw_admin_passcode');
    setIsAuthenticated(false);
    setPasscode('');
    setLicenses([]);
  };

  const fetchLicenses = async () => {
    try {
      const res = await fetch(`/api/admin/licenses?search=${encodeURIComponent(searchQuery)}`, {
        headers: { 'x-admin-passcode': passcode }
      });
      if (res.ok) {
        const data = await res.json();
        setLicenses(data.licenses || []);
      }
    } catch (err) {
      console.error(err);
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
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode
        },
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
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode
        },
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
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode
        },
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
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode
        },
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
    return (
      <div className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '440px' }}>
          <div className="card" style={{ padding: '40px' }}>
            <div className="text-center" style={{ marginBottom: '24px' }}>
              <div className="logo-icon" style={{ margin: '0 auto 16px', width: '48px', height: '48px', fontSize: '1.4rem' }}>
                ⚡
              </div>
              <h1 className="heading-md">License Administration</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Enter your administrative passcode to manage product keys and hardware bindings.
              </p>
            </div>

            {authError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '16px' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Admin Master Passcode
                </label>
                <input
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode (default: admin2026)"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(10, 13, 20, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Authenticating...' : 'Unlock Admin Portal →'}
              </button>
            </form>
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
              <span className="badge badge-guarantee">HWID Binding Manager</span>
            </div>
            <h1 className="heading-lg" style={{ marginTop: '8px', marginBottom: '4px' }}>
              Product Key & Hardware ID Administration
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Issue commercial licenses, release hardware locks, and manage single-PC bindings.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={fetchLicenses} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
              🔄 Refresh Data
            </button>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.88rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>
              Logout
            </button>
          </div>
        </div>

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
                    <option value="INR_2000">₹2,000 INR (India Special Lifetime)</option>
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
                            {lic.price || (lic.tier === 'INR_2000' ? '₹2,000 INR' : '$19 USD')}
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
      </div>
    </div>
  );
}
