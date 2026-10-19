-- Private, participant-only text conversations linked to marketplace listings.
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  participant_a uuid not null references public.profiles(id) on delete cascade,
  participant_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint conversations_distinct_participants check (participant_a <> participant_b),
  constraint conversations_canonical_participants check (participant_a < participant_b),
  constraint conversations_listing_participants_unique unique (listing_id, participant_a, participant_b)
);
create index conversations_participant_a_last_message_idx on public.conversations (participant_a, last_message_at desc);
create index conversations_participant_b_last_message_idx on public.conversations (participant_b, last_message_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
revoke all on public.conversations, public.messages from public, anon;
grant select on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant all on public.conversations, public.messages to service_role;

create policy conversations_participant_read on public.conversations
  for select to authenticated
  using ((select auth.uid()) = participant_a or (select auth.uid()) = participant_b);

create policy messages_participant_read on public.messages
  for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and ((select auth.uid()) = c.participant_a or (select auth.uid()) = c.participant_b)
  ));

create policy messages_participant_send on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and ((select auth.uid()) = c.participant_a or (select auth.uid()) = c.participant_b)
    )
  );

create or replace function public.start_listing_conversation(_listing_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  listing_owner_id uuid;
  lower_participant uuid;
  upper_participant uuid;
  conversation_id uuid;
begin
  if current_user_id is null then
    raise exception 'É necessário iniciar sessão para enviar mensagens.' using errcode = '28000';
  end if;
  select owner_id into listing_owner_id
  from public.listings
  where id = _listing_id and status = 'active';
  if listing_owner_id is null then
    raise exception 'Este anúncio já não está disponível.' using errcode = 'P0002';
  end if;
  if listing_owner_id = current_user_id then
    raise exception 'Não podes iniciar uma conversa contigo próprio.' using errcode = '22023';
  end if;

  lower_participant := least(current_user_id, listing_owner_id);
  upper_participant := greatest(current_user_id, listing_owner_id);
  insert into public.conversations (listing_id, participant_a, participant_b)
  values (_listing_id, lower_participant, upper_participant)
  on conflict (listing_id, participant_a, participant_b)
  do update set updated_at = now()
  returning id into conversation_id;
  return conversation_id;
end;
$$;
revoke all on function public.start_listing_conversation(uuid) from public, anon;
grant execute on function public.start_listing_conversation(uuid) to authenticated;

create or replace function public.bump_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.conversations
  set last_message_at = new.created_at, updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;
revoke all on function public.bump_conversation_on_message() from public, anon, authenticated;
create trigger messages_bump_conversation
  after insert on public.messages
  for each row execute function public.bump_conversation_on_message();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
     ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
