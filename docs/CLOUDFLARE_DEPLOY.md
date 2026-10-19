# Publicação em produção — Cloudflare Workers

O projeto usa TanStack Start com renderização no servidor. Por isso, a publicação recomendada é Cloudflare Workers, e não GitHub Pages estático.

## Preparar uma única vez

1. Abre o painel Cloudflare: https://dash.cloudflare.com/
2. Selecciona a conta que vai alojar o Worldspark Network Hub.
3. Em **Workers & Pages**, confirma que a conta pode criar Workers.
4. Em **Manage account → Account API tokens**, cria um token com permissões mínimas para editar Workers e acesso apenas à conta de destino.
5. No GitHub, abre **Settings → Secrets and variables → Actions → New repository secret** no repositório.
6. Cria estes dois secrets com os valores da tua conta Cloudflare:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

Não coloques esses valores em ficheiros do repositório, comentários, issues ou mensagens.

## Publicar

O workflow `.github/workflows/deploy-cloudflare.yml` compila, executa lint e testes e depois executa `wrangler deploy` em cada push para `main`. Também pode ser iniciado manualmente em **GitHub → Actions → Deploy to Cloudflare Workers → Run workflow**.

O primeiro deploy bem-sucedido apresentará o URL `*.workers.dev` nos logs/na consola Cloudflare. Confirma a página inicial, login, navegação, carregamento de dados Supabase e rotas protegidas antes de divulgar o endereço.

## Bloqueios que exigem acesso do proprietário

- Os secrets de Cloudflare têm de ser adicionados por alguém com permissão de administrador do repositório; não são valores de código e não podem ser inferidos.
- O workflow tem de estar na branch `main` para publicar em produção. O PR de preparação precisa de ser revisto e integrado.
- Se o build/deploy indicar configuração Nitro/Wrangler em falta ou incompatível, corrige essa saída específica antes de anunciar o site como publicado.

## Verificação após publicação

1. Em **Actions**, confirma que o workflow de deploy terminou com sucesso.
2. Abre o URL exacto indicado pela Cloudflare.
3. Testa `/`, login/registo, `/centro`, `/admin` (com conta administradora), produtos, serviços e mensagens.
4. Confirma que os secrets e quaisquer chaves privadas nunca aparecem nos logs.
