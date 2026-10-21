# Migrações de base de dados

## Fonte de verdade

`drizzle/migrations/` é a única história versionada: 21 ficheiros SQL (`0000`–`0020`) e 21 entradas correspondentes em `drizzle/migrations/meta/_journal.json`.

## Excepção: `20261020000100_harden_auth_profile_trigger.sql`

Esta migração foi escrita fora do histórico Drizzle e aplicada directamente no projecto Supabase referido em `supabase/config.toml`. Reescreve a função `public.handle_new_user()`: fixa `search_path`, mantém `SECURITY DEFINER` e trata falhas na criação do perfil.

Consequências enquanto não for reconciliada:

- A história Drizzle continua a descrever a versão anterior da função.
- Uma reconstrução da base de dados a partir de `drizzle/migrations/` produz um `handle_new_user()` sem este endurecimento.
- O Drizzle não sabe que esta alteração existe.

## Reconciliar antes da próxima migração

1. Comparar a definição actual na base de dados alojada com este ficheiro:
   `select prosrc from pg_proc where proname = 'handle_new_user';`
2. Converter este SQL numa migração Drizzle nova (`0021_...`), sem reescrever migrações já publicadas.
3. Confirmar qual das duas versões deve prevalecer e reaplicar a definição na base de dados alojada, se necessário.
4. Registar a migração nova como já aplicada no histórico remoto (`drizzle.__drizzle_migrations`) em vez de a executar de novo, quando o efeito já estiver em produção.
5. Remover este ficheiro depois de o equivalente existir no histórico Drizzle.
