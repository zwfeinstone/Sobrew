-- Add center account metadata for in-app onboarding
alter table public.centers
  add column if not exists contact_email text,
  add column if not exists shipping_line1 text,
  add column if not exists shipping_line2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip text,
  add column if not exists is_active boolean not null default true;

-- Profiles map auth users to role + center account
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','customer')),
  customer_id uuid references public.centers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

-- Center-specific product catalog and pricing
create table if not exists public.customer_products (
  customer_id uuid not null references public.centers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  is_available boolean not null default false,
  price_cents integer not null check (price_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);

drop trigger if exists trg_customer_products_updated_at on public.customer_products;
create trigger trg_customer_products_updated_at
before update on public.customer_products
for each row execute function public.touch_updated_at();

-- Role helpers now use profiles
create or replace function public.current_customer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select customer_id from profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where user_id = auth.uid() limit 1;
$$;

grant execute on function public.current_customer_id() to authenticated;
grant execute on function public.current_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.customer_products enable row level security;

-- Remove older policies where helper semantics changed
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname='public' AND tablename in ('centers','center_users','products','price_tiers','product_prices','orders','order_items')
  LOOP
    EXECUTE format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- Admin policies
create policy "admin manage centers" on public.centers for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin manage products" on public.products for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin manage customer_products" on public.customer_products for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin manage profiles" on public.profiles for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin manage orders" on public.orders for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin manage order_items" on public.order_items for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- Customer policies
create policy "customer own center" on public.centers for select using (id = public.current_customer_id() and is_active = true);
create policy "customer own profile" on public.profiles for select using (user_id = auth.uid());
create policy "customer read available products" on public.products for select using (
  active = true and exists (
    select 1 from public.customer_products cp
    where cp.product_id = products.id
      and cp.customer_id = public.current_customer_id()
      and cp.is_available = true
  )
);
create policy "customer read own customer_products" on public.customer_products for select using (
  customer_id = public.current_customer_id() and is_available = true
);
create policy "customer read own orders" on public.orders for select using (center_id = public.current_customer_id());
create policy "customer create own orders" on public.orders for insert with check (center_id = public.current_customer_id());
create policy "customer read own order_items" on public.order_items for select using (
  order_id in (select id from public.orders where center_id = public.current_customer_id())
);
create policy "customer create own order_items" on public.order_items for insert with check (
  order_id in (select id from public.orders where center_id = public.current_customer_id())
);

-- Lock legacy tables from customer use
create policy "admin manage center_users" on public.center_users for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin manage price_tiers" on public.price_tiers for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin manage product_prices" on public.product_prices for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
