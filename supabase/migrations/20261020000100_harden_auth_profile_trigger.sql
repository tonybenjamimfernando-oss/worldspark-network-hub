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