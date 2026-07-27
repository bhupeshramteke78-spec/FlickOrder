do $$
begin
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type public.booking_status as enum (
      'PENDING',
      'CONFIRMED',
      'DECLINED',
      'CANCELLED',
      'COMPLETED',
      'NO_SHOW'
    );
  end if;
end
$$;

alter table public.restaurant_settings
  add column if not exists booking_enabled boolean not null default true,
  add column if not exists booking_slot_minutes integer not null default 30
    check (booking_slot_minutes between 15 and 120),
  add column if not exists booking_duration_minutes integer not null default 90
    check (booking_duration_minutes between 30 and 360),
  add column if not exists booking_advance_days integer not null default 30
    check (booking_advance_days between 1 and 90),
  add column if not exists booking_min_notice_minutes integer not null default 60
    check (booking_min_notice_minutes between 0 and 1440),
  add column if not exists booking_max_party_size integer not null default 20
    check (booking_max_party_size between 1 and 100);

create table if not exists public.restaurant_bookings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid references public.tables(id) on delete set null,
  customer_id uuid references public.profiles(id) on delete set null,
  customer_name text not null check (char_length(trim(customer_name)) between 2 and 120),
  customer_phone text not null check (char_length(trim(customer_phone)) between 7 and 20),
  party_size integer not null check (party_size between 1 and 100),
  booking_date date not null,
  booking_time time not null,
  duration_minutes integer not null default 90 check (duration_minutes between 30 and 360),
  special_request text check (special_request is null or char_length(special_request) <= 500),
  status public.booking_status not null default 'PENDING',
  confirmation_code text not null unique,
  access_token_hash text not null,
  source text not null default 'WEB' check (source in ('WEB', 'STAFF')),
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  decline_reason text check (decline_reason is null or char_length(decline_reason) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists restaurant_bookings_schedule_idx
  on public.restaurant_bookings (restaurant_id, booking_date, booking_time, status);

create index if not exists restaurant_bookings_customer_idx
  on public.restaurant_bookings (customer_id, created_at desc)
  where customer_id is not null;

drop trigger if exists set_restaurant_bookings_updated_at on public.restaurant_bookings;
create trigger set_restaurant_bookings_updated_at
before update on public.restaurant_bookings
for each row execute function public.set_updated_at();

alter table public.restaurant_bookings enable row level security;

drop policy if exists "bookings customer or member read" on public.restaurant_bookings;
create policy "bookings customer or member read"
on public.restaurant_bookings
for select
using (
  customer_id = auth.uid()
  or exists (
    select 1
    from public.restaurant_members member
    where member.restaurant_id = restaurant_bookings.restaurant_id
      and member.profile_id = auth.uid()
      and member.role in ('OWNER', 'MANAGER', 'WAITER')
  )
  or public.is_super_admin()
);

drop policy if exists "bookings operations update" on public.restaurant_bookings;
create policy "bookings operations update"
on public.restaurant_bookings
for update
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.restaurant_members member
    where member.restaurant_id = restaurant_bookings.restaurant_id
      and member.profile_id = auth.uid()
      and member.role in ('OWNER', 'MANAGER', 'WAITER')
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.restaurant_members member
    where member.restaurant_id = restaurant_bookings.restaurant_id
      and member.profile_id = auth.uid()
      and member.role in ('OWNER', 'MANAGER', 'WAITER')
  )
);

create or replace function public.create_restaurant_booking(
  p_restaurant_id uuid,
  p_customer_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_party_size integer,
  p_booking_date date,
  p_booking_time time,
  p_duration_minutes integer,
  p_special_request text,
  p_access_token_hash text
)
returns table (
  booking_id uuid,
  confirmation_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_table_id uuid;
  generated_code text;
  requested_start timestamp;
  requested_end timestamp;
begin
  if p_party_size < 1 or p_party_size > 100 then
    raise exception 'Invalid party size';
  end if;

  if p_duration_minutes < 30 or p_duration_minutes > 360 then
    raise exception 'Invalid booking duration';
  end if;

  requested_start := p_booking_date + p_booking_time;
  requested_end := requested_start + make_interval(mins => p_duration_minutes);

  perform pg_advisory_xact_lock(
    hashtextextended(
      p_restaurant_id::text || ':' || p_booking_date::text || ':' || p_booking_time::text,
      0
    )
  );

  select restaurant_table.id
  into selected_table_id
  from public.tables restaurant_table
  where restaurant_table.restaurant_id = p_restaurant_id
    and restaurant_table.seats >= p_party_size
    and restaurant_table.status <> 'CLEANING'
    and not exists (
      select 1
      from public.restaurant_bookings existing_booking
      where existing_booking.table_id = restaurant_table.id
        and existing_booking.status in ('PENDING', 'CONFIRMED')
        and (existing_booking.booking_date + existing_booking.booking_time) < requested_end
        and (
          existing_booking.booking_date
          + existing_booking.booking_time
          + make_interval(mins => existing_booking.duration_minutes)
        ) > requested_start
    )
  order by restaurant_table.seats asc, restaurant_table.table_number asc
  limit 1;

  if selected_table_id is null then
    raise exception 'No table is available for this time and party size';
  end if;

  generated_code := 'FOB-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

  insert into public.restaurant_bookings (
    restaurant_id,
    table_id,
    customer_id,
    customer_name,
    customer_phone,
    party_size,
    booking_date,
    booking_time,
    duration_minutes,
    special_request,
    confirmation_code,
    access_token_hash
  )
  values (
    p_restaurant_id,
    selected_table_id,
    p_customer_id,
    trim(p_customer_name),
    trim(p_customer_phone),
    p_party_size,
    p_booking_date,
    p_booking_time,
    p_duration_minutes,
    nullif(trim(coalesce(p_special_request, '')), ''),
    generated_code,
    p_access_token_hash
  )
  returning id into booking_id;

  confirmation_code := generated_code;
  return next;
end;
$$;

revoke all on function public.create_restaurant_booking(
  uuid, uuid, text, text, integer, date, time, integer, text, text
) from public;

grant execute on function public.create_restaurant_booking(
  uuid, uuid, text, text, integer, date, time, integer, text, text
) to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'restaurant_bookings'
  ) then
    alter publication supabase_realtime add table public.restaurant_bookings;
  end if;
end
$$;
