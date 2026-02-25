# SoBrew Wholesale Portal (Next.js + Supabase)

Production-ready multi-tenant wholesale ordering portal built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## Features

- Center-based tenancy with Supabase Auth email/password login
- Strict row-level security (RLS) for tenant isolation
- Tier pricing plus center-specific price overrides
- Catalog, product detail, cart, checkout (no payments), order history, reorder
- Admin area (products, tiers, centers, orders, status updates, CSV export)
- Email notifications via Resend for new orders + confirmations (+ shipped status)
- Brand theming via environment settings and center logo/accent fields

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres + RLS
- Resend (server-side email)

## Local setup

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create env file**
   ```bash
   cp .env.example .env.local
   ```
   Fill all values from your Supabase + Resend projects.
3. **Create Supabase schema**
   - Open Supabase SQL Editor.
   - Run `db/migrations/001_init.sql`.
4. **Seed sample data**
   - Run `db/seeds/001_seed.sql`.
5. **Create auth users and map them to centers**
   - Create users in Supabase Auth (email/password).
   - Insert mappings in `center_users` (`user_id`, `center_id`, `role`).
   - Create your first admin by inserting a `center_users` row with `role='admin'`.
6. **Run app**
   ```bash
   npm run dev
   ```

## Key pages

- `/login` - Center/Admin login
- `/catalog` - Center-specific product catalog and pricing
- `/catalog/[id]` - Product detail
- `/cart` - Cart quantity controls and subtotal
- `/checkout` - Shipping details + order submit
- `/orders` - Order history
- `/orders/[id]` - Order detail + reorder trigger
- `/admin` - Admin dashboard
- `/admin/products` - Product CRUD (create/list baseline)
- `/admin/tiers` - Tier CRUD (create/list baseline)
- `/admin/centers` - Center notes management
- `/admin/orders` and `/admin/orders/[id]` - Order management/status

## Money precision

All prices and totals are stored as `integer` cents in Postgres (`price_cents`, `total_cents`, etc.) and formatted to dollars/cents in UI.

## Email events

- On checkout submit:
  - New order email to `ORDER_NOTIFICATION_EMAIL` (defaults to `hello@sobrew.com`)
  - Confirmation email to the center user
- On admin status change to `Shipped`:
  - Shipped update email to the center user

## RLS summary

- Center users can only access:
  - Their own center profile
  - Their own pricing context (center override or assigned tier)
  - Their own orders + line items
- Admin users can read/write all portal tables.

## Notes

- Product images are URL-based (Supabase Storage optional later).
- CSV export is available at `/api/admin/export-orders`.
- Reorder endpoint prepares payload from previous order items.
