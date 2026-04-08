-- Ενεργοποίηση Realtime για τον πίνακα coupons (αυτόματη ενημέρωση στο app πελάτη)
-- Τρέξε μία φορά στο Supabase SQL Editor

ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
