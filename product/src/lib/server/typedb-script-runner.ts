/**
 * Minimal TypeDB HTTP client for one-off scripts (audit / maintenance).
 * Does not share the Next.js route singleton — safe for CLI `tsx` runs.
 */
import {
  TypeDBHttpDriver,
  isApiErrorResponse,
  isOkResponse,
  type ApiResponse,
  type QueryResponse,
} from "@typedb/driver-http";
import { getTypeDbConfig } from "@/src/lib/server/config";
import { WORKBENCH_TYPEDB3_SCHEMA_LINES } from "@/src/lib/server/graph-persistence/typedb-workbench-schema";

function unwrapApi<T>(res: ApiResponse<T>, context: string): T {
  const r = res as ApiResponse;
  if (isApiErrorResponse(r)) {
    throw new Error(`${context}: ${r.err.message}`);
  }
  return (r as { ok: T }).ok;
}

async function runSchemaLine(driver: TypeDBHttpDriver, database: string, line: string): Promise<void> {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("//")) {
    return;
  }
  const res = await driver.oneShotQuery(trimmed, true, database, "schema");
  if (isApiErrorResponse(res)) {
    const msg = String(res.err?.message ?? "").toLowerCase();
    if (msg.includes("already exists") || msg.includes("duplicate") || msg.includes("conflict")) {
      return;
    }
    throw new Error(`TypeDB schema: ${trimmed.slice(0, 100)} — ${res.err.message}`);
  }
}

export async function ensureWorkbenchSchemaForScript(
  driver: TypeDBHttpDriver,
  database: string,
): Promise<void> {
  for (const line of WORKBENCH_TYPEDB3_SCHEMA_LINES) {
    await runSchemaLine(driver, database, line);
  }
}

export async function openReadTx(driver: TypeDBHttpDriver, database: string): Promise<string> {
  const res = await driver.openTransaction(database, "read", { transactionTimeoutMillis: 180_000 });
  return unwrapApi(res, "openTransaction read").transactionId;
}

export async function openWriteTx(driver: TypeDBHttpDriver, database: string): Promise<string> {
  const res = await driver.openTransaction(database, "write", { transactionTimeoutMillis: 300_000 });
  return unwrapApi(res, "openTransaction write").transactionId;
}

export async function runInTx(
  driver: TypeDBHttpDriver,
  txId: string,
  query: string,
  context: string,
): Promise<QueryResponse> {
  const raw = await driver.query(txId, query.trim(), {});
  const res = raw as ApiResponse;
  if (isApiErrorResponse(res)) {
    throw new Error(`${context}: ${res.err.message}`);
  }
  if (!isOkResponse(res as ApiResponse<QueryResponse>)) {
    throw new Error(`${context}: empty response`);
  }
  return (res as { ok: QueryResponse }).ok;
}

export async function commitTx(driver: TypeDBHttpDriver, txId: string): Promise<void> {
  unwrapApi(await driver.commitTransaction(txId), "commitTransaction");
}

export async function rollbackTx(driver: TypeDBHttpDriver, txId: string): Promise<void> {
  const res = await driver.rollbackTransaction(txId);
  if (isApiErrorResponse(res)) {
    return;
  }
}

export type TypeDbScriptRunner = {
  database: string;
  driver: TypeDBHttpDriver;
};

export function createTypeDbScriptRunner(): TypeDbScriptRunner {
  const cfg = getTypeDbConfig();
  if (!cfg) {
    throw new Error(
      "TypeDB is not configured. Set TYPEDB_USERNAME, TYPEDB_PASSWORD, TYPEDB_ADDRESS (or TYPEDB_HOST), TYPEDB_DATABASE, or TYPEDB_CONNECTION_STRING in product/.env.local.",
    );
  }
  const driver = new TypeDBHttpDriver({
    username: cfg.username,
    password: cfg.password,
    addresses: cfg.addresses,
  });
  return { driver, database: cfg.database };
}
