create or replace function public.has_restaurant_role(
  target_restaurant_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.restaurant_members rm
    where rm.restaurant_id = target_restaurant_id
      and rm.profile_id = auth.uid()
      and rm.role::text = any(allowed_roles)
  );
$$;

drop policy if exists "restaurants member update" on public.restaurants;
create policy "restaurants owner manager update"
  on public.restaurants
  for update
  using (
    public.has_restaurant_role(id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  )
  with check (
    public.has_restaurant_role(id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

drop policy if exists "members owner manage" on public.restaurant_members;
create policy "members owner manager insert"
  on public.restaurant_members
  for insert
  with check (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

create policy "members owner manager update"
  on public.restaurant_members
  for update
  using (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  )
  with check (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

create policy "members owner manager delete"
  on public.restaurant_members
  for delete
  using (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

drop policy if exists "restaurant scoped settings update" on public.restaurant_settings;
create policy "restaurant settings owner manager update"
  on public.restaurant_settings
  for update
  using (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  )
  with check (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

drop policy if exists "categories member manage" on public.categories;
create policy "categories owner manager insert"
  on public.categories
  for insert
  with check (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

create policy "categories owner manager update"
  on public.categories
  for update
  using (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  )
  with check (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

create policy "categories owner manager delete"
  on public.categories
  for delete
  using (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

drop policy if exists "menu member manage" on public.menu_items;
create policy "menu owner manager insert"
  on public.menu_items
  for insert
  with check (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

create policy "menu owner manager update"
  on public.menu_items
  for update
  using (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  )
  with check (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

create policy "menu owner manager delete"
  on public.menu_items
  for delete
  using (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

drop policy if exists "tables member manage" on public.tables;
create policy "tables owner manager insert"
  on public.tables
  for insert
  with check (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

create policy "tables owner manager update"
  on public.tables
  for update
  using (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER', 'KITCHEN', 'WAITER'])
    or public.is_super_admin()
  )
  with check (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER', 'KITCHEN', 'WAITER'])
    or public.is_super_admin()
  );

create policy "tables owner manager delete"
  on public.tables
  for delete
  using (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

drop policy if exists "orders member update" on public.orders;
create policy "orders staff update"
  on public.orders
  for update
  using (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER', 'KITCHEN', 'WAITER'])
    or public.is_super_admin()
  )
  with check (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER', 'KITCHEN', 'WAITER'])
    or public.is_super_admin()
  );

drop policy if exists "payments member update" on public.payments;
create policy "payments staff update"
  on public.payments
  for update
  using (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER', 'WAITER'])
    or public.is_super_admin()
  )
  with check (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER', 'WAITER'])
    or public.is_super_admin()
  );

drop policy if exists "service requests member update" on public.service_requests;
create policy "service requests staff update"
  on public.service_requests
  for update
  using (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER', 'WAITER'])
    or public.is_super_admin()
  )
  with check (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER', 'WAITER'])
    or public.is_super_admin()
  );
