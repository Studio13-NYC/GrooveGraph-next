export type ModelLane =
  | "gpt-5.4"
  | "composer-1.5"
  | "gpt-5.4-mini"
  | "gpt-5.4-nano"
  | "gpt-5.3-codex";

export type SubagentName =
  | "orchestrator"
  | "composer-meta"
  | "explorer"
  | "product-manager"
  | "implementer"
  | "reviewer"
  | "tester"
  | "hygienist"
  | "graphic-artist"
  | "infrastructure-deployment";

export interface SubagentDefinition {
  name: SubagentName;
  modelLane: ModelLane;
  purpose: string;
  writableByDefault: boolean;
}

export const SUBAGENT_REGISTRY: Record<SubagentName, SubagentDefinition> = {
  orchestrator: {
    name: "orchestrator",
    modelLane: "gpt-5.4",
    purpose: "Top-level decomposition, routing, and final synthesis.",
    writableByDefault: false,
  },
  "composer-meta": {
    name: "composer-meta",
    modelLane: "composer-1.5",
    purpose: "Rules, skills, prompt contracts, and other Cursor-native meta work.",
    writableByDefault: true,
  },
  explorer: {
    name: "explorer",
    modelLane: "gpt-5.4-mini",
    purpose: "Fast context gathering for bounded exploration.",
    writableByDefault: false,
  },
  "product-manager": {
    name: "product-manager",
    modelLane: "gpt-5.4-mini",
    purpose:
      "Discovery-first product research, legacy archaeology, and flexible graph workflow framing.",
    writableByDefault: false,
  },
  implementer: {
    name: "implementer",
    modelLane: "gpt-5.3-codex",
    purpose: "Bounded implementation and refactoring after scope is fixed.",
    writableByDefault: true,
  },
  reviewer: {
    name: "reviewer",
    modelLane: "gpt-5.4-mini",
    purpose: "Review for regressions, ambiguity, and missing tests.",
    writableByDefault: false,
  },
  tester: {
    name: "tester",
    modelLane: "gpt-5.4-mini",
    purpose: "Workflow validation and failure interpretation.",
    writableByDefault: false,
  },
  hygienist: {
    name: "hygienist",
    modelLane: "gpt-5.4-nano",
    purpose: "Cleanup analysis, unused-surface triage, and hygiene proposal generation.",
    writableByDefault: false,
  },
  "graphic-artist": {
    name: "graphic-artist",
    modelLane: "gpt-5.4-mini",
    purpose: "Visual systems, campaign graphics, and image-brief production.",
    writableByDefault: true,
  },
  "infrastructure-deployment": {
    name: "infrastructure-deployment",
    modelLane: "gpt-5.4-mini",
    purpose: "Azure baseline preservation, deployment planning, and smoke validation.",
    writableByDefault: true,
  },
};

export function getSubagent(name: SubagentName): SubagentDefinition {
  return SUBAGENT_REGISTRY[name];
}

export function listSubagents(): SubagentDefinition[] {
  return Object.values(SUBAGENT_REGISTRY);
}
