const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { ensureAdminUser } = require('./db/ensureAdminUser');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const billRoutes = require('./routes/bills');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;

// Ensure the admin user exists. This runs on every cold start in serverless
// environments (Vercel) and once on boot in a traditional long-running
// server. It does not block module export so Vercel can pick up `app`
// immediately.
ensureAdminUser().catch((err) => {
  console.error('Failed to initialize Supabase admin user:', err);
});

// Only call app.listen() when running as a traditional long-running server
// (local dev, or any non-Vercel host). On Vercel, the platform itself wraps
// the exported `app` as a serverless function and must not have listen()
// called explicitly.
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Shop Billing System server running on port ${PORT}`);
  });
}

module.exports = app;