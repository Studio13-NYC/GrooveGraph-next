import { NextResponse } from "next/server";
import {
  applyGraphCandidateUpdate,
  createEvent,
  readSession,
  saveSession,
} from "@/src/lib/server/session-store";
import type { UpdateGraphCandidateRequest } from "@/src/types/research-session";

export const dynamic = "force-dynamic";

function isValidUpdateRequest(body: unknown): body is UpdateGraphCandidateRequest {
  if (!body || typeof body !== "object") {
    return false;
  }

  const request = body as Partial<UpdateGraphCandidateRequest>;
  if (request.candidateType === "entity") {
    return Boolean(
      request.candidateId &&
        typeof request.candidateId === "string" &&
        request.displayName &&
        typeof request.displayName === "string" &&
        request.provisionalKind &&
        typeof request.provisionalKind === "string" &&
        Array.isArray(request.aliases) &&
        request.aliases.every((alias) => typeof alias === "string"),
    );
  }

  if (request.candidateType === "relationship") {
    return Boolean(
      request.candidateId &&
        typeof request.candidateId === "string" &&
        request.verb &&
        typeof request.verb === "string",
    );
  }

  return false;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const body = (await request.json()) as unknown;

  if (!isValidUpdateRequest(body)) {
    return NextResponse.json(
      { error: "Invalid candidate update payload." },
      { status: 400 },
    );
  }

  const trimmedRequest: UpdateGraphCandidateRequest =
    body.candidateType === "entity"
      ? {
          candidateType: "entity",
          candidateId: body.candidateId,
          displayName: body.displayName.trim(),
          provisionalKind: body.provisionalKind.trim(),
          aliases: body.aliases.map((alias) => alias.trim()),
        }
      : {
          candidateType: "relationship",
          candidateId: body.candidateId,
          verb: body.verb.trim(),
        };

  if (
    (trimmedRequest.candidateType === "entity" &&
      (!trimmedRequest.displayName ||
        !trimmedRequest.provisionalKind ||
        trimmedRequest.aliases.some((alias) => !alias))) ||
    (trimmedRequest.candidateType === "relationship" && !trimmedRequest.verb)
  ) {
    return NextResponse.json(
      { error: "Editable fields cannot be empty." },
      { status: 400 },
    );
  }

  const session = await readSession(sessionId);

  try {
    const candidate = applyGraphCandidateUpdate(session, trimmedRequest);
    await saveSession(session);
    return NextResponse.json({ candidate, session });
  } catch (error) {
    session.events.push(
      createEvent(
        "workflow_failed",
        "failure",
        "/api/sessions/[sessionId]/candidates",
        "Graph candidate update failed.",
        {
          session_id: session.id,
          candidate_id: trimmedRequest.candidateId,
          candidate_type: trimmedRequest.candidateType,
          error: error instanceof Error ? error.message : "unknown",
        },
      ),
    );
    await saveSession(session);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update graph candidate.",
      },
      { status: 400 },
    );
  }
}
