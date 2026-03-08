-- Normalize and constrain app roles.
alter table public.admin_profiles
  alter column role set default 'admin';

update public.admin_profiles
set role = case
  when lower(coalesce(role, 'admin')) = 'data_entry' then 'data_entry'
  else 'admin'
end;

alter table public.admin_profiles
  drop constraint if exists admin_profiles_role_check;

alter table public.admin_profiles
  add constraint admin_profiles_role_check check (role in ('admin', 'data_entry'));

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role from public.admin_profiles where id = auth.uid()
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'admin'
$$;

-- Keep inventory quantities in sync based on movements.
create or replace function public.apply_inventory_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item_row public.inventory_items%rowtype;
  next_qty numeric;
  next_avg numeric;
begin
  select * into item_row
  from public.inventory_items
  where id = new.inventory_item_id and restaurant_id = new.restaurant_id
  for update;

  if not found then
    raise exception 'Inventory item not found for movement %', new.inventory_item_id;
  end if;

  if new.movement_type in ('purchase', 'adjustment', 'usage', 'waste') then
    next_qty := item_row.current_quantity + new.quantity;
  else
    next_qty := item_row.current_quantity;
  end if;

  if new.movement_type = 'purchase' and new.unit_cost is not null and new.quantity > 0 then
    if next_qty = 0 then
      next_avg := 0;
    else
      next_avg := ((item_row.current_quantity * item_row.average_unit_cost) + (new.quantity * new.unit_cost)) / next_qty;
    end if;
  else
    next_avg := item_row.average_unit_cost;
  end if;

  update public.inventory_items
  set current_quantity = next_qty,
      average_unit_cost = next_avg,
      updated_at = now()
  where id = new.inventory_item_id and restaurant_id = new.restaurant_id;

  return new;
end;
$$;

drop trigger if exists trg_apply_inventory_movement on public.inventory_movements;
create trigger trg_apply_inventory_movement
after insert on public.inventory_movements
for each row execute function public.apply_inventory_movement();

-- Remove broad policies from phase 1.
drop policy if exists "Admins can manage own restaurant" on public.restaurants;
drop policy if exists "Admins can manage own profile" on public.admin_profiles;
drop policy if exists "restaurant scope policy staff" on public.staff;
drop policy if exists "restaurant scope policy staff_advances" on public.staff_advances;
drop policy if exists "restaurant scope policy payroll_records" on public.payroll_records;
drop policy if exists "restaurant scope policy inventory_categories" on public.inventory_categories;
drop policy if exists "restaurant scope policy inventory_items" on public.inventory_items;
drop policy if exists "restaurant scope policy inventory_movements" on public.inventory_movements;
drop policy if exists "restaurant scope policy purchases" on public.purchases;
drop policy if exists "restaurant scope policy daily_sales" on public.daily_sales;

-- Restaurants
create policy "restaurants select scoped"
on public.restaurants for select
using (id = public.current_restaurant_id());

create policy "restaurants update admin scoped"
on public.restaurants for update
using (id = public.current_restaurant_id() and public.is_admin_user())
with check (id = public.current_restaurant_id() and public.is_admin_user());

-- Admin profiles
create policy "admin_profiles select own"
on public.admin_profiles for select
using (id = auth.uid());

create policy "admin_profiles update own"
on public.admin_profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Staff
create policy "staff select scoped"
on public.staff for select
using (restaurant_id = public.current_restaurant_id());

create policy "staff write admin scoped"
on public.staff for all
using (restaurant_id = public.current_restaurant_id() and public.is_admin_user())
with check (restaurant_id = public.current_restaurant_id() and public.is_admin_user());

-- Staff advances
create policy "staff_advances select scoped"
on public.staff_advances for select
using (restaurant_id = public.current_restaurant_id());

create policy "staff_advances insert scoped"
on public.staff_advances for insert
with check (
  restaurant_id = public.current_restaurant_id()
  and public.current_user_role() in ('admin', 'data_entry')
);

create policy "staff_advances modify admin scoped"
on public.staff_advances for update
using (restaurant_id = public.current_restaurant_id() and public.is_admin_user())
with check (restaurant_id = public.current_restaurant_id() and public.is_admin_user());

create policy "staff_advances delete admin scoped"
on public.staff_advances for delete
using (restaurant_id = public.current_restaurant_id() and public.is_admin_user());

-- Payroll
create policy "payroll_records select scoped"
on public.payroll_records for select
using (restaurant_id = public.current_restaurant_id());

create policy "payroll_records write admin scoped"
on public.payroll_records for all
using (restaurant_id = public.current_restaurant_id() and public.is_admin_user())
with check (restaurant_id = public.current_restaurant_id() and public.is_admin_user());

-- Inventory categories
create policy "inventory_categories select scoped"
on public.inventory_categories for select
using (restaurant_id = public.current_restaurant_id());

create policy "inventory_categories write admin scoped"
on public.inventory_categories for all
using (restaurant_id = public.current_restaurant_id() and public.is_admin_user())
with check (restaurant_id = public.current_restaurant_id() and public.is_admin_user());

-- Inventory items
create policy "inventory_items select scoped"
on public.inventory_items for select
using (restaurant_id = public.current_restaurant_id());

create policy "inventory_items write admin scoped"
on public.inventory_items for all
using (restaurant_id = public.current_restaurant_id() and public.is_admin_user())
with check (restaurant_id = public.current_restaurant_id() and public.is_admin_user());

-- Inventory movements
create policy "inventory_movements select scoped"
on public.inventory_movements for select
using (restaurant_id = public.current_restaurant_id());

create policy "inventory_movements insert scoped"
on public.inventory_movements for insert
with check (
  restaurant_id = public.current_restaurant_id()
  and (
    public.is_admin_user()
    or (public.current_user_role() = 'data_entry' and movement_type = 'purchase')
  )
);

create policy "inventory_movements update admin scoped"
on public.inventory_movements for update
using (restaurant_id = public.current_restaurant_id() and public.is_admin_user())
with check (restaurant_id = public.current_restaurant_id() and public.is_admin_user());

create policy "inventory_movements delete admin scoped"
on public.inventory_movements for delete
using (restaurant_id = public.current_restaurant_id() and public.is_admin_user());

-- Purchases
create policy "purchases select scoped"
on public.purchases for select
using (restaurant_id = public.current_restaurant_id());

create policy "purchases insert scoped"
on public.purchases for insert
with check (
  restaurant_id = public.current_restaurant_id()
  and public.current_user_role() in ('admin', 'data_entry')
);

create policy "purchases modify admin scoped"
on public.purchases for update
using (restaurant_id = public.current_restaurant_id() and public.is_admin_user())
with check (restaurant_id = public.current_restaurant_id() and public.is_admin_user());

create policy "purchases delete admin scoped"
on public.purchases for delete
using (restaurant_id = public.current_restaurant_id() and public.is_admin_user());

-- Daily sales
create policy "daily_sales select scoped"
on public.daily_sales for select
using (restaurant_id = public.current_restaurant_id());

create policy "daily_sales insert scoped"
on public.daily_sales for insert
with check (
  restaurant_id = public.current_restaurant_id()
  and public.current_user_role() in ('admin', 'data_entry')
);

create policy "daily_sales modify admin scoped"
on public.daily_sales for update
using (restaurant_id = public.current_restaurant_id() and public.is_admin_user())
with check (restaurant_id = public.current_restaurant_id() and public.is_admin_user());

create policy "daily_sales delete admin scoped"
on public.daily_sales for delete
using (restaurant_id = public.current_restaurant_id() and public.is_admin_user());
