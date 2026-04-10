import { NextResponse } from "next/server";
import { readSession } from "@/src/lib/server/session-store";

export const dynamic = "force-dynamic";

/** GET single session JSON — used by API clients / debugging; the workbench UI loads sessions via `/api/sessions` and local state. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const session = await readSession(sessionId);
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Session not found." },
      { status: 404 },
    );
  }
}
