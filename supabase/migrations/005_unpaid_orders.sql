-- 005_unpaid_orders.sql

create table if not exists public.unpaid_orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id),
  date date not null,
  order_reference text,
  reason text not null,
  description text not null,
  amount numeric not null check (amount >= 0),
  note text,
  created_at timestamptz not null default now()
);

alter table public.unpaid_orders enable row level security;

drop policy if exists "unpaid_orders select scoped" on public.unpaid_orders;
drop policy if exists "unpaid_orders insert scoped" on public.unpaid_orders;
drop policy if exists "unpaid_orders delete scoped" on public.unpaid_orders;

create policy "unpaid_orders select scoped"
on public.unpaid_orders for select
using (restaurant_id = public.current_restaurant_id());

create policy "unpaid_orders insert scoped"
on public.unpaid_orders for insert
with check (
  restaurant_id = public.current_restaurant_id()
  and public.current_user_role() in ('admin', 'data_entry')
);

create policy "unpaid_orders delete scoped"
on public.unpaid_orders for delete
using (
  restaurant_id = public.current_restaurant_id()
  and (
    public.is_admin_user()
    or public.current_user_role() = 'data_entry'
  )
);
