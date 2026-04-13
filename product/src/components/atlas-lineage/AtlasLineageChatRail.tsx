"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkspaceResponse } from "@/src/components/research-workbench-model";
import { fetchJson } from "@/src/components/research-workbench-utils";
import { researchTurnProgressForElapsed } from "@/src/lib/research-turn-progress-ui";
import type { ResearchConversationMode, ResearchSession } from "@/src/types/research-session";

export type AtlasLineageChatRailProps = {
  sessionId: string | null;
  session: ResearchSession | null;
  onSessionUpdated: (s: ResearchSession) => void;
  busy?: boolean;
  onBusyChange?: (b: boolean) => void;
};

function IconChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {direction === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}

export function AtlasLineageChatRail({
  sessionId,
  session,
  onSessionUpdated,
  busy = false,
  onBusyChange,
}: AtlasLineageChatRailProps) {
  const [expanded, setExpanded] = useState(true);
  const [conversationMode, setConversationMode] = useState<ResearchConversationMode>("explore");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  /** Bumps on an interval while `sending` so elapsed-time progress copy updates. */
  const [turnProgressTick, setTurnProgressTick] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const turnStartedAtRef = useRef<number | null>(null);

  const chatEnabled = Boolean(sessionId);
  const effectiveBusy = busy || sending;

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [session?.messages.length, expanded]);

  useEffect(() => {
    if (!sending) {
      turnStartedAtRef.current = null;
      return;
    }
    const id = window.setInterval(() => {
      setTurnProgressTick((n) => n + 1);
    }, 400);
    return () => window.clearInterval(id);
  }, [sending]);

  void turnProgressTick;
  const turnElapsedMs =
    sending && turnStartedAtRef.current !== null ? Date.now() - turnStartedAtRef.current : 0;
  const turnProgressUi = sending ? researchTurnProgressForElapsed(turnElapsedMs) : null;

  const send = useCallback(async () => {
    if (!chatEnabled || !sessionId || !draft.trim() || effectiveBusy) {
      return;
    }
    setError(null);
    turnStartedAtRef.current = Date.now();
    setTurnProgressTick(0);
    setSending(true);
    onBusyChange?.(true);
    try {
      const data = await fetchJson<WorkspaceResponse>(`/api/sessions/${encodeURIComponent(sessionId)}/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: draft.trim(),
          mode: conversationMode,
        }),
      });
      onSessionUpdated(data.session);
      setDraft("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Turn failed.");
    } finally {
      setSending(false);
      onBusyChange?.(false);
    }
  }, [chatEnabled, sessionId, draft, effectiveBusy, conversationMode, onSessionUpdated, onBusyChange]);

  const messages = (session?.messages ?? []).filter((m) => m.role === "user" || m.role === "assistant");

  return (
    <aside
      className={`gg-atlas-lineage__chat-rail ${expanded ? "gg-atlas-lineage__chat-rail--expanded" : "gg-atlas-lineage__chat-rail--collapsed"}`}
      aria-label="Research chat"
    >
      {!expanded ? (
        <button
          type="button"
          className="gg-atlas-lineage__chat-rail-tab"
          onClick={() => setExpanded(true)}
          title="Expand research chat"
          aria-expanded={false}
        >
          <IconChevron direction="right" />
          <span className="gg-atlas-lineage__chat-rail-tab-label">Chat</span>
        </button>
      ) : (
        <div className="gg-atlas-lineage__chat-rail-inner">
          <div className="gg-atlas-lineage__chat-rail-head">
            <h2 className="gg-atlas-lineage__chat-rail-title">Research chat</h2>
            <button
              type="button"
              className="gg-atlas-lineage__chat-rail-collapse"
              onClick={() => setExpanded(false)}
              title="Collapse chat rail"
              aria-expanded
            >
              <IconChevron direction="left" />
            </button>
          </div>
          <div className="gg-atlas-lineage__chat-rail-modes" role="group" aria-label="Conversation mode">
            <button
              type="button"
              className={`gg-atlas-lineage__chat-rail-mode ${conversationMode === "explore" ? "gg-atlas-lineage__chat-rail-mode--on" : ""}`}
              onClick={() => setConversationMode("explore")}
              aria-pressed={conversationMode === "explore"}
            >
              Explore
            </button>
            <button
              type="button"
              className={`gg-atlas-lineage__chat-rail-mode ${conversationMode === "build" ? "gg-atlas-lineage__chat-rail-mode--on" : ""}`}
              onClick={() => setConversationMode("build")}
              aria-pressed={conversationMode === "build"}
            >
              Build
            </button>
          </div>
          {!chatEnabled ? (
            <p className="gg-atlas-lineage__chat-rail-placeholder">
              Select a <strong>research session</strong> in the strip above to enable chat.
            </p>
          ) : null}
          {error ? (
            <p className="gg-atlas-lineage__chat-rail-error" role="alert">
              {error}
            </p>
          ) : null}
          {turnProgressUi ? (
            <div
              className="gg-atlas-lineage__chat-rail-progress"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <p className="gg-atlas-lineage__chat-rail-progress-title">{turnProgressUi.phaseLabel}</p>
              <p className="gg-atlas-lineage__chat-rail-progress-detail">{turnProgressUi.detailLine}</p>
              <p className="gg-atlas-lineage__chat-rail-progress-eta">{turnProgressUi.etaLine}</p>
            </div>
          ) : null}
          <div ref={listRef} className="gg-atlas-lineage__chat-rail-messages" tabIndex={0}>
            {chatEnabled && messages.length === 0 ? (
              <p className="gg-atlas-lineage__chat-rail-empty">No messages yet.</p>
            ) : null}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`gg-atlas-lineage__chat-msg ${m.role === "user" ? "gg-atlas-lineage__chat-msg--user" : "gg-atlas-lineage__chat-msg--assistant"}`}
              >
                <span className="gg-atlas-lineage__chat-msg-role">{m.role === "user" ? "You" : "Assistant"}</span>
                <p className="gg-atlas-lineage__chat-msg-body">{m.content}</p>
              </div>
            ))}
          </div>
          <div className="gg-atlas-lineage__chat-rail-compose">
            <label htmlFor="atlas-chat-input" className="sr-only">
              Message to research assistant
            </label>
            <textarea
              id="atlas-chat-input"
              className="gg-atlas-lineage__chat-rail-input"
              rows={3}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError(null);
              }}
              placeholder={
                chatEnabled ? "Ask about sources, entities, or relationships…" : "Choose a session above to start…"
              }
              disabled={!chatEnabled || effectiveBusy}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              type="button"
              className="gg-atlas-lineage__btn-create-session gg-atlas-lineage__chat-rail-send"
              disabled={!chatEnabled || effectiveBusy || !draft.trim()}
              onClick={() => void send()}
            >
              {sending && turnProgressUi ? `${turnProgressUi.phaseLabel}…` : effectiveBusy ? "Working…" : "Send"}
            </button>
            <p className="gg-atlas-lineage__chat-rail-hint">Ctrl+Enter to send</p>
          </div>
        </div>
      )}
    </aside>
  );
}
