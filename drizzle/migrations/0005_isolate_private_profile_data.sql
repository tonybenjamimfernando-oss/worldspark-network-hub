-- Tax identifiers are private data and must not live in publicly readable profiles.
create table public.profile_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tax_id text,
  updated_at timestamptz not null default now()
);

insert into public.profile_private (user_id, tax_id)
select id, tax_id from public.profiles
on conflict (user_id) do update set tax_id = excluded.tax_id, updated_at = now();

alter table public.profile_private enable row level security;
revoke all on public.profile_private from anon, public;
grant select, insert, update, delete on public.profile_private to authenticated;
grant all on public.profile_private to service_role;

create policy "users read own private profile"
  on public.profile_private for select to authenticated
  using (auth.uid() = user_id);
create policy "users create own private profile"
  on public.profile_private for insert to authenticated
  with check (auth.uid() = user_id);
create policy "users update own private profile"
  on public.profile_private for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "users delete own private profile"
  on public.profile_private for delete to authenticated
  using (auth.uid() = user_id);

alter table public.profiles drop column tax_id;

comment on table public.profile_private is
  'Private profile fields. Access is restricted to the owning authenticated user.';
