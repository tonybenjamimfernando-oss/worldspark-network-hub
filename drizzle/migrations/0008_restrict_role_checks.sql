-- Prevent authenticated clients from probing another user's role assignments.
-- RLS policies only need to check the current caller's moderator/admin roles.

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if _user_id is distinct from auth.uid() then
    return false;
  end if;

  return exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = _role
  );
end;
$$;

revoke all on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;
