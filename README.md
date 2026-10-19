# Worldspark Network Hub

**Worldspark Network Hub (GCNM)** é uma aplicação de descoberta e comércio que reúne anúncios de produtos, serviços, oportunidades, pedidos de compra e ofertas externas, mantendo a identificação da loja ou plataforma de origem quando disponível.

## Estado actual

O projecto já inclui:
- Catálogo de anúncios e pesquisa/exploração.
- Perfis públicos e painel autenticado do vendedor.
- Publicação de produtos, serviços, oportunidades e pedidos de compra.
- Importação de ofertas externas por URL e CSV.
- Propostas de fornecedores para pedidos de compra.
- Avaliações, denúncias e links de afiliado.
- Migrações SQL e validação automática com GitHub Actions.

Algumas áreas, como chat completo, mapa com GPS, pagamentos e planos pagos, ainda dependem de implementação e/ou de serviços externos. Não presumir que estão operacionais só porque aparecem na navegação.

## Requisitos

- [Bun](https://bun.sh/) (versão compatível com o workflow de CI).
- Um projecto Supabase com as tabelas, políticas RLS e bucket de armazenamento necessários.
- Variáveis de ambiente configuradas para o ambiente de execução.

## Desenvolvimento local

```bash
bun install --frozen-lockfile
bun run dev
```

Validar antes de propor alterações:

```bash
bun run test
bun run build
bun run lint
```

O workflow de GitHub Actions executa os testes e a compilação de produção em pushes para `main`, branches `feature/**` e pull requests dirigidos a `main`.

## Variáveis de ambiente

Consulta `.env.example` para os nomes das variáveis. Nunca coloques chaves secretas, tokens de acesso, palavras-passe ou credenciais de serviço no Git.

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`: configuração pública usada no cliente.
- `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`: configuração usada pelo servidor em operações autenticadas.
- `SUPABASE_SERVICE_ROLE_KEY`: chave privilegiada do servidor, se necessária; nunca pode ser exposta ao navegador nem adicionada ao repositório.

As variáveis `VITE_*` são incorporadas no bundle do cliente e não devem conter segredos. A chave publicável do Supabase é destinada a ser usada no cliente; a segurança dos dados deve ser garantida com políticas RLS e permissões de base de dados.

## Migrações de base de dados

As migrações versionadas encontram-se em `drizzle/migrations/`. Antes de aplicar uma migração a um projecto Supabase existente:

1. Confirma a versão e o histórico real da base de dados.
2. Faz uma cópia de segurança apropriada.
3. Revê a migração e confirma que não repete alterações já aplicadas manualmente.
4. Aplica-a num ambiente de teste e valida as permissões RLS.
5. Só depois planeia a aplicação em produção.

**A presença de uma migração no GitHub não significa que ela já foi executada na base de dados alojada.** As migrações de segurança devem ser confirmadas no Supabase antes de se considerar as respectivas protecções activas em produção.

## Contribuição segura

- Trabalha numa branch e abre um pull request.
- Mantém as alterações pequenas e específicas.
- Não comitas ficheiros `.env` nem credenciais.
- Acrescenta testes para novas regras de negócio e segurança.
- Não simules pagamentos, conversões, mensagens ou integrações externas como se fossem reais.

## Construção e alojamento

O código está versionado neste repositório. O alojamento e a configuração de variáveis de ambiente são tarefas separadas da validação do código e devem ser confirmados no fornecedor escolhido antes de anunciar a aplicação como disponível em produção.
