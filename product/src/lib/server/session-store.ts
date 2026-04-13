import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type {
  ResearchSession,
  ReviewDecision,
  ReviewDecisionRequest,
  SessionEvent,
  SessionMessage,
  UpdateGraphCandidateRequest,
} from "@/src/types/research-session";
import { fallbackDisplayTitleFromSeed } from "@/src/lib/server/session-title-from-prompt";

function workspaceRoot(): string {
  return process.cwd();
}

function dataRoot(): string {
  return path.join(workspaceRoot(), ".data");
}

function sessionsRoot(): string {
  return path.join(dataRoot(), "sessions");
}

function sessionFile(sessionId: string): string {
  return path.join(sessionsRoot(), `${sessionId}.json`);
}

async function ensureDirs(): Promise<void> {
  await mkdir(sessionsRoot(), { recursive: true });
}

function nowIso(): string {
  return new Date().toISOString();
}

const SESSION_TITLE_MAX_LEN = 200;

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function createEvent(
  stage: SessionEvent["stage"],
  outcome: SessionEvent["outcome"],
  route: string,
  message: string,
  metadata?: Record<string, string>,
): SessionEvent {
  return {
    id: createId("evt"),
    stage,
    outcome,
    route,
    message,
    metadata,
    createdAt: nowIso(),
  };
}

export async function createSession(
  seedQuery: string,
  openaiConversationId?: string,
  displayTitle?: string,
): Promise<ResearchSession> {
  await ensureDirs();
  const id = createId("rs");
  const createdAt = nowIso();
  const trimmedSeed = seedQuery.trim();
  const trimmedTitle = displayTitle?.trim();
  const title =
    trimmedTitle && trimmedTitle.length > 0
      ? trimmedTitle.slice(0, SESSION_TITLE_MAX_LEN)
      : fallbackDisplayTitleFromSeed(trimmedSeed.length > 0 ? trimmedSeed : seedQuery);
  const session: ResearchSession = {
    id,
    title,
    seedQuery,
    status: "ready",
    openaiConversationId,
    createdAt,
    updatedAt: createdAt,
    messages: [],
    sources: [],
    evidenceSnippets: [],
    claims: [],
    entityCandidates: [],
    relationshipCandidates: [],
    reviewDecisions: [],
    notes: [],
    events: [
      createEvent("session_created", "success", "/api/sessions", "Research session created.", {
        session_id: id,
      }),
    ],
  };

  await saveSession(session);
  return session;
}

export async function listSessions(): Promise<ResearchSession[]> {
  await ensureDirs();
  const files = await readdir(sessionsRoot(), { withFileTypes: true });
  const sessions = await Promise.all(
    files
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => readSession(entry.name.replace(/\.json$/, ""))),
  );

  return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function readSession(sessionId: string): Promise<ResearchSession> {
  const raw = await readFile(sessionFile(sessionId), "utf8");
  return JSON.parse(raw) as ResearchSession;
}

export async function saveSession(session: ResearchSession): Promise<void> {
  await ensureDirs();
  session.updatedAt = nowIso();
  await writeFile(sessionFile(session.id), JSON.stringify(session, null, 2));
}

export function updateSessionTitle(session: ResearchSession, title: string): void {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("Title cannot be empty.");
  }
  session.title = trimmed.slice(0, SESSION_TITLE_MAX_LEN);
  session.events.push(
    createEvent(
      "session_metadata_updated",
      "success",
      "/api/sessions/[sessionId]",
      "Session title updated.",
      { session_id: session.id },
    ),
  );
}

export function appendMessage(
  session: ResearchSession,
  message: Omit<SessionMessage, "id" | "createdAt">,
): SessionMessage {
  const nextMessage: SessionMessage = {
    id: createId("msg"),
    createdAt: nowIso(),
    ...message,
  };

  session.messages.push(nextMessage);
  return nextMessage;
}

