-- Run this in the Supabase SQL editor (or via the CLI) before starting the server.

CREATE TABLE IF NOT EXISTS billingsystemusers (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_name_normalized TEXT NOT NULL,
  category TEXT,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT,
  supplier_name TEXT,
  supplier_contact TEXT,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  remarks TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products (active);
CREATE INDEX IF NOT EXISTS idx_products_name_normalized ON products (product_name_normalized);

CREATE TABLE IF NOT EXISTS bills (
  id BIGSERIAL PRIMARY KEY,
  bill_number TEXT UNIQUE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 0,
  bill_date DATE NOT NULL,
  bill_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bills_bill_date ON bills (bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills (bill_number);

CREATE TABLE IF NOT EXISTS bill_items (
  id BIGSERIAL PRIMARY KEY,
  bill_id BIGINT NOT NULL REFERENCES bills(id),
  product_id BIGINT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  selling_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items (bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_product_id ON bill_items (product_id);