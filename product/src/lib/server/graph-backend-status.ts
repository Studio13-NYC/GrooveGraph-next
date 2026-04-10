import { TypeDBHttpDriver, isApiErrorResponse } from "@typedb/driver-http";
import { getTypeDbConfig, isTypedbConnectionStringEmptyInDisk } from "@/src/lib/server/config";

export type GraphBackendStatusPayload = {
  configured: boolean;
  reachable: boolean;
  database: string | null;
  message: string;
  /** When unconfigured: connection string key exists in `.env.local` but value is empty. */
  connectionStringEmpty?: boolean;
};

/**
 * Probes TypeDB connectivity for graph writes. Does not expose credentials; safe for JSON to the client.
 */
export async function getGraphBackendStatus(): Promise<GraphBackendStatusPayload> {
  const cfg = getTypeDbConfig();
  if (!cfg) {
    const emptyCs = isTypedbConnectionStringEmptyInDisk();
    return {
      configured: false,
      reachable: false,
      database: null,
      message: emptyCs
        ? "TYPEDB_CONNECTION_STRING is present in .env.local but has no value. Use one line: typedb://user:pass@https://host:port/?name=database (or set TYPEDB_USERNAME, TYPEDB_PASSWORD, TYPEDB_ADDRESS, TYPEDB_DATABASE)."
        : "TypeDB env not set (TYPEDB_CONNECTION_STRING or TYPEDB_USERNAME, TYPEDB_PASSWORD, TYPEDB_ADDRESS, TYPEDB_DATABASE).",
      connectionStringEmpty: emptyCs,
    };
  }

  const driver = new TypeDBHttpDriver({
    username: cfg.username,
    password: cfg.password,
    addresses: cfg.addresses,
  });

  const health = await driver.health();
  if (isApiErrorResponse(health)) {
    return {
      configured: true,
      reachable: false,
      database: cfg.database,
      message: health.err?.message ?? "TypeDB health check failed.",
    };
  }

  return {
    configured: true,
    reachable: true,
    database: cfg.database,
    message: "TypeDB cluster responded to health check.",
  };
}
