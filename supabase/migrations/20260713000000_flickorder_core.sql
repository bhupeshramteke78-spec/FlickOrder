create extension if not exists "pgcrypto";

create type public.app_role as enum ('CUSTOMER', 'OWNER', 'MANAGER', 'KITCHEN', 'WAITER', 'SUPER_ADMIN');
create type public.member_role as enum ('OWNER', 'MANAGER', 'KITCHEN', 'WAITER');
create type public.food_type as enum ('VEG', 'NON_VEG', 'EGG');
create type public.table_status as enum ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING');
create type public.order_status as enum ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED');
create type public.payment_status as enum ('UNPAID', 'VERIFICATION_PENDING', 'PAID', 'FAILED', 'REFUNDED');
create type public.payment_method as enum ('UPI', 'CASH', 'CARD_MACHINE');
create type public.service_request_type as enum ('WATER', 'TISSUE', 'SPOON', 'FORK', 'BILL', 'WAITER');
create type public.service_request_status as enum ('OPEN', 'ACKNOWLEDGED', 'COMPLETED', 'CANCELLED');
create type public.subscription_status as enum ('TRIALING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.app_role not null default 'CUSTOMER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text not null unique,
  type text not null,
  cuisine text[] not null default '{}',
  email text not null,
  phone text not null,
  city text not null,
  state text not null,
  address text not null,
  logo_url text,
  cover_url text,
  rating numeric(3,2),
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null,
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, profile_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
  plan text not null check (plan in ('trial', 'basic', 'growth', 'pro')),
  status public.subscription_status not null,
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurant_settings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
  brand_color text not null default '#69e6a3',
  upi_id text not null,
  upi_display_name text not null,
  tax_rate numeric(5,2) not null default 0,
  qr_ordering_enabled boolean not null default true,
  menu_preferences jsonb not null default '{}',
  opening_hours jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, name)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  description text,
  image_url text,
  price numeric(12,2) not null check (price >= 0),
  offer_price numeric(12,2) check (offer_price >= 0),
  preparation_time_minutes integer not null check (preparation_time_minutes > 0),
  food_type public.food_type not null,
  is_available boolean not null default true,
  is_sold_out boolean not null default false,
  is_popular boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (offer_price is null or offer_price <= price)
);

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_number text not null,
  seats integer not null default 2 check (seats > 0),
  status public.table_status not null default 'AVAILABLE',
  qr_token text not null default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, table_number)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  table_id uuid not null references public.tables(id) on delete restrict,
  customer_id uuid references public.profiles(id) on delete set null,
  order_number text not null,
  status public.order_status not null default 'PENDING',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  tax_total numeric(12,2) not null default 0 check (tax_total >= 0),
  total numeric(12,2) not null check (total >= 0),
  payment_status public.payment_status not null default 'UNPAID',
  kitchen_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, order_number)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete restrict,
  name_snapshot text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  notes text,
  options text[] not null default '{}',
  total numeric(12,2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete cascade,
  method public.payment_method not null,
  status public.payment_status not null default 'VERIFICATION_PENDING',
  amount numeric(12,2) not null check (amount >= 0),
  transaction_note text not null,
  confirmed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid not null references public.tables(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  type public.service_request_type not null,
  status public.service_request_status not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, customer_id)
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, customer_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index restaurants_city_idx on public.restaurants (city);
create index menu_items_restaurant_idx on public.menu_items (restaurant_id, category_id);
create index orders_restaurant_status_idx on public.orders (restaurant_id, status, created_at desc);
create index payments_paid_idx on public.payments (restaurant_id, status, created_at desc);
create index service_requests_open_idx on public.service_requests (restaurant_id, status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_restaurant_member(target_restaurant_id uuid)
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
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'SUPER_ADMIN'
  );
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles','restaurants','restaurant_members','subscriptions','restaurant_settings',
    'categories','menu_items','tables','orders','order_items','payments','service_requests',
    'reviews','favorites','notifications','audit_logs'
  ]
  loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.service_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles self or admin read" on public.profiles for select using (id = auth.uid() or public.is_super_admin());
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "restaurants public read" on public.restaurants for select using (true);
create policy "restaurants member update" on public.restaurants for update using (public.is_restaurant_member(id) or public.is_super_admin());

create policy "members read scoped" on public.restaurant_members for select using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());
create policy "members owner manage" on public.restaurant_members for all using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

create policy "restaurant scoped read subscriptions" on public.subscriptions for select using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());
create policy "restaurant scoped settings read" on public.restaurant_settings for select using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());
create policy "restaurant scoped settings update" on public.restaurant_settings for update using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

create policy "categories public read" on public.categories for select using (is_active = true or public.is_restaurant_member(restaurant_id) or public.is_super_admin());
create policy "categories member manage" on public.categories for all using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

create policy "menu public read" on public.menu_items for select using (true);
create policy "menu member manage" on public.menu_items for all using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

create policy "tables public read" on public.tables for select using (true);
create policy "tables member manage" on public.tables for all using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

create policy "orders member read" on public.orders for select using (public.is_restaurant_member(restaurant_id) or customer_id = auth.uid() or public.is_super_admin());
create policy "orders public insert" on public.orders for insert with check (true);
create policy "orders member update" on public.orders for update using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

create policy "order items member read" on public.order_items for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (public.is_restaurant_member(o.restaurant_id) or o.customer_id = auth.uid() or public.is_super_admin())
  )
);
create policy "order items public insert" on public.order_items for insert with check (true);

create policy "payments member read" on public.payments for select using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());
create policy "payments customer insert" on public.payments for insert with check (true);
create policy "payments member update" on public.payments for update using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

create policy "service requests scoped read" on public.service_requests for select using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());
create policy "service requests public insert" on public.service_requests for insert with check (true);
create policy "service requests member update" on public.service_requests for update using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

create policy "reviews public read" on public.reviews for select using (true);
create policy "reviews customer write" on public.reviews for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create policy "favorites customer manage" on public.favorites for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "notifications scoped read" on public.notifications for select using (public.is_restaurant_member(restaurant_id) or profile_id = auth.uid() or public.is_super_admin());
create policy "audit admin read" on public.audit_logs for select using (public.is_super_admin());

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.menu_items;
alter publication supabase_realtime add table public.tables;
alter publication supabase_realtime add table public.service_requests;
alter publication supabase_realtime add table public.notifications;
