-- Migration v2: Expand constraints + disable RLS for dev
-- Run this in Supabase SQL Editor

-- 1. Expand asset_type and operation constraints
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_asset_type_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_operation_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_asset_type_check
  CHECK (asset_type IN ('stock', 'fii', 'bdr', 'fixed_income', 'crypto', 'international', 'fund'));

ALTER TABLE transactions
  ADD CONSTRAINT transactions_operation_check
  CHECK (operation IN ('buy', 'sell', 'income', 'split', 'bonus', 'dividend', 'application', 'redemption'));

-- 2. Disable RLS for development (re-enable in production)
ALTER TABLE statements DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 3. Ensure market_prices and dividends have no RLS issues
ALTER TABLE market_prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE dividends DISABLE ROW LEVEL SECURITY;

-- 4. Add error_message column if missing
ALTER TABLE statements ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 5. Add unique constraint on dividends(ticker, ex_date) if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'dividends_ticker_ex_date_key'
       OR conname = 'dividends_ticker_ex_date_unique'
  ) THEN
    ALTER TABLE dividends ADD CONSTRAINT dividends_ticker_ex_date_unique UNIQUE (ticker, ex_date);
  END IF;
END $$;
