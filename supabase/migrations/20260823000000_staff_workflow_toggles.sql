alter table public.restaurant_settings
  add column if not exists kitchen_enabled boolean not null default false,
  add column if not exists waiter_enabled boolean not null default false;
