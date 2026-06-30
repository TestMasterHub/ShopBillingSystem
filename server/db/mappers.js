function normalize(str) {
  return (str || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
}

function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at
  };
}

function mapProductRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    productName: row.product_name,
    productNameNormalized: row.product_name_normalized,
    category: row.category,
    purchasePrice: row.purchase_price,
    sellingPrice: row.selling_price,
    quantity: row.quantity,
    unit: row.unit,
    supplierName: row.supplier_name,
    supplierContact: row.supplier_contact,
    minimumStock: row.minimum_stock,
    remarks: row.remarks,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapProductToRow(input) {
  return {
    product_name: input.productName,
    product_name_normalized: input.productNameNormalized,
    category: input.category,
    purchase_price: input.purchasePrice,
    selling_price: input.sellingPrice,
    quantity: input.quantity,
    unit: input.unit,
    supplier_name: input.supplierName,
    supplier_contact: input.supplierContact,
    minimum_stock: input.minimumStock,
    remarks: input.remarks
  };
}

function mapBillRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    billNumber: row.bill_number,
    subtotal: row.subtotal,
    discount: row.discount,
    grandTotal: row.grand_total,
    totalItems: row.total_items,
    billDate: row.bill_date,
    billTime: row.bill_time,
    createdAt: row.created_at
  };
}

function mapBillItemRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    billId: row.bill_id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    sellingPrice: row.selling_price,
    total: row.total
  };
}

module.exports = {
  normalize,
  mapUserRow,
  mapProductRow,
  mapProductToRow,
  mapBillRow,
  mapBillItemRow
};