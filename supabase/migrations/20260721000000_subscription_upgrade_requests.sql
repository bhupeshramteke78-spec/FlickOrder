do $$
begin
  create type public.subscription_upgrade_status as enum (
    'PENDING_PAYMENT',
    'VERIFICATION_PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
  );
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.subscription_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  plan text not null check (plan in ('basic', 'growth', 'pro')),
  amount numeric(12,2) not null check (amount >= 0),
  status public.subscription_upgrade_status not null default 'PENDING_PAYMENT',
  payment_method text not null default 'UPI' check (payment_method in ('UPI')),
  transaction_note text not null,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscription_upgrade_requests_restaurant_idx
  on public.subscription_upgrade_requests (restaurant_id, status, created_at desc);

drop trigger if exists set_subscription_upgrade_requests_updated_at on public.subscription_upgrade_requests;
create trigger set_subscription_upgrade_requests_updated_at
  before update on public.subscription_upgrade_requests
  for each row execute function public.set_updated_at();

alter table public.subscription_upgrade_requests enable row level security;

drop policy if exists "subscription upgrade requests scoped read" on public.subscription_upgrade_requests;
create policy "subscription upgrade requests scoped read"
  on public.subscription_upgrade_requests
  for select
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

drop policy if exists "subscription upgrade requests super admin update" on public.subscription_upgrade_requests;
create policy "subscription upgrade requests super admin update"
  on public.subscription_upgrade_requests
  for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

do $$
begin
  alter publication supabase_realtime add table public.subscription_upgrade_requests;
exception
  when duplicate_object then null;
end;
$$;
