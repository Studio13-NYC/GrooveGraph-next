export type ReviewStatus = "proposed" | "accepted" | "rejected" | "deferred";

export interface SessionMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  responseId?: string;
  createdAt: string;
}

export interface SourceDocument {
  id: string;
  url: string;
  title: string;
  citationText?: string;
  sessionId: string;
  createdAt: string;
}

export interface EvidenceSnippet {
  id: string;
  sourceId?: string;
  text: string;
  confidence: "low" | "medium" | "high";
  sessionId: string;
  createdAt: string;
}

export interface Claim {
  id: string;
  text: string;
  confidence: "low" | "medium" | "high";
  evidenceSnippetIds: string[];
  status: ReviewStatus;
  createdAt: string;
}

export interface EntityCandidate {
  id: string;
  displayName: string;
  provisionalKind: string;
  aliases: string[];
  externalIds: string[];
  attributes: Record<string, string>;
  evidenceSnippetIds: string[];
  status: ReviewStatus;
  createdAt: string;
}

export interface RelationshipCandidate {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  verb: string;
  confidence: "low" | "medium" | "high";
  evidenceSnippetIds: string[];
  status: ReviewStatus;
  createdAt: string;
}

export interface ReviewDecision {
  id: string;
  itemType: "claim" | "entity" | "relationship";
  itemId: string;
  decision: Exclude<ReviewStatus, "proposed">;
  note?: string;
  createdAt: string;
}

export interface SessionEvent {
  id: string;
  stage:
    | "session_created"
    | "turn_started"
    | "turn_completed"
    | "tool_called"
    | "tool_completed"
    | "decision_recorded"
    | "candidate_updated"
    | "workflow_failed";
  outcome: "success" | "failure";
  route: string;
  message: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface ResearchSession {
  id: string;
  title: string;
  seedQuery: string;
  status: "ready" | "running" | "error";
  openaiConversationId?: string;
  lastResponseId?: string;
  createdAt: string;
  updatedAt: string;
  messages: SessionMessage[];
  sources: SourceDocument[];
  evidenceSnippets: EvidenceSnippet[];
  claims: Claim[];
  entityCandidates: EntityCandidate[];
  relationshipCandidates: RelationshipCandidate[];
  reviewDecisions: ReviewDecision[];
  notes: string[];
  events: SessionEvent[];
}

export interface CreateSessionRequest {
  seedQuery: string;
}

export interface TurnRequest {
  message: string;
}

export interface ReviewDecisionRequest {
  itemType: "claim" | "entity" | "relationship";
  itemId: string;
  decision: Exclude<ReviewStatus, "proposed">;
  note?: string;
}

export interface UpdateEntityCandidateRequest {
  candidateType: "entity";
  candidateId: string;
  displayName: string;
  provisionalKind: string;
  aliases: string[];
}

export interface UpdateRelationshipCandidateRequest {
  candidateType: "relationship";
  candidateId: string;
  verb: string;
}

export type UpdateGraphCandidateRequest =
  | UpdateEntityCandidateRequest
  | UpdateRelationshipCandidateRequest;
