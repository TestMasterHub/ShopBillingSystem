import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function BillView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bill, setBill] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setNotFound(false);
    setMessage({ type: '', text: '' });

    api.get(`/bills/${id}`)
      .then((res) => {
        if (!mounted) return;
        setBill(res.data.bill);
        setItems(res.data.bill.items || res.data.items || []);
      })
      .catch((err) => {
        if (!mounted) return;
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          const text = err.response?.data?.message || 'Failed to load bill details.';
          setMessage({ type: 'danger', text });
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return <div className="text-center text-muted py-5">Loading bill details...</div>;
  }

  if (notFound) {
    return (
      <div>
        <div className="card shadow-sm">
          <div className="card-body text-center text-muted py-5">
            Bill not found.
          </div>
        </div>
        <button
          className="btn btn-outline-secondary mt-3"
          onClick={() => navigate('/bill-history')}
        >
          Back to Billing History
        </button>
      </div>
    );
  }

  return (
    <div>
      {message.text && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}

      {bill && (
        <>
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <div className="text-muted small mb-1">Bill Number</div>
                  <div className="fw-semibold">{bill.billNumber}</div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted small mb-1">Date</div>
                  <div className="fw-semibold">{bill.billDate}</div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted small mb-1">Time</div>
                  <div className="fw-semibold">{bill.billTime}</div>
                </div>
                {bill.status && (
                  <div className="col-6 col-md-3">
                    <div className="text-muted small mb-1">Status</div>
                    <div className="fw-semibold">{bill.status}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-3">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-touch mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Product Name</th>
                      <th>Quantity</th>
                      <th>Price Per Item</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan="4" className="text-center text-muted py-4">No items found.</td></tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={item.id || item.productId || idx}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td>₹{Number(item.sellingPrice ?? item.price ?? 0).toFixed(2)}</td>
                          <td>₹{(Number(item.quantity) * Number(item.sellingPrice ?? item.price ?? 0)).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6 col-md-4">
                  <div className="text-muted small">Subtotal</div>
                  <div className="fs-5 fw-semibold">₹{Number(bill.subtotal || 0).toFixed(2)}</div>
                </div>
                <div className="col-6 col-md-4">
                  <div className="text-muted small">Discount</div>
                  <div className="fs-5 fw-semibold">₹{Number(bill.discount || 0).toFixed(2)}</div>
                </div>
                <div className="col-6 col-md-4">
                  <div className="text-muted small">Grand Total</div>
                  <div className="fs-4 fw-bold" style={{ color: '#1f6f50' }}>₹{Number(bill.grandTotal || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <button
        className="btn btn-outline-secondary"
        onClick={() => navigate('/bill-history')}
      >
        Back to Billing History
      </button>
    </div>
  );
}