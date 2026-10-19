# Worldspark Network Hub — plano de auditoria e conclusão técnica

**Branch de trabalho:** `plan/worldspark-engineering-audit`  
**Repositório:** `tonybenjamimfernando-oss/worldspark-network-hub`  
**Supabase atualmente acessível:** `cdauhpfszqhlojcafulo` (`worldspark-network-hub`)  
**Estado inicial verificado:** projeto ACTIVE_HEALTHY e vazio antes das alterações. **Estado após Fase 2:** migrações `0000`–`0013` aplicadas e confirmadas no histórico; oito tabelas principais com RLS activo; bucket `media` criado e verificado.  
**Configuração do repositório:** `supabase/config.toml` foi alinhado para `cdauhpfszqhlojcafulo` no ramo de trabalho; ainda não foi fundido na branch principal.  
**Regra de segurança:** alterações no Supabase foram aplicadas apenas depois de confirmar que o projecto autorizado estava vazio; as novas alterações do repositório continuam isoladas num ramo/PR.

## Objetivo

Completar o produto por etapas verificáveis, mantendo as funcionalidades existentes e melhorando segurança, qualidade, experiência móvel, observabilidade e preparação para produção. Uma funcionalidade só será considerada concluída quando interface, autenticação/autorização, persistência, erros, acessibilidade e testes forem verificados.

## Auditoria inicial — evidências

- Aplicação TypeScript com React 19, TanStack Start/Router, Vite, React Query, Tailwind/shadcn e Supabase JS.
- Rotas encontradas no route tree: início, autenticação, explorar, empresas, freelancers, mapa, mensagens, planos, regras, painel autenticado, publicação, detalhe de anúncio e perfil público.
- Fluxos já implementados no código: listagens, pesquisa, perfis, publicação, importação CSV e por URL, propostas para pedidos, avaliações/denúncias, links de afiliado e correspondência local de ofertas.
- As páginas `/mapa` e `/mensagens` são, por enquanto, páginas informativas; não constituem mapa GPS nem chat operacional. Os planos pagos também estão identificados como em preparação.
- As migrações versionadas em `drizzle/migrations/` são `0000`–`0011`; o diário Drizzle lista 12 entradas. A presença no Git não prova execução no Supabase.
- A configuração `supabase/config.toml` foi actualizada no ramo de auditoria para apontar para o projecto actual acessível.
- A migração `0006_enforce_media_bucket_limits.sql` apenas atualiza o bucket `media` se já existir. No projeto atual não há buckets; é necessário planear a criação segura do bucket e os limites, sem modificar o histórico já publicado.
- `0005_isolate_private_profile_data.sql` move o identificador fiscal para `profile_private`; o painel já depende dessa tabela. A sequência completa das migrações é, portanto, necessária antes de validar o fluxo de perfil.
- A migração base define políticas para `storage.objects`, mas não cria o bucket `media`; foi acrescentada a migração `0012_ensure_media_bucket.sql` para o criar/normalizar com limite de 10 MiB e MIME types permitidos.
- O cliente privilegiado está em `src/integrations/supabase/client.server.ts`. Confirmar que nunca é importado por módulos enviados ao navegador e que nenhuma chave privilegiada está no bundle.
- CI já inclui lint, testes e build. O histórico recente indica que estes passaram no PR #24; isso não valida o esquema remoto nem todas as jornadas reais.

## Plano faseado

### Fase 0 — inventário integral e linha de base
1. Enumerar todos os ficheiros de aplicação, rotas, componentes, hooks, utilitários, migrações, testes e workflows.
2. Mapear cada ecrã para consultas Supabase, tabelas, RPCs, políticas RLS e dependências externas.
3. Rever todas as migrações e o diário Drizzle; comparar os tipos TypeScript gerados com o SQL real.
4. Executar lint, testes e build a partir do estado atual; registar resultados e falhas reproduzíveis.
5. Criar matriz funcional: implementado, parcial, placeholder, não iniciado, bloqueado por fornecedor.
**Saída/aceitação:** inventário versionado, matriz de cobertura e baseline CI sem afirmações não verificadas.

### Fase 1 — alinhamento de ambiente e configuração
1. Confirmar o ID do projeto Supabase selecionado e atualizar a configuração do projeto apenas quando essa correspondência estiver comprovada.
2. Auditar variáveis de ambiente, ficheiros rastreados, regras de ignorar segredos, configuração de SSR e OAuth.
3. Confirmar URLs de redirecionamento de autenticação, recuperação de palavra-passe e domínios de produção.
4. Separar configuração pública de credenciais exclusivas do servidor.
**Saída/aceitação:** ambiente reproduzível e ausência de segredos privados no código cliente/repositório.

