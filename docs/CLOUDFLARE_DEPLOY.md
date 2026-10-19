# Publicação em produção — Cloudflare Workers

O projeto usa TanStack Start com renderização no servidor. Por isso, a publicação recomendada é Cloudflare Workers, e não GitHub Pages estático.

## Preparar uma única vez

1. Abre o painel Cloudflare: https://dash.cloudflare.com/ e selecciona a conta de destino.
2. Em **Manage account → Account API tokens**, cria um token com permissões mínimas para editar Workers e acesso apenas à conta de destino.
3. No GitHub, abre **Settings → Secrets and variables → Actions** do repositório.
4. Em **Variables**, cria as variáveis públicas de configuração Supabase:
   - `VITE_SUPABASE_URL` = `https://cdauhpfszqhlojcafulo.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = chave publishable do projecto `worldspark-network-hub` no Supabase.
5. Em **Secrets**, cria:
   - `CLOUDFLARE_API_TOKEN` = token criado no passo 2.
   - `CLOUDFLARE_ACCOUNT_ID` = ID da conta Cloudflare de destino.

A chave `publishable` é destinada ao cliente e não substitui as políticas RLS do Supabase. Nunca coloques tokens privados, chaves `service_role` ou palavras-passe no repositório.

## Publicar

O workflow `.github/workflows/deploy-cloudflare.yml` executa lint, testes, compilação e depois `wrangler deploy` em cada push para `main`. Também pode ser iniciado manualmente em **GitHub → Actions → Deploy to Cloudflare Workers → Run workflow**.

O primeiro deploy bem-sucedido apresentará o URL `*.workers.dev` nos logs/na consola Cloudflare. Confirma a página inicial, login, navegação, carregamento de dados Supabase e rotas protegidas antes de divulgar o endereço.

## Bloqueios que exigem acesso do proprietário

- Os secrets Cloudflare têm de ser adicionados por alguém com permissão de administrador do repositório; não são valores que se possam inferir.
- O workflow tem de estar na branch `main` para publicar em produção. O PR de preparação precisa de ser integrado.
- Se o build/deploy indicar configuração Nitro/Wrangler em falta ou incompatível, corrige essa saída específica antes de anunciar o site como publicado.

## Verificação após publicação

1. Em **Actions**, confirma que o workflow de deploy terminou com sucesso.
2. Abre o URL exacto indicado pela Cloudflare.
3. Testa `/`, login/registo, `/centro`, `/admin` (com conta administradora), produtos, serviços e mensagens.
4. Confirma que tokens privados não aparecem nos logs.
