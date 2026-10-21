# Migrações de base de dados

drizzle/migrations/ é a história única e versionada: ficheiros 0000 a 0022, com entrada
correspondente em drizzle/migrations/meta/_journal.json.

## Excepção reconciliada

A migração de handle_new_user() que vivia aqui solta
(20261020000100_harden_auth_profile_trigger.sql) foi comparada com a função em produção e passou
a drizzle/migrations/0021_harden_auth_profile_trigger.sql. A definição actual confirma-se com:

    select prosrc from pg_proc where proname = 'handle_new_user';

Este diretório já não contém migrações fora do histórico Drizzle.

## Histórico remoto

O projecto alojado não mantém drizzle.__drizzle_migrations; as aplicações ficam registadas em
supabase_migrations.schema_migrations. O endurecimento de privilégios da Fase 3 está lá
registado como 20261022000000 (0022_least_privilege_api_grants).
