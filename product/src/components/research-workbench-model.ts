import type { Dispatch, PointerEvent, RefObject, SetStateAction } from "react";
import type {
  EntityCandidate,
  ResearchSession,
  RelationshipCandidate,
  ReviewDecisionRequest,
  UpdateGraphCandidateRequest,
} from "@/src/types/research-session";

/** Shown while naming / confirming a new session from the seed field. */
export type SessionCreateDialogState = {
  titleDraft: string;
};

export type GraphBackendStatusPayload = {
  configured: boolean;
  reachable: boolean;
  database: string | null;
  message: string;
  connectionStringEmpty?: boolean;
};

export type WorkspaceResponse = {
  session: ResearchSession;
};

export type TripletCandidate = {
  relationship: RelationshipCandidate;
  sourceEntity: EntityCandidate | null;
  targetEntity: EntityCandidate | null;
};

export type EntityEditDraft = {
  candidateId: string;
  displayName: string;
  provisionalKind: string;
  aliases: string[];
};

export type TripletEditDraft = {
  relationshipId: string;
  relationshipVerb: string;
  sourceEntity: EntityEditDraft | null;
  targetEntity: EntityEditDraft | null;
};

export type ResearchWorkbenchModel = {
  sessions: ResearchSession[];
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
  seedQuery: string;
  setSeedQuery: (v: string) => void;
  message: string;
  setMessage: (v: string) => void;
  tripletEditDraft: TripletEditDraft | null;
  setTripletEditDraft: Dispatch<SetStateAction<TripletEditDraft | null>>;
  savingTripletId: string | null;
  isBusy: boolean;
  error: string | null;
  leftColumnFraction: number;
  isMainGridResizing: boolean;
  isNarrowWorkspaceLayout: boolean;
  latestAssistantMessageRef: RefObject<HTMLElement | null>;
  mainGridRef: RefObject<HTMLElement | null>;
  selectedSession: ResearchSession | null;
  tripletCandidates: TripletCandidate[];
  availableKindLabels: string[];
  latestAssistantMessageId: string | null;
  sessionCreateDialog: SessionCreateDialogState | null;
  sessionCreateNamingBusy: boolean;
  sessionCreateConfirmBusy: boolean;
  createSession: () => Promise<void>;
  confirmSessionCreate: () => Promise<void>;
  cancelSessionCreateDialog: () => void;
  setSessionCreateTitleDraft: (value: string) => void;
  sendTurn: () => Promise<void>;
  recordDecision: (request: ReviewDecisionRequest) => Promise<void>;
  updateGraphCandidate: (request: UpdateGraphCandidateRequest) => Promise<boolean>;
  beginTripletEdit: (
    relationship: RelationshipCandidate,
    sourceEntity: EntityCandidate | null,
    targetEntity: EntityCandidate | null,
  ) => void;
  beginMainGridResize: (event: PointerEvent<HTMLElement>) => void;
  updateTripletEntityDraft: (
    relationshipId: string,
    side: "sourceEntity" | "targetEntity",
    field: "displayName" | "provisionalKind",
    value: string,
  ) => void;
  updateTripletEntityAlias: (
    relationshipId: string,
    side: "sourceEntity" | "targetEntity",
    aliasIndex: number,
    value: string,
  ) => void;
  addTripletEntityAlias: (
    relationshipId: string,
    side: "sourceEntity" | "targetEntity",
    value: string,
  ) => void;
  removeTripletEntityAlias: (
    relationshipId: string,
    side: "sourceEntity" | "targetEntity",
    aliasIndex: number,
  ) => void;
  saveTripletEdit: (relationshipId: string) => Promise<void>;
  graphBackendStatus: GraphBackendStatusPayload | null;
  graphBackendStatusLoading: boolean;
  refreshGraphBackendStatus: () => Promise<void>;
};
