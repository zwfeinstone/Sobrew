alter table public.products
  add column if not exists unit text,
  add column if not exists sort_order integer not null default 0;

create index if not exists products_sort_order_idx on public.products(sort_order, name);
