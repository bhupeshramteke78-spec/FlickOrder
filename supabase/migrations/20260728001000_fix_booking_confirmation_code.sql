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

  generated_code := 'FOB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

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
