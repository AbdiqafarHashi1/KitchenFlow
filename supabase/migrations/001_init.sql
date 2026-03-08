create extension if not exists "pgcrypto";

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  phone text,
  address text,
  currency text not null default 'KES',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id),
  full_name text,
  role text default 'admin',
  created_at timestamptz default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id),
  full_name text not null,
  role text not null,
  phone text,
  salary_type text not null default 'monthly' check (salary_type in ('monthly','weekly','daily')),
  base_salary numeric not null default 0,
  start_date date,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.staff_advances (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id),
  staff_id uuid not null references public.staff(id) on delete cascade,
  advance_date date not null,
  amount numeric not null,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.payroll_records (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id),
  staff_id uuid not null references public.staff(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  base_salary numeric not null default 0,
  advances_total numeric not null default 0,
  other_deductions numeric not null default 0,
  tax_deduction numeric not null default 0,
  net_payable numeric not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid')),
  payment_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id),
  name text not null,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id),
  category_id uuid references public.inventory_categories(id),
  name text not null,
  unit text not null,
  current_quantity numeric not null default 0,
  min_quantity numeric not null default 0,
  average_unit_cost numeric not null default 0,
  supplier_name text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id),
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  movement_type text not null check (movement_type in ('purchase','usage','waste','adjustment')),
  quantity numeric not null,
  unit_cost numeric,
  total_cost numeric,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id),
  inventory_item_id uuid not null references public.inventory_items(id),
  supplier_name text,
  quantity numeric not null,
  unit_cost numeric not null,
  total_cost numeric not null,
  purchase_date date not null,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.daily_sales (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id),
  sales_date date not null,
  sales_amount numeric not null,
  source text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.restaurants enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.staff enable row level security;
alter table public.staff_advances enable row level security;
alter table public.payroll_records enable row level security;
alter table public.inventory_categories enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.purchases enable row level security;
alter table public.daily_sales enable row level security;

create or replace function public.current_restaurant_id()
returns uuid
language sql
stable
as $$
  select restaurant_id from public.admin_profiles where id = auth.uid()
$$;

create policy "Admins can manage own restaurant"
on public.restaurants for all
using (id = public.current_restaurant_id()) with check (id = public.current_restaurant_id());

create policy "Admins can manage own profile"
on public.admin_profiles for all
using (id = auth.uid()) with check (id = auth.uid());

create policy "restaurant scope policy staff" on public.staff for all
using (restaurant_id = public.current_restaurant_id()) with check (restaurant_id = public.current_restaurant_id());
create policy "restaurant scope policy staff_advances" on public.staff_advances for all
using (restaurant_id = public.current_restaurant_id()) with check (restaurant_id = public.current_restaurant_id());
create policy "restaurant scope policy payroll_records" on public.payroll_records for all
using (restaurant_id = public.current_restaurant_id()) with check (restaurant_id = public.current_restaurant_id());
create policy "restaurant scope policy inventory_categories" on public.inventory_categories for all
using (restaurant_id = public.current_restaurant_id()) with check (restaurant_id = public.current_restaurant_id());
create policy "restaurant scope policy inventory_items" on public.inventory_items for all
using (restaurant_id = public.current_restaurant_id()) with check (restaurant_id = public.current_restaurant_id());
create policy "restaurant scope policy inventory_movements" on public.inventory_movements for all
using (restaurant_id = public.current_restaurant_id()) with check (restaurant_id = public.current_restaurant_id());
create policy "restaurant scope policy purchases" on public.purchases for all
using (restaurant_id = public.current_restaurant_id()) with check (restaurant_id = public.current_restaurant_id());
create policy "restaurant scope policy daily_sales" on public.daily_sales for all
using (restaurant_id = public.current_restaurant_id()) with check (restaurant_id = public.current_restaurant_id());
