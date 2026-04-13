import { NextResponse } from "next/server";
import { getGraphPersistence } from "@/src/lib/server/graph-persistence/get-graph-persistence";
import type { GraphSyncResult } from "@/src/lib/server/graph-persistence/types";
import {
  acceptAllProposedGraphCandidates,
  createEvent,
  readSession,
  saveSession,
} from "@/src/lib/server/session-store";
import type { ResearchSession } from "@/src/types/research-session";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;

  try {
    const session = await readSession(sessionId);
    const snapshotJson = JSON.stringify(session);

    acceptAllProposedGraphCandidates(session);

    const persistence = getGraphPersistence();
    let result: GraphSyncResult;
    try {
      result = await persistence.persistResearchSession(session, { includeDeferred: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "TypeDB publish failed.";
      const reverted = JSON.parse(snapshotJson) as ResearchSession;
      reverted.events.push(
        createEvent(
          "workflow_failed",
          "failure",
          "/api/sessions/[sessionId]/graph/publish",
          "Publish to TypeDB failed; session left unchanged.",
          {
            session_id: reverted.id,
            error: message,
          },
        ),
      );
      await saveSession(reverted);
      const status = message.includes("not configured") ? 503 : 500;
      return NextResponse.json({ error: message }, { status });
    }

    session.events.push(
      createEvent(
        "candidate_updated",
        "success",
        "/api/sessions/[sessionId]/graph/publish",
        "Accepted proposed graph candidates and synced to TypeDB.",
        {
          session_id: session.id,
          entities_upserted: String(result.entitiesUpserted),
          relationships_upserted: String(result.relationshipsUpserted),
        },
      ),
    );
    await saveSession(session);

    return NextResponse.json({ session, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed.";
    const isNotFound = message.includes("ENOENT") || message.includes("not found");
    return NextResponse.json({ error: message }, { status: isNotFound ? 404 : 500 });
  }
}
