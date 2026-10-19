-- Keep external listing links HTTPS-only on both creation and later edits.
-- The original listing_rate_limit trigger validates this only on INSERT.
create or replace function public.validate_external_listing_url()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_external then
    if new.source_url is null or new.source_url !~* '^https://[^[:space:]]+$' then
      raise exception 'Ofertas externas exigem um link HTTPS válido da loja de origem.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists listings_validate_external_url on public.listings;
create trigger listings_validate_external_url
before insert or update on public.listings
for each row execute function public.validate_external_listing_url();

comment on function public.validate_external_listing_url() is
  'Requires external listings to retain a non-empty HTTPS source URL when created or edited.';
