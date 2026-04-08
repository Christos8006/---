-- ΤΑΚΗΣ Loyalty v3 — Λογαριασμός πελάτη + έκδοση κουπονιού από ταμείο
-- Τρέξε στο Supabase SQL Editor (ΠΡΟΣΟΧΗ: διαγράφει παλιά coupons/receipts/customers)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Στήλες προφίλ πελάτη
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS surname TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_member_code_unique
  ON public.profiles (member_code) WHERE member_code IS NOT NULL;

-- Μοναδικός κωδικός μέλους (10 χαρακτήρες)
CREATE OR REPLACE FUNCTION public.generate_member_code() RETURNS TEXT AS $$
DECLARE
  chars CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
  attempts INT := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..10 LOOP
      result := result || substr(chars, (floor(random() * length(chars))::int + 1), 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE member_code = result);
    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'generate_member_code failed';
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Νέοι χρήστες: προφίλ με member_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, surname, phone, member_code, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'name', ''), ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'surname', ''),
    NEW.raw_user_meta_data->>'phone',
    public.generate_member_code(),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Παλιοί πίνακες guest
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.receipts CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;

-- Κουπόνια: δένονται στον χρήστη (profiles.id = auth.users.id)
CREATE TABLE public.coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10, 2) NOT NULL CHECK (discount_amount IN (1, 2)),
  qr_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  is_redeemed BOOLEAN DEFAULT FALSE,
  issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;

-- Πίσω-fill member_code για υπάρχοντες χρήστες χωρίς κωδικό
UPDATE public.profiles p
SET member_code = public.generate_member_code()
WHERE p.member_code IS NULL;
