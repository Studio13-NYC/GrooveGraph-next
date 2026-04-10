import type { ReactNode } from "react";
import {
  EmptyState,
  MarkdownMessage,
  StatusBar,
  TripletEntitySummary,
} from "@/src/components/research-workbench-widgets";
import type { EntityCandidate } from "@/src/types/research-session";
import {
  StyleguideDecisionRow,
  StyleguideMiniActionRow,
} from "./StyleguideClientWidgets";

const MOCK_ENTITY: EntityCandidate = {
  id: "sg-entity-1",
  displayName: "North River Studio",
  provisionalKind: "Organization",
  aliases: ["NRS", "North River"],
  externalIds: [],
  attributes: {},
  evidenceSnippetIds: [],
  status: "proposed",
  createdAt: "2026-01-01T00:00:00.000Z",
};

/** Same path as approval / evidence chevrons in `GrooveGraphAppShell.tsx`. */
const STYLEGUIDE_CHEVRON_DOWN = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type SwatchShape = "rounded" | "circle" | "diamond";

function Swatch({
  className,
  label,
  shape = "rounded",
  children,
}: {
  className: string;
  label: string;
  shape?: SwatchShape;
  children?: ReactNode;
}) {
  const shapeClass =
    shape === "circle"
      ? "gg-sg-swatch--shape-circle"
      : shape === "diamond"
        ? "gg-sg-swatch--shape-diamond"
        : "";

  return (
    <div className="gg-sg-swatch-item">
      <div
        className={["gg-sg-swatch", shapeClass, className].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        {children}
      </div>
      <span className="gg-sg-swatch-caption">{label}</span>
    </div>
  );
}

function SwatchGrid({ children }: { children: ReactNode }) {
  return <div className="gg-sg-swatch-grid">{children}</div>;
}

export default function DesignStyleguidePage() {
  return (
    <main id="styleguide-main">
      <div className="gg-sg-page">
        <header className="gg-sg-section">
          <p className="gg-sg-type-grid-1" style={{ marginBlockEnd: "0.5rem" }}>
            GrooveGraph Next
          </p>
          <h1 style={{ margin: 0, fontSize: "var(--gg-type-grid-3)", lineHeight: 1.15 }}>
            GrooveGraph design system
          </h1>
          <p className="gg-sg-type-body" style={{ marginBlockStart: "0.75rem" }}>
            Practical reference for surfaces, type, strokes, and shared UI pieces used across the
            research workbench.
          </p>
        </header>

        <section className="gg-sg-section" aria-labelledby="sg-foundation-heading">
          <h2 id="sg-foundation-heading" className="gg-sg-section-title">
            Foundation
          </h2>
          <p className="gg-sg-type-body">
            Extended rationale, map grammar, and signage discipline are documented in the repo at{" "}
            <code>docs/VISUAL_STYLE_GUIDE.mdc</code>.
          </p>
        </section>

        <section className="gg-sg-section" aria-labelledby="sg-palette-heading">
          <h2 id="sg-palette-heading" className="gg-sg-section-title">
            Palette
          </h2>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "0 0 0.75rem" }}>
            Surface &amp; diagram ground
          </h3>
          <SwatchGrid>
            <Swatch className="gg-sg-swatch--surface-canvas" label="--gg-surface-canvas" />
            <Swatch className="gg-sg-swatch--surface-canvas-ink" label="--gg-surface-canvas-ink" />
            <Swatch className="gg-sg-swatch--map-land" label="--gg-map-land" />
            <Swatch className="gg-sg-swatch--map-water" label="--gg-map-water" />
            <Swatch className="gg-sg-swatch--map-park" label="--gg-map-park" />
          </SwatchGrid>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.5rem 0 0.75rem" }}>
            Ink &amp; slate
          </h3>
          <SwatchGrid>
            <Swatch className="gg-sg-swatch--ink" label="--gg-ink" />
            <Swatch className="gg-sg-swatch--slate" label="--gg-slate" />
          </SwatchGrid>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.5rem 0 0.75rem" }}>
            Route families
          </h3>
          <SwatchGrid>
            <Swatch className="gg-sg-swatch--route-red" label="--gg-route-red" />
            <Swatch className="gg-sg-swatch--route-green" label="--gg-route-green" />
            <Swatch className="gg-sg-swatch--route-blue" label="--gg-route-blue" />
            <Swatch className="gg-sg-swatch--route-orange" label="--gg-route-orange" />
            <Swatch className="gg-sg-swatch--route-yellow" label="--gg-route-yellow" />
            <Swatch className="gg-sg-swatch--route-brown" label="--gg-route-brown" />
            <Swatch className="gg-sg-swatch--route-gray" label="--gg-route-gray" />
            <Swatch className="gg-sg-swatch--route-purple" label="--gg-route-purple" />
            <Swatch className="gg-sg-swatch--route-lime" label="--gg-route-lime" />
          </SwatchGrid>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.5rem 0 0.75rem" }}>
            Sign system
          </h3>
          <SwatchGrid>
            <Swatch className="gg-sg-swatch--sign-panel" label="--gg-sign-panel" />
            <Swatch className="gg-sg-swatch--sign-band" label="--gg-sign-band" />
            <Swatch className="gg-sg-swatch--sign-exit-bg" label="--gg-sign-exit-bg" />
            <Swatch className="gg-sg-swatch--sign-exit-fg" label="--gg-sign-exit-fg" />
            <Swatch className="gg-sg-swatch--sign-transfer-bg" label="--gg-sign-transfer-bg" />
            <Swatch className="gg-sg-swatch--sign-transfer-fg" label="--gg-sign-transfer-fg" />
          </SwatchGrid>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.5rem 0 0.75rem" }}>
            Accent
          </h3>
          <SwatchGrid>
            <Swatch className="gg-sg-swatch--accent-directional" label="--gg-accent-directional" />
          </SwatchGrid>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.5rem 0 0.75rem" }}>
            Visualization families
          </h3>
          <p className="gg-sg-type-body" style={{ marginBlockEnd: "1rem" }}>
            Graph fills should lean on the saturated route hues first for separation at a glance.
            Brown, route grey, diagram park grey, slate, and ink are reserved for lower-salience
            roles or structural neutrals. Shape can reinforce category in legends (rounded tile,
            circle, diamond). For a green read, use{" "}
            <code style={{ fontSize: "0.9em" }}>--gg-route-lime</code> — not{" "}
            <code style={{ fontSize: "0.9em" }}>--gg-route-green</code> — so chroma stays
            distinct on screen.
          </p>

          <p className="gg-sg-viz-priority-note">Bright route hues — saturated set (lime, not green)</p>
          <div className="gg-sg-swatch-grid gg-sg-swatch-grid--viz-bright">
            <Swatch
              shape="rounded"
              className="gg-sg-swatch--route-yellow"
              label="--gg-route-yellow"
            />
            <Swatch
              shape="diamond"
              className="gg-sg-swatch--route-blue"
              label="--gg-route-blue"
            />
            <Swatch
              shape="circle"
              className="gg-sg-swatch--route-red"
              label="--gg-route-red"
            />
            <Swatch
              shape="circle"
              className="gg-sg-swatch--route-lime"
              label="--gg-route-lime"
            />
            <Swatch
              shape="rounded"
              className="gg-sg-swatch--route-orange"
              label="--gg-route-orange"
            />
            <Swatch
              shape="diamond"
              className="gg-sg-swatch--route-purple"
              label="--gg-route-purple"
            />
          </div>

          <p className="gg-sg-viz-priority-note gg-sg-viz-priority-note--secondary">
            KindFamily tokens — bright roles first
          </p>
          <SwatchGrid>
            <Swatch
              shape="circle"
              className="gg-sg-swatch--viz-labels"
              label="--gg-viz-family-labels → red"
            />
            <Swatch
              shape="rounded"
              className="gg-sg-swatch--viz-recordings"
              label="--gg-viz-family-recordings → yellow"
            />
            <Swatch
              shape="diamond"
              className="gg-sg-swatch--viz-studios"
              label="--gg-viz-family-studios → blue"
            />
            <Swatch
              shape="diamond"
              className="gg-sg-swatch--viz-genres"
              label="--gg-viz-family-genres → lime"
            />
            <Swatch
              shape="rounded"
              className="gg-sg-swatch--viz-gear"
              label="--gg-viz-family-gear → gray"
            />
            <Swatch
              shape="diamond"
              className="gg-sg-swatch--viz-people"
              label="--gg-viz-family-people → brown"
            />
            <Swatch
              shape="circle"
              className="gg-sg-swatch--viz-other"
              label="--gg-viz-family-other → slate"
            />
          </SwatchGrid>

          <p className="gg-sg-viz-priority-note gg-sg-viz-priority-note--secondary">
            Lower-salience &amp; neutrals — reserve
          </p>
          <SwatchGrid>
            <Swatch
              shape="rounded"
              className="gg-sg-swatch--route-green"
              label="--gg-route-green (prefer lime for viz)"
            />
            <Swatch shape="rounded" className="gg-sg-swatch--route-brown" label="--gg-route-brown" />
            <Swatch shape="rounded" className="gg-sg-swatch--route-gray" label="--gg-route-gray" />
            <Swatch shape="rounded" className="gg-sg-swatch--map-park" label="--gg-map-park" />
            <Swatch shape="rounded" className="gg-sg-swatch--slate" label="--gg-slate" />
            <Swatch shape="rounded" className="gg-sg-swatch--ink" label="--gg-ink" />
          </SwatchGrid>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.5rem 0 0.75rem" }}>
            On-dark label sample
          </h3>
          <SwatchGrid>
            <Swatch className="gg-sg-swatch--on-dark-label" label="--gg-on-dark-fg on band">
              Aa
            </Swatch>
          </SwatchGrid>
        </section>

        <section className="gg-sg-section" aria-labelledby="sg-type-heading">
          <h2 id="sg-type-heading" className="gg-sg-section-title">
            Typography
          </h2>
          <p className="gg-sg-type-body" style={{ marginBlockEnd: "1.25rem", maxWidth: "62ch" }}>
            Sizes and rhythm are token-driven in <code>nycta-groovegraph-tokens.css</code>. Use{" "}
            <strong style={{ color: "var(--gg-ink)" }}>ink</strong> for titles,{" "}
            <strong style={{ color: "var(--gg-slate)" }}>slate</strong> for supporting copy,{" "}
            <strong style={{ color: "var(--gg-route-blue)" }}>route blue</strong> for links, and{" "}
            <strong style={{ color: "var(--gg-accent-directional)" }}>accent orange</strong> only for
            directional / primary-action emphasis — not brown or neutral grey for hierarchy.
          </p>

          <div className="gg-sg-type-hero-specimen">
            <p className="gg-sg-type-hero-specimen__label">Display specimen</p>
            <p className="gg-sg-type-hero-specimen__sample">GrooveGraph</p>
            <p className="gg-sg-type-hero-specimen__latin">
              The quick brown fox jumps over the lazy dog — grid-2 at comfortable measure.
            </p>
          </div>

          <div
            className="gg-sg-type-ramp"
            role="group"
            aria-labelledby="sg-type-ramp-label"
          >
            <p id="sg-type-ramp-label" className="gg-sg-type-ramp-title">
              Relative scale
            </p>
            <div className="gg-sg-type-ramp-row">
              <span className="gg-sg-swatch-caption" style={{ margin: 0 }}>
                Grid 1
              </span>
              <div className="gg-sg-type-ramp-bar-wrap">
                <div className="gg-sg-type-ramp-bar gg-sg-type-ramp-bar--1" />
              </div>
              <span className="gg-sg-type-ramp-meta">label track</span>
            </div>
            <div className="gg-sg-type-ramp-row">
              <span className="gg-sg-swatch-caption" style={{ margin: 0 }}>
                Grid 2
              </span>
              <div className="gg-sg-type-ramp-bar-wrap">
                <div className="gg-sg-type-ramp-bar gg-sg-type-ramp-bar--2" />
              </div>
              <span className="gg-sg-type-ramp-meta">body / UI</span>
            </div>
            <div className="gg-sg-type-ramp-row">
              <span className="gg-sg-swatch-caption" style={{ margin: 0 }}>
                Grid 3
              </span>
              <div className="gg-sg-type-ramp-bar-wrap">
                <div className="gg-sg-type-ramp-bar gg-sg-type-ramp-bar--3" />
              </div>
              <span className="gg-sg-type-ramp-meta">display</span>
            </div>
          </div>

          <div className="gg-sg-type-specimen-grid">
            <div className="gg-sg-type-specimen gg-sg-type-specimen--label">
              <p className="gg-sg-type-specimen__tag">Label · grid 1</p>
              <p className="gg-sg-type-specimen__sample gg-sg-type-grid-1">
                Sessions · History · Seed
              </p>
              <p className="gg-sg-type-specimen__code">
                --gg-type-grid-1 + tracking + uppercase · 600 weight
              </p>
            </div>
            <div className="gg-sg-type-specimen gg-sg-type-specimen--body">
              <p className="gg-sg-type-specimen__tag">Body · grid 2</p>
              <p className="gg-sg-type-specimen__sample gg-sg-type-grid-2">
                Thread copy, plate titles, and inspector fields use this comfortable line.
              </p>
              <p className="gg-sg-type-specimen__code">
                --gg-type-grid-2 · leading-body · weight 500–600
              </p>
            </div>
            <div className="gg-sg-type-specimen gg-sg-type-specimen--display">
              <p className="gg-sg-type-specimen__tag">Display · grid 3</p>
              <p className="gg-sg-type-specimen__sample gg-sg-type-grid-3">Research app</p>
              <p className="gg-sg-type-specimen__code">
                clamp display · tight leading · 700 weight · slight negative tracking
              </p>
            </div>
          </div>

          <p className="gg-sg-type-body" style={{ marginBlockEnd: "1rem" }}>
            Supporting paragraphs use grid-2 size with slate ink (
            <code>.gg-sg-type-body</code>, ~65ch max width) so long explanations stay legible next to
            dense plates.
          </p>

          <h3 className="gg-sg-type-h3" style={{ marginBlockEnd: "0.5rem" }}>
            Token reference
          </h3>
          <div className="gg-sg-card gg-sg-pattern-table" style={{ overflowX: "auto", maxWidth: "100%" }}>
            <table className="gg-sg-type-token-table">
              <thead>
                <tr>
                  <th scope="col">Token</th>
                  <th scope="col">Role</th>
                  <th scope="col">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>--gg-font-sans</code>
                  </td>
                  <td>Family stack</td>
                  <td>
                    &quot;Helvetica Neue&quot;, Helvetica, Arial, &quot;Nimbus Sans L&quot;, sans-serif
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>--gg-type-grid-1</code>
                  </td>
                  <td>Labels, captions, kickers</td>
                  <td>0.8125rem · uppercase + --gg-tracking-label</td>
                </tr>
                <tr>
                  <td>
                    <code>--gg-type-grid-2</code>
                  </td>
                  <td>Body, panel titles</td>
                  <td>1.125rem · --gg-leading-body</td>
                </tr>
                <tr>
                  <td>
                    <code>--gg-type-grid-3</code>
                  </td>
                  <td>Hero / product wordmark</td>
                  <td>clamp(1.75rem, 4vw, 2.75rem)</td>
                </tr>
                <tr>
                  <td>
                    <code>--gg-tracking-label</code> / leads
                  </td>
                  <td>Spacing rhythm</td>
                  <td>0.08em · tight 1.1 · body 1.35</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="gg-sg-type-h3" style={{ marginBlock: "1.5rem 0 0.75rem" }}>
            Document ladder
          </h3>
          <p className="gg-sg-type-body" style={{ marginBlockEnd: "0.75rem" }}>
            Map structure to tokens: one display line, then section heads, then subheads, then
            eyebrows — all within the same sans stack.
          </p>
          <div className="gg-sg-type-ladder-board">
            <div className="gg-sg-type-ladder-row">
              <span className="gg-sg-type-ladder-tag">H1</span>
              <div>
                <h1 className="gg-sg-type-h1">Page title</h1>
                <p className="gg-sg-type-spec" style={{ marginTop: "0.35rem" }}>
                  .gg-sg-type-h1 · grid-3
                </p>
              </div>
            </div>
            <div className="gg-sg-type-ladder-row">
              <span className="gg-sg-type-ladder-tag">H2</span>
              <div>
                <h2 className="gg-sg-type-h2">Section heading</h2>
                <p className="gg-sg-type-spec" style={{ marginTop: "0.35rem" }}>
                  .gg-sg-type-h2 · grid-2 semibold
                </p>
              </div>
            </div>
            <div className="gg-sg-type-ladder-row">
              <span className="gg-sg-type-ladder-tag">H3</span>
              <div>
                <h3 className="gg-sg-type-h3">Subsection</h3>
                <p className="gg-sg-type-spec" style={{ marginTop: "0.35rem" }}>
                  .gg-sg-type-h3 · grid-2 medium
                </p>
              </div>
            </div>
            <div className="gg-sg-type-ladder-row">
              <span className="gg-sg-type-ladder-tag">H4</span>
              <div>
                <h4 className="gg-sg-type-h4">Eyebrow / meta</h4>
                <p className="gg-sg-type-spec" style={{ marginTop: "0.35rem" }}>
                  .gg-sg-type-h4 · grid-1 uppercase
                </p>
              </div>
            </div>
          </div>

          <h3 className="gg-sg-type-h3" style={{ marginBlock: "1.5rem 0 0.75rem" }}>
            In-context composition
          </h3>
          <article className="gg-sg-type-compose" aria-label="Typography composition example">
            <p className="gg-sg-type-grid-1 gg-sg-type-compose__kicker">Reference · internal</p>
            <h1 className="gg-sg-type-h1" style={{ fontSize: "clamp(1.35rem, 3vw, 2rem)" }}>
              Session summary
            </h1>
            <p className="gg-sg-type-compose__lead">
              Lead sentence at grid-2, slightly heavier than body, full ink.
            </p>
            <p className="gg-sg-type-compose__body">
              Supporting detail stays slate for hierarchy. Links use route blue; reserve orange for
              directional emphasis.
            </p>
            <p className="gg-sg-type-compose__body">
              <a className="gg-sg-type-compose__link" href="#sg-type-heading">
                Example in-page anchor
              </a>{" "}
              · focus ring uses accent token.
            </p>
            <aside className="gg-sg-type-compose__callout">
              Lime accent bar + wash: secondary emphasis without competing with display type.
            </aside>
          </article>
        </section>

        <section className="gg-sg-section" aria-labelledby="sg-icon-heading">
          <h2 id="sg-icon-heading" className="gg-sg-section-title">
            Iconography
          </h2>
          <p className="gg-sg-type-body" style={{ marginBlockEnd: "1rem" }}>
            The product does not ship a general icon font. Chrome uses{" "}
            <strong>lightweight SVG strokes</strong> (round caps) for disclosure chevrons,{" "}
            <strong>Unicode arrows</strong> where density matters (session / graph filter rails), and{" "}
            <strong>geometric tokens</strong> (disc, ring, swatch) for status and legend keys. Prefer
            this vocabulary over emoji in structural UI.
          </p>
          <div className="gg-sg-icon-grid">
            <div className="gg-sg-icon-tile">
              <span className="gg-sg-icon-tile__glyph" aria-hidden>
                «
              </span>
              <p className="gg-sg-icon-tile__hint">Collapse rail</p>
              <p className="gg-sg-icon-tile__label">
                Narrow column to strip; paired with <code>»</code> to expand.{" "}
                <code>.gg-next-rail-toggle</code>
              </p>
            </div>
            <div className="gg-sg-icon-tile">
              <span className="gg-sg-icon-tile__glyph" aria-hidden>
                »
              </span>
              <p className="gg-sg-icon-tile__hint">Expand rail</p>
              <p className="gg-sg-icon-tile__label">
                Same control as graph filter rail toolbar — see <code>workbench.css</code> comments.
              </p>
            </div>
            <div className="gg-sg-icon-tile">
              <span className="gg-sg-icon-tile__svg">{STYLEGUIDE_CHEVRON_DOWN}</span>
              <p className="gg-sg-icon-tile__hint">Disclosure</p>
              <p className="gg-sg-icon-tile__label">
                Approval plate headers and evidence sections (
                <code>AppCollapsiblePlateHeader</code>, <code>EvidenceCollapsibleSection</code>).
              </p>
            </div>
            <div className="gg-sg-icon-tile">
              <div className="gg-sg-split-demo" aria-hidden>
                <span className="gg-sg-split-demo__cap" />
                <span className="gg-sg-split-demo__ring" />
                <span className="gg-sg-split-demo__cap" />
              </div>
              <p className="gg-sg-icon-tile__hint">Split</p>
              <p className="gg-sg-icon-tile__label">
                Column resize affordance: hairline caps, ring, orange inset.{" "}
                <code>.gg-next-split</code>
              </p>
            </div>
            <div className="gg-sg-icon-tile">
              <div className="gg-sg-history-disc-demo" aria-hidden />
              <p className="gg-sg-icon-tile__hint">Active session</p>
              <p className="gg-sg-icon-tile__label">
                History row: double ring uses route orange on ink border — matches active index
                state.
              </p>
            </div>
            <div className="gg-sg-icon-tile">
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span
                  className="gg-sg-swatch gg-sg-swatch--shape-circle gg-sg-swatch--viz-labels"
                  style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0 }}
                />
                <span
                  className="gg-sg-swatch gg-sg-swatch--shape-diamond gg-sg-swatch--viz-studios"
                  style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0 }}
                />
              </div>
              <p className="gg-sg-icon-tile__hint">Legend</p>
              <p className="gg-sg-icon-tile__label">
                Graph map filters: filled circle vs diamond swatches for kind / status emphasis (
                <code>WorkbenchSigmaGraph</code> + viz tokens).
              </p>
            </div>
          </div>
        </section>

        <section className="gg-sg-section" aria-labelledby="sg-collapse-heading">
          <h2 id="sg-collapse-heading" className="gg-sg-section-title">
            Collapsible panels
          </h2>
          <p className="gg-sg-type-body" style={{ marginBlockEnd: "1rem" }}>
            Four patterns appear on <code>/main</code>: horizontal rails, native{" "}
            <code>details</code>/<code>summary</code>, button headers with <code>aria-expanded</code>
            , and nested sections inside a plate. Keep focus rings and region labels consistent.
          </p>
          <div className="gg-sg-card gg-sg-pattern-table" style={{ overflowX: "auto" }}>
            <table className="gg-sg-type-token-table">
              <thead>
                <tr>
                  <th scope="col">Surface</th>
                  <th scope="col">Mechanism</th>
                  <th scope="col">Implementation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Session index column</td>
                  <td>Horizontal collapse</td>
                  <td>
                    <code>button.gg-next-rail-toggle</code> · « / » · persistence{" "}
                    <code>INDEX_NAV_COLLAPSED_KEY</code> · <code>GrooveGraphAppShell.tsx</code>
                  </td>
                </tr>
                <tr>
                  <td>Graph filter rail</td>
                  <td>Same rail pattern</td>
                  <td>
                    <code>.gg-next-graph-filter-rail</code> + toolbar toggle ·{" "}
                    <code>WorkbenchSigmaGraph.tsx</code> / <code>workbench.css</code>
                  </td>
                </tr>
                <tr>
                  <td>Sessions drawer</td>
                  <td>Native disclosure</td>
                  <td>
                    <code>details.gg-next-sessions-details</code> · <code>summary</code> row · default{" "}
                    <code>open</code>
                  </td>
                </tr>
                <tr>
                  <td>Graph filter blades</td>
                  <td>Nested disclosure</td>
                  <td>
                    <code>details.gg-next-graph-filter-blade</code> · summary hides marker via CSS
                  </td>
                </tr>
                <tr>
                  <td>Evidence / Relationship / Claims</td>
                  <td>Toggle button header</td>
                  <td>
                    <code>AppCollapsiblePlateHeader</code> · <code>aria-controls</code> + region id ·
                    chevron rotates via <code>.collapsibleChevronOpen</code>
                  </td>
                </tr>
                <tr>
                  <td>Field notes / Sources</td>
                  <td>Nested toggle</td>
                  <td>
                    <code>EvidenceCollapsibleSection</code> · badge count · scroll region when open
                  </td>
                </tr>
                <tr>
                  <td>Column split (related)</td>
                  <td>Resize, not collapse</td>
                  <td>
                    <code>role=&quot;separator&quot;</code> · <code>.gg-next-split</code> · pointer
                    drag on desktop grid
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <details className="gg-sg-details-demo">
            <summary>Example native details (sessions pattern)</summary>
            <div className="gg-sg-details-demo__body">
              Use for self-contained drawers where progressive enhancement matters. Pair summary copy
              with a clear title; hide the default marker and supply your own affordance if needed.
            </div>
          </details>
        </section>

        <section className="gg-sg-section" aria-labelledby="sg-lines-heading">
          <h2 id="sg-lines-heading" className="gg-sg-section-title">
            Lines &amp; rules
          </h2>
          <div className="gg-sg-lines-row">
            <div className="gg-sg-stroke-demo">
              <span className="gg-sg-swatch-caption">Hairline</span>
              <span className="gg-sg-stroke-line gg-sg-stroke-line--hairline" />
            </div>
            <div className="gg-sg-stroke-demo">
              <span className="gg-sg-swatch-caption">UI stroke</span>
              <span className="gg-sg-stroke-line gg-sg-stroke-line--ui" />
            </div>
            <div className="gg-sg-stroke-demo">
              <span className="gg-sg-swatch-caption">UI bold</span>
              <span className="gg-sg-stroke-line gg-sg-stroke-line--ui-bold" />
            </div>
            <div>
              <span className="gg-sg-swatch-caption" style={{ display: "block", marginBottom: "0.35rem" }}>
                Sign band height
              </span>
              <div className="gg-sg-sign-band-strip" aria-hidden />
            </div>
            <div>
              <span className="gg-sg-swatch-caption" style={{ display: "block", marginBottom: "0.35rem" }}>
                Parallel gap
              </span>
              <div className="gg-sg-parallel-tracks" aria-hidden>
                <span />
                <span />
              </div>
            </div>
          </div>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.5rem 0 0.75rem" }}>
            Radius ladder
          </h3>
          <div className="gg-sg-radius-ladder" aria-hidden>
            {(["r1", "r2", "r3", "r4", "r5"] as const).map((r) => (
              <div key={r} className="gg-sg-radius-ladder-item">
                <div className={`gg-sg-radius-box gg-sg-radius-box--${r}`} />
                <span className="gg-sg-radius-label">--gg-radius-{r}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="gg-sg-section" aria-labelledby="sg-map-heading">
          <h2 id="sg-map-heading" className="gg-sg-section-title">
            Map grammar
          </h2>
          <p className="gg-sg-type-body">
            Render route geometry with <strong>SVG (or canvas)</strong> paths using{" "}
            <code>stroke-linecap: round</code> and <code>stroke-linejoin: round</code>. Orthogonal
            and 45° segments share one stroke-weight family; parallel trunks use the gutter token.
            Avoid stacked <code>div</code> bars — square ends and axis-aligned boxes read as
            incorrect next to manual-grade map strokes.
          </p>
          <div className="gg-sg-map-demo">
            <figure style={{ margin: 0 }}>
              <svg
                className="gg-sg-map-svg"
                viewBox="0 0 120 120"
                role="img"
                aria-label="Sample orthogonal and diagonal paths with round caps"
              >
                <title>Map grammar sample</title>
                <path
                  className="gg-sg-map-path gg-sg-map-path--trunk"
                  d="M 16 60 H 72 V 28"
                />
                <path
                  className="gg-sg-map-path gg-sg-map-path--branch"
                  d="M 72 60 L 100 88"
                />
                <path
                  className="gg-sg-map-path gg-sg-map-path--bundle-a"
                  d="M 16 92 H 96"
                />
                <path
                  className="gg-sg-map-path gg-sg-map-path--bundle-b"
                  d="M 16 100 H 96"
                />
              </svg>
              <figcaption className="gg-sg-swatch-caption" style={{ marginTop: "0.5rem" }}>
                Round caps · bundle: lime + orange (distinct from trunk / branch hues)
              </figcaption>
            </figure>
          </div>
        </section>
      </div>

      <div className="gg-sg-page gg-sg-page--wide">
        <section className="gg-sg-section" aria-labelledby="sg-plates-heading">
          <h2 id="sg-plates-heading" className="gg-sg-section-title">
            Plates &amp; composition
          </h2>
          <div className="gg-sg-plate-row">
            <div className="gg-sg-plate">
              <div className="gg-sg-plate__band" aria-hidden />
              <div className="gg-sg-plate__body">
                <p className="gg-sg-plate__label">Primary label</p>
                <h3 className="gg-sg-plate__title">Panel title</h3>
                <p className="gg-sg-plate__text">Secondary supporting copy inside the plate body.</p>
              </div>
            </div>
            <div className="gg-sg-plate gg-sg-plate--accent-bar">
              <div className="gg-sg-plate__band" aria-hidden />
              <div className="gg-sg-plate__body">
                <p className="gg-sg-plate__label">Accent bar</p>
                <h3 className="gg-sg-plate__title">Directional emphasis</h3>
                <p className="gg-sg-plate__text">Uses the software accent token on the inline edge.</p>
              </div>
            </div>
          </div>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.5rem 0 0.75rem" }}>
            Disc scale
          </h3>
          <div className="gg-sg-disc-row" aria-hidden>
            <span className="gg-sg-disc gg-sg-disc--sm">S</span>
            <span className="gg-sg-disc gg-sg-disc--md">M</span>
            <span className="gg-sg-disc gg-sg-disc--lg">L</span>
          </div>
        </section>

        <hr className="gg-sg-divider" />

        <section className="gg-sg-section" aria-labelledby="sg-components-heading">
          <h2 id="sg-components-heading" className="gg-sg-section-title">
            Components
          </h2>
          <p className="gg-sg-type-body">
            Shared research UI from <code>product/src/components/research-workbench-widgets.tsx</code>
            , styled globally via <code>workbench.css</code>.
          </p>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.25rem 0 0.75rem" }}>
            MarkdownMessage
          </h3>
          <div className="gg-sg-card">
            <MarkdownMessage
              content={`Short **markdown** sample with a [link](https://example.com) and a list:

- First item
- Second item`}
            />
          </div>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.25rem 0 0.75rem" }}>
            EmptyState
          </h3>
          <div className="gg-sg-card">
            <EmptyState text="No rows match the current filters." />
          </div>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.25rem 0 0.75rem" }}>
            MiniAction
          </h3>
          <StyleguideMiniActionRow />

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.25rem 0 0.75rem" }}>
            StatusBar
          </h3>
          <div className="gg-sg-type-stack">
            <StatusBar status="proposed" detail="Awaiting review" />
            <StatusBar status="accepted" detail="Approved for graph" />
            <StatusBar status="rejected" detail="Out of scope" />
            <StatusBar status="deferred" detail="Needs evidence" />
          </div>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.25rem 0 0.75rem" }}>
            DecisionRow
          </h3>
          <div className="gg-sg-card">
            <StyleguideDecisionRow />
          </div>

          <h3 className="gg-sg-type-grid-2" style={{ margin: "1.25rem 0 0.75rem" }}>
            TripletEntitySummary
          </h3>
          <div className="gg-sg-card" style={{ maxWidth: "28rem" }}>
            <TripletEntitySummary
              displayName={MOCK_ENTITY.displayName}
              kind={MOCK_ENTITY.provisionalKind}
              entity={MOCK_ENTITY}
              danglingId=""
              align="start"
              kindOptions={["Organization", "Person", "Recording"]}
            />
          </div>
        </section>

        <section className="gg-sg-section" aria-labelledby="sg-surfaces-heading">
          <h2 id="sg-surfaces-heading" className="gg-sg-section-title">
            App surfaces
          </h2>
          <div className="gg-sg-card">
            <ul className="gg-sg-type-body" style={{ margin: 0, paddingInlineStart: "1.25rem" }}>
              <li>
                <code>product/src/components/WorkbenchSigmaGraph.tsx</code> — graph canvas
              </li>
              <li>
                <code>product/src/components/ResearchWorkbench.tsx</code> — primary workbench layout
              </li>
              <li>
                <code>product/src/groove-graph-app/GrooveGraphAppShell.tsx</code> — app shell and
                routing chrome (session-dependent; not mounted here)
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
