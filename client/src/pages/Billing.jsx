import React, { useState, useCallback } from 'react';
import api from '../api/api';

export default function Billing() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const handleSearch = useCallback(async () => {
    setMessage({ type: '', text: '' });
    const term = searchTerm.trim().replace(/\s+/g, ' ');
    try {
      const res = await api.get('/products', { params: { search: term } });
      setResults(res.data.products);
      setSearched(true);
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to search products.' });
    }
  }, [searchTerm]);

  const handleClear = () => {
    setSearchTerm('');
    setResults([]);
    setSearched(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.quantity) {
          setMessage({ type: 'warning', text: `Insufficient stock for ${product.productName}.` });
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      if (product.quantity < 1) {
        setMessage({ type: 'warning', text: `Insufficient stock for ${product.productName}.` });
        return prev;
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.productName,
          sellingPrice: product.sellingPrice,
          availableStock: product.quantity,
          quantity: 1
        }
      ];
    });
  };

  const updateQuantity = (productId, rawValue) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const value = rawValue === '' ? '' : Number(rawValue);
        return { ...item, quantity: value };
      })
    );
  };

  const commitQuantity = (productId) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        let qty = Number(item.quantity);
        if (!qty || qty < 1) qty = 1;
        if (qty > item.availableStock) qty = item.availableStock;
        return { ...item, quantity: qty };
      })
    );
  };

  const incrementQuantity = (productId, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        let qty = Number(item.quantity) || 0;
        qty += delta;
        if (qty < 1) qty = 1;
        if (qty > item.availableStock) {
          setMessage({ type: 'warning', text: `Insufficient stock for ${item.productName}.` });
          qty = item.availableStock;
        }
        return { ...item, quantity: qty };
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    return sum + qty * item.sellingPrice;
  }, 0);

  const discountValue = Number(discount) || 0;
  const grandTotal = Math.max(subtotal - discountValue, 0);

  const hasStockIssue = cart.some((item) => Number(item.quantity) > item.availableStock || !Number(item.quantity) || Number(item.quantity) < 1);

  const handleSaveBill = async () => {
    setMessage({ type: '', text: '' });

    if (cart.length === 0) {
      setMessage({ type: 'warning', text: 'Cart is empty. Add products before saving the bill.' });
      return;
    }

    if (hasStockIssue) {
      setMessage({ type: 'danger', text: 'Please fix quantity issues before saving the bill.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        items: cart.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })),
        discount: discountValue
      };
      const res = await api.post('/bills', payload);
      setMessage({ type: 'success', text: `Bill ${res.data.bill.billNumber} saved successfully.` });
      setCart([]);
      setDiscount(0);
      handleClear();
    } catch (err) {
      const text = err.response?.data?.message || 'Failed to save bill.';
      setMessage({ type: 'danger', text });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h4 className="mb-3">Billing</h4>

      {message.text && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="input-group">
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button className="btn btn-primary btn-lg-touch" onClick={handleSearch}>
              Search
            </button>
            <button className="btn btn-outline-secondary btn-lg-touch" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {searched && (
        <div className="card shadow-sm mb-3">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-touch mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Product Name</th>
                    <th>Selling Price</th>
                    <th>Available Stock</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">No products found.</td>
                    </tr>
                  ) : (
                    results.map((product) => (
                      <tr key={product.id}>
                        <td>{product.productName}</td>
                        <td>₹{product.sellingPrice.toFixed(2)}</td>
                        <td>
                          {product.quantity}
                          {product.quantity <= product.minimumStock && (
                            <span className="badge low-stock-badge ms-2">Low Stock</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary btn-lg-touch"
                            onClick={() => addToCart(product)}
                            disabled={product.quantity < 1}
                          >
                            Add
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

      <div className="card shadow-sm mb-3">
        <div className="card-header bg-white fw-semibold">Billing Cart</div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-touch mb-0">
              <thead className="table-light">
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Price Per Item</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">Cart is empty.</td>
                  </tr>
                ) : (
                  cart.map((item) => {
                    const qty = Number(item.quantity) || 0;
                    const invalid = qty > item.availableStock || qty < 1;
                    return (
                      <tr key={item.productId}>
                        <td>{item.productName}</td>
                        <td style={{ minWidth: '160px' }}>
                          <div className="d-flex align-items-center gap-1">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => incrementQuantity(item.productId, -1)}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              className={`form-control form-control-sm text-center ${invalid ? 'is-invalid' : ''}`}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.productId, e.target.value)}
                              onBlur={() => commitQuantity(item.productId)}
                              style={{ width: '70px' }}
                              min="1"
                            />
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => incrementQuantity(item.productId, 1)}
                            >
                              +
                            </button>
                          </div>
                          {invalid && <div className="text-danger small mt-1">Insufficient Stock</div>}
                        </td>
                        <td>₹{item.sellingPrice.toFixed(2)}</td>
                        <td>₹{(qty * item.sellingPrice).toFixed(2)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            Remove
                          </button>
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

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label">Discount</label>
              <input
                type="number"
                className="form-control"
                value={discount}
                min="0"
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-4">
              <div className="text-muted small">Subtotal</div>
              <div className="fs-5 fw-semibold">₹{subtotal.toFixed(2)}</div>
            </div>
            <div className="col-6 col-md-4">
              <div className="text-muted small">Grand Total</div>
              <div className="fs-4 fw-bold" style={{ color: '#1f6f50' }}>₹{grandTotal.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary btn-lg w-100 btn-lg-touch"
        onClick={handleSaveBill}
        disabled={saving || cart.length === 0}
      >
        {saving ? 'Saving Bill...' : 'Save Bill'}
      </button>
    </div>
  );
}