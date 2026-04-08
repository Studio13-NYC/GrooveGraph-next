/**
 * Smoke-check Neo4j for Entity nodes matching a substring (default: "paul").
 * Run from this package directory:
 *   node --env-file=.env.local scripts/verify-neo4j-entities.mjs "paul weller"
 *
 * Requires: NEO4J_URI, NEO4J_USERNAME (or NEO4J_USER), NEO4J_PASSWORD, optional NEO4J_DATABASE
 */
import neo4j from "neo4j-driver";

const needle = (process.argv[2] ?? "paul").trim().toLowerCase();
const uri = process.env.NEO4J_URI?.trim();
const user = (process.env.NEO4J_USERNAME ?? process.env.NEO4J_USER)?.trim();
const password = process.env.NEO4J_PASSWORD?.trim();
const database = process.env.NEO4J_DATABASE?.trim() || "neo4j";

if (!uri || !user || !password) {
  console.error("Missing NEO4J_URI, NEO4J_USERNAME (or NEO4J_USER), or NEO4J_PASSWORD.");
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session({ database });

try {
  await driver.verifyConnectivity();
  console.log(`Connected. Database: ${database}. Searching entities for substring: "${needle}"\n`);

  const result = await session.run(
    `
    MATCH (e:Entity)
    WHERE toLower(e.displayName) CONTAINS $needle
       OR any(a IN coalesce(e.aliases, []) WHERE toLower(a) CONTAINS $needle)
    RETURN e.displayName AS displayName,
           e.nameNorm AS nameNorm,
           e.provisionalKind AS kind,
           e.lastSessionId AS lastSessionId
    LIMIT 25
    `,
    { needle },
  );

  if (result.records.length === 0) {
    console.log("No Entity nodes matched. Common causes:");
    console.log("- Graph review rows are still \"proposed\" — accept them, then Sync to graph.");
    console.log("- Wrong database selected in Neo4j Browser (use database:", database + ").");
    console.log("- Session was synced on another machine; local .data sessions differ from production.");
    process.exitCode = 2;
  } else {
    for (const record of result.records) {
      console.log(
        "-",
        record.get("displayName"),
        "|",
        record.get("kind"),
        "| nameNorm:",
        record.get("nameNorm"),
        "| session:",
        record.get("lastSessionId") ?? "—",
      );
    }
    console.log(`\nTotal: ${result.records.length} (limit 25).`);
  }

  const countResult = await session.run(`MATCH (e:Entity) RETURN count(e) AS c`);
  const total = countResult.records[0]?.get("c");
  console.log("Total Entity nodes in database:", total != null ? total.toString() : "?");
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await session.close();
  await driver.close();
}