### Fase 2 — base de dados e migrações
**Progresso actual: esquema base inicializado; validação de permissões e tipos ainda pendente.**
1. Confirmado que o projecto Supabase seleccionado estava vazio antes da inicialização.
2. Aplicadas e verificadas, por ordem, as migrações `0000`–`0013`; o histórico remoto contém as 14 migrações.
3. Criada `0012_ensure_media_bucket.sql` sem alterar migrações antigas; bucket confirmado como público para leitura, limite 10 MiB e MIME types JPEG/PNG/WebP/GIF.
4. Criada `0013_harden_function_access_and_indexes.sql`: revoga execução directa de funções privilegiadas usadas apenas por triggers, converte `has_role` para `SECURITY INVOKER` e adiciona cinco índices de chaves estrangeiras.
5. Verificado que as oito tabelas principais têm RLS activo e zero linhas no momento da verificação.
6. Os advisors deixaram de assinalar as funções de trigger como publicamente executáveis; permanecem avisos intencionais nas RPCs de métricas `track_listing` e `track_affiliate_click`, e avisos de optimização de políticas RLS ainda por tratar.
7. Ainda falta comparar integralmente os tipos TypeScript com o esquema remoto e executar testes de autorização reais com utilizadores de teste.
**Saída/aceitação:** migrações aplicadas e rastreáveis; restantes verificações de segurança/permissões permanecem abertas.

### Fase 3 — segurança e privacidade
1. Verificar RLS em todas as tabelas do esquema exposto e políticas de Storage.
2. Verificar proteção de perfis privados, funções `SECURITY DEFINER`, `search_path`, grants e autorização de administradores/moderadores.
3. Testar proteção de métricas, decisões de propostas, verificação de perfis, avaliações, denúncias e URLs externas.
4. Rever SSRF e limites de leitura na importação de metadados externos; considerar limites de taxa e proteção contra abuso.
5. Confirmar que dados de contacto e identificadores privados só são devolvidos quando autorizados.
**Saída/aceitação:** sem vulnerabilidades críticas/altas conhecidas; riscos residuais documentados e ações de mitigação.

### Fase 4 — estabilização dos fluxos centrais
1. Registo, login, OAuth, recuperação e saída.
2. Perfil pessoal/empresa/prestador e persistência do perfil privado.
3. Publicação/edição/ocultação de anúncios, upload de imagens, URLs assinadas e validação de formulários.
4. Exploração, filtros, pesquisa, paginação e estados de vazio/erro.
5. Pedidos de compra, propostas e correspondência fornecedor–pedido.
6. Avaliações, denúncias, afiliados, atribuição de origem e métricas.
**Saída/aceitação:** testes unitários e de integração para sucesso, falha, limites e autorização de cada fluxo.

### Fase 5 — experiência do utilizador e acessibilidade
1. Testar todos os links, botões, navegação móvel, estados de carregamento, erros e notificações.
2. Verificar teclado, foco, rótulos, contraste, semântica e leitores de ecrã.
3. Corrigir inconsistências visuais sem substituir identidade e estrutura existentes desnecessariamente.
4. Verificar responsividade em ecrãs estreitos, carregamento de imagens e desempenho.
**Saída/aceitação:** jornadas principais utilizáveis em móvel e desktop; nenhuma ação apresentada como funcional se não estiver ligada.

### Fase 6 — funcionalidades de expansão, por dependência
1. **Mensagens:** conversas, participantes, persistência, RLS, tempo real, bloqueio/denúncia e anexos; chamadas de voz/vídeo só após avaliar fornecedor e custos.
2. **Mapa e geolocalização:** consentimento explícito, localização aproximada por padrão, pesquisa por área, filtros e direções; nunca expor localização precisa sem necessidade.
3. **Idiomas e moedas:** preferências por utilizador, tradução de interface, moeda por país e conversão com fonte/timestamp; não tratar conversão indicativa como cotação garantida.
4. **Promoções e créditos:** ledger auditável, regras de crédito comprado versus promocional, expiração, antifraude, limites e administração.
5. **Pagamentos:** integrar apenas fornecedor disponível no país, validar webhooks no servidor, idempotência, reconciliação e reembolsos. Não armazenar dados de cartão.
6. **Administração:** funções e permissões explícitas, auditoria de ações e métricas operacionais.
**Saída/aceitação:** cada módulo lançado separadamente, com fornecedor, custo, privacidade, testes e critérios de rollback documentados.

