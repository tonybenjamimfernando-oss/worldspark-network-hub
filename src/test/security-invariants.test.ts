import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MIGRATION_DIRS = ["drizzle/migrations", "supabase/migrations"];

/** As migrações são a única fonte de verdade das regras de acesso à base de dados. */
const migrations = MIGRATION_DIRS.flatMap((dir) => {
  const base = new URL("../../" + dir + "/", import.meta.url);
  return readdirSync(base)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({ file: dir + "/" + file, sql: readFileSync(new URL(file, base), "utf8") }));
});

/** Linhas de comentário são removidas para que SQL comentado nunca satisfaça uma verificação. */
const sqlText = migrations
  .map((migration) => "\n-- " + migration.file + "\n" + migration.sql.replace(/^\s*--.*$/gm, ""))
  .join("\n");

const statements = sqlText.split(";");
const policies = [...sqlText.matchAll(/create\s+policy[\s\S]*?;/gi)].map((match) => match[0]);
const tables = [...sqlText.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/gi)].map((match) =>
  match[1].toLowerCase(),
);
const rlsEnabled = new Set(
  [...sqlText.matchAll(/alter\s+table\s+(?:public\.)?([a-z_][a-z0-9_]*)\s+enable\s+row\s+level\s+security/gi)].map((match) =>
    match[1].toLowerCase(),
  ),
);
const definers = [...sqlText.matchAll(/security\s+definer/gi)].map((match) => match.index ?? 0);

describe("invariantes de segurança das migrações", () => {
  it("lê todas as migrações", () => {
    expect(migrations.length).toBeGreaterThan(15);
    expect(tables.length).toBeGreaterThanOrEqual(11);
    expect(policies.length).toBeGreaterThanOrEqual(30);
    expect(definers.length).toBeGreaterThanOrEqual(15);
  });

  it("activa RLS em todas as tabelas do esquema public", () => {
    expect(tables.filter((table) => !rlsEnabled.has(table))).toEqual([]);
  });

  it("não expõe tabelas através de políticas abertas", () => {
    const open = policies.filter((policy) => /using\s*\(\s*true\s*\)|with\s+check\s*\(\s*true\s*\)/i.test(policy));
    expect(open).toEqual([]);
  });

  it("fixa search_path em todas as funções SECURITY DEFINER", () => {
    const missing = definers
      .filter((index) => {
        const end = sqlText.indexOf("$$", index);
        return !/search_path/i.test(sqlText.slice(index, end === -1 ? index + 400 : end));
      })
      .map((index) => sqlText.slice(index, index + 80).split("\n")[0].trim());
    expect(missing).toEqual([]);
  });

  it("limita as políticas de storage ao bucket e ao próprio utilizador", () => {
    const storagePolicies = policies.filter((policy) => /on\s+storage\.objects/i.test(policy));
    expect(storagePolicies.length).toBeGreaterThan(0);
    expect(storagePolicies.filter((policy) => !/bucket_id/i.test(policy))).toEqual([]);
    const writes = storagePolicies.filter((policy) => /for\s+(insert|update|delete)/i.test(policy));
    expect(writes.length).toBeGreaterThan(0);
    expect(writes.filter((policy) => !/auth\.uid\(\)/i.test(policy))).toEqual([]);
  });

  it("não concede dados privados nem contadores de limite a visitantes", () => {
    const privateProfileGrants = statements.filter(
      (statement) =>
        /grant/i.test(statement) &&
        /public\.profile_private/i.test(statement) &&
        /\bto\b[^;]*\b(anon|public)\b/i.test(statement),
    );
    expect(privateProfileGrants).toEqual([]);
    const metricsGrants = statements.filter(
      (statement) =>
        /grant/i.test(statement) && /metrics_rate_limit/i.test(statement) && /\bto\b[^;]*\b(anon|authenticated)/i.test(statement),
    );
    expect(metricsGrants).toEqual([]);
  });
});
