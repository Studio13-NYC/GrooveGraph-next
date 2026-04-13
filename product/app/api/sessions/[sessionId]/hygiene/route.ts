import { NextResponse } from "next/server";
import { applySessionGraphHygiene } from "@/src/lib/server/session-graph-hygiene";
import { readSession, saveSession } from "@/src/lib/server/session-store";

export const dynamic = "force-dynamic";

/**
 * POST — run graph hygiene on the session (merge duplicate entities, repair relationships).
 */
export async function POST(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    const session = await readSession(sessionId);
    const report = applySessionGraphHygiene(session);
    await saveSession(session);
    return NextResponse.json({ session, report });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Graph hygiene failed.",
      },
      { status: 500 },
    );
  }
}
