-- Prevent review-rate-limit bypass by backdating inserts and serialize concurrent
-- submissions from the same author before counting recent reviews.
create or replace function public.validate_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  -- A client must not be able to backdate a review to evade the hourly limit.
  new.created_at := now();

  -- Serialize this author's review inserts so concurrent requests cannot all
  -- observe the same pre-insert count and exceed the limit together.
  perform pg_advisory_xact_lock(hashtextextended(new.author_id::text, 0));

  if exists (
    select 1
    from public.listings
    where id = new.listing_id
      and owner_id = new.author_id
  ) then
    raise exception 'Não pode avaliar o seu próprio anúncio';
  end if;

  select count(*)
  into recent
  from public.reviews
  where author_id = new.author_id
    and created_at > now() - interval '1 hour';

  if recent >= 10 then
    raise exception 'Limite de avaliações atingido. Tente mais tarde.';
  end if;

  new.status := 'visible';
  return new;
end;
$$;

comment on function public.validate_review() is
  'Prevents self-reviews and review-rate-limit bypass by forcing server timestamps and serializing each author’s inserts.';
