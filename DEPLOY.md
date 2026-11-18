# Kitab: setup and deployment checklist

## 1. Supabase project
1. Create a project at supabase.com.
2. SQL editor: run, in this order, `supabase/001_schema.sql` … `007_public_gifts.sql`.
   - Before 002: register one **Author** account in the running app (002 attaches demo books to the first author). If you
     would rather start with no demo data, skip the demo-books block in 002 and keep the categories.
   - Re-run order matters; each file assumes the previous ones.
3. Authentication → URL configuration: set Site URL to your domain and add `https://YOUR-DOMAIN/auth/callback` (and the localhost one)
   to Redirect URLs. Keep **Confirm email** switched on in production.
4. Authentication → Email: configure a real SMTP provider; the built-in mailer is for testing only.
5. Storage: buckets `book-covers` (public), `book-files` and `payment-proofs` (private) are created by 003; limits by 005.

## 2. Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server only; never expose it, never prefix with NEXT_PUBLIC_
NEXT_PUBLIC_SITE_URL=https://YOUR-DOMAIN
```

## 3. First admin
Register normally, then in Supabase → Table editor → `profiles`, set your row's `role` to `admin`. (This cannot be done from the app, by design.)
Then open `/admin/settings` and fill in: Telebirr number and account name, commission %, minimum withdrawal, contact details, Terms and Privacy.

## 4. Deploy
- `npm install && npm run build && npm start`, or deploy to Vercel/any Node host.
- Vercel limits request bodies to ~4.5 MB, which is why payment screenshots are capped at 4 MB. Book files upload straight to Supabase Storage and are not affected.
- Remove demo data before launch: `delete from books where is_sample_data;`

## 5. Before taking real money: test both journeys by hand
Customer: register → browse → add to cart → checkout → upload receipt → admin approves → book in library → read and download.
Author: register as author → admin approves author → upload → admin approves book → customer buys → check earnings → request withdrawal → admin approves and marks paid.
Also try: reject a payment and resubmit; reuse a Telebirr reference (must be refused); open another user's `/read/...` and `/orders/...` URL (must 404); a reader trying to open `/admin` (must 404).

## Not built (known gaps)
Interface translations (am/om/ti), rate limiting, admin charts, refund flow, sample-page preview, mobile/Kindle formats, a separate admin login page (admins use /login).
Verify every payment against your real Telebirr statement before approving: the app cannot confirm a payment by itself.
