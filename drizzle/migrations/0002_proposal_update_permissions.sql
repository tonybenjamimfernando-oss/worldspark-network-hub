-- Restrict proposal updates to the buyer's decision only.
-- Prevent clients from changing supplier, request, price, message, or delivery terms.
revoke update on table public.proposals from authenticated;
grant update (status) on table public.proposals to authenticated;

drop policy if exists "buyer update status" on public.proposals;
create policy "buyer decides pending proposal"
  on public.proposals
  for update
  to authenticated
  using (
    status = 'sent'
    and exists (
      select 1
      from public.listings l
      where l.id = request_id
        and l.owner_id = auth.uid()
        and l.kind = 'request'
    )
  )
  with check (
    status in ('accepted', 'declined')
    and exists (
      select 1
      from public.listings l
      where l.id = request_id
        and l.owner_id = auth.uid()
        and l.kind = 'request'
    )
  );
