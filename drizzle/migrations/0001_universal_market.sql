
alter table public.listings
  add column is_external boolean not null default false,
  add column source_url text,
  add column source_platform text,
  add column source_store text,
  add column publisher_relation text not null default 'owner' check (publisher_relation in ('owner','representative','sharer')),
  add column source_checked_at timestamptz,
  add column budget_max numeric(14,2),
  add column quantity integer,
  add column deadline date,
  add column contact_visibility text not null default 'proposers' check (contact_visibility in ('public','proposers','private')),
  add column views integer not null default 0,
  add column outbound_clicks integer not null default 0;
create unique index listings_source_url_unique on public.listings (lower(source_url)) where source_url is not null;

create or replace function public.track_listing(_id uuid, _kind text) returns void language sql security definer set search_path=public as $$
  update public.listings set
    views = views + case when _kind='view' then 1 else 0 end,
    outbound_clicks = outbound_clicks + case when _kind='out' then 1 else 0 end
  where id=_id and status='active';
$$;
grant execute on function public.track_listing(uuid, text) to anon, authenticated;

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.listings(id) on delete cascade,
  supplier_id uuid not null references public.profiles(id) on delete cascade,
  price numeric(14,2) check (price is null or price >= 0),
  currency text not null default 'EUR',
  delivery_days integer check (delivery_days is null or delivery_days >= 0),
  message text not null check (char_length(message) between 5 and 3000),
  status text not null default 'sent' check (status in ('sent','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (request_id, supplier_id)
);
grant select, insert, update, delete on public.proposals to authenticated;
grant all on public.proposals to service_role;
alter table public.proposals enable row level security;
create policy "supplier or buyer read" on public.proposals for select to authenticated using (auth.uid()=supplier_id or exists (select 1 from public.listings l where l.id=request_id and l.owner_id=auth.uid()));
create policy "supplier insert" on public.proposals for insert to authenticated with check (auth.uid()=supplier_id and exists (select 1 from public.listings l where l.id=request_id and l.kind='request' and l.status='active' and l.owner_id<>auth.uid()));
create policy "supplier delete" on public.proposals for delete to authenticated using (auth.uid()=supplier_id);
create policy "buyer update status" on public.proposals for update to authenticated using (exists (select 1 from public.listings l where l.id=request_id and l.owner_id=auth.uid()));

create or replace function public.listing_rate_limit() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if (select count(*) from public.listings where owner_id=new.owner_id and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'Limite de publicações por hora atingido.';
  end if;
  if new.is_external and (new.source_url is null or new.source_url !~* '^https://') then
    raise exception 'Ofertas externas exigem um link https válido da loja de origem.';
  end if;
  return new;
end $$;
create trigger listings_rate_limit before insert on public.listings for each row execute function public.listing_rate_limit();
