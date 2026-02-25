-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Centers represent tenant wholesale accounts
create table if not exists public.centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  tier_id uuid,
  logo_url text,
  accent_color text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.price_tiers (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

alter table public.centers
  add constraint centers_tier_fk foreign key (tier_id) references public.price_tiers(id);

create table if not exists public.center_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  center_id uuid not null references public.centers(id) on delete cascade,
  role text not null check (role in ('admin','center_user')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sku text not null unique,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Store money in integer cents for exact precision
create table if not exists public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tier_id uuid references public.price_tiers(id) on delete cascade,
  center_id uuid references public.centers(id) on delete cascade,
  price_cents integer not null check (price_cents >= 0),
  created_at timestamptz not null default now(),
  check ((tier_id is not null) <> (center_id is not null))
);

create unique index if not exists product_prices_tier_unique on public.product_prices(product_id, tier_id) where tier_id is not null;
create unique index if not exists product_prices_center_unique on public.product_prices(product_id, center_id) where center_id is not null;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers(id),
  status text not null default 'New' check (status in ('New','Processing','Shipped')),
  contact_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  po_number text,
  notes text,
  total_cents integer not null check (total_cents >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

-- Resolve price by center override first, fallback to center's tier
create or replace function public.catalog_for_center(p_center_id uuid)
returns table (
  id uuid,
  name text,
  description text,
  sku text,
  image_url text,
  active boolean,
  price_cents integer
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.name, p.description, p.sku, p.image_url, p.active,
    coalesce(cp.price_cents, tp.price_cents) as price_cents
  from products p
  join centers c on c.id = p_center_id
  left join product_prices cp on cp.product_id = p.id and cp.center_id = c.id
  left join product_prices tp on tp.product_id = p.id and tp.tier_id = c.tier_id
  where p.active = true and coalesce(cp.price_cents, tp.price_cents) is not null;
$$;

grant execute on function public.catalog_for_center(uuid) to authenticated;

alter table public.centers enable row level security;
alter table public.center_users enable row level security;
alter table public.products enable row level security;
alter table public.price_tiers enable row level security;
alter table public.product_prices enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Helpers to determine current user role/center
create or replace function public.current_center_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select center_id from center_users where user_id = auth.uid() limit 1;
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from center_users where user_id = auth.uid() limit 1;
$$;

grant execute on function public.current_center_id() to authenticated;
grant execute on function public.current_role() to authenticated;

-- Admin read/write all
create policy "admin all centers" on public.centers for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin all center_users" on public.center_users for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin all products" on public.products for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin all tiers" on public.price_tiers for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin all prices" on public.product_prices for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin all orders" on public.orders for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin all order_items" on public.order_items for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- Center scoped access
create policy "center own profile" on public.centers for select using (id = public.current_center_id());
create policy "center own user mapping" on public.center_users for select using (user_id = auth.uid());
create policy "center read active products" on public.products for select using (active = true);
create policy "center read own tier" on public.price_tiers for select using (
  id in (select tier_id from centers where id = public.current_center_id())
);
create policy "center read own pricing" on public.product_prices for select using (
  center_id = public.current_center_id()
  or tier_id in (select tier_id from centers where id = public.current_center_id())
);
create policy "center read own orders" on public.orders for select using (center_id = public.current_center_id());
create policy "center create own orders" on public.orders for insert with check (center_id = public.current_center_id());
create policy "center read own order_items" on public.order_items for select using (
  order_id in (select id from orders where center_id = public.current_center_id())
);
create policy "center insert own order_items" on public.order_items for insert with check (
  order_id in (select id from orders where center_id = public.current_center_id())
);
