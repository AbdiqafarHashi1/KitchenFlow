-- 003_usage_expenses.sql

create table if not exists public.daily_expenses (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id),
  expense_date date not null,
  category text not null,
  amount numeric not null check (amount >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_expenses enable row level security;

drop policy if exists "daily_expenses select scoped" on public.daily_expenses;
drop policy if exists "daily_expenses insert scoped" on public.daily_expenses;
drop policy if exists "daily_expenses update admin scoped" on public.daily_expenses;
drop policy if exists "daily_expenses delete admin scoped" on public.daily_expenses;

create policy "daily_expenses select scoped"
on public.daily_expenses for select
using (restaurant_id = public.current_restaurant_id());

create policy "daily_expenses insert scoped"
on public.daily_expenses for insert
with check (
  restaurant_id = public.current_restaurant_id()
  and public.current_user_role() in ('admin', 'data_entry')
);

create policy "daily_expenses update admin scoped"
on public.daily_expenses for update
using (
  restaurant_id = public.current_restaurant_id()
  and public.is_admin_user()
)
with check (
  restaurant_id = public.current_restaurant_id()
  and public.is_admin_user()
);

create policy "daily_expenses delete admin scoped"
on public.daily_expenses for delete
using (
  restaurant_id = public.current_restaurant_id()
  and public.is_admin_user()
);

drop policy if exists "inventory_movements insert scoped" on public.inventory_movements;

create policy "inventory_movements insert scoped"
on public.inventory_movements for insert
with check (
  restaurant_id = public.current_restaurant_id()
  and (
    public.is_admin_user()
    or (
      public.current_user_role() = 'data_entry'
      and movement_type in ('purchase', 'usage')
    )
  )
);
