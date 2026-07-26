create or replace function public.run_subscription_lifecycle_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_trials integer := 0;
  expired_paid integer := 0;
  deleted_trials integer := 0;
begin
  update public.subscriptions
  set
    status = 'EXPIRED',
    updated_at = now()
  where status = 'TRIALING'
    and trial_ends_at is not null
    and trial_ends_at <= now();

  get diagnostics expired_trials = row_count;

  update public.subscriptions
  set
    status = 'EXPIRED',
    updated_at = now()
  where status = 'ACTIVE'
    and current_period_ends_at is not null
    and current_period_ends_at + interval '1 day' <= now();

  get diagnostics expired_paid = row_count;

  with abandoned as (
    select r.id, r.owner_id, r.name, s.trial_ends_at
    from public.restaurants r
    join public.subscriptions s on s.restaurant_id = r.id
    where r.deleted_at is null
      and s.plan = 'trial'
      and s.trial_ends_at is not null
      and s.trial_ends_at + interval '30 days' <= now()
  ),
  marked_restaurants as (
    update public.restaurants r
    set
      deleted_at = now(),
      deleted_by = null,
      deletion_requested_at = coalesce(r.deletion_requested_at, now()),
      deletion_reason = coalesce(r.deletion_reason, 'Automatically deleted after abandoned trial retention window.'),
      is_open = false,
      updated_at = now()
    from abandoned a
    where r.id = a.id
    returning r.id, r.owner_id, r.name
  ),
  cancelled_subscriptions as (
    update public.subscriptions s
    set
      status = 'CANCELLED',
      updated_at = now()
    from marked_restaurants r
    where s.restaurant_id = r.id
    returning s.restaurant_id
  ),
  disabled_settings as (
    update public.restaurant_settings rs
    set
      qr_ordering_enabled = false,
      updated_at = now()
    from marked_restaurants r
    where rs.restaurant_id = r.id
    returning rs.restaurant_id
  ),
  removed_push as (
    delete from public.push_subscriptions ps
    using marked_restaurants r
    where ps.restaurant_id = r.id
    returning ps.id
  ),
  removed_members as (
    delete from public.restaurant_members rm
    using marked_restaurants r
    where rm.restaurant_id = r.id
    returning rm.id
  ),
  audit_insert as (
    insert into public.audit_logs (actor_id, restaurant_id, action, entity, entity_id, metadata)
    select
      null,
      r.id,
      'trial_account_auto_deleted',
      'restaurants',
      r.id,
      jsonb_build_object(
        'restaurantName', r.name,
        'reason', 'Trial was not upgraded within 30 days after it ended.'
      )
    from marked_restaurants r
    returning id
  )
  select count(*) into deleted_trials from marked_restaurants;

  return jsonb_build_object(
    'expiredTrials', expired_trials,
    'expiredPaidSubscriptions', expired_paid,
    'deletedAbandonedTrials', deleted_trials
  );
end;
$$;

revoke all on function public.run_subscription_lifecycle_maintenance() from public;
revoke all on function public.run_subscription_lifecycle_maintenance() from anon;
revoke all on function public.run_subscription_lifecycle_maintenance() from authenticated;
