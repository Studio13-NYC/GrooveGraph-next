import { NextResponse } from "next/server";
import { appendReviewDecision, readSession, saveSession } from "@/src/lib/server/session-store";
import type { ReviewDecisionRequest } from "@/src/types/research-session";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const body = (await request.json()) as ReviewDecisionRequest;

  const session = await readSession(sessionId);
  const decision = appendReviewDecision(session, body);
  await saveSession(session);

  return NextResponse.json({ decision, session });
}
