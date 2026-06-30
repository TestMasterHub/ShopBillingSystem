-- Run this after 001_schema.sql in the Supabase SQL editor.
-- This function performs the entire bill-save operation atomically:
-- validates items, locks the relevant product rows, checks stock,
-- generates the bill number, inserts the bill + bill_items, and
-- decrements product stock -- all inside a single transaction.
-- If anything fails, Postgres rolls back the whole operation automatically.

CREATE OR REPLACE FUNCTION create_bill(items_json JSONB, discount_input NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  item JSONB;
  product_row products%ROWTYPE;
  line_total NUMERIC;
  subtotal NUMERIC := 0;
  grand_total NUMERIC;
  discount_value NUMERIC := COALESCE(discount_input, 0);
  new_bill_id BIGINT;
  new_bill_number TEXT;
  date_part TEXT;
  prefix TEXT;
  last_seq INTEGER;
  next_seq INTEGER;
  bill_date_val DATE := CURRENT_DATE;
  bill_time_val TIME := CURRENT_TIME;
  resolved_items JSONB := '[]'::JSONB;
  result_bill JSONB;
  result_items JSONB := '[]'::JSONB;
BEGIN
  IF items_json IS NULL OR jsonb_array_length(items_json) = 0 THEN
    RAISE EXCEPTION 'Bill must contain at least one item.' USING ERRCODE = 'P0001';
  END IF;

  IF discount_value < 0 THEN
    RAISE EXCEPTION 'Discount cannot be negative.' USING ERRCODE = 'P0001';
  END IF;

  -- First pass: validate, lock product rows in a stable order to avoid deadlocks, compute subtotal
  FOR item IN SELECT * FROM jsonb_array_elements(items_json)
  LOOP
    IF (item->>'productId') IS NULL OR (item->>'quantity') IS NULL OR (item->>'quantity')::NUMERIC <= 0 THEN
      RAISE EXCEPTION 'Invalid item in bill.' USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  FOR item IN
    SELECT * FROM jsonb_array_elements(items_json) AS elem
    ORDER BY (elem->>'productId')::BIGINT
  LOOP
    SELECT * INTO product_row
    FROM products
    WHERE id = (item->>'productId')::BIGINT AND active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or inactive.' USING ERRCODE = 'P0001';
    END IF;

    IF (item->>'quantity')::INTEGER > product_row.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %.', product_row.product_name USING ERRCODE = 'P0001';
    END IF;

    line_total := (item->>'quantity')::NUMERIC * product_row.selling_price;
    subtotal := subtotal + line_total;

    resolved_items := resolved_items || jsonb_build_object(
      'productId', product_row.id,
      'productName', product_row.product_name,
      'quantity', (item->>'quantity')::INTEGER,
      'sellingPrice', product_row.selling_price,
      'total', line_total
    );
  END LOOP;

  IF discount_value > subtotal THEN
    RAISE EXCEPTION 'Discount cannot exceed subtotal.' USING ERRCODE = 'P0001';
  END IF;

  grand_total := subtotal - discount_value;

  date_part := to_char(bill_date_val, 'YYYYMMDD');
  prefix := 'TMH-' || date_part || '-';

  SELECT MAX(CAST(split_part(bill_number, '-', 3) AS INTEGER))
  INTO last_seq
  FROM bills
  WHERE bill_number LIKE prefix || '%';

  next_seq := COALESCE(last_seq, 0) + 1;
  new_bill_number := prefix || lpad(next_seq::TEXT, 4, '0');

  INSERT INTO bills (bill_number, subtotal, discount, grand_total, total_items, bill_date, bill_time)
  VALUES (new_bill_number, subtotal, discount_value, grand_total, jsonb_array_length(resolved_items), bill_date_val, bill_time_val)
  RETURNING id INTO new_bill_id;

  FOR item IN SELECT * FROM jsonb_array_elements(resolved_items)
  LOOP
    INSERT INTO bill_items (bill_id, product_id, product_name, quantity, selling_price, total)
    VALUES (
      new_bill_id,
      (item->>'productId')::BIGINT,
      item->>'productName',
      (item->>'quantity')::INTEGER,
      (item->>'sellingPrice')::NUMERIC,
      (item->>'total')::NUMERIC
    );

    UPDATE products
    SET quantity = quantity - (item->>'quantity')::INTEGER,
        updated_at = now()
    WHERE id = (item->>'productId')::BIGINT;

    result_items := result_items || jsonb_build_object(
      'billId', new_bill_id,
      'productId', (item->>'productId')::BIGINT,
      'productName', item->>'productName',
      'quantity', (item->>'quantity')::INTEGER,
      'sellingPrice', (item->>'sellingPrice')::NUMERIC,
      'total', (item->>'total')::NUMERIC
    );
  END LOOP;

  SELECT jsonb_build_object(
    'id', id,
    'billNumber', bill_number,
    'subtotal', subtotal,
    'discount', discount,
    'grandTotal', grand_total,
    'totalItems', total_items,
    'billDate', bill_date,
    'billTime', bill_time,
    'createdAt', created_at
  ) INTO result_bill
  FROM bills
  WHERE id = new_bill_id;

  RETURN result_bill || jsonb_build_object('items', result_items);
END;
$$;