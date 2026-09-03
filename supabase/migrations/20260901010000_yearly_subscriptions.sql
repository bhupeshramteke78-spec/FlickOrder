alter table public.subscriptions
  add column if not exists billing_interval text not null default 'MONTHLY';

alter table public.subscription_upgrade_requests
  add column if not exists billing_interval text not null default 'MONTHLY';

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
  req_interval text;
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

  req_interval := coalesce(upgrade_request.billing_interval, 'MONTHLY');

  if req_interval = 'YEARLY' then
    period_end := period_start + interval '365 days';
  else
    period_end := period_start + interval '30 days';
  end if;

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
    billing_interval = req_interval,
    current_period_ends_at = period_end
  where subscriptions.restaurant_id = upgrade_request.restaurant_id;

  select
    upgrade_request.id,
    upgrade_request.restaurant_id,
    upgrade_request.plan,
    period_end,
    false
  into request_id, restaurant_id, plan, current_period_ends_at, already_processed;

  return next;
end;
$$;
