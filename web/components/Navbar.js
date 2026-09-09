'use client';

import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on ESC or resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) {
        setMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container nav-container">
        <a href="/" className="logo" aria-label="AI Rewrite Anywhere Home" onClick={closeMenu}>
          <div className="logo-icon">⚡</div>
          <span className="logo-text">AI Rewrite Anywhere</span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" aria-label="Desktop Navigation">
          <ul className="nav-links">
            <li><a href="/#features" className="nav-link">Features</a></li>
            <li><a href="/#simulator" className="nav-link">Live Demo</a></li>
            <li><a href="/#pricing" className="nav-link">Pricing</a></li>
            <li><a href="/how-to-use" className="nav-link">How to Use & API Keys</a></li>
            <li><a href="/support" className="nav-link">Support</a></li>
          </ul>
        </nav>

        {/* Header Actions */}
        <div className="nav-actions">
          <ThemeToggle />
          <a href="/#pricing" className="btn btn-primary nav-cta-btn" onClick={closeMenu}>
            <span className="cta-full">Buy License ($19 / ₹2,000)</span>
            <span className="cta-mobile">Buy ($19)</span>
          </a>

          {/* Mobile Hamburger Toggle Button */}
          <button
            className={`hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Overlay Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMenu}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span className="mobile-menu-title">Navigation</span>
              <button
                className="mobile-close-btn"
                onClick={closeMenu}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <ul className="mobile-nav-links">
              <li>
                <a href="/#features" className="mobile-nav-link" onClick={closeMenu}>
                  <span className="mobile-nav-icon">⚡</span>
                  <span>Features</span>
                </a>
              </li>
              <li>
                <a href="/#simulator" className="mobile-nav-link" onClick={closeMenu}>
                  <span className="mobile-nav-icon">💻</span>
                  <span>Live Demo Simulator</span>
                </a>
              </li>
              <li>
                <a href="/#pricing" className="mobile-nav-link" onClick={closeMenu}>
                  <span className="mobile-nav-icon">💎</span>
                  <span>Pricing & Guarantee</span>
                </a>
              </li>
              <li>
                <a href="/how-to-use" className="mobile-nav-link" onClick={closeMenu}>
                  <span className="mobile-nav-icon">📖</span>
                  <span>How to Use & API Keys</span>
                </a>
              </li>
              <li>
                <a href="/support" className="mobile-nav-link" onClick={closeMenu}>
                  <span className="mobile-nav-icon">🛡️</span>
                  <span>Support & FAQ</span>
                </a>
              </li>
            </ul>

            <div className="mobile-menu-footer">
              <div className="mobile-badge-wrapper">
                <span className="badge badge-windows" style={{ width: '100%', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.401H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.95-1.801"/>
                  </svg>
                  Exclusively for Windows 10 & 11
                </span>
              </div>
              <a
                href="/#pricing"
                className="btn btn-primary btn-large"
                style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}
                onClick={closeMenu}
              >
                Get Lifetime License ($19 / ₹2,000)
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
