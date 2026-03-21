/**
 * TypeScript mirror of `framework/src/visual-system/nycta-groovegraph-tokens.css`.
 * Import CSS in any app: `@import "@groovegraph-next/framework/nycta-groovegraph-tokens.css";`
 * Keep hex values in sync when either file changes.
 */
export const newRegimePalette = {
  /** Default UI / diagram base (light) */
  surfaceCanvas: "#FFFFFF",
  surfaceCanvasDark: "#0A0A0A",
  /** Map land token aliases canvas — no separate warm fill */
  mapLand: "#FFFFFF",
  mapWater: "#FFFFFF",
  mapPark: "#A7A9AC",
  ink: "#111111",
  inkDarkMode: "#F2F2F2",
  slate: "#5A5654",
  slateDarkMode: "#A3A3A3",
  redRoute: "#EE352E",
  blueRoute: "#0039A6",
  greenRoute: "#00933C",
  orangeRoute: "#FF6319",
  magentaRoute: "#B933AD",
  yellowRoute: "#FCCC0A",
  grayRoute: "#A7A9AC",
  brownRoute: "#996633",
  limeRoute: "#6CBE45",
} as const;

/** @deprecated Use newRegimePalette.surfaceCanvas */
export const paper = newRegimePalette.surfaceCanvas;

export const oldRegimePalette = {
  board: "#F6F4EE",
  marker: "#1F1F1F",
  fadedBlue: "#6D88A8",
  correctionRed: "#B03A2E",
  stickyNote: "#F3D85B",
  tape: "#D8CCB0",
} as const;

export const typography = {
  titleFamily:
    '"Helvetica Neue", Helvetica, Arial, "Nimbus Sans L", sans-serif',
  bodyFamily:
    '"Helvetica Neue", Helvetica, Arial, "Nimbus Sans L", sans-serif',
  titleWeight: 800,
  labelWeight: 700,
} as const;

/** Map-line geometry at design scale (SVG / canvas); CSS uses --gg-route-stroke-* */
export const geometry = {
  routeStrokeUiPx: 6,
  routeStrokeUiBoldPx: 8,
  routeStrokeHairlinePx: 1,
  parallelGapFactor: 0.52,
  radiusR1Px: 10,
  radiusR2Px: 14,
  radiusR3Px: 20,
  radiusR4Px: 28,
  radiusR5Px: 40,
  stationRadiusPx: 8,
  gridUnitPx: 8,
} as const;
