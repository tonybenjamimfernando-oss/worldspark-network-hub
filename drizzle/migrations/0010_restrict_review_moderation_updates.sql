-- Moderators may hide or restore reviews, but should not rewrite review content,
-- authorship, target listing, rating, or timestamps through the public API.
revoke update on table public.reviews from authenticated;
grant update (status) on table public.reviews to authenticated;
