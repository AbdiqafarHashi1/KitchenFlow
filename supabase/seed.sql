insert into public.restaurants (id,name,slug,phone,address,currency)
values ('11111111-1111-1111-1111-111111111111','KitchenFlow Demo Restaurant','kitchenflow-demo','+254700000111','Nairobi CBD','KES')
on conflict (slug) do nothing;

-- requires real auth user id replacement
-- update this id after creating admin user in Supabase Auth
insert into public.admin_profiles (id,restaurant_id,full_name,role)
values ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111111','Demo Admin','admin')
on conflict (id) do nothing;

insert into public.inventory_categories (id,restaurant_id,name,sort_order) values
('20000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Meat',1),
('20000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Vegetables',2),
('20000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Dry Goods',3),
('20000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Drinks',4)
on conflict do nothing;

insert into public.staff (id,restaurant_id,full_name,role,phone,salary_type,base_salary,start_date,is_active,notes) values
('30000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','John Kamau','Head Chef','+254711000001','monthly',60000,'2024-01-10',true,'Kitchen lead'),
('30000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Grace Achieng','Cashier','+254711000002','monthly',38000,'2024-02-15',true,'Evening shift'),
('30000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Peter Otieno','Storekeeper','+254711000003','monthly',42000,'2024-03-01',true,'Handles stock')
on conflict do nothing;

insert into public.inventory_items (id,restaurant_id,category_id,name,unit,current_quantity,min_quantity,average_unit_cost,supplier_name,active) values
('40000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','20000000-0000-0000-0000-000000000001','Chicken','kg',18,10,440,'FreshFarm',true),
('40000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','20000000-0000-0000-0000-000000000001','Beef','kg',12,8,680,'Prime Cuts',true),
('40000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','20000000-0000-0000-0000-000000000002','Tomatoes','kg',9,12,110,'Greenline',true),
('40000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','20000000-0000-0000-0000-000000000002','Onions','kg',20,10,90,'Greenline',true),
('40000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','20000000-0000-0000-0000-000000000003','Rice','kg',40,20,165,'GrainHub',true),
('40000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','20000000-0000-0000-0000-000000000003','Cooking Oil','ltr',15,10,320,'Market Oils',true),
('40000000-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','20000000-0000-0000-0000-000000000004','Soda','btl',96,48,60,'Soft Drinks Ltd',true),
('40000000-0000-0000-0000-000000000008','11111111-1111-1111-1111-111111111111','20000000-0000-0000-0000-000000000003','Salt','kg',8,5,80,'Pantry Hub',true)
on conflict do nothing;

insert into public.purchases (id,restaurant_id,inventory_item_id,supplier_name,quantity,unit_cost,total_cost,purchase_date,note) values
('50000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000001','FreshFarm',10,460,4600,current_date - interval '1 day','Market rate change'),
('50000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000005','GrainHub',25,170,4250,current_date - interval '2 day','Bulk stock'),
('50000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','40000000-0000-0000-0000-000000000003','Greenline',15,120,1800,current_date,'Morning delivery')
on conflict do nothing;

insert into public.inventory_movements (restaurant_id,inventory_item_id,movement_type,quantity,unit_cost,total_cost,note)
select '11111111-1111-1111-1111-111111111111', inventory_item_id, 'purchase', quantity, unit_cost, total_cost, note from public.purchases where restaurant_id='11111111-1111-1111-1111-111111111111';

insert into public.daily_sales (id,restaurant_id,sales_date,sales_amount,source,notes) values
('60000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',current_date - interval '1 day',48500,'Walk-in','Ramadan high traffic'),
('60000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',current_date,51200,'Mixed','Weekend dinner')
on conflict do nothing;

insert into public.staff_advances (id,restaurant_id,staff_id,advance_date,amount,note) values
('70000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','30000000-0000-0000-0000-000000000001',current_date - interval '3 day',3000,'Medical'),
('70000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','30000000-0000-0000-0000-000000000002',current_date - interval '1 day',1500,'Transport'),
('70000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','30000000-0000-0000-0000-000000000003',current_date,2000,'Family emergency')
on conflict do nothing;

insert into public.payroll_records (id,restaurant_id,staff_id,period_start,period_end,base_salary,advances_total,other_deductions,tax_deduction,net_payable,payment_status,payment_date) values
('80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','30000000-0000-0000-0000-000000000001',date_trunc('month',current_date - interval '1 month'),date_trunc('month',current_date) - interval '1 day',60000,3000,500,2000,54500,'paid',current_date - interval '2 day'),
('80000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','30000000-0000-0000-0000-000000000002',date_trunc('month',current_date - interval '1 month'),date_trunc('month',current_date) - interval '1 day',38000,1500,0,1200,35300,'pending',null)
on conflict do nothing;
