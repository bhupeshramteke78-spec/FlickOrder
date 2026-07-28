create table if not exists public.api_rate_limits (
  key text primary key,
  request_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;

revoke all on table public.api_rate_limits from public, anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  current_window timestamptz;
  now_at timestamptz := clock_timestamp();
begin
  if p_key is null or length(p_key) < 3 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.api_rate_limits as limits (
    key,
    request_count,
    window_started_at,
    updated_at
  )
  values (p_key, 1, now_at, now_at)
  on conflict (key) do update
  set
    request_count = case
      when limits.window_started_at + make_interval(secs => p_window_seconds) <= now_at then 1
      else limits.request_count + 1
    end,
    window_started_at = case
      when limits.window_started_at + make_interval(secs => p_window_seconds) <= now_at then now_at
      else limits.window_started_at
    end,
    updated_at = now_at
  returning request_count, window_started_at
  into current_count, current_window;

  return query
  select
    current_count <= p_limit,
    case
      when current_count <= p_limit then 0
      else greatest(
        1,
        ceil(
          extract(epoch from (
            current_window + make_interval(secs => p_window_seconds) - now_at
          ))
        )::integer
      )
    end;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;

create or replace function public.provision_restaurant_owner(
  p_owner_id uuid,
  p_owner_name text,
  p_phone text,
  p_restaurant_name text,
  p_slug text,
  p_restaurant_type text,
  p_cuisine text[],
  p_email text,
  p_city text,
  p_state text,
  p_address text,
  p_upi_id text,
  p_upi_display_name text,
  p_fssai_number text,
  p_google_maps_url text,
  p_latitude numeric,
  p_longitude numeric,
  p_documents jsonb default '[]'::jsonb
)
returns table (
  restaurant_id uuid,
  restaurant_slug text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  created_restaurant_id uuid;
begin
  if p_owner_id is null or p_restaurant_name is null or p_slug is null then
    raise exception 'Owner and restaurant details are required';
  end if;

  insert into public.profiles (id, full_name, phone, role)
  values (p_owner_id, p_owner_name, p_phone, 'OWNER')
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    phone = excluded.phone,
    role = 'OWNER';

  insert into public.restaurants (
    owner_id,
    name,
    slug,
    type,
    cuisine,
    email,
    phone,
    city,
    state,
    address,
    verification_status,
    fssai_number,
    google_maps_url,
    latitude,
    longitude,
    location_source
  )
  values (
    p_owner_id,
    p_restaurant_name,
    p_slug,
    p_restaurant_type,
    p_cuisine,
    p_email,
    p_phone,
    p_city,
    p_state,
    p_address,
    'PENDING',
    p_fssai_number,
    nullif(p_google_maps_url, ''),
    p_latitude,
    p_longitude,
    case when p_latitude is not null and p_longitude is not null then 'GOOGLE_MAPS_LINK' else null end
  )
  returning id into created_restaurant_id;

  insert into public.restaurant_members (restaurant_id, profile_id, role)
  values (created_restaurant_id, p_owner_id, 'OWNER');

  insert into public.subscriptions (
    restaurant_id,
    plan,
    status,
    trial_ends_at
  )
  values (
    created_restaurant_id,
    'trial',
    'TRIALING',
    now() + interval '3 days'
  );

  insert into public.restaurant_settings (
    restaurant_id,
    upi_id,
    upi_display_name
  )
  values (
    created_restaurant_id,
    p_upi_id,
    p_upi_display_name
  );

  insert into public.restaurant_verification_documents (
    restaurant_id,
    document_type,
    file_url
  )
  select
    created_restaurant_id,
    document->>'document_type',
    document->>'file_url'
  from jsonb_array_elements(coalesce(p_documents, '[]'::jsonb)) as document
  where document->>'document_type' in (
    'FSSAI_CERTIFICATE',
    'STOREFRONT_PHOTO',
    'OWNER_ID',
    'GST_CERTIFICATE',
    'OTHER'
  )
    and coalesce(document->>'file_url', '') <> '';

  return query select created_restaurant_id, p_slug;
end;
$$;

revoke all on function public.provision_restaurant_owner(
  uuid, text, text, text, text, text, text[], text, text, text, text,
  text, text, text, text, numeric, numeric, jsonb
) from public, anon, authenticated;
grant execute on function public.provision_restaurant_owner(
  uuid, text, text, text, text, text, text[], text, text, text, text,
  text, text, text, text, numeric, numeric, jsonb
) to service_role;

create table if not exists public.processed_payment_webhook_events (
  event_id text primary key,
  request_id uuid references public.subscription_upgrade_requests(id) on delete set null,
  processed_at timestamptz not null default now()
);

alter table public.processed_payment_webhook_events enable row level security;
revoke all on table public.processed_payment_webhook_events from public, anon, authenticated;

create or replace function public.activate_subscription_payment(
  p_request_id uuid,
  p_payment_id text default null,
  p_signature text default null,
  p_verified_by uuid default null,
  p_webhook_event_id text default null
)
returns table (
  request_id uuid,
  restaurant_id uuid,
  plan text,
  current_period_ends_at timestamptz,
  already_processed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  upgrade_request public.subscription_upgrade_requests%rowtype;
  period_start timestamptz;
  period_end timestamptz;
begin
  if p_webhook_event_id is not null then
    insert into public.processed_payment_webhook_events (event_id, request_id)
    values (p_webhook_event_id, p_request_id)
    on conflict (event_id) do nothing;

    if not found then
      select
        requests.id,
        requests.restaurant_id,
        requests.plan,
        subscriptions.current_period_ends_at,
        true
      into request_id, restaurant_id, plan, current_period_ends_at, already_processed
      from public.subscription_upgrade_requests requests
      left join public.subscriptions
        on subscriptions.restaurant_id = requests.restaurant_id
      where requests.id = p_request_id;
      return next;
      return;
    end if;
  end if;

  select *
  into upgrade_request
  from public.subscription_upgrade_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Subscription request not found';
  end if;

  if upgrade_request.status = 'APPROVED' then
    select
      upgrade_request.id,
      upgrade_request.restaurant_id,
      upgrade_request.plan,
      subscriptions.current_period_ends_at,
      true
    into request_id, restaurant_id, plan, current_period_ends_at, already_processed
    from public.subscriptions
    where subscriptions.restaurant_id = upgrade_request.restaurant_id;
    return next;
    return;
  end if;

  if upgrade_request.status not in ('PENDING_PAYMENT', 'VERIFICATION_PENDING') then
    raise exception 'Subscription request cannot be activated from status %', upgrade_request.status;
  end if;

  select greatest(now(), coalesce(subscriptions.current_period_ends_at, now()))
  into period_start
  from public.subscriptions
  where subscriptions.restaurant_id = upgrade_request.restaurant_id
  for update;

  if period_start is null then
    raise exception 'Subscription record not found';
  end if;

  period_end := period_start + interval '30 days';

  update public.subscription_upgrade_requests
  set
    status = 'APPROVED',
    razorpay_payment_id = coalesce(p_payment_id, razorpay_payment_id),
    razorpay_signature = coalesce(p_signature, razorpay_signature),
    paid_at = coalesce(paid_at, now()),
    verified_by = coalesce(p_verified_by, verified_by),
    verified_at = now()
  where id = p_request_id;

  update public.subscriptions
  set
    plan = upgrade_request.plan,
    status = 'ACTIVE',
    trial_ends_at = null,
    current_period_ends_at = period_end
  where subscriptions.restaurant_id = upgrade_request.restaurant_id;

  insert into public.audit_logs (
    actor_id,
    restaurant_id,
    action,
    entity,
    entity_id,
    metadata
  )
  values (
    p_verified_by,
    upgrade_request.restaurant_id,
    'subscription_payment_approved',
    'subscription_upgrade_requests',
    p_request_id,
    jsonb_build_object(
      'plan', upgrade_request.plan,
      'amount', upgrade_request.amount,
      'currentPeriodEndsAt', period_end,
      'webhookEventId', p_webhook_event_id
    )
  );

  request_id := upgrade_request.id;
  restaurant_id := upgrade_request.restaurant_id;
  plan := upgrade_request.plan;
  current_period_ends_at := period_end;
  already_processed := false;
  return next;
end;
$$;

revoke all on function public.activate_subscription_payment(
  uuid, text, text, uuid, text
) from public, anon, authenticated;
grant execute on function public.activate_subscription_payment(
  uuid, text, text, uuid, text
) to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'restaurant-verification',
  'restaurant-verification',
  false,
  1258291,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "restaurants public read" on public.restaurants;
drop policy if exists "tables public read" on public.tables;
drop policy if exists "reviews public read" on public.reviews;

create or replace function public.is_public_restaurant(target_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.restaurants
    where restaurants.id = target_restaurant_id
      and restaurants.verification_status = 'APPROVED'
      and restaurants.deleted_at is null
  );
$$;

revoke all on function public.is_public_restaurant(uuid) from public;
grant execute on function public.is_public_restaurant(uuid) to anon, authenticated, service_role;

create policy "restaurants scoped read"
  on public.restaurants
  for select
  using (
    public.is_restaurant_member(id)
    or public.is_super_admin()
  );

create policy "tables scoped read"
  on public.tables
  for select
  using (
    public.is_restaurant_member(restaurant_id)
    or public.is_super_admin()
  );

create policy "reviews scoped read"
  on public.reviews
  for select
  using (
    customer_id = auth.uid()
    or public.is_restaurant_member(restaurant_id)
    or public.is_super_admin()
  );

drop policy if exists "categories public read" on public.categories;
create policy "categories approved restaurant read"
  on public.categories
  for select
  using (
    (
      is_active = true
      and public.is_public_restaurant(restaurant_id)
    )
    or public.is_restaurant_member(restaurant_id)
    or public.is_super_admin()
  );

drop policy if exists "menu public read" on public.menu_items;
create policy "menu approved restaurant read"
  on public.menu_items
  for select
  using (
    public.is_public_restaurant(restaurant_id)
    or public.is_restaurant_member(restaurant_id)
    or public.is_super_admin()
  );
