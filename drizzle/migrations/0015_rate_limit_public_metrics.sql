-- Atomic, server-side rate limits for public metrics.
create table if not exists public.metrics_rate_limits (
  ip_hash text not null,
  scope text not null check (scope in ('listing', 'affiliate')),
  window_start timestamptz not null,
  hits integer not null default 0 check (hits >= 0),
  updated_at timestamptz not null default now(),
  primary key (ip_hash, scope, window_start)
);
alter table public.metrics_rate_limits enable row level security;
revoke all on table public.metrics_rate_limits from public, anon, authenticated;

create or replace function public.consume_metrics_rate_limit(_ip_hash text, _scope text, _max_hits integer, _window_start timestamptz)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare current_hits integer;
begin
  if _ip_hash is null or char_length(_ip_hash) <> 64 or _scope not in ('listing', 'affiliate') or _max_hits < 1 or _max_hits > 1000 then return false; end if;
  insert into public.metrics_rate_limits (ip_hash, scope, window_start, hits, updated_at)
  values (_ip_hash, _scope, _window_start, 1, now())
  on conflict (ip_hash, scope, window_start)
  do update set hits = public.metrics_rate_limits.hits + 1, updated_at = now()
  returning hits into current_hits;
  delete from public.metrics_rate_limits where window_start < now() - interval '24 hours';
  return current_hits <= _max_hits;
end; $$;
revoke all on function public.consume_metrics_rate_limit(text, text, integer, timestamptz) from public, anon, authenticated;
grant execute on function public.consume_metrics_rate_limit(text, text, integer, timestamptz) to service_role;

create or replace function public.track_listing(_id uuid, _kind text, _viewer_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if _kind = 'view' then
    update public.listings set views = views + 1 where id = _id and status = 'active' and owner_id is distinct from _viewer_id;
  elsif _kind = 'out' then
    update public.listings set outbound_clicks = outbound_clicks + 1 where id = _id and status = 'active' and is_external = true and source_url is not null and owner_id is distinct from _viewer_id;
  end if;
end; $$;

create or replace function public.track_affiliate_click(_code text, _viewer_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if _code is null or char_length(_code) < 6 or char_length(_code) > 32 then return; end if;
  update public.affiliate_links a set clicks = a.clicks + 1
  from public.listings l where a.listing_id = l.id and a.code = _code and l.status = 'active'
    and l.affiliate_enabled = true and l.owner_id is distinct from _viewer_id and a.affiliate_id is distinct from _viewer_id;
end; $$;

-- Legacy two-argument RPCs are revoked by migration 0016 after the frontend rollout.
revoke all on function public.track_listing(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.track_affiliate_click(text, uuid) from public, anon, authenticated;
grant execute on function public.track_listing(uuid, text, uuid) to service_role;
grant execute on function public.track_affiliate_click(text, uuid) to service_role;
