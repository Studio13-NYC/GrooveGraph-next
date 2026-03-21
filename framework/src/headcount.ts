import type { SubagentName } from "./subagent-registry.js";

export type HeadcountMode = "serial" | "async";

export interface HeadcountBudgetRange {
  tokensLow: number;
  tokensHigh: number;
  costLowUsd: number;
  costHighUsd: number;
}

export interface HeadcountStep {
  id: string;
  agent: SubagentName;
  title: string;
  goal: string;
  inputs: string[];
  handoffFrom: string[];
  output: string;
  successChecks: string[];
  referenceBudget: HeadcountBudgetRange;
}

export interface HeadcountTest {
  id: string;
  name: string;
  mode: HeadcountMode;
  objective: string;
  finalProject: string;
  whyThisTestExists: string;
  successCriteria: string[];
  steps: HeadcountStep[];
}

export interface HeadcountBudgetSummary extends HeadcountBudgetRange {
  stepCount: number;
}

export const HEADCOUNT_SERIAL_TEST: HeadcountTest = {
  id: "headcount-serial-release-packet",
  name: "Headcount Serial Release Packet",
  mode: "serial",
  objective:
    "Prove that the orchestrator can manage a strict handoff chain where each agent receives bounded instructions, uses prior outputs, and contributes to one final release packet.",
  finalProject:
    "A synthesized headcount release packet for a tiny product slice, including scoped findings, product framing, implementation intent, review notes, validation notes, hygiene notes, deployment notes, and rough slice cost.",
  whyThisTestExists:
    "Serial work is where weak instructions and bad handoffs become obvious. This test checks whether each lane can stay in role while still advancing one shared outcome.",
  successCriteria: [
    "Every agent receives a bounded packet with a clear stop condition.",
    "Each agent output is explicitly consumed by the next relevant agent.",
    "The final synthesis preserves the chain of reasoning instead of flattening it into a vague summary.",
    "Each agent returns a `cost_summary` or explicitly returns `unknown`.",
    "The orchestrator produces one rolled-up slice cost summary for rough reference.",
  ],
  steps: [
    {
      id: "serial-explorer",
      agent: "explorer",
      title: "Locate the smallest working surface",
      goal:
        "Identify the exact files and docs needed for a tiny smoke-page revision without over-searching.",
      inputs: ["user goal", "repo state", "docs/INDEX.md", "product/"],
      handoffFrom: [],
      output: "Relevant paths, why they matter, and the minimum writable surface.",
      successChecks: [
        "Returns a short file list rather than a broad repo tour.",
        "Separates writable targets from reference docs.",
      ],
      referenceBudget: { tokensLow: 1200, tokensHigh: 2400, costLowUsd: 0.001, costHighUsd: 0.003 },
    },
    {
      id: "serial-product-manager",
      agent: "product-manager",
      title: "Frame the discovery-first product slice",
      goal:
        "Turn the explored surface into a clear user, workflow, and persistence framing without hardening the ontology too early.",
      inputs: ["explorer output", "legacy product signals", "user goal"],
      handoffFrom: ["serial-explorer"],
      output:
        "A concise product brief defining the hero workflow, starter types, flexible persistence stance, and normalization triggers.",
      successChecks: [
        "Defines the user-visible why of the slice before implementation begins.",
        "Keeps early graph structure flexible instead of over-specifying ontology.",
      ],
      referenceBudget: { tokensLow: 1500, tokensHigh: 3000, costLowUsd: 0.0015, costHighUsd: 0.004 },
    },
    {
      id: "serial-composer-meta",
      agent: "composer-meta",
      title: "Define the execution contract",
      goal:
        "Turn the discovered surface into a tight execution rubric and packet shape for the downstream agents.",
      inputs: ["explorer output", "product-manager output", "docs/CONTEXT_PACKETS.md", ".cursor/rules/"],
      handoffFrom: ["serial-explorer", "serial-product-manager"],
      output: "A concise packet/rubric defining acceptance criteria and non-goals.",
      successChecks: [
        "Clarifies what later agents must and must not change.",
        "Produces a contract that the implementer and reviewer can both use.",
      ],
      referenceBudget: { tokensLow: 1800, tokensHigh: 3200, costLowUsd: 0.002, costHighUsd: 0.005 },
    },
    {
      id: "serial-graphic-artist",
      agent: "graphic-artist",
      title: "Produce the visual brief",
      goal:
        "Create a small visual-direction brief that keeps the smoke revision aligned with the repo visual system.",
      inputs: [
        "explorer output",
        "product-manager output",
        "composer-meta rubric",
        "docs/design-language/FOUNDATION.md",
        "docs/VISUAL_STYLE_GUIDE.md",
      ],
      handoffFrom: ["serial-explorer", "serial-product-manager", "serial-composer-meta"],
      output: "A focused visual brief or title treatment for the smoke change.",
      successChecks: [
        "Uses the documented visual regime rather than generic design language.",
        "Keeps the change bounded and production-oriented.",
      ],
      referenceBudget: { tokensLow: 1400, tokensHigh: 2800, costLowUsd: 0.001, costHighUsd: 0.004 },
    },
    {
      id: "serial-implementer",
      agent: "implementer",
      title: "Apply the bounded change",
      goal:
        "Translate the packet and brief into the minimal implementation artifact needed for the smoke revision.",
      inputs: ["explorer output", "product-manager output", "composer-meta rubric", "graphic-artist brief"],
      handoffFrom: ["serial-explorer", "serial-product-manager", "serial-composer-meta", "serial-graphic-artist"],
      output: "A bounded implementation change or patch-ready artifact.",
      successChecks: [
        "Stays inside the declared writable scope.",
        "Implements the brief without inventing new requirements.",
      ],
      referenceBudget: { tokensLow: 2600, tokensHigh: 5200, costLowUsd: 0.003, costHighUsd: 0.008 },
    },
    {
      id: "serial-reviewer",
      agent: "reviewer",
      title: "Check for regressions",
      goal:
        "Review the bounded implementation with a bug-finding mindset and call out any missing validation.",
      inputs: ["implementer output", "composer-meta rubric"],
      handoffFrom: ["serial-composer-meta", "serial-implementer"],
      output: "Findings ordered by severity or an explicit no-findings statement.",
      successChecks: [
        "Prioritizes behavioral risk over summary.",
        "Returns file references or explicitly says no findings.",
      ],
      referenceBudget: { tokensLow: 1500, tokensHigh: 3000, costLowUsd: 0.001, costHighUsd: 0.004 },
    },
    {
      id: "serial-tester",
      agent: "tester",
      title: "Validate the user-visible result",
      goal:
        "Turn the reviewed implementation into a concrete workflow check with a clear pass/fail statement.",
      inputs: ["implementer output", "reviewer output", "expected user-visible result"],
      handoffFrom: ["serial-implementer", "serial-reviewer"],
      output: "Validation result, observed behavior, and next step if the test fails.",
      successChecks: [
        "Speaks in user-visible outcomes rather than internals only.",
        "Returns a binary result and a next move.",
      ],
      referenceBudget: { tokensLow: 1400, tokensHigh: 2600, costLowUsd: 0.001, costHighUsd: 0.003 },
    },
    {
      id: "serial-hygienist",
      agent: "hygienist",
      title: "Generate the cleanup proposal",
      goal:
        "Run the bounded hygiene lens over the changed surface and turn any cleanup findings into a proposal-first table.",
      inputs: ["implementer output", "tester output", "docs/HYGIENE.md"],
      handoffFrom: ["serial-implementer", "serial-tester"],
      output: "Cleanup status plus a proposal table or an explicit no-removal recommendation.",
      successChecks: [
        "Uses proposal-first hygiene guidance rather than silent deletion.",
        "Distinguishes safe observations from changes requiring human approval.",
      ],
      referenceBudget: { tokensLow: 900, tokensHigh: 1800, costLowUsd: 0.0005, costHighUsd: 0.002 },
    },
    {
      id: "serial-infra",
      agent: "infrastructure-deployment",
      title: "Prepare the release path",
      goal:
        "Summarize how the bounded change would move to the target surface without breaking preserved infrastructure.",
      inputs: ["implementer output", "tester output", "hygienist output", "docs/AZURE_BASELINE.md"],
      handoffFrom: ["serial-implementer", "serial-tester", "serial-hygienist"],
      output: "Deployment path, preserved surfaces, overwrite surfaces, and smoke-check plan.",
      successChecks: [
        "Respects the Azure preservation boundary.",
        "Produces a concrete release and rollback note set.",
      ],
      referenceBudget: { tokensLow: 1600, tokensHigh: 3200, costLowUsd: 0.002, costHighUsd: 0.004 },
    },
  ],
};

