-- Validate public analytics events and prevent self-generated metrics.
-- This reduces accidental/malicious counter inflation; anonymous traffic still requires
-- edge-level rate limiting if stronger anti-abuse guarantees are needed.

create or replace function public.track_listing(_id uuid, _kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if _kind not in ('view', 'out') then
    return;
  end if;

  if _kind = 'view' then
    update public.listings
    set views = views + 1
    where id = _id
      and status = 'active'
      and owner_id is distinct from auth.uid();
  elsif _kind = 'out' then
    update public.listings
    set outbound_clicks = outbound_clicks + 1
    where id = _id
      and status = 'active'
      and is_external = true
      and source_url is not null
      and owner_id is distinct from auth.uid();
  end if;
end;
$$;

revoke all on function public.track_listing(uuid, text) from public;
grant execute on function public.track_listing(uuid, text) to anon, authenticated;

create or replace function public.track_affiliate_click(_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if _code is null or char_length(_code) < 6 or char_length(_code) > 32 then
    return;
  end if;

  update public.affiliate_links a
  set clicks = a.clicks + 1
  from public.listings l
  where a.listing_id = l.id
    and a.code = _code
    and l.status = 'active'
    and l.affiliate_enabled = true
    and l.owner_id is distinct from auth.uid()
    and a.affiliate_id is distinct from auth.uid();
end;
$$;

revoke all on function public.track_affiliate_click(text) from public;
grant execute on function public.track_affiliate_click(text) to anon, authenticated;
