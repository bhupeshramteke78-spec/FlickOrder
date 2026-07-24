alter table public.restaurants
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_requested_by uuid references public.profiles(id) on delete set null,
  add column if not exists deletion_reason text,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null;

create index if not exists restaurants_deletion_requested_idx
  on public.restaurants (deletion_requested_at desc)
  where deletion_requested_at is not null and deleted_at is null;

create index if not exists restaurants_deleted_idx
  on public.restaurants (deleted_at)
  where deleted_at is not null;
