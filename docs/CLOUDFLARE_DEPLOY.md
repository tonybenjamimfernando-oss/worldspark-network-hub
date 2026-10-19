# Publicação em produção — Cloudflare Workers

O projeto usa TanStack Start com renderização no servidor. Por isso, a publicação recomendada é Cloudflare Workers, e não GitHub Pages estático.

## Preparar uma única vez

1. Abre https://dash.cloudflare.com/ e selecciona a conta de destino.
2. Em **Manage account → Account API tokens**, cria um token com permissões mínimas para editar Workers e acesso apenas à conta de destino.
3. No GitHub, abre **Settings → Secrets and variables → Actions → New repository secret** do repositório.
4. Cria estes dois secrets:
   - `CLOUDFLARE_API_TOKEN` = token Cloudflare criado no passo 2.
   - `CLOUDFLARE_ACCOUNT_ID` = ID da conta Cloudflare de destino.

A URL e a chave Supabase publishable do projecto `worldspark-network-hub` já são fornecidas ao passo de build do workflow. A chave publishable é pública por definição; a segurança dos dados continua a depender das políticas RLS. Nunca coloques tokens privados, chaves `service_role` ou palavras-passe no repositório.

## Publicar

O workflow `.github/workflows/deploy-cloudflare.yml` executa lint, testes, compilação e depois `wrangler deploy` em cada push para `main`. Também pode ser iniciado manualmente em **GitHub → Actions → Deploy to Cloudflare Workers → Run workflow**.

O primeiro deploy bem-sucedido apresentará o URL `*.workers.dev` nos logs/na consola Cloudflare. Confirma a página inicial, login, navegação, carregamento de dados Supabase e rotas protegidas antes de divulgar o endereço.

## Bloqueios que exigem acesso do proprietário

- Os dois secrets Cloudflare têm de ser adicionados por alguém com permissão de administrador do repositório; não são valores que se possam inferir.
- O workflow tem de estar na branch `main` para publicar em produção. O PR de preparação precisa de ser integrado.
- Se o build/deploy indicar configuração Nitro/Wrangler em falta ou incompatível, corrige essa saída específica antes de anunciar o site como publicado.

## Verificação após publicação

1. Em **Actions**, confirma que o workflow de deploy terminou com sucesso.
2. Abre o URL exacto indicado pela Cloudflare.
3. Testa `/`, login/registo, `/centro`, `/admin` (com conta administradora), produtos, serviços e mensagens.
4. Confirma que tokens privados não aparecem nos logs.
