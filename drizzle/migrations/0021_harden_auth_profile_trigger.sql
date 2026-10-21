-- 0021 — Reconciliação: endurecimento da criação de perfil
--
-- Esta migração passa para o histórico Drizzle o que vivia solto em
-- supabase/migrations/20261020000100_harden_auth_profile_trigger.sql. O SQL é idêntico à função
-- que está em produção no projecto alojado (o histórico remoto regista-a como 20261020001629).
-- Reescreve handle_new_user(): fixa search_path, mantém SECURITY DEFINER e trata falhas na
-- criação do perfil sem deixar o registo a meio.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do update
    set display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name);

  return new;
exception when others then
  raise log 'handle_new_user failed for user %: %', new.id, sqlerrm;
  raise exception 'Não foi possível criar o perfil da conta. Tenta novamente mais tarde.';
end;
$function$;
