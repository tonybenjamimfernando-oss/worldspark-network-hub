-- Restrict direct invocation of trigger-only privileged functions.
-- Triggers continue to invoke these functions; API callers do not need EXECUTE.
revoke all on function public.auto_hide_review() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.listing_rate_limit() from public, anon, authenticated;
revoke all on function public.validate_review() from public, anon, authenticated;

-- has_role only checks the caller's own role after migration 0008.
-- It does not need SECURITY DEFINER; keep it callable for RLS policies.
alter function public.has_role(uuid, public.app_role) security invoker;
revoke all on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;

-- Cover foreign keys that are frequently used for owner-scoped lookups/deletes.
create index if not exists listings_owner_id_idx on public.listings (owner_id);
create index if not exists affiliate_links_affiliate_id_idx on public.affiliate_links (affiliate_id);
create index if not exists proposals_supplier_id_idx on public.proposals (supplier_id);
create index if not exists review_reports_reporter_id_idx on public.review_reports (reporter_id);
create index if not exists reviews_author_id_idx on public.reviews (author_id);
