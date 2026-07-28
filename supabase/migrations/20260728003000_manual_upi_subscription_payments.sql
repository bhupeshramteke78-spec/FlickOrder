alter table public.subscription_upgrade_requests
  add column if not exists transaction_id text,
  add column if not exists payment_submitted_at timestamptz,
  add column if not exists rejection_reason text;

alter table public.subscription_upgrade_requests
  alter column payment_method set default 'UPI',
  alter column gateway set default 'MANUAL_UPI';

create unique index if not exists subscription_upgrade_requests_transaction_id_idx
  on public.subscription_upgrade_requests (lower(transaction_id))
  where transaction_id is not null;

update public.subscription_upgrade_requests
set status = 'CANCELLED'
where status = 'PENDING_PAYMENT'
  and payment_method = 'RAZORPAY';

drop policy if exists "subscription upgrade requests scoped read"
  on public.subscription_upgrade_requests;

create policy "subscription upgrade requests owner and super admin read"
  on public.subscription_upgrade_requests
  for select
  using (
    public.is_super_admin()
    or exists (
      select 1
      from public.restaurant_members
      where restaurant_members.restaurant_id = subscription_upgrade_requests.restaurant_id
        and restaurant_members.profile_id = auth.uid()
        and restaurant_members.role = 'OWNER'
    )
  );
