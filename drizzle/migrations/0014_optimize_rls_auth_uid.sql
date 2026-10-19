-- Cache auth.uid() per statement instead of re-evaluating it for every row.
-- Rebuild existing public-schema policies without changing their predicates, roles,
-- command, or permissive/restrictive behavior.
do $$
declare
  policy_row record;
  roles_clause text;
  using_clause text;
  check_clause text;
begin
  for policy_row in
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') like '%auth.uid()%'
        or coalesce(with_check, '') like '%auth.uid()%'
      )
  loop
    roles_clause := array_to_string(policy_row.roles, ', ');
    using_clause := case
      when policy_row.qual is not null
      then ' using (' || replace(policy_row.qual, 'auth.uid()', '(select auth.uid())') || ')'
      else ''
    end;
    check_clause := case
      when policy_row.with_check is not null
      then ' with check (' || replace(policy_row.with_check, 'auth.uid()', '(select auth.uid())') || ')'
      else ''
    end;

    execute format(
      'drop policy %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );

    execute format(
      'create policy %I on %I.%I as %s for %s to %s%s%s',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename,
      policy_row.permissive,
      policy_row.cmd,
      roles_clause,
      using_clause,
      check_clause
    );
  end loop;
end;
$$;
