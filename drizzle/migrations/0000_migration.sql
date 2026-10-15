
create type public.account_type as enum ('personal','business','provider');
create type public.listing_kind as enum ('product','service','request','opportunity');
create type public.app_role as enum ('admin','moderator','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type public.account_type not null default 'personal',
  display_name text not null default '',
  username text unique,
  bio text,
  avatar_url text,
  company_name text,
  tax_id text,
  services text[] not null default '{}',
  public_phone text,
  public_email text,
  website text,
  city text,
  country text,
  is_verified boolean not null default false,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "public profiles readable" on public.profiles for select using (is_public or auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.protect_profile_verified() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.is_verified is distinct from old.is_verified and current_user not in ('service_role','postgres') then
    new.is_verified := old.is_verified;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_protect before update on public.profiles for each row execute function public.protect_profile_verified();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean
language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind public.listing_kind not null default 'product',
  title text not null check (char_length(title) between 3 and 140),
  description text not null default '' check (char_length(description) <= 8000),
  category text not null default 'other',
  images text[] not null default '{}',
  video_url text,
  price numeric(14,2) check (price is null or price >= 0),
  currency text not null default 'EUR' check (char_length(currency)=3),
  stock integer check (stock is null or stock >= 0),
  brand text,
  condition text,
  variants text,
  features text,
  city text,
  country text,
  delivery text,
  warranty text,
  returns_policy text,
  terms text,
  affiliate_enabled boolean not null default false,
  affiliate_commission numeric(5,2) check (affiliate_commission is null or (affiliate_commission >= 0 and affiliate_commission <= 90)),
  status text not null default 'active' check (status in ('active','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.listings (kind, created_at desc);
create index on public.listings (category);
grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;
grant all on public.listings to service_role;
alter table public.listings enable row level security;
create policy "active listings readable" on public.listings for select using (status='active' or auth.uid()=owner_id);
create policy "owner insert" on public.listings for insert to authenticated with check (auth.uid()=owner_id);
create policy "owner update" on public.listings for update to authenticated using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "owner delete" on public.listings for delete to authenticated using (auth.uid()=owner_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 2000),
  status text not null default 'visible' check (status in ('visible','hidden')),
  created_at timestamptz not null default now(),
  unique (listing_id, author_id)
);
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "visible reviews readable" on public.reviews for select using (status='visible' or auth.uid()=author_id or public.has_role(auth.uid(),'moderator') or public.has_role(auth.uid(),'admin'));
create policy "author insert" on public.reviews for insert to authenticated with check (auth.uid()=author_id);
create policy "author delete" on public.reviews for delete to authenticated using (auth.uid()=author_id);
create policy "moderator update" on public.reviews for update to authenticated using (public.has_role(auth.uid(),'moderator') or public.has_role(auth.uid(),'admin'));

create or replace function public.validate_review() returns trigger language plpgsql security definer set search_path=public as $$
declare recent int;
begin
  if exists (select 1 from public.listings where id=new.listing_id and owner_id=new.author_id) then
    raise exception 'Não pode avaliar o seu próprio anúncio';
  end if;
  select count(*) into recent from public.reviews where author_id=new.author_id and created_at > now() - interval '1 hour';
  if recent >= 10 then raise exception 'Limite de avaliações atingido. Tente mais tarde.'; end if;
  new.status := 'visible';
  return new;
end $$;
create trigger reviews_validate before insert on public.reviews for each row execute function public.validate_review();

create table public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);
grant insert, select on public.review_reports to authenticated;
grant all on public.review_reports to service_role;
alter table public.review_reports enable row level security;
create policy "reporter insert" on public.review_reports for insert to authenticated with check (auth.uid()=reporter_id);
create policy "mods read reports" on public.review_reports for select to authenticated using (auth.uid()=reporter_id or public.has_role(auth.uid(),'moderator') or public.has_role(auth.uid(),'admin'));

create or replace function public.auto_hide_review() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if (select count(*) from public.review_reports where review_id=new.review_id) >= 3 then
    update public.reviews set status='hidden' where id=new.review_id;
  end if;
  return new;
end $$;
create trigger review_reports_autohide after insert on public.review_reports for each row execute function public.auto_hide_review();

create table public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  affiliate_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique default substr(replace(gen_random_uuid()::text,'-',''),1,10),
  clicks integer not null default 0,
  created_at timestamptz not null default now(),
  unique (listing_id, affiliate_id)
);
grant select, insert, delete on public.affiliate_links to authenticated;
grant all on public.affiliate_links to service_role;
alter table public.affiliate_links enable row level security;
create policy "affiliate or seller read" on public.affiliate_links for select to authenticated using (auth.uid()=affiliate_id or exists (select 1 from public.listings l where l.id=listing_id and l.owner_id=auth.uid()));
create policy "affiliate insert" on public.affiliate_links for insert to authenticated with check (auth.uid()=affiliate_id and exists (select 1 from public.listings l where l.id=listing_id and l.affiliate_enabled and l.status='active' and l.owner_id<>auth.uid()));
create policy "affiliate delete" on public.affiliate_links for delete to authenticated using (auth.uid()=affiliate_id);

create or replace function public.track_affiliate_click(_code text) returns void language sql security definer set search_path=public as $$
  update public.affiliate_links set clicks = clicks + 1 where code = _code;
$$;
grant execute on function public.track_affiliate_click(text) to anon, authenticated;

create policy "media read all" on storage.objects for select using (bucket_id='media');
create policy "media own upload" on storage.objects for insert to authenticated with check (bucket_id='media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media own delete" on storage.objects for delete to authenticated using (bucket_id='media' and (storage.foldername(name))[1] = auth.uid()::text);
