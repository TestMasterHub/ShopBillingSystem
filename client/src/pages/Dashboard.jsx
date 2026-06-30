import React, { useEffect, useState } from 'react';
import api from '../api/api';

function StatCard({ label, value, accent }) {
  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div className="card shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small mb-1">{label}</div>
          <div className="fs-3 fw-bold" style={{ color: accent || '#1f6f50' }}>{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/dashboard')
      .then((res) => {
        if (mounted) setStats(res.data);
      })
      .catch(() => {
        if (mounted) setError('Failed to load dashboard data.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div className="text-center text-muted py-5">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <h4 className="mb-3">Dashboard</h4>
      <div className="row g-3">
        <StatCard label="Today's Sales" value={`₹${stats.todaySales.toFixed(2)}`} />
        <StatCard label="Bills Today" value={stats.billsToday} />
        <StatCard label="Total Products" value={stats.totalProducts} />
        <StatCard label="Low Stock Products" value={stats.lowStockProducts} accent="#e67e22" />
      </div>
    </div>
  );
}