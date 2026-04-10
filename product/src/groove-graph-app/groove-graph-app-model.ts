import type { ResearchWorkbenchModel } from "@/src/components/research-workbench-model";

/**
 * App-facing name for the research session UI model. Same contract as
 * {@link ResearchWorkbenchModel}; use this in `/main` and new shell code.
 */
export type GrooveGraphAppModel = ResearchWorkbenchModel;

export type {
  GraphBackendStatusPayload,
  TripletCandidate,
  TripletEditDraft,
  WorkspaceResponse,
} from "@/src/components/research-workbench-model";
