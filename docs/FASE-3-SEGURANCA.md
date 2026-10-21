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

### 2. Registo sem barreira contra automação — Média

O Turnstile está inactivo por falta da chave de site (src/routes/auth.tsx). Enquanto assim estiver, a
criação de contas depende apenas dos limites do Supabase Auth. Mitigação: obter a chave de site,
activar a protecção CAPTCHA no Supabase Auth e enviar captchaToken no registo.

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

- Testes de autorização com utilizadores reais (anónimo, dono, terceiro, moderador, admin) a atacar cada
  tabela. Exigem um projecto de teste — Supabase local ou projecto dedicado — e não podem correr contra
  produção. As invariantes estáticas agora no CI são a camada que pode correr sempre.
- Decidir os riscos 1 e 3 e activar o Turnstile (risco 2).

## Verificação contínua

src/test/security-invariants.test.ts corre no CI e falha se alguma tabela nova ficar sem RLS, se
aparecer uma política using (true), se uma função SECURITY DEFINER deixar de fixar search_path, se uma
política de storage sair do bucket ou deixar de exigir o dono, ou se forem concedidos dados privados ou
contadores de limite a anon.
