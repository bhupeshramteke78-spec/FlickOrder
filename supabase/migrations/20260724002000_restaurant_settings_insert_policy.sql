drop policy if exists "restaurant settings owner manager insert" on public.restaurant_settings;

create policy "restaurant settings owner manager insert"
  on public.restaurant_settings
  for insert
  with check (
    public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );
