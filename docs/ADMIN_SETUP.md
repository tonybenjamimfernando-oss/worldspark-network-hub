# Activar o acesso administrativo

O centro administrativo está disponível em `/admin`, mas o acesso só é concedido a contas que tenham o papel `admin` na tabela `public.user_roles`. Não atribuas esse papel através de metadados editáveis do perfil.

## 1. Confirmar a conta

No painel do Supabase, abre **Authentication → Users** e copia o UUID da conta que deve ser administradora. Confirma cuidadosamente que é a tua conta.

## 2. Atribuir o papel

No **SQL Editor** do projecto de produção, executa o comando abaixo depois de substituir `UUID_DA_TUA_CONTA` pelo UUID confirmado:

```sql
insert into public.user_roles (user_id, role)
select 'UUID_DA_TUA_CONTA'::uuid, 'admin'::public.app_role
where not exists (
  select 1
  from public.user_roles
  where user_id = 'UUID_DA_TUA_CONTA'::uuid
    and role = 'admin'::public.app_role
);
```

Este comando apenas atribui o papel à conta indicada; não cria contas nem altera anúncios.

## 3. Verificar

```sql
select role
from public.user_roles
where user_id = 'UUID_DA_TUA_CONTA'::uuid
order by role;
```

Termina a sessão e inicia-a novamente no site, ou actualiza a sessão, e abre `/admin`. A navegação administrativa só aparece quando a função `public.has_role(auth.uid(), 'admin')` confirma o papel.

## Segurança

- Nunca atribuas o papel `admin` a utilizadores desconhecidos.
- Não coloques chaves `service_role`, tokens ou palavras-passe no código, no GitHub ou neste documento.
- O painel actual é uma visão operacional inicial; não implica que todos os módulos de moderação, auditoria, pagamentos ou tráfego já estejam implementados.
