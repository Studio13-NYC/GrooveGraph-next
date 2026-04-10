import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WorkbenchVizApiResponse } from "@/src/types/workbench-viz-graph";
import type { WorkbenchVizGraph } from "@/src/types/workbench-viz-graph";

export type VizHistoryEntry = {
  fingerprint: string;
  graph: WorkbenchVizGraph;
  source: "typedb" | "session";
  capturedAt: number;
};

export function fingerprintGraph(graph: WorkbenchVizGraph): string {
  const nodes = [...graph.nodes]
    .map((n) => n.id)
    .sort()
    .join("|");
  const edges = [...graph.edges]
    .map((e) => e.id)
    .sort()
    .join("|");
  return `${nodes}#${edges}`;
}

export type SessionVizHistory = {
  entries: VizHistoryEntry[];
  index: number;
  canBack: boolean;
  canForward: boolean;
  goBack: () => void;
  goForward: () => void;
  effectiveGraph: WorkbenchVizGraph | null;
  effectiveSource: "typedb" | "session" | null;
  isViewingLatest: boolean;
  positionLabel: string;
  currentCapturedAt: number | null;
};

/**
 * Per-session stack of distinct viz payloads (fingerprinted). New snapshots append; index jumps to latest on push.
 */
export function useSessionVizHistory(
  sessionId: string | null,
  latest: WorkbenchVizApiResponse | null,
): SessionVizHistory {
  const [entries, setEntries] = useState<VizHistoryEntry[]>([]);
  const [index, setIndex] = useState(0);
  const prevEntriesLengthRef = useRef(0);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => {
    setEntries([]);
    setIndex(0);
    prevEntriesLengthRef.current = 0;
  }, [sessionId]);

  const fp = latest ? fingerprintGraph(latest.graph) : null;

  useEffect(() => {
    if (!sessionId || !latest || !fp) {
      return;
    }
    setEntries((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.fingerprint === fp) {
        return prev;
      }
      const nextEntry: VizHistoryEntry = {
        fingerprint: fp,
        graph: latest.graph,
        source: latest.source,
        capturedAt: Date.now(),
      };
      return [...prev, nextEntry];
    });
  }, [sessionId, latest, fp]);

  const entryCount = entries.length;
  useEffect(() => {
    setIndex((i) => {
      if (entryCount === 0) {
        return 0;
      }
      return Math.min(i, entryCount - 1);
    });
  }, [entryCount]);

  /** Only jump to the newest snapshot when a new entry is appended, not when the user navigated back. */
  useEffect(() => {
    const len = entries.length;
    if (len === 0) {
      prevEntriesLengthRef.current = 0;
      return;
    }
    if (len > prevEntriesLengthRef.current) {
      setIndex(len - 1);
    }
    prevEntriesLengthRef.current = len;
  }, [entries.length]);

  const safeIndex = entries.length === 0 ? 0 : Math.min(index, entries.length - 1);
  const effectiveEntry = entries.length > 0 ? entries[safeIndex] ?? null : null;

  const canBack = entries.length > 0 && safeIndex > 0;
  const canForward = entries.length > 0 && safeIndex < entries.length - 1;

  const goBack = useCallback(() => {
    setIndex((i) => {
      const len = entriesRef.current.length;
      if (len === 0) {
        return 0;
      }
      const j = Math.min(i, len - 1);
      return j > 0 ? j - 1 : 0;
    });
  }, []);

  const goForward = useCallback(() => {
    setIndex((i) => {
      const len = entriesRef.current.length;
      if (len === 0) {
        return 0;
      }
      const j = Math.min(i, len - 1);
      return j < len - 1 ? j + 1 : j;
    });
  }, []);

  const effectiveGraph = useMemo(() => {
    if (entries.length === 0) {
      return latest?.graph ?? null;
    }
    return effectiveEntry?.graph ?? null;
  }, [entries.length, effectiveEntry, latest]);

  const effectiveSource = useMemo((): "typedb" | "session" | null => {
    if (entries.length === 0) {
      return latest?.source ?? null;
    }
    return effectiveEntry?.source ?? null;
  }, [entries.length, effectiveEntry, latest]);

  const isViewingLatest = entries.length === 0 || safeIndex === entries.length - 1;

  const positionLabel = entries.length === 0 ? "—" : `${safeIndex + 1} / ${entries.length}`;

  const currentCapturedAt = effectiveEntry?.capturedAt ?? null;

  return {
    entries,
    index: safeIndex,
    canBack,
    canForward,
    goBack,
    goForward,
    effectiveGraph,
    effectiveSource,
    isViewingLatest,
    positionLabel,
    currentCapturedAt,
  };
}
