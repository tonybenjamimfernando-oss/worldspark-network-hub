# Fase 3 — Segurança e privacidade: auditoria

Âmbito: regras de acesso na base de dados (RLS, políticas de Storage, grants), funções privilegiadas,
exposição de dados privados, abuso das métricas públicas e importação de URLs externas.

Método: leitura das 22 migrações em drizzle/migrations/ e supabase/migrations/, do código em src/ e da
função Edge track-metrics, seguida de verificação automatizada das invariantes descritas no fim.
Nada foi aplicado à base de dados alojada: esta fase produz testes e documentação no repositório.

## Verificado e correcto

- **RLS em todas as tabelas.** As 11 tabelas criadas (profiles, profile_private, listings, proposals,
  reviews, review_reports, affiliate_links, conversations, messages, user_roles, metrics_rate_limits)
  têm *enable row level security*. Verificado por teste automatizado.
- **Sem políticas abertas.** Das 35 políticas, nenhuma usa *using (true)* ou *with check (true)*. As
  leituras amplas existentes estão limitadas ao bucket de imagens.
- **Funções privilegiadas.** As 18 funções *security definer* fixam *search_path*. A função has_role
  passou a *security invoker* (0013) e mantém-se executável por anon/authenticated porque as políticas
  dependem dela.
- **Métricas públicas.** track_listing e track_affiliate_click deixaram de ser executáveis pelo
  navegador (0015, 0016 revogam anon/authenticated). Só a função Edge track-metrics as invoca com
  service_role, com limite por IP (consume_metrics_rate_limit, hash de 64 caracteres, janela horária e
  expurgo a 24 horas), validação de tipo e de tamanho do código, e contagem que ignora o próprio
  dono/visitante.
- **Estado dos limites.** metrics_rate_limits tem RLS activo, política de negação explícita para
  anon/authenticated e grants revogados.
- **Propostas.** A migração 0002 revoga update na tabela e concede apenas update na coluna status: o
  dono do pedido decide, mas não altera valores nem autoria. As políticas confirmam que só o autor
  insere/apaga e só o dono do pedido actualiza.
- **Perfil verificado.** O trigger protect_profile_verified repõe is_verified sempre que a alteração não
  vem de service_role ou postgres.
- **Identificador fiscal.** profiles.tax_id foi removido (0005) e o valor passou para profile_private,
  cujos grants excluem anon e public, verificado por teste.
- **Chat.** conversations e messages só para participantes; messages exige sender_id igual a auth.uid();
  conversations exige ordem canónica dos participantes e que um deles seja o dono de um anúncio activo;
  start_listing_conversation exige sessão iniciada.
- **Storage.** Políticas restritas ao bucket media; escrita e eliminação limitadas à pasta do próprio
  utilizador ((storage.foldername(name))[1] = auth.uid()::text); limites do bucket em 0012 (10 MiB,
  JPEG/PNG/WebP/GIF).
- **Importação de URLs externas** (src/lib/meta.functions.ts). Exige sessão, aceita apenas https, rejeita
  credenciais no URL, IP literal e prefixos privados (localhost, 127., 10., 192.168., 172.16–31.,
  169.254., 0., ::1), rejeita sufixos internos, não segue redireccionamentos, exige HTML, limita o corpo
  a 400 KB e impõe 8 segundos de tempo limite.

## Verificação na base de dados real (2026-10-21)

Auditoria repetida directamente contra o projecto alojado (worldspark-network-hub, eu-west-1),
com sondagens feitas como visitante anónimo através do PostgREST, além da leitura das definições
em pg_class, pg_policies, pg_proc, pg_default_acl e pg_trigger.

Confirmado:

- 11 tabelas em public, todas com RLS activo. 30 políticas, exactamente as que as migrações
  criam (35 create menos as substituídas em 0002 e 0014). Nenhuma política aberta.
- 18 funções SECURITY DEFINER, todas com search_path fixo. As funções de métricas (track_listing,
  track_affiliate_click, consume_metrics_rate_limit) não são executáveis por anon nem por
  authenticated; has_role continua acessível porque as políticas dependem dela.
- Trigger on_auth_user_created a chamar handle_new_user, com a definição endurecida.
- Bucket media público, limitado a 10 MiB e apenas imagens; upload e eliminação restritos à pasta
  do próprio utilizador; leitura pública.
- anon e authenticated não podem criar objectos em public, storage nem extensions, pelo que não
  há risco de sombreamento dos nomes usados dentro das funções.
- Sondagens anónimas: profiles devolve o perfil público (com public_phone e public_email, como a
  interface promete), listings e reviews respondem sem linhas, e profile_private, conversations,
  messages e metrics_rate_limits respondem 401.
