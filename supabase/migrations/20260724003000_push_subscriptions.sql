create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_restaurant_idx
  on public.push_subscriptions (restaurant_id, created_at desc);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push subscriptions scoped read" on public.push_subscriptions;
create policy "push subscriptions scoped read"
  on public.push_subscriptions
  for select
  using (
    profile_id = auth.uid()
    or public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
    or public.is_super_admin()
  );

drop policy if exists "push subscriptions own insert" on public.push_subscriptions;
create policy "push subscriptions own insert"
  on public.push_subscriptions
  for insert
  with check (
    profile_id = auth.uid()
    and public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
  );

drop policy if exists "push subscriptions own update" on public.push_subscriptions;
create policy "push subscriptions own update"
  on public.push_subscriptions
  for update
  using (
    profile_id = auth.uid()
    and public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
  )
  with check (
    profile_id = auth.uid()
    and public.has_restaurant_role(restaurant_id, array['OWNER', 'MANAGER'])
  );

drop policy if exists "push subscriptions own delete" on public.push_subscriptions;
create policy "push subscriptions own delete"
  on public.push_subscriptions
  for delete
  using (
    profile_id = auth.uid()
    or public.is_super_admin()
  );
