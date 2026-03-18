export const newRegimePalette = {
  paper: "#F2E9D8",
  black: "#111111",
  slate: "#5E6670",
  redRoute: "#D7332F",
  blueRoute: "#1B67C9",
  greenRoute: "#11804B",
  orangeRoute: "#E97722",
  magentaRoute: "#C433A8",
  yellowRoute: "#F2C230",
  grayRoute: "#8E8B84",
} as const;

export const oldRegimePalette = {
  board: "#F6F4EE",
  marker: "#1F1F1F",
  fadedBlue: "#6D88A8",
  correctionRed: "#B03A2E",
  stickyNote: "#F3D85B",
  tape: "#D8CCB0",
} as const;

export const typography = {
  titleFamily: "Helvetica, Arial, sans-serif",
  bodyFamily: "Helvetica, Arial, sans-serif",
  titleWeight: 800,
  labelWeight: 700,
} as const;

export const geometry = {
  routeStroke: 12,
  routeStrokeLarge: 18,
  stationRadius: 8,
  cornerRadius: 20,
  borderRadius: 28,
  gridUnit: 8,
} as const;
