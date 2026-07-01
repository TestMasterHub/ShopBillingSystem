import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile drawer automatically if the window is resized up to
  // desktop width while it's open, so it can never linger as a stray panel.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `nav-link px-3 py-2 ${isActive ? 'fw-bold text-white bg-dark rounded' : 'text-dark'}`;

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar navbar-expand-md navbar-light bg-white border-bottom shadow-sm sticky-top">
      <div className="container-fluid px-3">
        <span className="navbar-brand fw-bold" style={{ color: '#1f6f50' }}>
          Shop Billing System
        </span>
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-controls="mainNavOffcanvas"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Desktop inline nav */}
        <div className="collapse navbar-collapse d-none d-md-flex" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-md-0 gap-1">
            <li className="nav-item">
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/billing" className={linkClass}>Billing</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/stock" className={linkClass}>Stock</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/bill-history" className={linkClass}>Bill History</NavLink>
            </li>
          </ul>
          <div className="d-flex align-items-center gap-3">
            {user && <span className="text-muted small">Hi, {user.username}</span>}
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile offcanvas menu — slides in from the right. d-md-none ensures
          this can never render at desktop widths, even if menuOpen is stuck
          true from a resize. */}
      <div
        className={`offcanvas offcanvas-end d-md-none ${menuOpen ? 'show' : ''}`}
        tabIndex="-1"
        id="mainNavOffcanvas"
        style={{ visibility: menuOpen ? 'visible' : 'hidden' }}
      >
        <div className="offcanvas-header border-bottom">
          <span className="fw-bold" style={{ color: '#1f6f50' }}>Menu</span>
          <button type="button" className="btn-close" onClick={closeMenu} aria-label="Close"></button>
        </div>
        <div className="offcanvas-body d-flex flex-column">
          <ul className="navbar-nav gap-1 mb-3">
            <li className="nav-item">
              <NavLink to="/dashboard" className={linkClass} onClick={closeMenu}>Dashboard</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/billing" className={linkClass} onClick={closeMenu}>Billing</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/stock" className={linkClass} onClick={closeMenu}>Stock</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/bill-history" className={linkClass} onClick={closeMenu}>Bill History</NavLink>
            </li>
          </ul>
          <div className="mt-auto d-flex align-items-center justify-content-between border-top pt-3">
            {user && <span className="text-muted small">Hi, {user.username}</span>}
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop — only relevant on mobile; offcanvas itself is d-md-none
          so there's nothing to back up on desktop, but guard anyway */}
      {menuOpen && (
        <div className="offcanvas-backdrop fade show d-md-none" onClick={closeMenu}></div>
      )}
    </nav>
  );
}