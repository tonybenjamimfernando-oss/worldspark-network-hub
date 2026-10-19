-- Optional approximate public coordinates for location-based discovery.
alter table public.listings
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6);
alter table public.listings
  add constraint listings_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint listings_longitude_range check (longitude is null or longitude between -180 and 180),
  add constraint listings_coordinates_pair check ((latitude is null) = (longitude is null));
create index if not exists listings_coordinates_idx on public.listings (latitude, longitude)
  where status = 'active' and latitude is not null and longitude is not null;
