# ΤΑΚΗΣ Fast Food — Σύστημα Κουπονιών

Εφαρμογή επιβράβευσης πελατών για το **ΤΑΚΗΣ Fast Food** (Βόλου 75, Λάρισα).

---

## Λειτουργία (v3 — λογαριασμός + ταμείο)

| Παραγγελία | Κουπόνι |
|---|---|
| €10 – €19.99 | **€1 έκπτωση** |
| €20+ | **€2 έκπτωση** |

1. Στο μαγαζί: QR προς `/join` (εκτύπωση) → ο πελάτης κάνει **εγγραφή** (όνομα, επίθετο, κινητό, email, κωδικός).
2. Στον **λογαριασμό** (`/account`) εμφανίζεται **μοναδικό QR μέλους** — ο ταμίας το σκανάρει από το κινητό του πελάτη.
3. **Έκδοση κουπονιού** (`/admin/issue`): μετά το σκάναρισμα, ο ταμίας πατάει **€1** ή **€2** (ανάλογα με την αγορά). Στέλνεται **email** με τον κωδικό κουπονιού.
4. **Εξαργύρωση** (`/admin/scan`): σκάναρισμα του κωδικού/QR του κουπονιού. Κάθε κουπόνι **30 μέρες**, **μία χρήση**.

**Βάση:** τρέξε `supabase/schema-v3.sql` (διαγράφει παλιά guest πίνακα `customers` / `receipts` αν υπήρχαν).

---

## Εγκατάσταση

### 1. Supabase (Βάση Δεδομένων)

1. Δημιούργησε δωρεάν λογαριασμό στο [supabase.com](https://supabase.com)
2. Δημιούργησε νέο project
3. Πήγαινε στο **SQL Editor** και τρέξε `supabase/schema-v3.sql` (ή πρώτα `schema.sql` για νέο project, μετά προσαρμογές)
4. Αντέγραψε τα credentials από **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Resend (email κουπονιού)

- `RESEND_API_KEY` στο `.env.local` και στο Vercel

### 3. Ρύθμισε το `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_SECRET=takis-admin-2024
RESEND_API_KEY=re_...
```

### 4. Εκκίνηση

```bash
npm install
npm run dev
```

Άνοιξε το [http://localhost:3000](http://localhost:3000)

---

## Δημιουργία Admin Λογαριασμού (για ταμία)

Αφού ξεκινήσει η εφαρμογή, κάνε ένα POST request:

```bash
curl -X POST http://localhost:3000/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@takis.gr",
    "password": "κωδικός-ταμία",
    "name": "ΤΑΚΗΣ Admin",
    "secret": "takis-admin-2024"
  }'
```

Ή χρησιμοποίησε το [Postman](https://postman.com) / [Hoppscotch](https://hoppscotch.io).

---

## Σελίδες

### Πελάτης
| URL | Λειτουργία |
|---|---|
| `/` | Αρχική |
| `/join` | QR καταστήματος → εγγραφή |
| `/register` | Εγγραφή |
| `/login` | Σύνδεση |
| `/account` | QR μέλους + κουπόνια |
| `/forgot-password` | Ανάκτηση κωδικού (email) |

### Ταμίας (Admin)
| URL | Λειτουργία |
|---|---|
| `/admin/login` | Είσοδος |
| `/admin/issue` | Σκάναρε QR μέλους → έκδοση €1 / €2 |
| `/admin/scan` | Εξαργύρωση κουπονιού |
| `/admin/coupons` | Λίστα |

---

## Deploy στο Vercel (δωρεάν)

1. Πήγαινε στο [vercel.com](https://vercel.com)
2. Σύνδεσε το GitHub repository
3. Πρόσθεσε τις environment variables από το `.env.local`
4. Deploy!

---

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (PostgreSQL + Auth + Storage)
- **Google Cloud Vision API** (OCR)
- **Tailwind CSS** + **shadcn/ui**
- **qrcode** (δημιουργία QR) + **html5-qrcode** (σκάναρισμα)
