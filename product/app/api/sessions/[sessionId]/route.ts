import { NextResponse } from "next/server";
import { createEvent, readSession, saveSession, updateSessionTitle } from "@/src/lib/server/session-store";
import type { UpdateSessionRequest } from "@/src/types/research-session";

export const dynamic = "force-dynamic";

function isValidPatch(body: unknown): body is UpdateSessionRequest {
  if (!body || typeof body !== "object") {
    return false;
  }
  const o = body as Partial<UpdateSessionRequest>;
  return typeof o.title === "string";
}

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isValidPatch(body)) {
    return NextResponse.json({ error: "Expected { title: string }." }, { status: 400 });
  }

  let session;
  try {
    session = await readSession(sessionId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Session not found." },
      { status: 404 },
    );
  }

  try {
    updateSessionTitle(session, body.title);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid title." },
      { status: 400 },
    );
  }

  try {
    await saveSession(session);
    return NextResponse.json({ session });
  } catch (error) {
    session.events.push(
      createEvent(
        "workflow_failed",
        "failure",
        "/api/sessions/[sessionId]",
        "Failed to save session after title update.",
        {
          session_id: session.id,
          error: error instanceof Error ? error.message : "unknown",
        },
      ),
    );
    await saveSession(session);
    return NextResponse.json({ error: "Failed to save session." }, { status: 500 });
  }
}
