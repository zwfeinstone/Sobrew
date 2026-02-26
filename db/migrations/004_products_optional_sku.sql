alter table public.products
  alter column sku drop not null;

-- Keep uniqueness for provided skus
create unique index if not exists products_sku_unique_not_null on public.products(sku) where sku is not null;
