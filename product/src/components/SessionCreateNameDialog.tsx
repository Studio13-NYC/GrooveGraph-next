"use client";

import { useEffect, useId, useRef } from "react";
import styles from "./SessionCreateNameDialog.module.css";

export type SessionCreateNameDialogMode = "name-only" | "prompt-and-name";

export type SessionCreateNameDialogProps = {
  open: boolean;
  mode: SessionCreateNameDialogMode;
  /** When `mode` is `prompt-and-name`, the starting prompt draft. */
  promptValue?: string;
  onPromptChange?: (value: string) => void;
  nameValue: string;
  onNameChange: (value: string) => void;
  suggestBusy?: boolean;
  confirmBusy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  /** Visual theme for pages that use a light shell. */
  variant?: "dark" | "light";
};

export function SessionCreateNameDialog({
  open,
  mode,
  promptValue = "",
  onPromptChange,
  nameValue,
  onNameChange,
  suggestBusy = false,
  confirmBusy = false,
  error = null,
  onCancel,
  onConfirm,
  variant = "dark",
}: SessionCreateNameDialogProps) {
  const titleId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const t = window.setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  const dialogClass =
    variant === "light" ? `${styles.dialog} ${styles.dialogLight}` : styles.dialog;

  const canConfirm =
    mode === "name-only"
      ? nameValue.trim().length > 0
      : promptValue.trim().length > 0 && nameValue.trim().length > 0;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={dialogClass}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            Name this session
          </h2>
        </div>
        <div className={styles.body}>
          {mode === "prompt-and-name" && onPromptChange ? (
            <div className={styles.field}>
              <label htmlFor="gg-session-create-prompt" className={styles.label}>
                Starting prompt
              </label>
              <textarea
                id="gg-session-create-prompt"
                className={styles.textarea}
                value={promptValue}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="What do you want to explore?"
                disabled={confirmBusy}
                rows={4}
              />
            </div>
          ) : null}
          <div className={styles.field}>
            <label htmlFor="gg-session-create-name" className={styles.label}>
              Session name
              {suggestBusy ? (
                <span className={styles.hint} aria-live="polite">
                  {" "}
                  (suggesting…)
                </span>
              ) : null}
            </label>
            <input
              ref={nameInputRef}
              id="gg-session-create-name"
              type="text"
              className={styles.input}
              value={nameValue}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Short label for your history"
              disabled={confirmBusy}
              maxLength={220}
              autoComplete="off"
            />
          </div>
          {mode === "name-only" ? (
            <p className={styles.hint}>
              You can accept the suggested name or edit it before the session is created.
            </p>
          ) : (
            <p className={styles.hint}>
              The name updates from your prompt while you type; edit it anytime before creating.
            </p>
          )}
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onCancel}
            disabled={confirmBusy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={onConfirm}
            disabled={confirmBusy || !canConfirm}
          >
            {confirmBusy ? "Creating…" : "Create session"}
          </button>
        </div>
      </div>
    </div>
  );
}
