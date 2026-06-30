const express = require('express');
const supabase = require('../db/supabaseClient');
const { normalize, mapProductRow, mapProductToRow } = require('../db/mappers');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

async function findActiveByNormalizedName(normalizedName, excludeId) {
  let query = supabase
    .from('products')
    .select('id')
    .eq('product_name_normalized', normalizedName)
    .eq('active', true);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data || null;
}

router.get('/', async (req, res) => {
  try {
    const { search, includeInactive } = req.query;

    let query = supabase.from('products').select('*');

    if (!includeInactive) {
      query = query.eq('active', true);
    }

    if (search) {
      query = query.like('product_name_normalized', `%${normalize(search)}%`);
    }

    query = query.order('product_name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to fetch products.' });
    }

    res.json({ products: data.map(mapProductRow) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to fetch product.' });
    }

    if (!data) return res.status(404).json({ message: 'Product not found.' });
    res.json({ product: mapProductRow(data) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch product.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      productName, category, purchasePrice, sellingPrice,
      quantity, unit, supplierName, supplierContact, minimumStock, remarks
    } = req.body;

    if (!productName || !productName.trim()) {
      return res.status(400).json({ message: 'Product name is required.' });
    }
    if (purchasePrice === undefined || purchasePrice === null || Number(purchasePrice) < 0) {
      return res.status(400).json({ message: 'Purchase price must be a valid non-negative number.' });
    }
    if (sellingPrice === undefined || sellingPrice === null || Number(sellingPrice) < 0) {
      return res.status(400).json({ message: 'Selling price must be a valid non-negative number.' });
    }
    if (quantity === undefined || quantity === null || Number(quantity) < 0) {
      return res.status(400).json({ message: 'Quantity must be a valid non-negative number.' });
    }

    const normalized = normalize(productName);
    const existing = await findActiveByNormalizedName(normalized);

    if (existing) {
      return res.status(409).json({ message: 'A product with this name already exists.' });
    }

    const row = mapProductToRow({
      productName: productName.trim(),
      productNameNormalized: normalized,
      category: category || null,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      quantity: Number(quantity),
      unit: unit || null,
      supplierName: supplierName || null,
      supplierContact: supplierContact || null,
      minimumStock: Number(minimumStock) || 0,
      remarks: remarks || null
    });

    const { data, error } = await supabase
      .from('products')
      .insert(row)
      .select('*')
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to create product.' });
    }

    res.status(201).json({ product: mapProductRow(data) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create product.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existingData, error: existingError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (existingError) {
      console.error(existingError);
      return res.status(500).json({ message: 'Failed to update product.' });
    }

    if (!existingData) return res.status(404).json({ message: 'Product not found.' });

    const {
      productName, category, purchasePrice, sellingPrice,
      quantity, unit, supplierName, supplierContact, minimumStock, remarks
    } = req.body;

    if (!productName || !productName.trim()) {
      return res.status(400).json({ message: 'Product name is required.' });
    }
    if (purchasePrice === undefined || purchasePrice === null || Number(purchasePrice) < 0) {
      return res.status(400).json({ message: 'Purchase price must be a valid non-negative number.' });
    }
    if (sellingPrice === undefined || sellingPrice === null || Number(sellingPrice) < 0) {
      return res.status(400).json({ message: 'Selling price must be a valid non-negative number.' });
    }
    if (quantity === undefined || quantity === null || Number(quantity) < 0) {
      return res.status(400).json({ message: 'Quantity must be a valid non-negative number.' });
    }

    const normalized = normalize(productName);
    const duplicate = await findActiveByNormalizedName(normalized, id);

    if (duplicate) {
      return res.status(409).json({ message: 'A product with this name already exists.' });
    }

    const row = mapProductToRow({
      productName: productName.trim(),
      productNameNormalized: normalized,
      category: category || null,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      quantity: Number(quantity),
      unit: unit || null,
      supplierName: supplierName || null,
      supplierContact: supplierContact || null,
      minimumStock: Number(minimumStock) || 0,
      remarks: remarks || null
    });
    row.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('products')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to update product.' });
    }

    res.json({ product: mapProductRow(data) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update product.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (productError) {
      console.error(productError);
      return res.status(500).json({ message: 'Failed to delete product.' });
    }

    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const { count, error: usageError } = await supabase
      .from('bill_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', id);

    if (usageError) {
      console.error(usageError);
      return res.status(500).json({ message: 'Failed to delete product.' });
    }

    if (count > 0) {
      const { error: deactivateError } = await supabase
        .from('products')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (deactivateError) {
        console.error(deactivateError);
        return res.status(500).json({ message: 'Failed to delete product.' });
      }

      return res.json({ message: 'Product has billing history and was deactivated instead of deleted.' });
    }

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error(deleteError);
      return res.status(500).json({ message: 'Failed to delete product.' });
    }

    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
});

module.exports = router;