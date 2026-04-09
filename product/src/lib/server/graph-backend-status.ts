import { TypeDBHttpDriver, isApiErrorResponse } from "@typedb/driver-http";
import { getTypeDbConfig } from "@/src/lib/server/config";

export type GraphBackendStatusPayload = {
  configured: boolean;
  reachable: boolean;
  database: string | null;
  message: string;
};

/**
 * Probes TypeDB connectivity for graph writes. Does not expose credentials; safe for JSON to the client.
 */
export async function getGraphBackendStatus(): Promise<GraphBackendStatusPayload> {
  const cfg = getTypeDbConfig();
  if (!cfg) {
    return {
      configured: false,
      reachable: false,
      database: null,
      message:
        "TypeDB env not set (TYPEDB_CONNECTION_STRING or TYPEDB_USERNAME, TYPEDB_PASSWORD, TYPEDB_ADDRESS, TYPEDB_DATABASE).",
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
