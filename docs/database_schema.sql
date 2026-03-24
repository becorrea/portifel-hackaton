-- docs/database_schema.sql
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_id UUID REFERENCES brokers(id),
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  error_message TEXT,
  raw_ai_output JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statement_id UUID REFERENCES statements(id) ON DELETE SET NULL,
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'fii', 'bdr', 'fixed_income', 'crypto', 'international')),
  operation TEXT NOT NULL CHECK (operation IN ('buy', 'sell', 'income', 'split', 'bonus')),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL UNIQUE,
  price NUMERIC,
  change_pct NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT CHECK (source IN ('brapi', 'yfinance'))
);

CREATE TABLE IF NOT EXISTS dividends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dividend', 'jcp', 'income', 'coupon')),
  value_per_unit NUMERIC NOT NULL,
  ex_date DATE,
  payment_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_statements" ON statements
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- Seed brokers
INSERT INTO brokers (name) VALUES
  ('XP Investimentos'),
  ('Nu Invest'),
  ('Inter'),
  ('BTG Pactual'),
  ('Clear Corretora'),
  ('B3')
ON CONFLICT (name) DO NOTHING;
