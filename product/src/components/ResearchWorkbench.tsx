"use client";

import { WorkbenchNextView } from "./WorkbenchNextView";
import { useGrooveGraphAppModel } from "@/src/groove-graph-app/useGrooveGraphAppModel";

/** Legacy entry: same behavior as {@link GrooveGraphApp}; kept for `/` backup route. */
export function ResearchWorkbench() {
  const model = useGrooveGraphAppModel();
  return <WorkbenchNextView model={model} />;
}
