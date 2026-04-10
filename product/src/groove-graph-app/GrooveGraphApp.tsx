"use client";

import { GrooveGraphAppShell } from "./GrooveGraphAppShell";
import { useGrooveGraphAppModel } from "./useGrooveGraphAppModel";

/** Composition root for the GrooveGraph app surface (`/main`). */
export function GrooveGraphApp() {
  const model = useGrooveGraphAppModel();
  return <GrooveGraphAppShell model={model} />;
}
