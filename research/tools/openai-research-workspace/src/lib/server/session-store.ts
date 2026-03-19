import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type {
  ResearchSession,
  ReviewDecision,
  ReviewDecisionRequest,
  SessionEvent,
  SessionMessage,
} from "@/src/types/research-session";

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

export async function createSession(seedQuery: string, openaiConversationId?: string): Promise<ResearchSession> {
  await ensureDirs();
  const id = createId("rs");
  const createdAt = nowIso();
  const session: ResearchSession = {
    id,
    title: seedQuery.slice(0, 80),
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
