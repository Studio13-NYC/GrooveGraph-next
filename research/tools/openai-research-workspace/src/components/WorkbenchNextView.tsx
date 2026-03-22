"use client";

import { useEffect, useState, type ReactNode, type Ref } from "react";
import type { ResearchWorkbenchModel } from "./research-workbench-model";
import { formatTimestamp } from "./research-workbench-utils";
import {
  DecisionRow,
  EmptyState,
  MarkdownMessage,
  MiniAction,
  StatusBar,
  TripletEntitySummary,
} from "./research-workbench-widgets";

const INDEX_NAV_COLLAPSED_KEY = "gg-workbench-index-nav-collapsed";

export function WorkbenchNextView({ model }: { model: ResearchWorkbenchModel }) {
  const [indexNavCollapsed, setIndexNavCollapsed] = useState(false);
  const [indexNavHydrated, setIndexNavHydrated] = useState(false);
  const [evidenceFieldNotesOpen, setEvidenceFieldNotesOpen] = useState(true);
  const [evidenceSourcesOpen, setEvidenceSourcesOpen] = useState(false);
  const [includeDeferredInGraphSync, setIncludeDeferredInGraphSync] = useState(false);

  const {
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
    beginTripletEdit,
    beginMainGridResize,
    updateTripletEntityDraft,
    updateTripletEntityAlias,
    addTripletEntityAlias,
    removeTripletEntityAlias,
    saveTripletEdit,
    isGraphSyncing,
    graphSyncFeedback,
    syncSessionToNeo4j,
  } = model;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(INDEX_NAV_COLLAPSED_KEY);
      if (raw === "1" || raw === "true") {
        setIndexNavCollapsed(true);
      }
    } finally {
      setIndexNavHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!indexNavHydrated) {
      return;
    }
    localStorage.setItem(INDEX_NAV_COLLAPSED_KEY, indexNavCollapsed ? "1" : "0");
  }, [indexNavCollapsed, indexNavHydrated]);

  const canCollapseIndex = !isNarrowWorkspaceLayout;
  const indexCollapsed = canCollapseIndex && indexNavCollapsed;

  const directionalLine = selectedSession
    ? `Active session: ${selectedSession.title} · Updated ${formatTimestamp(selectedSession.updatedAt)}`
    : "Select a session or open a new one to begin.";

  return (
    <main className="gg-next-root">
      <header className="gg-next-masthead">
        <div className="gg-next-masthead-band" aria-hidden />
        <div className="gg-next-masthead-grid">
          <div className="gg-next-masthead-id">
            <p className="gg-next-kicker">Identification</p>
            <h1 className="gg-next-product">GrooveGraph</h1>
            <p className="gg-next-regime">Research workbench</p>
          </div>
          <p className="gg-next-directional">{directionalLine}</p>
        </div>
      </header>

      {error ? <div className="gg-next-alert">{error}</div> : null}
      {graphSyncFeedback && !error ? (
        <div className="gg-next-alert gg-next-alert--success" role="status">
          {graphSyncFeedback}
        </div>
      ) : null}

      <div
        className="gg-next-body"
        ref={mainGridRef as Ref<HTMLDivElement>}
        style={{
          display: "grid",
          gridTemplateColumns: isNarrowWorkspaceLayout
            ? "minmax(0, 1fr)"
            : indexCollapsed
              ? `56px minmax(0, ${leftColumnFraction}fr) 12px minmax(0, ${1 - leftColumnFraction}fr)`
              : `minmax(260px, 0.28fr) minmax(0, ${leftColumnFraction}fr) 12px minmax(0, ${1 - leftColumnFraction}fr)`,
          gap: isNarrowWorkspaceLayout ? "16px" : "0 12px",
          alignItems: "stretch",
        }}
      >
        {indexCollapsed ? (
          <aside
            id="gg-next-index-panel"
            className="gg-next-rail gg-next-rail--collapsed"
            aria-label="Session index"
          >
            <div className="gg-next-rail-collapsed-inner">
              <button
                type="button"
                className="gg-next-rail-toggle"
                onClick={() => setIndexNavCollapsed(false)}
                aria-expanded={false}
                aria-controls="gg-next-index-panel"
                title="Expand index"
              >
                <span className="gg-next-rail-toggle-icon" aria-hidden>
                  »
                </span>
                <span className="gg-next-sr-only">Expand session index</span>
              </button>
              <button
                type="button"
                className="gg-next-cta gg-next-cta--rail-icon"
                onClick={() => void createSession()}
                disabled={isBusy}
                title="Open session (expand index to edit seed)"
                aria-label="Open session"
              >
                {isBusy ? "…" : "+"}
              </button>
              <ul className="gg-next-index-collapsed-list" aria-label="Past sessions">
                {sessions.map((session) => {
                  const active = selectedSessionId === session.id;
                  return (
                    <li key={session.id}>
                      <button
                        type="button"
                        className={`gg-next-index-icon${active ? " gg-next-index-icon--active" : ""}`}
                        onClick={() => setSelectedSessionId(session.id)}
                        title={`${session.title} · ${formatTimestamp(session.updatedAt)}`}
                        aria-label={`${session.title}, ${formatTimestamp(session.updatedAt)}`}
                        aria-current={active ? "true" : undefined}
                      >
                        <span className="gg-next-index-disc" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        ) : (
          <aside id="gg-next-index-panel" className="gg-next-rail" aria-label="Session index">
            {canCollapseIndex ? (
              <div className="gg-next-rail-tools">
                <button
                  type="button"
                  className="gg-next-rail-toggle"
                  onClick={() => setIndexNavCollapsed(true)}
                  aria-expanded={true}
                  aria-controls="gg-next-index-panel"
                  title="Collapse index"
                >
                  <span className="gg-next-rail-toggle-icon" aria-hidden>
                    «
                  </span>
                  <span className="gg-next-sr-only">Collapse session index</span>
                </button>
              </div>
            ) : null}
            <div className="gg-next-plate gg-next-plate--rail">
              <div className="gg-next-plate-band" aria-hidden />
              <div className="gg-next-plate-inner">
                <p className="gg-next-plate-kicker">New session</p>
                <label className="gg-next-field">
                  <span className="gg-next-field-label">Seed</span>
                  <input
                    value={seedQuery}
                    onChange={(e) => setSeedQuery(e.target.value)}
                    placeholder="Artist, URL, question"
                    className="gg-next-input"
                  />
                </label>
                <button
                  type="button"
                  className="gg-next-cta"
                  onClick={() => void createSession()}
                  disabled={isBusy}
                >
                  {isBusy ? "Opening…" : "Open session"}
                </button>
              </div>
            </div>
            <details className="gg-next-index-past">
              <summary className="gg-next-index-past-summary">
                <span className="gg-next-index-past-label">Past sessions</span>
                <span className="gg-next-badge">{sessions.length}</span>
              </summary>
              <ul className="gg-next-index-list" aria-label="Past sessions">
                {sessions.length === 0 ? (
                  <li className="gg-next-index-empty">
                    <EmptyState className="gg-next-empty" text="No sessions yet." />
                  </li>
                ) : (
                  sessions.map((session) => {
                    const active = selectedSessionId === session.id;
                    return (
                      <li key={session.id}>
                        <button
                          type="button"
                          className={`gg-next-index-item${active ? " gg-next-index-item--active" : ""}`}
                          onClick={() => setSelectedSessionId(session.id)}
                        >
                          <span className="gg-next-index-disc" aria-hidden />
                          <span className="gg-next-index-copy">
                            <span className="gg-next-index-title">{session.title}</span>
                            <span className="gg-next-index-meta">{formatTimestamp(session.updatedAt)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </details>
          </aside>
        )}

        <div className="gg-next-corridor gg-next-corridor--discovery">
          <section className="gg-next-plate gg-next-plate--hero">
            <div
              className="gg-next-plate-band gg-next-plate-band--module"
              style={{ background: "var(--orange-route)" }}
              aria-hidden
            />
            <div className="gg-next-plate-inner gg-next-plate-inner--grow">
              <div className="gg-next-plate-heading">
                <p className="gg-next-plate-kicker">Primary module</p>
                <h2 className="gg-next-plate-title">Investigation</h2>
              </div>
              {selectedSession ? (
                <>
                  <div className="gg-next-stream">
                    {selectedSession.messages.length === 0 ? (
                      <EmptyState
                        className="gg-next-empty"
                        text="Send a message to start the investigation."
                      />
                    ) : (
                      selectedSession.messages.map((entry) => (
                        <article
                          key={entry.id}
                          ref={
                            entry.id === latestAssistantMessageId && entry.role === "assistant"
                              ? latestAssistantMessageRef
                              : undefined
                          }
                          className={`gg-next-bubble gg-next-bubble--${entry.role}`}
                        >
                          <div className="gg-next-bubble-head">
                            <span className="gg-next-bubble-role">{entry.role}</span>
                            <time className="gg-next-bubble-time">{formatTimestamp(entry.createdAt)}</time>
                          </div>
                          <MarkdownMessage content={entry.content} />
                        </article>
                      ))
                    )}
                  </div>
                  <div className="gg-next-platform">
                    <label className="gg-next-field">
                      <span className="gg-next-field-label">Compose turn</span>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Discovery question, refinement, or evidence request."
                        rows={3}
                        className="gg-next-textarea"
                      />
                    </label>
                    <button
                      type="button"
                      className="gg-next-cta"
                      onClick={() => void sendTurn()}
                      disabled={isBusy}
                    >
                      {isBusy ? "Running…" : "Send turn"}
                    </button>
                  </div>
                </>
              ) : (
                <EmptyState
                  className="gg-next-empty"
                  text="Select or open a session to use the investigation module."
                />
              )}
            </div>
          </section>

          <section className="gg-next-plate gg-next-plate--evidence">
            <div
              className="gg-next-plate-band gg-next-plate-band--module"
              style={{ background: "var(--blue-route)" }}
              aria-hidden
            />
            <div className="gg-next-plate-inner gg-next-plate-inner--grow">
              <div className="gg-next-plate-heading">
                <p className="gg-next-plate-kicker">Informational support</p>
                <h2 className="gg-next-plate-title">Evidence</h2>
              </div>
              <div className="gg-next-evidence-stack">
                <EvidenceCollapsibleSection
                  sectionId="evidence-field-notes"
                  title="Field notes"
                  count={selectedSession?.notes.length ?? 0}
                  open={evidenceFieldNotesOpen}
                  onToggle={() => setEvidenceFieldNotesOpen((v) => !v)}
                >
                  {selectedSession?.notes.length ? (
                    <ul className="gg-next-notes">
                      {selectedSession.notes.map((note, index) => (
                        <li key={`${note}-${index}`}>{note}</li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState className="gg-next-empty" text="Notes appear as the model records them." />
                  )}
                </EvidenceCollapsibleSection>
                <EvidenceCollapsibleSection
                  sectionId="evidence-sources"
                  title="Sources"
                  count={selectedSession?.sources.length ?? 0}
                  open={evidenceSourcesOpen}
                  onToggle={() => setEvidenceSourcesOpen((v) => !v)}
                >
                  {selectedSession?.sources.length ? (
                    <div className="gg-next-source-stack">
                      {selectedSession.sources.map((source) => (
                        <article key={source.id} className="gg-next-source-card">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="support-source-title"
                          >
                            {source.title}
                          </a>
                          <p className="support-source-url">{source.url}</p>
                          {source.citationText ? (
                            <p className="support-source-citation">{source.citationText}</p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      className="gg-next-empty"
                      text="Cited sources appear after web search."
                    />
                  )}
                </EvidenceCollapsibleSection>
              </div>
            </div>
          </section>
        </div>

        {!isNarrowWorkspaceLayout ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize split"
            tabIndex={-1}
            className={`gg-next-split${isMainGridResizing ? " gg-next-split--active" : ""}`}
            onPointerDown={beginMainGridResize}
          >
            <span className="gg-next-split-cap" aria-hidden />
            <span className="gg-next-split-ring" aria-hidden />
            <span className="gg-next-split-cap" aria-hidden />
            <span className="gg-next-split-tag">Split</span>
          </div>
        ) : null}

        <div className="gg-next-corridor gg-next-corridor--review">
          <section className="gg-next-plate">
            <div
              className="gg-next-plate-band gg-next-plate-band--module"
              style={{ background: "var(--magenta-route)" }}
              aria-hidden
            />
            <div className="gg-next-plate-inner">
              <div className="gg-next-plate-heading">
                <p className="gg-next-plate-kicker">Decision</p>
                <h2 className="gg-next-plate-title">Graph review</h2>
                {selectedSession ? (
                  <div className="gg-next-graph-sync">
                    <label className="gg-next-graph-sync-deferred">
                      <input
                        type="checkbox"
                        checked={includeDeferredInGraphSync}
                        onChange={(event) => setIncludeDeferredInGraphSync(event.target.checked)}
                        disabled={isGraphSyncing || isBusy}
                      />
                      <span>Include deferred</span>
                    </label>
                    <button
                      type="button"
                      className="gg-next-cta gg-next-cta--secondary"
                      disabled={isGraphSyncing || isBusy}
                      onClick={() =>
                        void syncSessionToNeo4j({ includeDeferred: includeDeferredInGraphSync })
                      }
                    >
                      {isGraphSyncing ? "Syncing…" : "Sync to graph"}
                    </button>
                  </div>
                ) : null}
              </div>
              {selectedSession ? (
                <div className="gg-next-review-stack">
                  {tripletCandidates.length ? (
                    tripletCandidates.map(({ relationship, sourceEntity, targetEntity }) => {
                      const isEditingTriplet = tripletEditDraft?.relationshipId === relationship.id;
                      const isSavingTriplet = savingTripletId === relationship.id;
                      const sourceDisplay = sourceEntity
                        ? sourceEntity.displayName
                        : `Missing source (${relationship.sourceEntityId})`;
                      const sourceKind = sourceEntity?.provisionalKind ?? "Unresolved entity";
                      const targetDisplay = targetEntity
                        ? targetEntity.displayName
                        : `Missing object (${relationship.targetEntityId})`;
                      const targetKind = targetEntity?.provisionalKind ?? "Unresolved entity";
                      const relationshipVerb = isEditingTriplet
                        ? tripletEditDraft?.relationshipVerb || "related to"
                        : relationship.verb;

                      return (
                        <article key={relationship.id} className="gg-next-triplet">
                          <div className="triplet-card-header">
                            <StatusBar status={relationship.status} />
                            <span className="review-confidence-label">
                              confidence: {relationship.confidence}
                            </span>
                          </div>
                          <div className="triplet-proposition">
                            <TripletEntitySummary
                              align="start"
                              displayName={sourceDisplay}
                              kind={sourceKind}
                              entity={sourceEntity}
                              danglingId={relationship.sourceEntityId}
                              isEditing={isEditingTriplet}
                              editDraft={isEditingTriplet ? tripletEditDraft?.sourceEntity ?? null : null}
                              kindOptions={availableKindLabels}
                              onUpdateDraft={(field, value) =>
                                updateTripletEntityDraft(relationship.id, "sourceEntity", field, value)
                              }
                              onUpdateAlias={(aliasIndex, value) =>
                                updateTripletEntityAlias(relationship.id, "sourceEntity", aliasIndex, value)
                              }
                              onAddAlias={(value) =>
                                addTripletEntityAlias(relationship.id, "sourceEntity", value)
                              }
                              onRemoveAlias={(aliasIndex) =>
                                removeTripletEntityAlias(relationship.id, "sourceEntity", aliasIndex)
                              }
                            />
                            {isEditingTriplet ? (
                              <input
                                value={tripletEditDraft?.relationshipVerb ?? relationship.verb}
                                onChange={(event) =>
                                  setTripletEditDraft((current) =>
                                    current?.relationshipId === relationship.id
                                      ? { ...current, relationshipVerb: event.target.value }
                                      : current,
                                  )
                                }
                                disabled={isSavingTriplet}
                                className="triplet-verb triplet-inline-input triplet-inline-verb-input"
                                aria-label="Relationship verb"
                              />
                            ) : (
                              <span className="triplet-verb">{relationshipVerb}</span>
                            )}
                            <TripletEntitySummary
                              align="end"
                              displayName={targetDisplay}
                              kind={targetKind}
                              entity={targetEntity}
                              danglingId={relationship.targetEntityId}
                              isEditing={isEditingTriplet}
                              editDraft={isEditingTriplet ? tripletEditDraft?.targetEntity ?? null : null}
                              kindOptions={availableKindLabels}
                              onUpdateDraft={(field, value) =>
                                updateTripletEntityDraft(relationship.id, "targetEntity", field, value)
                              }
                              onUpdateAlias={(aliasIndex, value) =>
                                updateTripletEntityAlias(relationship.id, "targetEntity", aliasIndex, value)
                              }
                              onAddAlias={(value) =>
                                addTripletEntityAlias(relationship.id, "targetEntity", value)
                              }
                              onRemoveAlias={(aliasIndex) =>
                                removeTripletEntityAlias(relationship.id, "targetEntity", aliasIndex)
                              }
                            />
                          </div>
                          <div className="triplet-action-row">
                            <DecisionRow
                              compact
                              onDecision={(decision) =>
                                void recordDecision({
                                  itemType: "relationship",
                                  itemId: relationship.id,
                                  decision,
                                })
                              }
                            />
                            {isEditingTriplet ? (
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <MiniAction
                                  compact
                                  label={isSavingTriplet ? "Saving…" : "Save"}
                                  variant="primary"
                                  disabled={isSavingTriplet}
                                  onClick={() => void saveTripletEdit(relationship.id)}
                                />
                                <MiniAction
                                  compact
                                  label="Cancel"
                                  variant="neutral"
                                  disabled={isSavingTriplet}
                                  onClick={() => setTripletEditDraft(null)}
                                />
                              </div>
                            ) : (
                              <MiniAction
                                compact
                                label="Edit"
                                variant="link"
                                disabled={Boolean(savingTripletId)}
                                onClick={() => beginTripletEdit(relationship, sourceEntity, targetEntity)}
                              />
                            )}
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <EmptyState className="gg-next-empty" text="No relationship triplets yet." />
                  )}
                </div>
              ) : (
                <EmptyState
                  className="gg-next-empty"
                  text="Select a session to review provisional graph artifacts."
                />
              )}
            </div>
          </section>

          <section className="gg-next-plate gg-next-plate--claims">
            <div
              className="gg-next-plate-band gg-next-plate-band--module"
              style={{ background: "var(--yellow-route)" }}
              aria-hidden
            />
            <div className="gg-next-plate-inner gg-next-plate-inner--grow">
              <div className="gg-next-plate-heading">
                <p className="gg-next-plate-kicker">Supporting review</p>
                <h2 className="gg-next-plate-title">Claims</h2>
              </div>
              {selectedSession?.claims.length ? (
                <div className="claims-review-list">
                  {selectedSession.claims.map((claim) => (
                    <article key={claim.id} className="claim-review-card">
                      <strong>{claim.text}</strong>
                      <StatusBar status={claim.status} detail={`confidence: ${claim.confidence}`} />
                      <DecisionRow
                        onDecision={(decision) =>
                          void recordDecision({
                            itemType: "claim",
                            itemId: claim.id,
                            decision,
                          })
                        }
                      />
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="gg-next-empty"
                  text="Structured claims from the session appear here."
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/** Evidence plate: one stacked section (Field notes or Sources). Spec: docs/product/RESEARCH_WORKBENCH_PRD.md Phase 1 §6–7. */
function EvidenceCollapsibleSection({
  sectionId,
  title,
  count,
  open,
  onToggle,
  children,
}: {
  sectionId: string;
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const headerId = `${sectionId}-header`;
  const panelId = `${sectionId}-panel`;
  return (
    <div className={`gg-next-evidence-section${open ? " gg-next-evidence-section--open" : ""}`}>
      <button
        type="button"
        id={headerId}
        className="gg-next-evidence-section-header"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="gg-next-evidence-section-chevron" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="gg-next-evidence-section-title">{title}</span>
        <span className="gg-next-badge">{count}</span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="gg-next-evidence-panel-scroll"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
