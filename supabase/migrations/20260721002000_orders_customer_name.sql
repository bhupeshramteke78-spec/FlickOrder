alter table public.orders
  add column if not exists customer_name text;

update public.orders
set customer_name = nullif(trim((regexp_match(kitchen_notes, '^customer:\s*([^\n\r]+)', 'i'))[1]), '')
where customer_name is null
  and kitchen_notes ~* '^customer:\s*';

update public.orders
set kitchen_notes = nullif(trim(regexp_replace(kitchen_notes, '^customer:\s*[^\n\r]*(\r?\n)?', '', 'i')), '')
where kitchen_notes ~* '^customer:\s*';

create index if not exists orders_restaurant_customer_name_idx
  on public.orders (restaurant_id, customer_name);
