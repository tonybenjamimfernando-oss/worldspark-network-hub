-- Prevent regular users from setting their own verification badge.
-- Column-level grants are the primary control; the trigger is defense in depth.
revoke update on table public.profiles from authenticated;

grant update (
  account_type,
  display_name,
  username,
  bio,
  avatar_url,
  company_name,
  tax_id,
  services,
  public_phone,
  public_email,
  website,
  city,
  country,
  is_public
) on table public.profiles to authenticated;

create or replace function public.protect_profile_verified()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user not in ('service_role', 'postgres') then
    if tg_op = 'INSERT' then
      new.is_verified := false;
    else
      new.is_verified := old.is_verified;
    end if;
  end if;

  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect
before insert or update on public.profiles
for each row execute function public.protect_profile_verified();

comment on function public.protect_profile_verified() is
  'Prevents authenticated users from self-assigning profile verification; trusted database roles may manage verification.';
