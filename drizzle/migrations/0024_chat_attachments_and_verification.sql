alter table public.messages add column if not exists attachment_path text;
alter table public.messages add column if not exists attachment_type text;
alter table public.messages add column if not exists attachment_name text;
alter table public.messages add column if not exists read_at timestamptz;
alter table public.messages alter column body set default '';

create or replace function public.mark_conversation_read(_conversation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.messages m set read_at = now()
  from public.conversations c
  where m.conversation_id = _conversation_id and c.id = m.conversation_id
    and m.read_at is null and m.sender_id <> auth.uid()
    and auth.uid() in (c.participant_a, c.participant_b);
end $$;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

create policy "chat participants read" on storage.objects for select to authenticated
using (bucket_id = 'chat' and exists (select 1 from public.conversations c
  where c.id::text = (storage.foldername(name))[1] and auth.uid() in (c.participant_a, c.participant_b)));
create policy "chat participants upload" on storage.objects for insert to authenticated
with check (bucket_id = 'chat' and (storage.foldername(name))[2] = auth.uid()::text and exists (select 1 from public.conversations c
  where c.id::text = (storage.foldername(name))[1] and auth.uid() in (c.participant_a, c.participant_b)));

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 160),
  registration_number text check (char_length(registration_number) <= 80),
  website text check (char_length(website) <= 300),
  notes text check (char_length(notes) <= 2000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index verification_one_pending on public.verification_requests(user_id) where status = 'pending';
grant select, insert on public.verification_requests to authenticated;
grant all on public.verification_requests to service_role;
alter table public.verification_requests enable row level security;
create policy "owner or admin read verification" on public.verification_requests for select to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "owner requests verification" on public.verification_requests for insert to authenticated
with check (auth.uid() = user_id and status = 'pending' and reviewed_at is null and review_note is null);

create or replace function public.review_verification(_id uuid, _approve boolean, _note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare _uid uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  update public.verification_requests set status = case when _approve then 'approved' else 'rejected' end,
    review_note = left(_note, 500), reviewed_at = now()
  where id = _id and status = 'pending' returning user_id into _uid;
  if _uid is null then raise exception 'Pedido inexistente ou já analisado'; end if;
  if _approve then update public.profiles set is_verified = true where id = _uid; end if;
end $$;
revoke execute on function public.review_verification(uuid, boolean, text) from public, anon;
grant execute on function public.review_verification(uuid, boolean, text) to authenticated;