import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

function SummaryCard({ label, value, accent }) {
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

export default function BillHistory() {
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadBills = useCallback(async (params = {}) => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.get('/bills', { params });
      setBills(res.data.bills || []);
    } catch (err) {
      const text = err.response?.data?.message || 'Failed to load billing history.';
      setMessage({ type: 'danger', text });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const handleSearch = () => {
    const term = searchTerm.trim().replace(/\s+/g, ' ');
    loadBills(term ? { search: term } : {});
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    loadBills();
  };

  const handleApplyFilter = () => {
    if (!fromDate && !toDate) return;
    const params = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    loadBills(params);
  };

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
    loadBills();
  };

  const totalBills = bills.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysBills = bills.filter((b) => (b.billDate || '').slice(0, 10) === todayStr).length;
  const totalSalesAmount = bills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0);
  const averageBillValue = totalBills > 0 ? totalSalesAmount / totalBills : 0;

  const sortedBills = [...bills].sort((a, b) => {
    const aTime = new Date(`${a.billDate}T${a.billTime || '00:00:00'}`).getTime();
    const bTime = new Date(`${b.billDate}T${b.billTime || '00:00:00'}`).getTime();
    return bTime - aTime;
  });

  return (
    <div>
      <h4 className="mb-3">Billing History</h4>

      {message.text && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-5">
              <label className="form-label">Search</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Bill Number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                <button className="btn btn-outline-primary" onClick={handleSearch}>Search</button>
                <button className="btn btn-outline-secondary" onClick={handleClearSearch}>Clear</button>
              </div>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">To Date</label>
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-3">
              <div className="d-flex gap-2">
                <button className="btn btn-primary w-100" onClick={handleApplyFilter}>Apply</button>
                <button className="btn btn-outline-secondary w-100" onClick={handleClearFilter}>Clear Filter</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <SummaryCard label="Total Bills" value={totalBills} />
        <SummaryCard label="Today's Bills" value={todaysBills} />
        <SummaryCard label="Total Sales Amount" value={`₹${totalSalesAmount.toFixed(2)}`} />
        <SummaryCard label="Average Bill Value" value={`₹${averageBillValue.toFixed(2)}`} accent="#e67e22" />
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-touch mb-0">
              <thead className="table-light">
                <tr>
                  <th>Bill Number</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Items Count</th>
                  <th>Subtotal</th>
                  <th>Discount</th>
                  <th>Grand Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="text-center text-muted py-4">Loading...</td></tr>
                ) : sortedBills.length === 0 ? (
                  <tr><td colSpan="8" className="text-center text-muted py-4">No billing records found.</td></tr>
                ) : (
                  sortedBills.map((bill) => (
                    <tr key={bill.id}>
                      <td>{bill.billNumber}</td>
                      <td>{bill.billDate}</td>
                      <td>{bill.billTime}</td>
                      <td>{bill.totalItems}</td>
                      <td>₹{Number(bill.subtotal || 0).toFixed(2)}</td>
                      <td>₹{Number(bill.discount || 0).toFixed(2)}</td>
                      <td>₹{Number(bill.grandTotal || 0).toFixed(2)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/bill-history/${bill.id}`)}
                        >
                          View
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
    </div>
  );
}