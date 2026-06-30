const express = require('express');
const supabase = require('../db/supabaseClient');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: billsTodayData, error: billsTodayError } = await supabase
      .from('bills')
      .select('grand_total')
      .eq('bill_date', today);

    if (billsTodayError) {
      console.error(billsTodayError);
      return res.status(500).json({ message: 'Failed to load dashboard data.' });
    }

    const todaySales = billsTodayData.reduce((sum, row) => sum + Number(row.grand_total || 0), 0);
    const billsToday = billsTodayData.length;

    const { count: totalProducts, error: totalProductsError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('active', true);

    if (totalProductsError) {
      console.error(totalProductsError);
      return res.status(500).json({ message: 'Failed to load dashboard data.' });
    }

    const { data: activeProducts, error: activeProductsError } = await supabase
      .from('products')
      .select('quantity, minimum_stock')
      .eq('active', true);

    if (activeProductsError) {
      console.error(activeProductsError);
      return res.status(500).json({ message: 'Failed to load dashboard data.' });
    }

    const lowStockProducts = activeProducts.filter(
      (p) => Number(p.quantity) <= Number(p.minimum_stock)
    ).length;

    res.json({
      todaySales,
      billsToday,
      totalProducts: totalProducts || 0,
      lowStockProducts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dashboard data.' });
  }
});

module.exports = router;