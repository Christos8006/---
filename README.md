# ΤΑΚΗΣ Fast Food — Σύστημα Κουπονιών

Εφαρμογή επιβράβευσης πελατών για το **ΤΑΚΗΣ Fast Food** (Βόλου 75, Λάρισα).

---

## Λειτουργία

| Παραγγελία | Κουπόνι |
|---|---|
| €10 – €19.99 | **€1 έκπτωση** |
| €20+ | **€2 έκπτωση** |

- Ο πελάτης φωτογραφίζει την απόδειξη → OCR αναγνωρίζει το ποσό → δημιουργείται κουπόνι με QR code
- Κάθε κουπόνι ισχύει **30 μέρες** και μπορεί να εξαργυρωθεί **μόνο 1 φορά**
- Κάθε απόδειξη μπορεί να χρησιμοποιηθεί **μόνο μία φορά** (anti-fraud)
- Ο ταμίας σκανάρει το QR από το κινητό του πελάτη

---

## Εγκατάσταση

### 1. Supabase (Βάση Δεδομένων)

1. Δημιούργησε δωρεάν λογαριασμό στο [supabase.com](https://supabase.com)
2. Δημιούργησε νέο project
3. Πήγαινε στο **SQL Editor** και τρέξε το αρχείο `supabase/schema.sql`
4. Αντέγραψε τα credentials από **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Google Cloud Vision API (OCR)

1. Πήγαινε στο [console.cloud.google.com](https://console.cloud.google.com)
2. Δημιούργησε νέο project
3. Ενεργοποίησε το **Cloud Vision API**
4. Δημιούργησε **API Key** από Credentials
5. Αντέγραψε το key → `GOOGLE_VISION_API_KEY`

### 3. Ρύθμισε το `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GOOGLE_VISION_API_KEY=AIza...
ADMIN_SECRET=takis-admin-2024
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
| `/` | Landing page |
| `/register` | Εγγραφή |
| `/login` | Σύνδεση |
| `/scan` | Σκάναρε απόδειξη |
| `/coupons` | Τα κουπόνια μου |
| `/profile` | Στοιχεία & ιστορικό |

### Ταμίας (Admin)
| URL | Λειτουργία |
|---|---|
| `/admin/login` | Είσοδος υπαλλήλου |
| `/admin/scan` | Σκάναρε QR πελάτη |
| `/admin/coupons` | Λίστα κουπονιών |

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
