import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `nav-link px-3 py-2 ${isActive ? 'fw-bold text-white bg-dark rounded' : 'text-dark'}`;

  return (
    <nav className="navbar navbar-expand-md navbar-light bg-white border-bottom shadow-sm sticky-top">
      <div className="container-fluid px-3">
        <span className="navbar-brand fw-bold" style={{ color: '#1f6f50' }}>
          Shop Billing System
        </span>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
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
    </nav>
  );
}