- A conta do dono tinha perfil mas nenhuma função atribuída, o que tornava a moderação impossível.
  Foi atribuída a função admin.

Corrigido em produção, com equivalente versionado em drizzle/migrations/0022:

- Privilégios mínimos. anon ficou apenas com SELECT em profiles, listings e reviews;
  authenticated perdeu as escritas sem política correspondente (user_roles, review_reports,
  affiliate_links, conversations, messages e profiles.DELETE). A lista final coincide exactamente
  com as políticas: cada privilégio concedido tem uma política que o limita.
- Privilégios auxiliares (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN) retirados de anon e
  authenticated em todas as tabelas.
- Privilégios por omissão de public: tabelas, sequências e funções novas deixam de nascer
  concedidas a anon e authenticated. Aplica-se ao papel postgres, que é quem cria as tabelas da
  aplicação; os valores por omissão do papel supabase_admin não são alteráveis por postgres.
- Funções que só existem para triggers deixaram de ser executáveis pela API. O disparo foi
  verificado com um insert revertido, confirmando que os limites e a validação continuam a correr.
- proposals, affiliate_links, user_roles e review_reports passaram a responder 401 a visitantes
  anónimos, em vez de 200 sem linhas.

Reconciliação do histórico: a migração solta de handle_new_user() foi comparada com a função em
produção (idêntica) e passou a drizzle/migrations/0021, com entrada no diário. O ficheiro solto e
o seu README deixaram de ser necessários.

## Riscos residuais

### 1. A visibilidade de contacto por anúncio não é garantida pelo servidor — Média

contact_visibility (public, proposers, private) é aplicado apenas em src/routes/anuncio.$id.tsx.
profiles.public_phone e profiles.public_email continuam legíveis por qualquer visitante, anónimo
incluído, em perfis públicos. Quem consultar a API directamente obtém o contacto mesmo quando o anúncio
está marcado como proposers ou private. A própria interface descreve esses campos como visíveis
publicamente, ou seja, existem hoje duas promessas contraditórias.

Opções: (A) separar o contacto por anúncio, com leitura pelo dono e uma função listing_contact que só
devolva o contacto quando autorizado — exige alterar painel, anúncio e perfil público; (B) assumir que o
contacto do perfil é público e deixar de o apresentar como protegido ao nível do anúncio. Precisa de
decisão de produto.

### 2. Registo e conta sem barreiras — Média

O Turnstile está inactivo por falta da chave de site e, no projecto alojado, a configuração de
autenticação confirma o resto: CAPTCHA desactivado, confirmação de email desligada (a conta fica
activa sem provar que o endereço é seu), comprimento mínimo da palavra-passe 6, protecção contra
palavras-passe comprometidas desligada e site_url de autenticação a apontar para localhost, o que
parte as ligações de confirmação e recuperação em produção. Mitigação: chave de site do Turnstile,
activar CAPTCHA, ligar a confirmação de email, subir o mínimo para 12, ligar a protecção de
palavras-passe comprometidas e apontar o site_url para o domínio real. Exige o âmbito auth:write
ou alteração directa no painel da Supabase.

### 3. Bucket público com URLs assinadas em paralelo — Baixa

O bucket media é público para leitura, mas a interface resolve as imagens com createSignedUrls de uma
hora (src/lib/media.ts). Não é uma falha: é redundância, porque as ligações expiram sem ganho de
segurança. Decisão: manter o bucket público e usar getPublicUrl, ou fechar a leitura pública e manter
apenas as URLs assinadas.

### 4. SSRF por resolução de DNS — Baixa

A importação valida o nome do anfitrião, não o endereço resolvido: um domínio público que aponte para
loopback (por exemplo localtest.me) passa a validação. O risco é contido pela plataforma de execução
(Cloudflare Workers bloqueia destinos privados), pelo limite de 400 KB, pelo tempo limite e por exigir
sessão. Mitigação futura: resolver o DNS e validar o endereço antes do pedido.

## O que falta para fechar a fase

- Testes de autorização com as cinco identidades (anónimo, dono, terceiro, moderador e admin) a
  atacar cada tabela. As sondagens anónimas já foram feitas contra o projecto alojado; falta a
  parte autenticada, que exige contas de teste e não pode correr contra dados reais.
- Decidir os riscos 1 e 3 e corrigir a configuração de autenticação (risco 2).

## Verificação contínua

src/test/security-invariants.test.ts corre no CI e falha se alguma tabela nova ficar sem RLS, se
aparecer uma política using (true), se uma função SECURITY DEFINER deixar de fixar search_path, se uma
política de storage sair do bucket ou deixar de exigir o dono, ou se forem concedidos dados privados ou
contadores de limite a anon.
