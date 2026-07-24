alter table public.restaurants
  add column if not exists verification_status text not null default 'PENDING'
    check (verification_status in ('PENDING', 'APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED')),
  add column if not exists fssai_number text,
  add column if not exists google_maps_url text,
  add column if not exists verification_note text,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references public.profiles(id);

update public.restaurants
set verification_status = 'APPROVED',
    verified_at = coalesce(verified_at, now())
where verification_status = 'PENDING'
  and created_at < now() - interval '1 minute';

create table if not exists public.restaurant_verification_documents (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  document_type text not null check (document_type in ('FSSAI_CERTIFICATE', 'STOREFRONT_PHOTO', 'OWNER_ID', 'GST_CERTIFICATE', 'OTHER')),
  file_url text not null,
  created_at timestamptz not null default now()
);

alter table public.restaurant_verification_documents enable row level security;

drop policy if exists "verification docs member read" on public.restaurant_verification_documents;
create policy "verification docs member read"
  on public.restaurant_verification_documents
  for select
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

drop policy if exists "verification docs service insert" on public.restaurant_verification_documents;
create policy "verification docs service insert"
  on public.restaurant_verification_documents
  for insert
  with check (false);

create index if not exists restaurants_verification_status_idx
  on public.restaurants (verification_status, created_at desc);

create index if not exists restaurant_verification_documents_restaurant_idx
  on public.restaurant_verification_documents (restaurant_id, created_at desc);
