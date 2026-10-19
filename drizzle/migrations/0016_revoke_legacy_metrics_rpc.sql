-- Final rollout step: browser clients must use the rate-limited Edge Function.
revoke all on function public.track_listing(uuid, text) from public, anon, authenticated;
revoke all on function public.track_affiliate_click(text) from public, anon, authenticated;
