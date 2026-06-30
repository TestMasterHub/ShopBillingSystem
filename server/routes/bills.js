const express = require('express');
const supabase = require('../db/supabaseClient');
const { mapBillRow, mapBillItemRow } = require('../db/mappers');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const { items, discount } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Bill must contain at least one item.' });
    }

    const discountValue = Number(discount) || 0;
    if (discountValue < 0) {
      return res.status(400).json({ message: 'Discount cannot be negative.' });
    }

    const itemsPayload = items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity)
    }));

    const { data, error } = await supabase.rpc('create_bill', {
      items_json: itemsPayload,
      discount_input: discountValue
    });

    if (error) {
      const message = error.message || 'Failed to save bill.';
      const knownMessages = [
        'Bill must contain at least one item.',
        'Discount cannot be negative.',
        'Invalid item in bill.',
        'Product not found or inactive.',
        'Discount cannot exceed subtotal.'
      ];

      const isInsufficientStock = message.startsWith('Insufficient stock for');
      const isKnown = knownMessages.includes(message) || isInsufficientStock;

      if (isKnown) {
        const status = message === 'Product not found or inactive.' ? 404 : 400;
        return res.status(status).json({ message });
      }

      console.error(error);
      return res.status(500).json({ message: 'Failed to save bill.' });
    }

    res.status(201).json({ bill: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save bill.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    let query = supabase.from('bills').select('*');

    if (search) {
      const term = search.trim();
      query = query.or(`bill_number.ilike.%${term}%,bill_date.ilike.%${term}%`);
    }

    query = query.order('id', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to fetch bills.' });
    }

    res.json({ bills: data.map(mapBillRow) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch bills.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: billData, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (billError) {
      console.error(billError);
      return res.status(500).json({ message: 'Failed to fetch bill.' });
    }

    if (!billData) return res.status(404).json({ message: 'Bill not found.' });

    const { data: itemsData, error: itemsError } = await supabase
      .from('bill_items')
      .select('*')
      .eq('bill_id', billData.id);

    if (itemsError) {
      console.error(itemsError);
      return res.status(500).json({ message: 'Failed to fetch bill.' });
    }

    const bill = mapBillRow(billData);
    bill.items = itemsData.map(mapBillItemRow);

    res.json({ bill });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch bill.' });
  }
});

module.exports = router;