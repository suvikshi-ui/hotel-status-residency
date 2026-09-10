#!/usr/bin/env node
/**
 * Apply supabase/migrations/0001_ledger.sql to the hotel's Supabase project.
 * Tries (in order): SUPABASE_ACCESS_TOKEN (Management API), DATABASE_URL /
 * SUPABASE_DB_PASSWORD (Postgres pooler). Publishable keys cannot run DDL.
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const PROJECT = process.env.SUPABASE_PROJECT_ID || "pptxeqcjecnwppftvjhc";
const SQL_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "migrations",
  "0001_ledger.sql",
);

async function viaManagement(sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT || "";
  if (!token) return { skipped: true, reason: "no SUPABASE_ACCESS_TOKEN" };
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status, body: text.slice(0, 500) };
  return { ok: true, via: "management", body: text.slice(0, 200) };
}

async function viaPostgres(sql) {
  const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "";
  const password =
    process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD || "";
  const client = url
    ? new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
    : password
      ? new pg.Client({
          host:
            process.env.SUPABASE_POOLER_HOST ||
            "aws-0-ap-south-1.pooler.supabase.com",
          port: Number(process.env.SUPABASE_POOLER_PORT || 6543),
          database: "postgres",
          user: process.env.SUPABASE_DB_USER || `postgres.${PROJECT}`,
          password,
          ssl: { rejectUnauthorized: false },
        })
      : null;
  if (!client) return { skipped: true, reason: "no DATABASE_URL / SUPABASE_DB_PASSWORD" };
  try {
    await client.connect();
    await client.query(sql);
    await client.end();
    return { ok: true, via: "postgres" };
  } catch (err) {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    return { ok: false, via: "postgres", message: err instanceof Error ? err.message : String(err) };
  }
}

const sql = await readFile(SQL_PATH, "utf8");
const mgmt = await viaManagement(sql);
if (mgmt.ok) {
  console.log("[supabase-ledger] applied via Management API");
  process.exit(0);
}
if (!mgmt.skipped) console.log("[supabase-ledger] management:", mgmt.status, mgmt.body);

const pgRes = await viaPostgres(sql);
if (pgRes.ok) {
  console.log("[supabase-ledger] applied via Postgres");
  process.exit(0);
}
if (!pgRes.skipped) console.log("[supabase-ledger] postgres:", pgRes.message);
console.log(
  "[supabase-ledger] could not apply DDL (need access token or DB password).",
);
process.exit(2);
