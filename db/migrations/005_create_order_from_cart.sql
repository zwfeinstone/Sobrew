-- Restore tenancy helpers to center_users model
create or replace function public.current_center_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select center_id from public.center_users where user_id = auth.uid() limit 1;
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.center_users where user_id = auth.uid() limit 1;
$$;

grant execute on function public.current_center_id() to authenticated;
grant execute on function public.current_role() to authenticated;

-- Atomic checkout RPC using authoritative pricing from product_prices
create or replace function public.create_order_from_cart(
  p_items jsonb,
  p_shipping jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_center_id uuid;
  v_role text;
  v_tier_id uuid;
  v_order_id uuid;
  v_total_cents integer := 0;
  v_contact_name text;
  v_phone text;
  v_address_line1 text;
  v_address_line2 text;
  v_city text;
  v_state text;
  v_postal_code text;
  v_po_number text;
  v_notes text;
  v_item_count integer;
  v_valid_count integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Invalid cart payload';
  end if;

  select cu.center_id, cu.role
    into v_center_id, v_role
  from public.center_users cu
  where cu.user_id = auth.uid()
  limit 1;

  if v_center_id is null then
    raise exception 'No center mapping for authenticated user';
  end if;

  if v_role <> 'center_user' then
    raise exception 'Only center users can create orders';
  end if;

  select c.tier_id into v_tier_id
  from public.centers c
  where c.id = v_center_id;

  if v_tier_id is null then
    raise exception 'Center tier not configured';
  end if;

  v_contact_name := nullif(trim(coalesce(p_shipping->>'contact_name', '')), '');
  v_phone := nullif(trim(coalesce(p_shipping->>'phone', '')), '');
  v_address_line1 := nullif(trim(coalesce(p_shipping->>'address_line1', '')), '');
  v_address_line2 := nullif(trim(coalesce(p_shipping->>'address_line2', '')), '');
  v_city := nullif(trim(coalesce(p_shipping->>'city', '')), '');
  v_state := nullif(trim(coalesce(p_shipping->>'state', '')), '');
  v_postal_code := nullif(trim(coalesce(p_shipping->>'postal_code', '')), '');
  v_po_number := nullif(trim(coalesce(p_shipping->>'po_number', '')), '');
  v_notes := nullif(trim(coalesce(p_shipping->>'notes', '')), '');

  if v_contact_name is null or v_phone is null or v_address_line1 is null or v_city is null or v_state is null or v_postal_code is null then
    raise exception 'Missing required shipping fields';
  end if;

  with parsed_items as (
    select
      (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) item
  ),
  normalized as (
    select product_id, sum(quantity)::integer as quantity
    from parsed_items
    group by product_id
  ),
  priced as (
    select
      n.product_id,
      n.quantity,
      coalesce(cp.price_cents, tp.price_cents) as price_cents
    from normalized n
    join public.products p on p.id = n.product_id and p.active = true
    left join public.product_prices cp
      on cp.product_id = n.product_id
     and cp.center_id = v_center_id
    left join public.product_prices tp
      on tp.product_id = n.product_id
     and tp.tier_id = v_tier_id
    where n.quantity > 0
  )
  select count(*) into v_item_count from normalized;

  if v_item_count is null or v_item_count = 0 then
    raise exception 'Cart is empty';
  end if;

  with parsed_items as (
    select
      (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) item
  ),
  normalized as (
    select product_id, sum(quantity)::integer as quantity
    from parsed_items
    group by product_id
  ),
  priced as (
    select
      n.product_id,
      n.quantity,
      coalesce(cp.price_cents, tp.price_cents) as price_cents
    from normalized n
    join public.products p on p.id = n.product_id and p.active = true
    left join public.product_prices cp
      on cp.product_id = n.product_id
     and cp.center_id = v_center_id
    left join public.product_prices tp
      on tp.product_id = n.product_id
     and tp.tier_id = v_tier_id
    where n.quantity > 0
  )
  select count(*) into v_valid_count
  from priced
  where price_cents is not null;

  if v_valid_count <> v_item_count then
    raise exception 'Cart contains unavailable or unpriced items';
  end if;

  insert into public.orders (
    center_id,
    status,
    contact_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    po_number,
    notes,
    total_cents
  )
  values (
    v_center_id,
    'New',
    v_contact_name,
    v_phone,
    v_address_line1,
    v_address_line2,
    v_city,
    v_state,
    v_postal_code,
    v_po_number,
    v_notes,
    0
  )
  returning id into v_order_id;

  with parsed_items as (
    select
      (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) item
  ),
  normalized as (
    select product_id, sum(quantity)::integer as quantity
    from parsed_items
    group by product_id
  ),
  priced as (
    select
      n.product_id,
      n.quantity,
      coalesce(cp.price_cents, tp.price_cents) as price_cents
    from normalized n
    join public.products p on p.id = n.product_id and p.active = true
    left join public.product_prices cp
      on cp.product_id = n.product_id
     and cp.center_id = v_center_id
    left join public.product_prices tp
      on tp.product_id = n.product_id
     and tp.tier_id = v_tier_id
    where n.quantity > 0
  )
  insert into public.order_items (
    order_id,
    product_id,
    quantity,
    unit_price_cents,
    line_total_cents
  )
  select
    v_order_id,
    product_id,
    quantity,
    price_cents,
    quantity * price_cents
  from priced;

  select coalesce(sum(line_total_cents), 0)
    into v_total_cents
  from public.order_items
  where order_id = v_order_id;

  if v_total_cents <= 0 then
    raise exception 'Unable to compute order total';
  end if;

  update public.orders
  set total_cents = v_total_cents
  where id = v_order_id;

  return v_order_id;
end;
$$;

grant execute on function public.create_order_from_cart(jsonb, jsonb) to authenticated;

-- Harden RLS for order writes: center users can read their own order/items but cannot write items directly.
do $$
declare p record;
begin
  for p in
    select tablename, policyname
    from pg_policies
    where schemaname='public'
      and tablename in ('orders', 'order_items')
      and policyname ilike 'customer%'
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;

  for p in
    select tablename, policyname
    from pg_policies
    where schemaname='public'
      and tablename in ('orders', 'order_items')
      and policyname ilike 'center%'
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy "center read own orders" on public.orders
for select
using (center_id = public.current_center_id());

create policy "center create own orders" on public.orders
for insert
with check (
  center_id = public.current_center_id()
  and status = 'New'
  and public.current_role() = 'center_user'
);

create policy "center read own order_items" on public.order_items
for select
using (order_id in (select id from public.orders where center_id = public.current_center_id()));

-- Explicitly keep admin full access for orders/order_items
create policy "admin all orders" on public.orders
for all
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

create policy "admin all order_items" on public.order_items
for all
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');
