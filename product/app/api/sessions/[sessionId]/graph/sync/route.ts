import { NextResponse } from "next/server";
import { getGraphPersistence } from "@/src/lib/server/graph-persistence/get-graph-persistence";
import { readSession } from "@/src/lib/server/session-store";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  let includeDeferred = false;

  try {
    const body = (await request.json()) as { includeDeferred?: boolean };
    includeDeferred = Boolean(body?.includeDeferred);
  } catch {
    includeDeferred = false;
  }

  try {
    const session = await readSession(sessionId);
    const persistence = getGraphPersistence();
    const result = await persistence.persistResearchSession(session, { includeDeferred });
    return NextResponse.json({ ok: true as const, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Graph sync failed.";
    const status = message.includes("ENOENT") || message.includes("not found") ? 404 : 503;
    return NextResponse.json({ ok: false as const, error: message }, { status });
  }
}
