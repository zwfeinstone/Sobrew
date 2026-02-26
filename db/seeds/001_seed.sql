-- Price tiers
insert into public.price_tiers (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Standard Tier'),
  ('22222222-2222-2222-2222-222222222222', 'Premium Tier')
on conflict do nothing;

-- Centers
insert into public.centers (id, name, slug, tier_id, logo_url, accent_color, notes, contact_email, shipping_line1, shipping_line2, city, state, zip, is_active)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sunrise Recovery Center', 'sunrise', '11111111-1111-1111-1111-111111111111', 'https://picsum.photos/seed/sunrise/160/80', '#1455A6', 'Priority shipping on Mondays', 'purchasing@sunrise.test', '123 Main St', null, 'Austin', 'TX', '78701', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Clearwater Wellness', 'clearwater', '22222222-2222-2222-2222-222222222222', 'https://picsum.photos/seed/clearwater/160/80', '#0F766E', null, 'orders@clearwater.test', '55 Harbor Rd', 'Suite 100', 'Miami', 'FL', '33101', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'North Star Treatment', 'north-star', '11111111-1111-1111-1111-111111111111', 'https://picsum.photos/seed/northstar/160/80', '#7C3AED', null, 'supply@northstar.test', '900 Pine Ave', null, 'Denver', 'CO', '80202', true)
on conflict do nothing;

-- Products
insert into public.products (id, name, description, sku, image_url, active, sort_order, unit)
values
  ('10000000-0000-0000-0000-000000000001', 'SoBrew Morning Blend', 'Smooth and balanced medium roast', 'SB-MORNING', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800', true, 1, 'bag'),
  ('10000000-0000-0000-0000-000000000002', 'SoBrew Dark Roast', 'Bold profile for concentrated brews', 'SB-DARK', 'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=800', true, 2, 'bag'),
  ('10000000-0000-0000-0000-000000000003', 'Decaf Comfort', 'Swiss-water processed decaf', 'SB-DECAF', 'https://images.unsplash.com/photo-1459755486867-b55449bb39ff?w=800', true, 3, 'bag'),
  ('10000000-0000-0000-0000-000000000004', 'Citrus Herbal Tea', 'Caffeine-free tea sachets', 'SB-TEA-CIT', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800', true, 4, 'case'),
  ('10000000-0000-0000-0000-000000000005', 'Vanilla Protein Shake', 'Ready-to-mix nutrition support', 'SB-SHAKE-VAN', 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800', true, 5, 'case'),
  ('10000000-0000-0000-0000-000000000006', 'Hydration Electrolyte Pack', 'Single-serve hydration packets', 'SB-HYDRATE', 'https://images.unsplash.com/photo-1551024709-8f23befc6cf0?w=800', true, 6, 'case')
on conflict (id) do update set
  name=excluded.name,
  description=excluded.description,
  sku=excluded.sku,
  image_url=excluded.image_url,
  active=excluded.active,
  sort_order=excluded.sort_order,
  unit=excluded.unit;

-- Tier pricing in cents
insert into public.product_prices (product_id, tier_id, price_cents)
values
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 1250),
  ('10000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 1399),
  ('10000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 1199),
  ('10000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 999),
  ('10000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 1699),
  ('10000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 899),
  ('10000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 1175),
  ('10000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 1299),
  ('10000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 1099),
  ('10000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 949),
  ('10000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 1599),
  ('10000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 850)
on conflict do nothing;

-- Center-specific override example
insert into public.product_prices (product_id, center_id, price_cents)
values ('10000000-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1499)
on conflict do nothing;
