import type { ModelLane, SubagentName } from "./subagent-registry.js";

export type CostMeasurementMode = "exact" | "estimated" | "unknown";

export interface CostSummary {
  measurementMode: CostMeasurementMode;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  notes?: string[];
}

export interface AgentCostSummary {
  agent: SubagentName;
  model: ModelLane;
  costSummary: CostSummary;
}

export interface SliceCostSummary {
  measurementMode: CostMeasurementMode;
  totalTokens: number | null;
  costUsd: number | null;
  agentSummaries: AgentCostSummary[];
}

export function normalizeCostSummary(summary: Partial<CostSummary>): CostSummary {
  const inputTokens = summary.inputTokens ?? 0;
  const outputTokens = summary.outputTokens ?? 0;
  const totalTokens = summary.totalTokens ?? inputTokens + outputTokens;
  const hasTokenData =
    summary.inputTokens != null || summary.outputTokens != null || summary.totalTokens != null;

  return {
    measurementMode: summary.measurementMode ?? "unknown",
    inputTokens: hasTokenData ? inputTokens : undefined,
    outputTokens: hasTokenData ? outputTokens : undefined,
    totalTokens: hasTokenData ? totalTokens : undefined,
    costUsd: summary.costUsd,
    notes: summary.notes ?? [],
  };
}

export function rollupSliceCost(summaries: AgentCostSummary[]): SliceCostSummary {
  const normalized = summaries.map((summary) => ({
    ...summary,
    costSummary: normalizeCostSummary(summary.costSummary),
  }));

  const knownCosts = normalized
    .map((summary) => summary.costSummary.costUsd)
    .filter((cost): cost is number => cost != null);
  const knownTokens = normalized
    .map((summary) => summary.costSummary.totalTokens)
    .filter((tokens): tokens is number => tokens != null);

  return {
    measurementMode: deriveMeasurementMode(normalized.map((summary) => summary.costSummary.measurementMode)),
    totalTokens: knownTokens.length > 0 ? knownTokens.reduce((sum, tokens) => sum + tokens, 0) : null,
    costUsd: knownCosts.length > 0 ? roundUsd(knownCosts.reduce((sum, cost) => sum + cost, 0)) : null,
    agentSummaries: normalized,
  };
}

export function formatSliceCostAsMarkdown(summary: SliceCostSummary): string {
  const totalCost = summary.costUsd == null ? "unknown" : `$${summary.costUsd.toFixed(6)}`;
  const totalTokens = summary.totalTokens == null ? "unknown" : String(summary.totalTokens);
  const agentLines = summary.agentSummaries.map(({ agent, model, costSummary }) => {
    const agentCost = costSummary.costUsd == null ? "unknown" : `$${costSummary.costUsd.toFixed(6)}`;
    const agentTokens = costSummary.totalTokens == null ? "unknown" : String(costSummary.totalTokens);

    return `- ${agent} (${model}) -> ${agentTokens} tokens, ${agentCost}, ${costSummary.measurementMode}`;
  });

  return [
    "Slice cost summary",
    "",
    `- Measurement: ${summary.measurementMode}`,
    `- Tokens: ${totalTokens}`,
    `- Cost: ${totalCost}`,
    "- Agent totals:",
    ...agentLines,
  ].join("\n");
}

function deriveMeasurementMode(modes: CostMeasurementMode[]): CostMeasurementMode {
  if (modes.length === 0) {
    return "unknown";
  }

  if (modes.every((mode) => mode === "exact")) {
    return "exact";
  }

  if (modes.some((mode) => mode === "estimated")) {
    return "estimated";
  }

  return "unknown";
}

function roundUsd(amount: number): number {
  return Math.round(amount * 1_000_000) / 1_000_000;
}
