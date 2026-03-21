"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { EntityCandidate } from "@/src/types/research-session";
import type { EntityEditDraft } from "./research-workbench-model";

export function LaneSection({
  label,
  title,
  railColor,
  children,
}: {
  label: string;
  title: string;
  railColor: string;
  children: ReactNode;
}) {
  return (
    <section
      className="lane-section"
      style={{ "--lane-color": railColor } as CSSProperties}
    >
      <div className="lane-section-header">
        <div className="lane-section-copy">
          <span className="lane-section-kicker">{label}</span>
          <h2 className="lane-section-title">{title}</h2>
        </div>
      </div>
      <div className="lane-section-body">{children}</div>
    </section>
  );
}

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="markdown-message">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export function EmptyState({ text, className }: { text: string; className?: string }) {
  return (
    <p
      className={className}
      style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}
    >
      {text}
    </p>
  );
}

export function DecisionRow({
  onDecision,
  compact = false,
}: {
  onDecision: (decision: "accepted" | "rejected" | "deferred") => void;
  compact?: boolean;
}) {
  return (
    <div className="decision-row">
      <MiniAction
        compact={compact}
        label="Accept"
        variant="accept"
        onClick={() => onDecision("accepted")}
      />
      <MiniAction
        compact={compact}
        label="Defer"
        variant="defer"
        onClick={() => onDecision("deferred")}
      />
      <MiniAction
        compact={compact}
        label="Reject"
        variant="reject"
        onClick={() => onDecision("rejected")}
      />
    </div>
  );
}

export function MiniAction({
  label,
  variant,
  onClick,
  compact = false,
  disabled = false,
}: {
  label: string;
  variant: "accept" | "defer" | "reject" | "link" | "neutral" | "primary";
  onClick: () => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={`mini-action mini-action-${variant}${compact ? " mini-action-compact" : ""}`}
    >
      {label}
    </button>
  );
}

export function StatusBar({
  status,
  detail,
}: {
  status: string;
  detail?: string;
}) {
  const statusClass =
    status === "accepted"
      ? "status-bar-accepted"
      : status === "rejected"
        ? "status-bar-rejected"
        : status === "deferred"
          ? "status-bar-deferred"
          : "status-bar-proposed";

  return (
    <div className={`status-bar ${statusClass}`}>
      <span aria-hidden className="status-bar-rail" />
      <span className="status-bar-label">{status}</span>
      {detail ? <span className="status-bar-detail">{detail}</span> : null}
    </div>
  );
}

export function TripletEntitySummary({
  displayName,
  kind,
  entity,
  danglingId,
  align,
  isEditing = false,
  editDraft = null,
  kindOptions,
  onUpdateDraft,
  onUpdateAlias,
  onAddAlias,
  onRemoveAlias,
}: {
  displayName: string;
  kind: string;
  entity: EntityCandidate | null;
  danglingId: string;
  align: "start" | "end";
  isEditing?: boolean;
  editDraft?: EntityEditDraft | null;
  kindOptions: string[];
  onUpdateDraft?: (field: "displayName" | "provisionalKind", value: string) => void;
  onUpdateAlias?: (aliasIndex: number, value: string) => void;
  onAddAlias?: (value: string) => void;
  onRemoveAlias?: (aliasIndex: number) => void;
}) {
  const kindListId = useId();
  const [nextAlias, setNextAlias] = useState("");

  function handleAddAlias() {
    if (!nextAlias.trim()) {
      return;
    }
    onAddAlias?.(nextAlias);
    setNextAlias("");
  }

  return (
    <div className={`triplet-entity-summary triplet-entity-summary-${align}`}>
      {isEditing && editDraft ? (
        <>
          <input
            value={editDraft.displayName}
            onChange={(event) => onUpdateDraft?.("displayName", event.target.value)}
            className="triplet-entity-name triplet-inline-input"
            aria-label={`${align === "start" ? "Subject" : "Object"} name`}
          />
          <input
            value={editDraft.provisionalKind}
            onChange={(event) => onUpdateDraft?.("provisionalKind", event.target.value)}
            className="triplet-entity-kind triplet-inline-input"
            list={kindListId}
            aria-label={`${align === "start" ? "Subject" : "Object"} kind`}
          />
          <datalist id={kindListId}>
            {kindOptions.map((kindOption) => (
              <option key={`${kindListId}-${kindOption}`} value={kindOption} />
            ))}
          </datalist>
          <div className="triplet-alias-editor">
            <p className="triplet-alias-label">Aliases</p>
            {editDraft.aliases.length ? (
              <div className="triplet-alias-list">
                {editDraft.aliases.map((alias, aliasIndex) => (
                  <div className="triplet-alias-row" key={`${align}-${aliasIndex}`}>
                    <input
                      value={alias}
                      onChange={(event) => onUpdateAlias?.(aliasIndex, event.target.value)}
                      className="triplet-inline-input triplet-alias-input"
                      aria-label={`${align === "start" ? "Subject" : "Object"} alias ${aliasIndex + 1}`}
                    />
                    <button
                      type="button"
                      className="triplet-alias-remove"
                      onClick={() => onRemoveAlias?.(aliasIndex)}
                      aria-label={`Remove alias ${aliasIndex + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="triplet-alias-empty">No aliases yet.</p>
            )}
            <div className="triplet-alias-add-row">
              <input
                value={nextAlias}
                onChange={(event) => setNextAlias(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddAlias();
                  }
                }}
                className="triplet-inline-input triplet-alias-input"
                placeholder="Add alias"
                aria-label={`${align === "start" ? "Subject" : "Object"} alias input`}
              />
              <button
                type="button"
                className="triplet-alias-add"
                onClick={handleAddAlias}
                disabled={!nextAlias.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <p
            className={
              entity ? "triplet-entity-name" : "triplet-entity-name triplet-entity-name-dangling"
            }
          >
            {displayName}
          </p>
          <p className="triplet-entity-kind">{kind}</p>
        </>
      )}
      {entity ? (
        <details className="entity-aliases triplet-entity-aliases">
          <summary>
            {entity.aliases.length} alias{entity.aliases.length === 1 ? "" : "es"}
          </summary>
          {entity.aliases.length ? (
            <ul>
              {entity.aliases.map((alias) => (
                <li key={alias}>{alias}</li>
              ))}
            </ul>
          ) : (
            <p>No aliases captured yet.</p>
          )}
        </details>
      ) : (
        <p className="triplet-dangling-note">dangling id: {danglingId}</p>
      )}
    </div>
  );
}
