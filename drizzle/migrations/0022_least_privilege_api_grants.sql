-- 0022 — Privilégios mínimos para a API
--
-- O Supabase concede, por omissão, todos os privilégios nas tabelas novas de public a anon e
-- authenticated. Até aqui a única barreira eram as políticas de RLS, o que deixava cada política
-- acrescentada sem cuidado imediatamente aberta a escritas que ninguém queria.
--
-- Esta migração torna o mínimo explícito e não altera dados nem o comportamento da aplicação:
-- as únicas tabelas lidas por visitantes anónimos são profiles, listings e reviews (as três com
-- política pública), o frontend não escreve em nenhuma das tabelas aqui revogadas e a Edge
-- Function das métricas usa o papel service_role. Aplicada no projecto alojado em 2026-10-21
-- (histórico: 20261022000000).

-- 1. Visitantes anónimos: leitura apenas onde existe política pública.
revoke all on public.profiles from anon;
revoke all on public.profile_private from anon;
revoke all on public.listings from anon;
revoke all on public.proposals from anon;
revoke all on public.reviews from anon;
revoke all on public.review_reports from anon;
revoke all on public.affiliate_links from anon;
revoke all on public.conversations from anon;
revoke all on public.messages from anon;
revoke all on public.user_roles from anon;
revoke all on public.metrics_rate_limits from anon;
grant select on public.profiles to anon;
grant select on public.listings to anon;
grant select on public.reviews to anon;

-- 2. Utilizadores autenticados: nada de escritas onde não existe política de escrita.
--    profiles, listings, proposals e reviews.status mantêm os grants por coluna.
revoke insert, update, delete on public.user_roles from authenticated;
revoke update, delete on public.review_reports from authenticated;
revoke update on public.affiliate_links from authenticated;
revoke update, delete on public.conversations from authenticated;
revoke update, delete on public.messages from authenticated;
revoke delete on public.profiles from authenticated;

-- 3. Privilégios auxiliares que a API não usa (TRUNCATE não respeita RLS).
revoke truncate, references, trigger on public.profiles from anon, authenticated;
revoke truncate, references, trigger on public.profile_private from anon, authenticated;
revoke truncate, references, trigger on public.listings from anon, authenticated;
revoke truncate, references, trigger on public.proposals from anon, authenticated;
revoke truncate, references, trigger on public.reviews from anon, authenticated;
revoke truncate, references, trigger on public.review_reports from anon, authenticated;
revoke truncate, references, trigger on public.affiliate_links from anon, authenticated;
revoke truncate, references, trigger on public.conversations from anon, authenticated;
revoke truncate, references, trigger on public.messages from anon, authenticated;
revoke truncate, references, trigger on public.user_roles from anon, authenticated;
revoke truncate, references, trigger on public.metrics_rate_limits from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
do $do$
begin
  execute 'revoke maintain on all tables in schema public from anon, authenticated';
exception when undefined_object or syntax_error then
  raise notice 'MAINTAIN não existe nesta versão do PostgreSQL; nada a revogar.';
end $do$;

-- 4. Tabelas, sequências e funções futuras em public não nascem concedidas à API.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from authenticated;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on sequences from authenticated;
alter default privileges in schema public revoke execute on functions from anon;
alter default privileges in schema public revoke execute on functions from authenticated;

-- 5. Funções que só correm dentro de triggers deixam de ser chamáveis pela API.
--    O disparo dos triggers foi verificado com um insert revertido.
revoke execute on function public.protect_profile_verified() from public, anon, authenticated;
revoke execute on function public.reset_listing_metrics_on_insert() from public, anon, authenticated;
revoke execute on function public.validate_external_listing_url() from public, anon, authenticated;
grant execute on function public.protect_profile_verified() to service_role;
grant execute on function public.reset_listing_metrics_on_insert() to service_role;
grant execute on function public.validate_external_listing_url() to service_role;
