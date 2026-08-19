// components/Navbar.js — White & Gold theme
import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Heart } from 'lucide-react';
import { wishlistCount, onWishlistChange } from '../services/wishlist';

const LINKS = [
  { to: '/',           label: 'Home' },
  { to: '/properties', label: 'Properties' },
  { to: '/market',     label: 'Market Intelligence' },
  { to: '/calculator', label: 'ROI Calculator' },
  { to: '/experts',    label: 'Experts' },
  { to: '/contact',    label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open,     setOpen]     = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setSavedCount(wishlistCount());
    return onWishlistChange(() => setSavedCount(wishlistCount()));
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="nav-logo">
        Iconic<span>Estates</span>
      </Link>

      <div className={`nav-links ${open ? 'open' : ''}`}>
        {LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            {label}
          </NavLink>
        ))}
        <Link
          to="/wishlist"
          className="nav-link nav-wishlist"
          onClick={() => setOpen(false)}
          aria-label="Saved properties"
        >
          <Heart size={18} />
          {savedCount > 0 && <span className="nav-wishlist-count">{savedCount}</span>}
        </Link>
        <Link
          to="/admin"
          className="btn btn-gold btn-sm"
          onClick={() => setOpen(false)}
          style={{ marginLeft: 8 }}
        >
          Admin
        </Link>
      </div>

      <button
        className="nav-mobile-btn"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        style={{ color: 'var(--text-main)' }}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>
    </nav>
  );
}
