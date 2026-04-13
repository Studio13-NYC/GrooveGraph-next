import { NextResponse } from "next/server";
import { readSession, renameProposedEntityKind, saveSession } from "@/src/lib/server/session-store";
import type { RenameProposedKindRequest } from "@/src/types/research-session";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const body = (await request.json()) as Partial<RenameProposedKindRequest>;

  const from = typeof body.from === "string" ? body.from.trim() : "";
  const to = typeof body.to === "string" ? body.to.trim() : "";

  if (!from || !to) {
    return NextResponse.json({ error: "Both from and to are required non-empty strings." }, { status: 400 });
  }

  if (from === to) {
    return NextResponse.json({ error: "Rename target must differ from the current kind." }, { status: 400 });
  }

  let session;
  try {
    session = await readSession(sessionId);
  } catch {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  const renamed = renameProposedEntityKind(session, from, to);
  await saveSession(session);

  return NextResponse.json({ session, renamed });
}
