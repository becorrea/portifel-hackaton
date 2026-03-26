-- Migration v3: Smart merge for incremental uploads
-- Run this in Supabase SQL Editor

-- 1. Add source column to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'movement'
  CHECK (source IN ('position_snapshot', 'movement'));

-- 2. Unique index to deduplicate movements (same ticker + date + operation + amount = same transaction)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_movement_dedup
  ON transactions (user_id, ticker, date, operation, total_value)
  WHERE source = 'movement';
