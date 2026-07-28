# FlickOrder

FlickOrder is a multi-restaurant dine-in operations platform built with Next.js, Supabase, manual UPI subscription verification, and Web Push. Restaurant owners manage menus, tables, reservations, orders, payments, analytics, staff access, and subscriptions. Customers discover approved restaurants, reserve tables, scan table QR codes, order without signing in, and pay directly to the restaurant.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill every required value.
3. Apply every file in `supabase/migrations` to the target Supabase project in timestamp order.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, VAPID private keys, the cron secret, or the super-admin password to browser code.

## Required production configuration

- Supabase URL, anon key, and service-role key
- `NEXT_PUBLIC_APP_URL` set to the canonical HTTPS deployment URL
- One dedicated `SUPER_ADMIN_EMAIL` Auth user whose `profiles.role` is `SUPER_ADMIN`
- A long random `SUPER_ADMIN_ACCESS_PASSWORD`
- `SUBSCRIPTION_PAYMENT_PROVIDER=manual_upi`
- FlickOrder UPI ID and display name for subscription payments
- A long random `CRON_SECRET`
- VAPID public/private keys and subject for device notifications

Vercel runs `/api/maintenance/subscriptions` daily from `vercel.json`. Keep `CRON_SECRET` configured so Vercel signs that request.

## Restaurant onboarding

Registration sends a Supabase confirmation email, uploads verification evidence to a private Storage bucket, and provisions the profile, restaurant, membership, trial, settings, and document records in one PostgreSQL transaction. A super admin must approve the restaurant before it appears publicly.

## Release checks

Run before every production deployment:

```bash
npm run check
npm audit --omit=dev
```

After deployment:

1. Confirm `/api/health` returns HTTP 200 without exposing configuration values.
2. Complete the owner registration and email confirmation flow.
3. Approve a restaurant from `/admin`.
4. Complete one QR order, status update, restaurant payment, reservation, and manual UPI subscription request.
5. Submit a test UPI transaction ID, verify it appears in Super Admin, and confirm approval activates the selected plan once.
6. Verify OWNER, MANAGER, KITCHEN, and WAITER permissions with separate accounts.
7. Confirm push notifications on an HTTPS desktop and mobile browser.

## Data safety

Anonymous customers never write directly to sensitive tables. Validated API handlers use rate limiting and transactional PostgreSQL RPCs. Restaurant data is scoped by membership; public discovery is server-rendered and only includes approved, non-deleted restaurants. Verification documents are private and shared with the super admin through short-lived signed URLs.
