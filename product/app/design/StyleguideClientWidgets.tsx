"use client";

import { useState } from "react";
import {
  DecisionRow,
  MiniAction,
} from "@/src/components/research-workbench-widgets";

export function StyleguideMiniActionRow() {
  const log = (label: string) => {
    if (typeof window !== "undefined" && window.console) {
      console.info(`[styleguide] ${label}`);
    }
  };

  return (
    <div
      className="gg-sg-card"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        alignItems: "center",
      }}
    >
      <MiniAction label="Accept" variant="accept" onClick={() => log("accept")} />
      <MiniAction label="Defer" variant="defer" onClick={() => log("defer")} />
      <MiniAction label="Reject" variant="reject" onClick={() => log("reject")} />
      <MiniAction label="Link" variant="link" onClick={() => log("link")} />
      <MiniAction label="Neutral" variant="neutral" onClick={() => log("neutral")} />
      <MiniAction label="Primary" variant="primary" onClick={() => log("primary")} />
    </div>
  );
}

export function StyleguideDecisionRow() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <div className="gg-sg-type-stack">
      <DecisionRow
        onDecision={(decision) => {
          setLast(decision);
          if (typeof window !== "undefined" && window.console) {
            console.info("[styleguide] decision", decision);
          }
        }}
      />
      <p className="gg-sg-swatch-caption" style={{ margin: 0 }}>
        Last choice (local state): {last ?? "—"}
      </p>
    </div>
  );
}
