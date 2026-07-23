drop policy if exists "orders public insert" on public.orders;
drop policy if exists "order items public insert" on public.order_items;
drop policy if exists "payments customer insert" on public.payments;
drop policy if exists "service requests public insert" on public.service_requests;

create policy "orders api only insert blocked"
  on public.orders
  for insert
  with check (false);

create policy "order items api only insert blocked"
  on public.order_items
  for insert
  with check (false);

create policy "payments api only insert blocked"
  on public.payments
  for insert
  with check (false);

create policy "service requests api only insert blocked"
  on public.service_requests
  for insert
  with check (false);
