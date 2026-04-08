/**
 * Resolve TypeDB Cloud config from process.env or loose .env.local text.
 * Does not log secrets.
 */
export function applyTypeDbEnvFromDotenvText(text) {
  if (!text) return;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

/**
 * connectionString like: typedb://user:pass@https://host:port/?name=db
 */
export function parseTypeDbConnectionString(cs) {
  if (!cs) return null;
  const m = cs.match(/typedb:\/\/([^:]+):([^@]+)@https?:\/\/([^?]+)\?name=([^&\s]+)/);
  if (!m) return null;
  const hostPort = m[3].replace(/\/$/, "");
  return {
    username: decodeURIComponent(m[1]),
    password: decodeURIComponent(m[2]),
    address: hostPort,
    database: decodeURIComponent(m[4]),
  };
}

export function parseTypeDbFromLooseEnvText(text) {
  if (!text) return null;
  const csLine = text.match(/connectionString\s*=\s*(.+)$/m);
  if (csLine) {
    const parsed = parseTypeDbConnectionString(csLine[1].trim());
    if (parsed) return parsed;
  }
  const user = text.match(/^\s*username\s*=\s*(\S+)/m)?.[1];
  const pass = text.match(/^\s*password\s*=\s*(\S+)/m)?.[1];
  const addr = text.match(/^\s*addresses\s*=\s*\[\s*https?:\/\/([^\]]+)\]/m)?.[1];
  const db = text.match(/[?&]name=([^&\s]+)/)?.[1];
  if (user && pass && addr && db) {
    return { username: user, password: pass, address: addr.replace(/\/$/, ""), database: db };
  }
  return null;
}

export function getTypeDbConfig(looseText) {
  const fromEnv = {
    username: process.env.TYPEDB_USERNAME?.trim(),
    password: process.env.TYPEDB_PASSWORD?.trim(),
    address: (process.env.TYPEDB_ADDRESS ?? process.env.TYPEDB_HOST)?.trim()?.replace(/^https?:\/\//, ""),
    database: process.env.TYPEDB_DATABASE?.trim(),
  };
  if (fromEnv.username && fromEnv.password && fromEnv.address && fromEnv.database) {
    const addr = fromEnv.address.includes("://") ? fromEnv.address : `https://${fromEnv.address}`;
    return {
      username: fromEnv.username,
      password: fromEnv.password,
      addresses: [addr],
      database: fromEnv.database,
    };
  }
  const cs = process.env.TYPEDB_CONNECTION_STRING?.trim();
  const parsed = parseTypeDbConnectionString(cs);
  if (parsed) {
    const addr = parsed.address.includes("://") ? parsed.address : `https://${parsed.address}`;
    return {
      username: parsed.username,
      password: parsed.password,
      addresses: [addr],
      database: parsed.database,
    };
  }
  const loose = looseText ? parseTypeDbFromLooseEnvText(looseText) : null;
  if (loose) {
    const addr = loose.address.includes("://") ? loose.address : `https://${loose.address}`;
    return {
      username: loose.username,
      password: loose.password,
      addresses: [addr],
      database: loose.database,
    };
  }
  return null;
}
