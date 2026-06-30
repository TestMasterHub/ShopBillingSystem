import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/api';

const CATEGORIES = ['Stationery', 'Hardware', 'Electrical', 'Paint', 'Household', 'Others'];
const UNITS = ['Piece', 'Box', 'Packet', 'Kg', 'Liter', 'Meter', 'Roll', 'Set'];

const EMPTY_FORM = {
  productName: '',
  category: CATEGORIES[0],
  purchasePrice: '',
  sellingPrice: '',
  quantity: '',
  unit: UNITS[0],
  supplierName: '',
  supplierContact: '',
  minimumStock: '',
  remarks: ''
};

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: search ? { search } : {} });
      setProducts(res.data.products);
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to load products.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearch = () => {
    loadProducts(searchTerm.trim());
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setForm({
      productName: product.productName,
      category: product.category || CATEGORIES[0],
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      unit: product.unit || UNITS[0],
      supplierName: product.supplierName || '',
      supplierContact: product.supplierContact || '',
      minimumStock: product.minimumStock,
      remarks: product.remarks || ''
    });
    setEditingId(product.id);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!form.productName.trim()) return 'Product name is required.';
    if (form.purchasePrice === '' || Number(form.purchasePrice) < 0) return 'Purchase price must be a valid non-negative number.';
    if (form.sellingPrice === '' || Number(form.sellingPrice) < 0) return 'Selling price must be a valid non-negative number.';
    if (form.quantity === '' || Number(form.quantity) < 0) return 'Quantity must be a valid non-negative number.';
    if (form.minimumStock !== '' && Number(form.minimumStock) < 0) return 'Minimum stock cannot be negative.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      productName: form.productName.trim(),
      category: form.category,
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      quantity: Number(form.quantity),
      unit: form.unit,
      supplierName: form.supplierName.trim(),
      supplierContact: form.supplierContact.trim(),
      minimumStock: Number(form.minimumStock) || 0,
      remarks: form.remarks.trim()
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setMessage({ type: 'success', text: 'Product updated successfully.' });
      } else {
        await api.post('/products', payload);
        setMessage({ type: 'success', text: 'Product added successfully.' });
      }
      closeModal();
      loadProducts(searchTerm.trim());
    } catch (err) {
      const text = err.response?.data?.message || 'Failed to save product.';
      setFormError(text);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.productName}"? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/products/${product.id}`);
      setMessage({ type: 'success', text: res.data.message });
      loadProducts(searchTerm.trim());
    } catch (err) {
      const text = err.response?.data?.message || 'Failed to delete product.';
      setMessage({ type: 'danger', text });
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 className="mb-0">Stock Management</h4>
        <button className="btn btn-primary btn-lg-touch" onClick={openAddModal}>
          + Add Product
        </button>
      </div>

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
              className="form-control"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <button className="btn btn-outline-primary" onClick={handleSearch}>Search</button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => { setSearchTerm(''); loadProducts(''); }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-touch mb-0">
              <thead className="table-light">
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Supplier Name</th>
                  <th>Supplier Contact</th>
                  <th>Min Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="10" className="text-center text-muted py-4">Loading...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan="10" className="text-center text-muted py-4">No products found.</td></tr>
                ) : (
                  products.map((product) => {
                    const lowStock = product.quantity <= product.minimumStock;
                    return (
                      <tr key={product.id} className={lowStock ? 'table-warning' : ''}>
                        <td>
                          {product.productName}
                          {lowStock && <span className="badge low-stock-badge ms-2">Low Stock</span>}
                        </td>
                        <td>{product.category || '-'}</td>
                        <td>₹{product.purchasePrice.toFixed(2)}</td>
                        <td>₹{product.sellingPrice.toFixed(2)}</td>
                        <td>{product.quantity}</td>
                        <td>{product.unit || '-'}</td>
                        <td>{product.supplierName || '-'}</td>
                        <td>{product.supplierContact || '-'}</td>
                        <td>{product.minimumStock}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(product)}>Edit</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(product)}>Delete</button>
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

      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{editingId ? 'Edit Product' : 'Add Product'}</h5>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
                </div>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger py-2">{formError}</div>}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Product Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.productName}
                        onChange={(e) => handleFormChange('productName', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={form.category}
                        onChange={(e) => handleFormChange('category', e.target.value)}
                      >
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-6 col-md-4">
                      <label className="form-label">Purchase Price *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.purchasePrice}
                        min="0"
                        onChange={(e) => handleFormChange('purchasePrice', e.target.value)}
                      />
                    </div>
                    <div className="col-6 col-md-4">
                      <label className="form-label">Selling Price *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.sellingPrice}
                        min="0"
                        onChange={(e) => handleFormChange('sellingPrice', e.target.value)}
                      />
                    </div>
                    <div className="col-6 col-md-4">
                      <label className="form-label">Quantity *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.quantity}
                        min="0"
                        onChange={(e) => handleFormChange('quantity', e.target.value)}
                      />
                    </div>
                    <div className="col-6 col-md-4">
                      <label className="form-label">Unit</label>
                      <select
                        className="form-select"
                        value={form.unit}
                        onChange={(e) => handleFormChange('unit', e.target.value)}
                      >
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="col-6 col-md-4">
                      <label className="form-label">Minimum Stock</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.minimumStock}
                        min="0"
                        onChange={(e) => handleFormChange('minimumStock', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Supplier Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.supplierName}
                        onChange={(e) => handleFormChange('supplierName', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Supplier Contact</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.supplierContact}
                        onChange={(e) => handleFormChange('supplierContact', e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Remarks</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={form.remarks}
                        onChange={(e) => handleFormChange('remarks', e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update Product' : 'Add Product'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}