create table if not exists public.daily_stock_counts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id),
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  count_date date not null,
  closing_quantity numeric not null check (closing_quantity >= 0),
  waste_quantity numeric not null default 0 check (waste_quantity >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, inventory_item_id, count_date)
);

alter table public.daily_stock_counts enable row level security;

create policy "restaurant scope select daily_stock_counts"
on public.daily_stock_counts for select
using (restaurant_id = public.current_restaurant_id());

create policy "restaurant scope insert daily_stock_counts"
on public.daily_stock_counts for insert
with check (restaurant_id = public.current_restaurant_id());

create policy "admin update daily_stock_counts"
on public.daily_stock_counts for update
using (
  restaurant_id = public.current_restaurant_id()
  and exists (
    select 1
    from public.admin_profiles ap
    where ap.id = auth.uid()
      and ap.restaurant_id = public.daily_stock_counts.restaurant_id
      and ap.role = 'admin'
  )
)
with check (
  restaurant_id = public.current_restaurant_id()
  and exists (
    select 1
    from public.admin_profiles ap
    where ap.id = auth.uid()
      and ap.restaurant_id = public.daily_stock_counts.restaurant_id
      and ap.role = 'admin'
  )
);

create policy "admin delete daily_stock_counts"
on public.daily_stock_counts for delete
using (
  restaurant_id = public.current_restaurant_id()
  and exists (
    select 1
    from public.admin_profiles ap
    where ap.id = auth.uid()
      and ap.restaurant_id = public.daily_stock_counts.restaurant_id
      and ap.role = 'admin'
  )
);
