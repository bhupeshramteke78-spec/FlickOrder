alter table public.restaurants
  add column if not exists latitude numeric(10,7),
  add column if not exists longitude numeric(10,7),
  add column if not exists location_source text;

alter table public.restaurants
  drop constraint if exists restaurants_location_source_check;

alter table public.restaurants
  add constraint restaurants_location_source_check
  check (
    location_source is null
    or location_source in ('OWNER_MANUAL', 'GOOGLE_MAPS_LINK', 'GEOCODED_ADDRESS', 'PIN_PICKER')
  );

create index if not exists restaurants_coordinates_idx
  on public.restaurants (latitude, longitude)
  where latitude is not null
    and longitude is not null
    and deleted_at is null;
