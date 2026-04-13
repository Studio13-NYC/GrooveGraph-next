"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KindFamily } from "@/src/lib/workbench-viz/graph-viz-styles";
import { KIND_FILTER_KEYS } from "@/src/lib/workbench-viz/graph-viz-styles";
import type { AtlasSchemaKind } from "@/src/types/atlas-lineage";
import {
  ATLAS_DEMO_KIND_OPTIONS,
  ATLAS_DEMO_SELECTABLE_KINDS,
  ATLAS_SESSION_KIND_OPTIONS,
} from "./atlas-lineage-demo-data";

export type AtlasKindMultiselectVariant = "demo" | "live";

const LIVE_UNIVERSE = KIND_FILTER_KEYS as readonly KindFamily[];

function labelForKind(variant: AtlasKindMultiselectVariant, k: AtlasSchemaKind): string {
  if (variant === "demo") {
    return ATLAS_DEMO_KIND_OPTIONS.find((o) => o.value === k)?.label ?? String(k);
  }
  return ATLAS_SESSION_KIND_OPTIONS.find((o) => o.value === k)?.label ?? String(k);
}

function summaryText(variant: AtlasKindMultiselectVariant, kinds: readonly AtlasSchemaKind[]): string {
  if (kinds.length === 0) {
    return "All types";
  }
  const labels = kinds.map((k) => labelForKind(variant, k));
  if (labels.length <= 2) {
    return labels.join(", ");
  }
  return `${kinds.length} types`;
}

export type AtlasKindMultiselectProps = {
  variant: AtlasKindMultiselectVariant;
  value: readonly AtlasSchemaKind[];
  onChange: (next: AtlasSchemaKind[]) => void;
  "aria-labelledby"?: string;
  /**
   * **Atlas lineage:** pass this prop to drive the list only from TypeDB/viz data (distinct `KindFamily` from node subtitles).
   * - `null`: graph not loaded yet → **no** type rows (panel is empty except “All types”).
   * - `[]`: graph loaded with no nodes (or no resolvable kinds) → same empty list.
   * - Non-empty: one checkbox per kind from the graph.
   *
   * **When this prop is omitted:** the legacy static lists apply — demo uses {@link ATLAS_DEMO_SELECTABLE_KINDS};
   * live uses `KIND_FILTER_KEYS` from `@/src/lib/workbench-viz/graph-viz-styles` (People, Recordings, …).
   */
  kindFamiliesFromGraph?: readonly KindFamily[] | null;
};

function capitalizeKindLabel(k: string): string {
  if (!k) return k;
  return k.charAt(0).toUpperCase() + k.slice(1);
}

export function AtlasKindMultiselect({
  variant,
  value,
  onChange,
  "aria-labelledby": ariaLabelledBy,
  kindFamiliesFromGraph,
}: AtlasKindMultiselectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDocPointer, true);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const graphKindFilter = kindFamiliesFromGraph !== undefined;
  const universe: readonly KindFamily[] | readonly (typeof ATLAS_DEMO_SELECTABLE_KINDS)[number][] = graphKindFilter
    ? (kindFamiliesFromGraph ?? [])
    : variant === "demo"
      ? ATLAS_DEMO_SELECTABLE_KINDS
      : LIVE_UNIVERSE;

  const toggle = useCallback(
    (k: AtlasSchemaKind) => {
      const has = value.includes(k);
      let next: AtlasSchemaKind[] = has ? value.filter((x) => x !== k) : [...value, k];
      const set = new Set(next);
      if (universe.length > 0 && universe.every((u) => set.has(u))) {
        next = [];
      }
      onChange(next);
    },
    [onChange, universe, value],
  );

  const rows =
    variant === "demo"
      ? ATLAS_DEMO_SELECTABLE_KINDS.map((k) => ({ key: k, kind: k as AtlasSchemaKind, label: labelForKind("demo", k) }))
      : (universe as readonly KindFamily[]).map((k) => ({
          key: k,
          kind: k as AtlasSchemaKind,
          label: graphKindFilter ? capitalizeKindLabel(k) : labelForKind("live", k),
        }));

  return (
    <div ref={rootRef} className="gg-atlas-lineage__kind-filter" aria-labelledby={ariaLabelledBy}>
      <button
        type="button"
        className="gg-atlas-lineage__kind-filter-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="gg-atlas-lineage__kind-filter-trigger-label">{summaryText(variant, value)}</span>
        <span className="gg-atlas-lineage__kind-filter-chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div id={listId} className="gg-atlas-lineage__kind-filter-panel" role="group" aria-label="Entity types">
          <div className="gg-atlas-lineage__kind-filter-actions">
            <button type="button" className="gg-atlas-lineage__kind-filter-link" onClick={() => onChange([])}>
              All types
            </button>
          </div>
          {rows.map(({ key, kind, label }) => {
            const selected = value.includes(kind);
            return (
              <label key={key} className="gg-atlas-lineage__kind-filter-row">
                <input
                  type="checkbox"
                  className="gg-atlas-lineage__kind-filter-check"
                  checked={selected}
                  onChange={() => toggle(kind)}
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