export function appendReviewDecision(
  session: ResearchSession,
  request: ReviewDecisionRequest,
): ReviewDecision {
  const decision: ReviewDecision = {
    id: createId("dec"),
    ...request,
    createdAt: nowIso(),
  };

  session.reviewDecisions.push(decision);

  if (request.itemType === "claim") {
    const claim = session.claims.find((item) => item.id === request.itemId);
    if (claim) {
      claim.status = request.decision;
    }
  } else if (request.itemType === "entity") {
    const entity = session.entityCandidates.find((item) => item.id === request.itemId);
    if (entity) {
      entity.status = request.decision;
    }
  } else {
    const relationship = session.relationshipCandidates.find((item) => item.id === request.itemId);
    if (relationship) {
      relationship.status = request.decision;
    }
  }

  session.events.push(
    createEvent("decision_recorded", "success", "/api/sessions/[sessionId]/decisions", "Review decision recorded.", {
      session_id: session.id,
      item_id: request.itemId,
      item_type: request.itemType,
      decision: request.decision,
    }),
  );

  return decision;
}

export function acceptAllProposedGraphCandidates(session: ResearchSession): {
  entitiesAccepted: number;
  relationshipsAccepted: number;
} {
  let entitiesAccepted = 0;
  for (const entity of session.entityCandidates) {
    if (entity.status !== "proposed") {
      continue;
    }
    appendReviewDecision(session, {
      itemType: "entity",
      itemId: entity.id,
      decision: "accepted",
    });
    entitiesAccepted += 1;
  }

  let relationshipsAccepted = 0;
  for (const relationship of session.relationshipCandidates) {
    if (relationship.status !== "proposed") {
      continue;
    }
    appendReviewDecision(session, {
      itemType: "relationship",
      itemId: relationship.id,
      decision: "accepted",
    });
    relationshipsAccepted += 1;
  }

  return { entitiesAccepted, relationshipsAccepted };
}

export function renameProposedEntityKind(session: ResearchSession, from: string, to: string): number {
  const fromTrimmed = from.trim();
  const toTrimmed = to.trim();
  if (!fromTrimmed || !toTrimmed || fromTrimmed === toTrimmed) {
    return 0;
  }

  let renamed = 0;
  for (const entity of session.entityCandidates) {
    if (entity.status !== "proposed" || entity.provisionalKind.trim() !== fromTrimmed) {
      continue;
    }
    entity.provisionalKind = toTrimmed;
    renamed += 1;
    session.events.push(
      createEvent(
        "candidate_updated",
        "success",
        "/api/sessions/[sessionId]/candidates/rename-kind",
        "Renamed provisional kind for proposed entities.",
        {
          session_id: session.id,
          from: fromTrimmed,
          to: toTrimmed,
        },
      ),
    );
  }

  return renamed;
}

export function applyGraphCandidateUpdate(
  session: ResearchSession,
  request: UpdateGraphCandidateRequest,
) {
  if (request.candidateType === "entity") {
    const entity = session.entityCandidates.find((item) => item.id === request.candidateId);
    if (!entity) {
      throw new Error("Entity candidate not found.");
    }

    entity.displayName = request.displayName;
    entity.provisionalKind = request.provisionalKind;
    entity.aliases = request.aliases;

    session.events.push(
      createEvent(
        "candidate_updated",
        "success",
        "/api/sessions/[sessionId]/candidates",
        "Entity candidate updated.",
        {
          session_id: session.id,
          candidate_id: request.candidateId,
          candidate_type: request.candidateType,
        },
      ),
    );

    return entity;
  }

  const relationship = session.relationshipCandidates.find(
    (item) => item.id === request.candidateId,
  );
  if (!relationship) {
    throw new Error("Relationship candidate not found.");
  }

  relationship.verb = request.verb;

  session.events.push(
    createEvent(
      "candidate_updated",
      "success",
      "/api/sessions/[sessionId]/candidates",
      "Relationship candidate updated.",
      {
        session_id: session.id,
        candidate_id: request.candidateId,
        candidate_type: request.candidateType,
      },
    ),
  );

  return relationship;
}
