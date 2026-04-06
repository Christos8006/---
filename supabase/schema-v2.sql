-- ΤΑΚΗΣ Loyalty v2 - Guest Customer Flow (χωρίς login)
-- Τρέξε αυτό στο Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Νέος πίνακας: customers (χωρίς auth)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Αφαίρεση παλιών πινάκων (αν υπάρχουν) και αναδημιουργία
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.receipts CASCADE;

-- ==========================================
-- Receipts table (τώρα συνδεδεμένο με customers)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  receipt_hash TEXT UNIQUE NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Coupons table (τώρα συνδεδεμένο με customers)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  receipt_id UUID REFERENCES public.receipts(id) ON DELETE CASCADE NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  is_redeemed BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- Χωρίς RLS για customers/receipts/coupons
-- (όλη η πρόσβαση γίνεται μέσω Server API με service role)
-- ==========================================
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- profiles παραμένει για admin auth
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Trigger για auto-create profile στο signup admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
