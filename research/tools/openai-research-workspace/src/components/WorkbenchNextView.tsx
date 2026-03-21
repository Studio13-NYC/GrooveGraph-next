"use client";

import type { Ref } from "react";
import Link from "next/link";
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

export function WorkbenchNextView({ model }: { model: ResearchWorkbenchModel }) {
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
  } = model;

  const directionalLine = selectedSession
    ? `Active line: ${selectedSession.title} · Updated ${formatTimestamp(selectedSession.updatedAt)}`
    : "Directional: select an existing session or open a new line to begin.";

  return (
    <main className="gg-next-root">
      <header className="gg-next-masthead">
        <div className="gg-next-masthead-band" aria-hidden />
        <div className="gg-next-masthead-grid">
          <div className="gg-next-masthead-id">
            <p className="gg-next-kicker">Identification</p>
            <h1 className="gg-next-product">GrooveGraph</h1>
            <p className="gg-next-regime">Research operations · Next regime</p>
          </div>
          <p className="gg-next-directional">{directionalLine}</p>
          <Link className="gg-next-classic-link" href="/classic">
            Classic workspace
          </Link>
        </div>
      </header>

      {error ? <div className="gg-next-alert">{error}</div> : null}

      <figure className="gg-next-schematic" aria-label="Workflow schematic">
        <svg viewBox="0 0 720 56" className="gg-next-schematic-svg" role="img">
          <title>Session to claims flow</title>
          <path
            d="M 24 40 L 120 40 L 152 8 L 280 8 L 312 40 L 400 40 L 432 8 L 560 8 L 592 40 L 696 40"
            fill="none"
            stroke="var(--gg-ink)"
            strokeWidth="var(--gg-route-stroke-hairline)"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.45"
          />
          <circle cx="24" cy="40" r="5" fill="var(--paper)" stroke="var(--gg-ink)" strokeWidth="2" />
          <circle cx="360" cy="40" r="6" fill="var(--paper)" stroke="var(--gg-route-orange)" strokeWidth="3" />
          <circle cx="696" cy="40" r="5" fill="var(--paper)" stroke="var(--gg-ink)" strokeWidth="2" />
          <text x="12" y="52" className="gg-next-sch-label">
            Session
          </text>
          <text x="248" y="52" className="gg-next-sch-label">
            Investigate
          </text>
          <text x="328" y="52" className="gg-next-sch-label">
            Interchange
          </text>
          <text x="520" y="52" className="gg-next-sch-label">
            Review
          </text>
        </svg>
      </figure>

      <div
        className="gg-next-body"
        ref={mainGridRef as Ref<HTMLDivElement>}
        style={{
          display: "grid",
          gridTemplateColumns: isNarrowWorkspaceLayout
            ? "minmax(0, 1fr)"
            : `minmax(260px, 0.28fr) minmax(0, ${leftColumnFraction}fr) 12px minmax(0, ${1 - leftColumnFraction}fr)`,
          gap: isNarrowWorkspaceLayout ? "16px" : "0 12px",
          alignItems: "stretch",
        }}
      >
        <aside className="gg-next-rail" aria-label="Session lines">
          <div className="gg-next-plate gg-next-plate--rail">
            <div className="gg-next-plate-band" aria-hidden />
            <div className="gg-next-plate-inner">
              <p className="gg-next-plate-kicker">New line</p>
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
                {isBusy ? "Opening…" : "Open route"}
              </button>
            </div>
          </div>
          <ul className="gg-next-line-list">
            {sessions.length === 0 ? (
              <li className="gg-next-line-empty">
                <EmptyState className="gg-next-empty" text="No lines yet." />
              </li>
            ) : (
              sessions.map((session) => {
                const active = selectedSessionId === session.id;
                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      className={`gg-next-line-stop${active ? " gg-next-line-stop--active" : ""}`}
                      onClick={() => setSelectedSessionId(session.id)}
                    >
                      <span className="gg-next-line-dot" aria-hidden />
                      <span className="gg-next-line-copy">
                        <span className="gg-next-line-title">{session.title}</span>
                        <span className="gg-next-line-meta">{formatTimestamp(session.updatedAt)}</span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        <div className="gg-next-corridor gg-next-corridor--discovery">
          <section className="gg-next-plate gg-next-plate--hero">
            <div
              className="gg-next-plate-band gg-next-plate-band--route"
              style={{ background: "var(--orange-route)" }}
              aria-hidden
            />
            <div className="gg-next-plate-inner gg-next-plate-inner--grow">
              <div className="gg-next-plate-heading">
                <p className="gg-next-plate-kicker">Research route</p>
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
                  text="Select or open a line to enter the investigation corridor."
                />
              )}
            </div>
          </section>

          <section className="gg-next-plate">
            <div
              className="gg-next-plate-band gg-next-plate-band--route"
              style={{ background: "var(--blue-route)" }}
              aria-hidden
            />
            <div className="gg-next-plate-inner">
              <div className="gg-next-plate-heading">
                <p className="gg-next-plate-kicker">Informational support</p>
                <h2 className="gg-next-plate-title">Evidence</h2>
              </div>
              <div className="gg-next-evidence-grid">
                <div className="gg-next-evidence-cell">
                  <div className="gg-next-evidence-head">
                    <span>Field notes</span>
                    <span className="gg-next-badge">{selectedSession?.notes.length ?? 0}</span>
                  </div>
                  {selectedSession?.notes.length ? (
                    <ul className="gg-next-notes">
                      {selectedSession.notes.map((note, index) => (
                        <li key={`${note}-${index}`}>{note}</li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState className="gg-next-empty" text="Notes appear as the model records them." />
                  )}
                </div>
                <div className="gg-next-evidence-cell">
                  <details className="gg-next-sources">
                    <summary className="gg-next-sources-summary">
                      <span>Sources</span>
                      <span className="gg-next-badge">{selectedSession?.sources.length ?? 0}</span>
                    </summary>
                    <div className="gg-next-sources-body">
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
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </section>
        </div>

        {!isNarrowWorkspaceLayout ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize corridors"
            tabIndex={-1}
            className={`gg-next-interchange${isMainGridResizing ? " gg-next-interchange--active" : ""}`}
            onPointerDown={beginMainGridResize}
          >
            <span className="gg-next-interchange-cap" aria-hidden />
            <span className="gg-next-interchange-ring" aria-hidden />
            <span className="gg-next-interchange-cap" aria-hidden />
            <span className="gg-next-interchange-tag">Transfer</span>
          </div>
        ) : null}

        <div className="gg-next-corridor gg-next-corridor--review">
          <section className="gg-next-plate">
            <div
              className="gg-next-plate-band gg-next-plate-band--route"
              style={{ background: "var(--magenta-route)" }}
              aria-hidden
            />
            <div className="gg-next-plate-inner">
              <div className="gg-next-plate-heading">
                <p className="gg-next-plate-kicker">Decision route</p>
                <h2 className="gg-next-plate-title">Graph review</h2>
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
                  text="Select a line to review provisional graph artifacts."
                />
              )}
            </div>
          </section>

          <section className="gg-next-plate">
            <div
              className="gg-next-plate-band gg-next-plate-band--route"
              style={{ background: "var(--yellow-route)" }}
              aria-hidden
            />
            <div className="gg-next-plate-inner">
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
