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
   - `db/migrations/005_create_order_from_cart.sql`
   - `db/seeds/001_seed.sql`
4. Create auth users (Supabase Auth) and map them in `center_users`:
   ```sql
   -- admin user mapping
   insert into public.center_users (user_id, center_id, role)
   values ('<admin_auth_user_uuid>', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin');

   -- center user mapping
   insert into public.center_users (user_id, center_id, role)
   values ('<center_auth_user_uuid>', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'center_user');
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
6. Assign the invited user to the center (role `center_user`).
7. Center user logs in and sees only that center's catalog/prices/orders.

## Key pages
- `/login`
- Customer: `/catalog`, `/catalog/[id]`, `/cart`, `/checkout`, `/orders`, `/orders/[id]`
- Admin: `/admin`, `/admin/centers`, `/admin/centers/[id]`, `/admin/users`, `/admin/products`, `/admin/orders`

## Notes
- If a center is set inactive, customer access is blocked on customer routes.
- Shipping is included in catalog price display.
- Emails sent on new order + confirmation; shipped email on status change to `Shipped`.


## Checkout integrity
- Orders are repriced server-side using center-specific override pricing (or tier fallback) inside Postgres RPC `create_order_from_cart`.
- Orders + line items are created transactionally to prevent orphan orders and client-side cart tampering.