### Fase 7 — qualidade, desempenho e observabilidade
1. Testes unitários, de integração, de contrato e jornadas end-to-end para fluxos críticos.
2. Rever índices, consultas N+1, paginação, limites e cache.
3. Ativar registo de erros sem tokens, emails privados ou dados sensíveis; monitorizar falhas de autenticação e RPC.
4. Executar verificações de segurança e performance do Supabase após alterações de schema.
5. Verificar dependências, lockfile, versões e vulnerabilidades conhecidas.
**Saída/aceitação:** pipeline reprodutível, métricas mínimas e procedimento de diagnóstico documentado.

### Fase 8 — preparação e lançamento
1. Confirmar build de produção, configuração do alojamento, variáveis, domínio e redirects.
2. Executar checklist de smoke tests no ambiente de staging antes de produção.
3. Aplicar migrações com plano de recuperação e verificar logs após a aplicação.
4. Validar registo, publicação, pesquisa, perfis, uploads, propostas e permissões no ambiente de produção.
5. Documentar operação, recuperação, suporte e próximos incrementos.
**Saída/aceitação:** checklist de lançamento assinada por evidências; nenhuma integração simulada é anunciada como real.

## Ordem de prioridade

1. **P0 — bloqueadores:** ID Supabase alinhado, schema inicializado, bucket criado com limites, autenticação, RLS e build.
2. **P1 — produto central:** publicar, pesquisar, perfil, pedidos/propostas, avaliações e uploads robustos.
3. **P2 — qualidade:** acessibilidade, observabilidade, performance, administração e testes end-to-end.
4. **P3 — expansão:** chat, mapa/GPS, idiomas/moedas, promoções/créditos e pagamentos, cada qual com dependências e custos avaliados.

## Protocolo de trabalho

- Trabalhar em branches pequenas e pull requests; não reescrever histórico já publicado.
- Não usar `service_role` no cliente, não partilhar segredos e não executar migrações base contra um banco já inicializado.
- Antes de cada mudança: identificar comportamento atual, risco e critério de aceitação.
- Depois de cada mudança: executar testes relevantes, lint e build; registar o resultado real.
- Não declarar uma fase concluída se houver testes pendentes, dependências externas não configuradas ou riscos críticos sem mitigação.
- Aplicar mudanças de produção somente depois de validar projeto, histórico e esquema; interromper e investigar qualquer divergência.


## Diário de execução — 2026-10-19

- [x] Criado ramo isolado `plan/worldspark-engineering-audit` e plano técnico.
- [x] Alinhado `supabase/config.toml` com o projecto Supabase autorizado.
- [x] Aplicadas e verificadas migrações `0000`–`0013` no projecto inicialmente vazio.
- [x] Criada migração para garantir o bucket de media em projectos limpos.
- [x] Corrigido acesso directo a funções privilegiadas de trigger e acrescentados índices identificados pelos advisors.
- [x] Executados novamente os advisors de segurança e desempenho.
- [x] Optimizar políticas RLS com `(select auth.uid())` via migração `0014_optimize_rls_auth_uid.sql`; o advisor deixou de apresentar `auth_rls_initplan`.
- [ ] Rever os avisos das RPCs de métricas `track_listing` e `track_affiliate_click`, que permanecem como funções `SECURITY DEFINER` acessíveis para tracking público.
- [ ] Reavaliar índices assinalados como não utilizados após haver tráfego real; a base recém-inicializada ainda não permite concluir se são desnecessários.
- [ ] Executar lint, testes e build na branch e validar CI do pull request.
- [ ] Rever a compatibilidade dos tipos TypeScript gerados com o schema real.


### Validação adicional — migração 0014

- [x] Adicionada migração forward-only para substituir chamadas directas a `auth.uid()` em políticas RLS por `(select auth.uid())`, preservando as condições e permissões existentes.
- [x] Aplicada ao projecto Supabase e validada com o advisor de desempenho; o aviso `auth_rls_initplan` deixou de aparecer.
- [x] O pipeline de CI da branch de origem passou em ESLint, testes unitários e build de produção.
- [ ] A migração e o journal precisam de permanecer integrados na branch principal para que o repositório reflicta o esquema remoto.
