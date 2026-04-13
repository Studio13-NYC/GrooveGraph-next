import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/src/lib/server/openai-client";
import { logResearchInteraction, truncateForLog } from "@/src/lib/server/research-interaction-log";
import { runResearchTurn } from "@/src/lib/server/research-runtime";
import { appendMessage, createEvent, readSession, saveSession } from "@/src/lib/server/session-store";
import type { TurnRequest } from "@/src/types/research-session";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const body = (await request.json()) as TurnRequest;

  if (!body.message?.trim()) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const mode = body.mode === "build" || body.mode === "explore" ? body.mode : "explore";

  const session = await readSession(sessionId);

  logResearchInteraction(sessionId, "http_turn_begin", {
    mode,
    messagePreview: truncateForLog(body.message.trim(), 600),
    sessionTitle: truncateForLog(session.title, 160),
    seedQueryPreview: truncateForLog(session.seedQuery, 200),
    openaiConversationId: session.openaiConversationId ?? null,
    entityCandidateCount: session.entityCandidates.length,
    relationshipCandidateCount: session.relationshipCandidates.length,
  });

  session.status = "running";
  appendMessage(session, { role: "user", content: body.message.trim() });
  session.events.push(
    createEvent("turn_started", "success", "/api/sessions/[sessionId]/turn", "Research turn started.", {
      session_id: session.id,
    }),
  );

  try {
    const client = getOpenAIClient();
    const response = await runResearchTurn(client, session, body.message.trim(), mode);
    const assistantText = response.output_text?.trim() || "No text output returned.";
    appendMessage(session, {
      role: "assistant",
      content: assistantText,
      responseId: response.id,
    });
    session.lastResponseId = response.id;
    session.status = "ready";
    session.events.push(
      createEvent("turn_completed", "success", "/api/sessions/[sessionId]/turn", "Research turn completed.", {
        session_id: session.id,
        response_id: response.id,
      }),
    );

    await saveSession(session);
    logResearchInteraction(sessionId, "http_turn_success", {
      responseId: response.id,
      assistantChars: assistantText.length,
    });
    return NextResponse.json({ session, responseId: response.id });
  } catch (error) {
    logResearchInteraction(sessionId, "http_turn_failed", {
      error: error instanceof Error ? error.message : "unknown",
      errorName: error instanceof Error ? error.name : undefined,
    });
    session.status = "error";
    session.events.push(
      createEvent("workflow_failed", "failure", "/api/sessions/[sessionId]/turn", "Research turn failed.", {
        session_id: session.id,
        error: error instanceof Error ? error.message : "unknown",
      }),
    );
    await saveSession(session);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Research turn failed." },
      { status: 500 },
    );
  }
}
