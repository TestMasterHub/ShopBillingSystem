import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Billing from './pages/Billing.jsx';
import Stock from './pages/Stock.jsx';
//import BillHistory from './pages/BillHistory.jsx';
//import BillView from './pages/BillView.jsx';
import { useAuth } from './context/AuthContext.jsx';

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
            <AppShell><Dashboard /></AppShell>
        }
      />
      <Route
        path="/billing"
        element={
            <AppShell><Billing /></AppShell>
        }
      />
      <Route
        path="/stock"
        element={
          <AppShell><Stock /></AppShell>
        }
      />
      {/* <Route
        path="/bill-history"
        element={
          <ProtectedRoute>
            <AppShell><BillHistory /></AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bill-history/:id"
        element={
          <ProtectedRoute>
            <AppShell><BillView /></AppShell>
          </ProtectedRoute>
        }
      /> */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}