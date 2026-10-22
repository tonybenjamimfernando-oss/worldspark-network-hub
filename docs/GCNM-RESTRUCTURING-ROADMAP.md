# Roteiro de reestruturação do GCNM — execução faseada

Data da inspeção: 2026-10-22  
Repositório: `tonybenjamimfernando-oss/worldspark-network-hub`  
Branch de trabalho: `audit/restructuring-phase-1`  
Regra de segurança: não alterar nem publicar em `main` diretamente; a aplicação está ligada ao Lovable.

## Objetivo e identidade
Reestruturar o GCNM existente, não criar uma plataforma separada. Preservar rotas, dados, autenticação, contratos do Supabase, tracking, permissões e funcionalidades já existentes. A imagem oficial da marca enviada pelo proprietário deve ser preservada sem redesenhar o globo, a inscrição GCNM ou o nome Global Commerce Network Map. Antes de substituir o símbolo de globo já desenhado em canvas, comparar a imagem oficial e o uso atual em cabeçalho, página inicial, favicon e mobile; não deformar nem cortar a imagem.

## Inspeção inicial confirmada
- A branch `main` está protegida e tem SHA `4f0d6ab097a9bc1ac11a7dc6bc333922c0d69d47`.
- O projeto está ligado ao Lovable. Commits na branch conectada podem sincronizar para o editor; não reescrever história publicada.
- Stack: React 19, TypeScript, TanStack Start/Router, Supabase JS, Vite, Vitest, ESLint e Prettier.
- Scripts disponíveis: `npm run build`, `npm run lint`, `npm run test`, `npm run typecheck`.
- `src/routes/index.tsx` já contém hero comercial, pesquisa que navega para `/explorar`, categorias ligadas a `CATEGORIES`, e secções alimentadas por tipos de catálogo.
- `src/components/SiteHeader.tsx` contém navegação existente, pesquisa, menu móvel, mensagens, acesso ao painel e controlo de administração.
- `AGENTS.md` exige preservar os contratos de rotas/dados, RLS, media privada com signed URLs e RPCs de tracking/counters.
- `REDESIGN-REPORT.md` documenta uma validação anterior (não reexecutada nesta fase): 10 testes reportados como aprovados e verificações de navegador. Gaps conhecidos nesse relatório incluem mapa/GPS, chat/voz/chamadas, conversão monetária, pagamentos, UI multilingue, importação CSV, ranking, verificação de parceiros e páginas dedicadas de lojas.
- O último commit em main tem mensagem `debug: mostrar erro do cliente no error component (temporario)`. Antes de lançamento, confirmar se o detalhe de erro ainda está exposto ao utilizador e se deve ser removido; não alterar às cegas.

## Fase 1 — Segurança e baseline
- [x] Criar branch de trabalho isolada a partir de main.
- [x] Inspecionar instruções do repositório, package.json, cabeçalho, home e relatório de redesign anterior.
- [ ] Fazer checkout local da branch e instalar dependências.
- [ ] Executar `npm run test`, `npm run typecheck`, `npm run lint` e `npm run build`; registar resultados atuais antes de tocar na aplicação.
- [ ] Inspecionar árvore completa de rotas, migrações Supabase, componentes de marca, tokens CSS e testes.
- [ ] Comparar screenshot de referência oficial com desktop e mobile atuais.

## Fase 2 — Marca e experiência inicial
- [ ] Integrar a imagem oficial somente depois de confirmar o ficheiro binário original e a sua legibilidade em tamanhos pequenos.
- [ ] Rever header e hero, evitando duplicar campos de pesquisa ou remover os destinos existentes.
- [ ] Manter o globo canvas existente onde fizer sentido; não trocar mapa interativo por decoração.
- [ ] Verificar acessibilidade: foco, navegação por teclado, rótulos, contraste e reduced motion.
- [ ] Adicionar/atualizar testes de navegação e pesquisa antes de seguir.

## Fase 3 — Navegação e salas comerciais
- [ ] Mapear cada item de navegação à rota existente e ao estado real dessa funcionalidade.
- [ ] Melhorar as páginas de detalhe de produto/serviço e atribuição à loja de origem.
- [ ] Reutilizar componentes existentes, sem criar caminhos paralelos para a mesma função.
- [ ] Manter estados honestos de “em preparação” onde o backend não existe.

## Fase 4 — Perfis, lojas e reputação
- [ ] Inspecionar schema e RLS antes de desenhar qualquer alteração de dados.
- [ ] Definir/confirmar perfis de comprador e capacidades de vendedor sem contornar políticas.
- [ ] Avaliações só após compra/pedido verificável pelo backend; nunca por estado controlado no navegador.
- [ ] Páginas de loja dependem de schema, permissões e rotas aprovados.

## Fase 5 — Funções avançadas e integrações
- [ ] Mapa/GPS, mensagens/voz, moedas, pagamentos, importação, ranking, publicidade e editor de media são trilhos separados.
- [ ] Para cada integração: confirmar fornecedor, disponibilidade regional, credenciais, consentimento, custos e requisitos legais.
- [ ] Não simular pagamentos, verificações, conversões ou sincronização de stock.
- [ ] Proteger chaves secretas no backend; nunca expor service-role keys no browser.

## Fase 6 — Aceitação e publicação
- [ ] Testes unitários, typecheck, lint e build verdes ou desvios justificados.
- [ ] Testes browser desktop e mobile para home, explorar, detalhe, autenticação, painel e menu.
- [ ] Testes autenticados feitos pelo proprietário para fluxos que exigem conta.
- [ ] Abrir pull request para revisão; não fazer merge/publicação sem autorização explícita.
- [ ] Documentar commit, checks, riscos restantes e URL de preview apenas quando realmente disponível.

## Limites desta execução
Nesta fase apenas foi criada a branch e este roteiro de trabalho. Nenhum código funcional da aplicação, schema, segredo, deployment ou publicação foi alterado. Não foi possível executar os scripts localmente através da ligação GitHub; a validação anterior mencionada acima pertence ao relatório histórico e não é prova de testes atuais.
