-- Keep listing analytics controlled by database functions, not by client payloads.
-- Owners may edit listing content, but cannot rewrite ownership, creation time or counters.
revoke update on table public.listings from authenticated;

grant update (
  kind,
  title,
  description,
  category,
  images,
  video_url,
  price,
  currency,
  stock,
  brand,
  condition,
  variants,
  features,
  city,
  country,
  delivery,
  warranty,
  returns_policy,
  terms,
  affiliate_enabled,
  affiliate_commission,
  status,
  is_external,
  source_url,
  source_platform,
  source_store,
  publisher_relation,
  source_checked_at,
  budget_max,
  quantity,
  deadline,
  contact_visibility
) on table public.listings to authenticated;

-- INSERT privileges remain available for publishing, but submitted analytics are ignored.
create or replace function public.reset_listing_metrics_on_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.views := 0;
  new.outbound_clicks := 0;
  return new;
end;
$$;

drop trigger if exists listings_reset_metrics_on_insert on public.listings;
create trigger listings_reset_metrics_on_insert
before insert on public.listings
for each row execute function public.reset_listing_metrics_on_insert();

comment on function public.reset_listing_metrics_on_insert() is
  'Resets client-supplied listing counters; analytics are incremented by trusted database functions.';
