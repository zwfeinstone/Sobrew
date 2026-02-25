# SoBrew Wholesale Portal (Next.js + Supabase)

Multi-tenant wholesale ordering portal built with Next.js App Router, TypeScript, Tailwind, Supabase, and Resend.

## Highlights
- Per-center tenant isolation with strict Supabase RLS
- Admin-managed centers, users, products, and center-specific catalog/pricing
- Customer catalog only shows products enabled for that center
- Money stored in integer cents (`price_cents`, `total_cents`)
- Checkout without payments, order history, reorder, admin order workflow + CSV export

## Setup
1. Install deps
   ```bash
   npm install
   ```
2. Configure env
   ```bash
   cp .env.example .env.local
   ```
3. Run SQL in Supabase SQL editor (in order):
   - `db/migrations/001_init.sql`
   - `db/migrations/002_admin_center_user_catalog.sql`
   - `db/migrations/003_products_admin_fields.sql`
   - `db/migrations/004_products_optional_sku.sql`
   - `db/seeds/001_seed.sql`
4. Create the first admin auth user (Supabase Auth) and insert profile row:
   ```sql
   insert into public.profiles (user_id, email, role, customer_id)
   values ('<auth_user_uuid>', 'admin@yourco.com', 'admin', null);
   ```
5. Run app
   ```bash
   npm run dev
   ```

## Admin onboarding flow (entirely inside app)
1. Log in as admin and open `/admin/centers`.
2. Create a center with contact + shipping details.
3. Open that center at `/admin/centers/[id]`.
4. In **Catalog & Pricing**, mark each product Available/Unavailable and set center-specific price in dollars.
5. Open `/admin/users` and invite the center user by email (Supabase Admin API).
6. Assign the invited user to the center (role `customer`).
7. Center user logs in and sees only that center's catalog/prices/orders.

## Key pages
- `/login`
- Customer: `/catalog`, `/catalog/[id]`, `/cart`, `/checkout`, `/orders`, `/orders/[id]`
- Admin: `/admin`, `/admin/centers`, `/admin/centers/[id]`, `/admin/users`, `/admin/products`, `/admin/orders`

## Notes
- If a center is set inactive, customer access is blocked on customer routes.
- Shipping is included in catalog price display.
- Emails sent on new order + confirmation; shipped email on status change to `Shipped`.
