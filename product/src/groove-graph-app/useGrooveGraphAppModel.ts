"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type {
  EntityCandidate,
  ResearchSession,
  RelationshipCandidate,
  ReviewDecisionRequest,
  UpdateGraphCandidateRequest,
} from "@/src/types/research-session";
import type {
  GraphBackendStatusPayload,
  TripletEditDraft,
  WorkspaceResponse,
} from "@/src/components/research-workbench-model";
import {
  clamp,
  fetchJson,
  normalizeAliases,
} from "@/src/components/research-workbench-utils";
import type { GrooveGraphAppModel } from "./groove-graph-app-model";

/** Persists column split; key string kept for existing browser localStorage. */
const WORKBENCH_SPLIT_STORAGE_KEY = "gg-workbench-next-split-fraction";

export function useGrooveGraphAppModel(): GrooveGraphAppModel {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [seedQuery, setSeedQuery] = useState("Prince");
  const [message, setMessage] = useState("");
  const [tripletEditDraft, setTripletEditDraft] = useState<TripletEditDraft | null>(null);
  const [savingTripletId, setSavingTripletId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Chat column share; graph + approval column gets the remainder. Default favors a larger graph. */
  const [leftColumnFraction, setLeftColumnFraction] = useState(0.34);
  const [splitFractionHydrated, setSplitFractionHydrated] = useState(false);
  const [isMainGridResizing, setIsMainGridResizing] = useState(false);
  const [isNarrowWorkspaceLayout, setIsNarrowWorkspaceLayout] = useState(false);
  const [graphBackendStatus, setGraphBackendStatus] = useState<GraphBackendStatusPayload | null>(
    null,
  );
  const [graphBackendStatusLoading, setGraphBackendStatusLoading] = useState(true);
  const latestAssistantMessageRef = useRef<HTMLElement | null>(null);
  const mainGridRef = useRef<HTMLElement | null>(null);
  const splitDragStateRef = useRef<{
    startX: number;
    startFraction: number;
    gridWidth: number;
  } | null>(null);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  );

  const tripletCandidates = useMemo(() => {
    if (!selectedSession) {
      return [];
    }

    const entitiesById = new Map(
      selectedSession.entityCandidates.map((entity) => [entity.id, entity]),
    );

    return selectedSession.relationshipCandidates.map((relationship) => ({
      relationship,
      sourceEntity: entitiesById.get(relationship.sourceEntityId) ?? null,
      targetEntity: entitiesById.get(relationship.targetEntityId) ?? null,
    }));
  }, [selectedSession]);

  const availableKindLabels = useMemo(() => {
    if (!selectedSession) {
      return [];
    }

    return [...new Set(selectedSession.entityCandidates.map((entity) => entity.provisionalKind))].sort(
      (left, right) => left.localeCompare(right),
    );
  }, [selectedSession]);

  async function refreshSessions(nextSelectedSessionId?: string | null) {
    const data = await fetchJson<{ sessions: ResearchSession[] }>("/api/sessions");
    setSessions(data.sessions);
    if (nextSelectedSessionId) {
      setSelectedSessionId(nextSelectedSessionId);
    }
  }

  useEffect(() => {
    void refreshSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSessionId !== null || sessions.length === 0) {
      return;
    }
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    setSelectedSessionId(sorted[0].id);
  }, [sessions, selectedSessionId]);

  async function refreshGraphBackendStatus() {
    setGraphBackendStatusLoading(true);
    try {
      const data = await fetchJson<GraphBackendStatusPayload>("/api/graph-backend-status");
      setGraphBackendStatus(data);
    } catch {
      setGraphBackendStatus(null);
    } finally {
      setGraphBackendStatusLoading(false);
    }
  }

  useEffect(() => {
    void refreshGraphBackendStatus();
    const intervalId = window.setInterval(() => void refreshGraphBackendStatus(), 45_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(WORKBENCH_SPLIT_STORAGE_KEY);
    const parsed = raw ? Number.parseFloat(raw) : NaN;
    if (Number.isFinite(parsed)) {
      setLeftColumnFraction(clamp(parsed, 0.22, 0.52));
    }
    setSplitFractionHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !splitFractionHydrated) {
      return;
    }
    window.localStorage.setItem(WORKBENCH_SPLIT_STORAGE_KEY, String(leftColumnFraction));
  }, [splitFractionHydrated, leftColumnFraction]);

  useEffect(() => {
    setTripletEditDraft(null);
  }, [selectedSessionId]);

  useEffect(() => {
    if (!tripletEditDraft?.relationshipId || !selectedSession) {
      return;
    }
    const relationship = selectedSession.relationshipCandidates.find(
      (r) => r.id === tripletEditDraft.relationshipId,
    );
    if (!relationship || relationship.status !== "proposed") {
      setTripletEditDraft(null);
    }
  }, [selectedSession, tripletEditDraft?.relationshipId]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 980px)");
    const syncLayoutMode = () => setIsNarrowWorkspaceLayout(mediaQuery.matches);
    syncLayoutMode();
    mediaQuery.addEventListener("change", syncLayoutMode);
    return () => mediaQuery.removeEventListener("change", syncLayoutMode);
  }, []);

  useEffect(() => {
    if (!isMainGridResizing) {
      return;
    }

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const dragState = splitDragStateRef.current;
      if (!dragState || dragState.gridWidth <= 0) {
        return;
      }

      const deltaFraction = (event.clientX - dragState.startX) / dragState.gridWidth;
      setLeftColumnFraction(clamp(dragState.startFraction + deltaFraction, 0.22, 0.52));
    };

    const stopResizing = () => {
      splitDragStateRef.current = null;
      setIsMainGridResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [isMainGridResizing]);

  async function createSession() {
    setError(null);
    setIsBusy(true);
    try {
      const data = await fetchJson<WorkspaceResponse>("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seedQuery }),
      });
      await refreshSessions(data.session.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create session.");
    } finally {
      setIsBusy(false);
    }
  }

  async function sendTurn() {
    if (!selectedSession || !message.trim()) {
      return;
    }

    setError(null);
    setIsBusy(true);
    try {
      const data = await fetchJson<WorkspaceResponse>(`/api/sessions/${selectedSession.id}/turn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      setSessions((current) =>
        current.map((session) => (session.id === data.session.id ? data.session : session)),
      );
      setMessage("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Turn failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function recordDecision(request: ReviewDecisionRequest) {
    if (!selectedSession) {
      return;
    }

    setError(null);
    try {
      const data = await fetchJson<WorkspaceResponse>(
        `/api/sessions/${selectedSession.id}/decisions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );

      setSessions((current) =>
        current.map((session) => (session.id === data.session.id ? data.session : session)),
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Decision failed.");
    }
  }

  async function updateGraphCandidate(request: UpdateGraphCandidateRequest): Promise<boolean> {
    if (!selectedSession) {
      return false;
    }

    setError(null);
    try {
      const data = await fetchJson<WorkspaceResponse>(
        `/api/sessions/${selectedSession.id}/candidates`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );

      setSessions((current) =>
        current.map((session) => (session.id === data.session.id ? data.session : session)),
      );
      return true;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Candidate update failed.");
      return false;
    }
  }

  function beginTripletEdit(
    relationship: RelationshipCandidate,
    sourceEntity: EntityCandidate | null,
    targetEntity: EntityCandidate | null,
  ) {
    setTripletEditDraft({
      relationshipId: relationship.id,
      relationshipVerb: relationship.verb,
      sourceEntity: sourceEntity
        ? {
            candidateId: sourceEntity.id,
            displayName: sourceEntity.displayName,
            provisionalKind: sourceEntity.provisionalKind,
            aliases: [...sourceEntity.aliases],
          }
        : null,
      targetEntity: targetEntity
        ? {
            candidateId: targetEntity.id,
            displayName: targetEntity.displayName,
            provisionalKind: targetEntity.provisionalKind,
            aliases: [...targetEntity.aliases],
          }
        : null,
    });
  }

  function beginMainGridResize(event: ReactPointerEvent<HTMLElement>) {
    if (isNarrowWorkspaceLayout || !mainGridRef.current) {
      return;
    }

    const gridWidth = mainGridRef.current.getBoundingClientRect().width;
    if (gridWidth <= 0) {
      return;
    }

    splitDragStateRef.current = {
      startX: event.clientX,
      startFraction: leftColumnFraction,
      gridWidth,
    };
    setIsMainGridResizing(true);
  }

  function updateTripletEntityDraft(
    relationshipId: string,
    side: "sourceEntity" | "targetEntity",
    field: "displayName" | "provisionalKind",
    value: string,
  ) {
    setTripletEditDraft((current) => {
      if (current?.relationshipId !== relationshipId) {
        return current;
      }

      const entityDraft = current[side];
      if (!entityDraft) {
        return current;
      }

      return {
        ...current,
        [side]: {
          ...entityDraft,
          [field]: value,
        },
      };
    });
  }

  function updateTripletEntityAlias(
    relationshipId: string,
    side: "sourceEntity" | "targetEntity",
    aliasIndex: number,
    value: string,
  ) {
    setTripletEditDraft((current) => {
      if (current?.relationshipId !== relationshipId) {
        return current;
      }

      const entityDraft = current[side];
      if (!entityDraft) {
        return current;
      }

      return {
        ...current,
        [side]: {
          ...entityDraft,
          aliases: entityDraft.aliases.map((alias, index) =>
            index === aliasIndex ? value : alias,
          ),
        },
      };
    });
  }

  function addTripletEntityAlias(
    relationshipId: string,
    side: "sourceEntity" | "targetEntity",
    value: string,
  ) {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }

    setTripletEditDraft((current) => {
      if (current?.relationshipId !== relationshipId) {
        return current;
      }

      const entityDraft = current[side];
      if (!entityDraft) {
        return current;
      }

      return {
        ...current,
        [side]: {
          ...entityDraft,
          aliases: [...entityDraft.aliases, trimmedValue],
        },
      };
    });
  }

  function removeTripletEntityAlias(
    relationshipId: string,
    side: "sourceEntity" | "targetEntity",
    aliasIndex: number,
  ) {
    setTripletEditDraft((current) => {
      if (current?.relationshipId !== relationshipId) {
        return current;
      }

      const entityDraft = current[side];
      if (!entityDraft) {
        return current;
      }

      return {
        ...current,
        [side]: {
          ...entityDraft,
          aliases: entityDraft.aliases.filter((_, index) => index !== aliasIndex),
        },
      };
    });
  }

  async function saveTripletEdit(relationshipId: string) {
    if (savingTripletId || tripletEditDraft?.relationshipId !== relationshipId) {
      return;
    }

    const draft = tripletEditDraft;
    if (!draft) {
      return;
    }

    const verb = draft.relationshipVerb.trim() || "related to";
    const updates: UpdateGraphCandidateRequest[] = [
      {
        candidateType: "relationship",
        candidateId: relationshipId,
        verb,
      },
    ];

    if (draft.sourceEntity) {
      updates.push({
        candidateType: "entity",
        candidateId: draft.sourceEntity.candidateId,
        displayName: draft.sourceEntity.displayName.trim() || "Unnamed entity",
        provisionalKind: draft.sourceEntity.provisionalKind.trim() || "Unknown",
        aliases: normalizeAliases(draft.sourceEntity.aliases),
      });
    }

    if (draft.targetEntity) {
      updates.push({
        candidateType: "entity",
        candidateId: draft.targetEntity.candidateId,
        displayName: draft.targetEntity.displayName.trim() || "Unnamed entity",
        provisionalKind: draft.targetEntity.provisionalKind.trim() || "Unknown",
        aliases: normalizeAliases(draft.targetEntity.aliases),
      });
    }

    setSavingTripletId(relationshipId);
    let allSaved = true;
    for (const request of updates) {
      const didSave = await updateGraphCandidate(request);
      if (!didSave) {
        allSaved = false;
      }
    }
    setSavingTripletId(null);

    if (allSaved) {
      setTripletEditDraft(null);
    }
  }

  const latestAssistantMessageId = useMemo(() => {
    if (!selectedSession) {
      return null;
    }

    const latestAssistant = [...selectedSession.messages]
      .reverse()
      .find((entry) => entry.role === "assistant");
    return latestAssistant?.id ?? null;
  }, [selectedSession]);

  return {
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    seedQuery,
    setSeedQuery,
    message,
    setMessage,
    tripletEditDraft,
    setTripletEditDraft,
    savingTripletId,
    isBusy,
    error,
    leftColumnFraction,
    isMainGridResizing,
    isNarrowWorkspaceLayout,
    latestAssistantMessageRef,
    mainGridRef,
    selectedSession,
    tripletCandidates,
    availableKindLabels,
    latestAssistantMessageId,
    createSession,
    sendTurn,
    recordDecision,
    updateGraphCandidate,
    beginTripletEdit,
    beginMainGridResize,
    updateTripletEntityDraft,
    updateTripletEntityAlias,
    addTripletEntityAlias,
    removeTripletEntityAlias,
    saveTripletEdit,
    graphBackendStatus,
    graphBackendStatusLoading,
    refreshGraphBackendStatus,
  };
}
