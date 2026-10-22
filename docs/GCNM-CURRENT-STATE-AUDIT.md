# Auditoria do estado atual — GCNM

Data: 2026-10-22  
Branch inspecionada: `audit/restructuring-phase-1`  
Base: `main` no commit `4f0d6ab097a9bc1ac11a7dc6bc333922c0d69d47`

## Achados confirmados

### 1. Página inicial — `src/routes/index.tsx`
- A pesquisa do hero usa `navigate({ to: "/explorar", search: { q } })`; preservar este contrato.
- Categorias vêm de `CATEGORIES` e abrem `/explorar` com `category`; o botão “Todas as categorias” expande/recolhe a lista.
- O hero usa `src/assets/commerce-port.jpg` como imagem de fundo e `<Globe className="hero-signature" />`; a marca escrita é atualmente texto estilizado `GCNM.`, não a imagem de logo oficial enviada pelo proprietário.
- A home consulta a tabela `listings` por `kind` e `status=active`; tem estados de carregamento, erro com botão de nova tentativa e vazio. Não substituir estas consultas por conteúdo de exemplo.
- Os links “Publicar oferta” e “Importar link externo” levam para a rota existente `/publicar` com os parâmetros de pesquisa atuais.
- O texto da página apresenta “Perfis, atribuição e avaliações”, mas isso não confirma por si só que todos os mecanismos de reputação/compra verificada estão implementados. Inspecionar backend antes de prometer verificação de compra.

### 2. Cabeçalho — `src/components/SiteHeader.tsx`
- A marca usa o componente canvas `BrandGlobe` dentro de um círculo azul e o texto “GCNM / GLOBAL COMMERCE NETWORK MAP”; não está a usar a imagem oficial enviada.
- Pesquisa do cabeçalho envia para `/explorar?q=...`; manter o comportamento e não duplicar a barra.
- Navegação existente: Comprar, Serviços, Pedidos de compra, Empresas, Freelancers, Mapa, Centro de comando e Planos.
- Atalhos móveis: Início, Comprar, Pedidos, Centro, Publicar e Painel/Entrar; preservar as rotas e parâmetros.
- Mensagens, Painel/Entrar e link de Publicar já estão no cabeçalho; administração só aparece quando `has_role` retorna `true`.
- O menu móvel usa o componente `Sheet`; não criar um segundo menu paralelo.
- O rodapé repete a marca tipográfica, sem a logo em imagem.

### 3. Globo — `src/components/Globe.tsx`
- É um canvas 2D animado com pontos e arcos dourados, com quadro estático quando `prefers-reduced-motion` é ativado.
- Os pontos geográficos e arcos são coordenadas decorativas codificadas no componente. Não tratar o desenho como mapa real, GPS ou rota.
- A imagem oficial enviada contém fundo branco incorporado; se for adicionada, verificar a apresentação em tamanhos pequenos e não declarar o fundo transparente. Não editar o ficheiro original.

### 4. CI — `.github/workflows/validate.yml`
- O workflow executa `bun install --frozen-lockfile`, lint, testes, typecheck e build.
- Eventos `push` abrangem `main`, `feature/**` e `feat/**`, mas não abrangem `audit/**`. Logo, commits nesta branch não disparam validação automática por push. Pull requests contra `main` são abrangidos.
- Não alterei o workflow nesta etapa; alterar gatilhos requer decisão explícita, pois pode aumentar execuções e custos de CI.
- Não foi executado nenhum job de CI por mim nesta etapa, pelo que não há resultados atuais de testes/build a reportar.

### 5. Testes existentes consultados
- `src/test/app-routing.test.tsx`: confirma que `/` corresponde a uma rota e não ao fallback.
- `src/test/search-query.test.ts`: verifica sanitização e limites do termo de pesquisa.
- `src/test/security-invariants.test.ts`: verifica invariantes sobre migrações, RLS, políticas, SECURITY DEFINER/search_path e storage.
- Estes ficheiros foram lidos, não executados. A existência de testes não prova que passem no estado atual.

## Priorização sugerida

1. Baseline executável (CI ou checkout local): obter resultados atuais de lint/test/typecheck/build antes de alterar comportamento.
2. Ativo oficial da logo: localizar e adicionar o ficheiro original à pasta de assets através de um método que preserve os bytes; só depois atualizar home/header/footer em conjunto e validar responsividade.
3. Verificação de fluxos: rotas do cabeçalho, pesquisa desktop/mobile, categorias, publicar/importar link, auth e acesso de admin.
4. Só então fazer alterações de experiência visual e de produto, em commits pequenos.

## Alterações realizadas durante esta auditoria
- Adicionado `docs/GCNM-RESTRUCTURING-ROADMAP.md` na branch de trabalho.
- Adicionado este relatório de inspeção.
- Nenhum componente funcional, migração, segredo, base de dados ou deployment foi alterado.
