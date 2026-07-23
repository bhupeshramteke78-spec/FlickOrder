alter table public.subscription_upgrade_requests
  drop constraint if exists subscription_upgrade_requests_payment_method_check;

alter table public.subscription_upgrade_requests
  add constraint subscription_upgrade_requests_payment_method_check
  check (payment_method in ('UPI', 'RAZORPAY'));

alter table public.subscription_upgrade_requests
  alter column payment_method set default 'RAZORPAY';

alter table public.subscription_upgrade_requests
  add column if not exists gateway text not null default 'RAZORPAY',
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_signature text,
  add column if not exists paid_at timestamptz;

create unique index if not exists subscription_upgrade_requests_razorpay_order_idx
  on public.subscription_upgrade_requests (razorpay_order_id)
  where razorpay_order_id is not null;
