-- Make the conversation starter invoker-safe and explicitly deny public access to rate-limit state.
create index if not exists metrics_rate_limits_window_start_idx
  on public.metrics_rate_limits (window_start);

create policy metrics_rate_limits_deny_public
  on public.metrics_rate_limits
  for all to anon, authenticated
  using (false)
  with check (false);

grant insert on public.conversations to authenticated;
create policy conversations_participant_create
  on public.conversations
  for insert to authenticated
  with check (
    (select auth.uid()) in (participant_a, participant_b)
    and participant_a < participant_b
    and exists (
      select 1 from public.listings l
      where l.id = listing_id
        and l.status = 'active'
        and l.owner_id in (participant_a, participant_b)
        and l.owner_id <> (select auth.uid())
    )
  );

create or replace function public.start_listing_conversation(_listing_id uuid)
returns uuid
language plpgsql
security invoker
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

  select id into conversation_id
  from public.conversations
  where listing_id = _listing_id
    and participant_a = lower_participant
    and participant_b = upper_participant;
  if conversation_id is not null then
    return conversation_id;
  end if;

  insert into public.conversations (listing_id, participant_a, participant_b)
  values (_listing_id, lower_participant, upper_participant)
  on conflict (listing_id, participant_a, participant_b) do nothing
  returning id into conversation_id;

  if conversation_id is null then
    select id into conversation_id
    from public.conversations
    where listing_id = _listing_id
      and participant_a = lower_participant
      and participant_b = upper_participant;
  end if;
  if conversation_id is null then
    raise exception 'Não foi possível iniciar a conversa.' using errcode = 'P0001';
  end if;
  return conversation_id;
end;
$$;
revoke all on function public.start_listing_conversation(uuid) from public, anon;
grant execute on function public.start_listing_conversation(uuid) to authenticated;