export const HEADCOUNT_ASYNC_TEST: HeadcountTest = {
  id: "headcount-async-launch-pack",
  name: "Headcount Async Launch Pack",
  mode: "async",
  objective:
    "Prove that the orchestrator can fan out bounded parallel work, absorb multiple incoming results, and synthesize them into one coherent launch pack.",
  finalProject:
    "A synthesized headcount launch pack with research, product framing, meta contract, visual direction, implementation scaffold, hygiene notes, review risks, validation plan, deployment notes, and rough slice cost.",
  whyThisTestExists:
    "Parallel work tests whether the orchestrator can preserve intent under concurrency and still produce one final artifact instead of a pile of disconnected outputs.",
  successCriteria: [
    "Each async packet has an independent scope and clear output shape.",
    "No agent depends on another async result to finish its own task.",
    "The final synthesis combines all outputs into one coherent launch pack.",
    "Each agent returns a `cost_summary` or explicitly returns `unknown`.",
    "The orchestrator provides one rolled-up rough slice total for the async run.",
  ],
  steps: [
    {
      id: "async-explorer",
      agent: "explorer",
      title: "Map the launch surfaces",
      goal: "Return the exact files and docs that matter for a launch-pack workflow.",
      inputs: ["repo state", "docs/INDEX.md"],
      handoffFrom: [],
      output: "The smallest set of relevant paths for the launch pack.",
      successChecks: ["Returns a bounded path set.", "Avoids repo-wide drift."],
      referenceBudget: { tokensLow: 1000, tokensHigh: 2200, costLowUsd: 0.001, costHighUsd: 0.003 },
    },
    {
      id: "async-product-manager",
      agent: "product-manager",
      title: "Define the discovery-first product frame",
      goal:
        "Return the user, hero workflow, persistence stance, and delayed-normalization guardrails for the launch pack.",
      inputs: ["legacy product signals", "user goal", "framework constraints"],
      handoffFrom: [],
      output: "A concise product frame for the launch pack.",
      successChecks: [
        "Defines what the product is trying to learn before implementation hardens schema.",
        "Separates starter types from later normalization work.",
      ],
      referenceBudget: { tokensLow: 1400, tokensHigh: 2800, costLowUsd: 0.0015, costHighUsd: 0.004 },
    },
    {
      id: "async-composer-meta",
      agent: "composer-meta",
      title: "Draft the run contract",
      goal: "Produce a reusable packet template and scoring rubric for rerunning headcount.",
      inputs: ["docs/CONTEXT_PACKETS.md", ".cursor/rules/"],
      handoffFrom: [],
      output: "A reusable packet and scoring template for future runs.",
      successChecks: ["Defines exact outputs.", "Keeps the packet concise."],
      referenceBudget: { tokensLow: 1600, tokensHigh: 3000, costLowUsd: 0.002, costHighUsd: 0.005 },
    },
    {
      id: "async-graphic-artist",
      agent: "graphic-artist",
      title: "Set the launch-pack visual frame",
      goal: "Provide a title treatment and visual direction for the final pack.",
      inputs: [
        "docs/design-language/FOUNDATION.md",
        "docs/VISUAL_STYLE_GUIDE.md",
        "message and audience",
      ],
      handoffFrom: [],
      output: "Title treatment and visual-direction note for the final pack.",
      successChecks: ["Uses the documented visual system.", "Remains bounded to the pack."],
      referenceBudget: { tokensLow: 1200, tokensHigh: 2400, costLowUsd: 0.001, costHighUsd: 0.003 },
    },
    {
      id: "async-implementer",
      agent: "implementer",
      title: "Build the assembly scaffold",
      goal:
        "Create the smallest implementation scaffold for compiling the final launch pack from structured inputs.",
      inputs: ["fixed schema", "target file list"],
      handoffFrom: [],
      output: "A bounded scaffold or starter artifact for the final pack.",
      successChecks: ["Stays inside a fixed schema.", "Does not require speculative requirements."],
      referenceBudget: { tokensLow: 2200, tokensHigh: 4400, costLowUsd: 0.003, costHighUsd: 0.007 },
    },
    {
      id: "async-reviewer",
      agent: "reviewer",
      title: "Surface the major risks",
      goal: "List the main behavioral and workflow risks for the final launch pack.",
      inputs: ["expected final pack behavior"],
      handoffFrom: [],
      output: "Risk list ordered by severity.",
      successChecks: ["Focuses on risks, not general commentary.", "Returns concise findings."],
      referenceBudget: { tokensLow: 1200, tokensHigh: 2400, costLowUsd: 0.001, costHighUsd: 0.003 },
    },
    {
      id: "async-hygienist",
      agent: "hygienist",
      title: "Audit the launch-pack surface",
      goal:
        "Check the bounded artifact plan for stale or contradictory surfaces and define proposal-first cleanup follow-up.",
      inputs: ["docs/HYGIENE.md", "target artifact surface", "expected final pack behavior"],
      handoffFrom: [],
      output: "Cleanup proposal notes for the launch pack or an explicit no-action recommendation.",
      successChecks: [
        "Keeps the analysis inside the framework-only boundary.",
        "Returns findings as reviewable proposals, not automatic deletions.",
      ],
      referenceBudget: { tokensLow: 900, tokensHigh: 1600, costLowUsd: 0.0005, costHighUsd: 0.002 },
    },
    {
      id: "async-tester",
      agent: "tester",
      title: "Define pass/fail checks",
      goal: "Produce a validation matrix for the final launch pack.",
      inputs: ["expected user-visible result"],
      handoffFrom: [],
      output: "Pass/fail checks with observable outcomes.",
      successChecks: ["Defines observable checks.", "Returns a usable matrix."],
      referenceBudget: { tokensLow: 1200, tokensHigh: 2200, costLowUsd: 0.001, costHighUsd: 0.003 },
    },
    {
      id: "async-infra",
      agent: "infrastructure-deployment",
      title: "Define the release envelope",
      goal: "Produce deployment, smoke, and rollback notes for the final pack while preserving the framework-only boundary.",
      inputs: ["docs/AZURE_BASELINE.md", "target release surface", "framework-only boundary"],
      handoffFrom: [],
      output: "Release envelope with preserve/overwrite boundaries.",
      successChecks: ["Respects preserved resources.", "Provides a concrete smoke plan."],
      referenceBudget: { tokensLow: 1400, tokensHigh: 2800, costLowUsd: 0.002, costHighUsd: 0.004 },
    },
  ],
};

export const HEADCOUNT_TESTS: HeadcountTest[] = [HEADCOUNT_SERIAL_TEST, HEADCOUNT_ASYNC_TEST];

export function summarizeHeadcountBudget(test: HeadcountTest): HeadcountBudgetSummary {
  return test.steps.reduce<HeadcountBudgetSummary>(
    (summary, step) => ({
      stepCount: summary.stepCount + 1,
      tokensLow: summary.tokensLow + step.referenceBudget.tokensLow,
      tokensHigh: summary.tokensHigh + step.referenceBudget.tokensHigh,
      costLowUsd: roundUsd(summary.costLowUsd + step.referenceBudget.costLowUsd),
      costHighUsd: roundUsd(summary.costHighUsd + step.referenceBudget.costHighUsd),
    }),
    {
      stepCount: 0,
      tokensLow: 0,
      tokensHigh: 0,
      costLowUsd: 0,
      costHighUsd: 0,
    },
  );
}

function roundUsd(amount: number): number {
  return Math.round(amount * 1_000_000) / 1_000_000;
}
