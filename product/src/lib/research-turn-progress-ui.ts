/**
 * Client-side progress copy for long-running requests where the server does not stream status.
 * Estimates are heuristic and labeled as such for the user.
 */

export type IndeterminateProgressUi = {
  phaseLabel: string;
  detailLine: string;
  /** Human-readable time hint; always framed as an estimate. */
  etaLine: string;
};

function formatEtaSeconds(predictedTotalSec: number, elapsedSec: number): string {
  const remain = Math.max(3, Math.round(predictedTotalSec - elapsedSec));
  if (remain < 55) {
    return `Roughly ${remain}s left (estimate).`;
  }
  const m = Math.max(1, Math.round(remain / 60));
  return `Roughly ${m} min left (estimate).`;
}

/** Research chat POST `/turn` — model + optional web_search + tools + artifact extraction. */
export function researchTurnProgressForElapsed(elapsedMs: number): IndeterminateProgressUi {
  const sec = elapsedMs / 1000;
  const predictedTotalSec = Math.min(180, Math.max(28, 22 + sec * 1.25));

  if (sec < 2.5) {
    return {
      phaseLabel: "Sending your turn",
      detailLine: "Delivering the message to the server.",
      etaLine: formatEtaSeconds(predictedTotalSec, sec),
    };
  }
  if (sec < 12) {
    return {
      phaseLabel: "Assistant is thinking",
      detailLine: "The model is reasoning and may plan web search or graph tools.",
      etaLine: formatEtaSeconds(predictedTotalSec, sec),
    };
  }
  if (sec < 40) {
    return {
      phaseLabel: "Search and tool execution",
      detailLine: "Fetching sources, snippets, and drafting entity or relationship candidates.",
      etaLine: formatEtaSeconds(predictedTotalSec, sec),
    };
  }
  if (sec < 90) {
    return {
      phaseLabel: "Wrapping up this turn",
      detailLine: "Extra model passes after tool results are common here.",
      etaLine: formatEtaSeconds(predictedTotalSec, sec),
    };
  }
  return {
    phaseLabel: "Still working",
    detailLine: "Heavy web or tool use can push a single turn toward two minutes.",
    etaLine: formatEtaSeconds(Math.max(predictedTotalSec, sec + 25), sec),
  };
}

/** TypeDB-backed `/api/graph/viz` fetch. */
export function graphVizLoadProgressForElapsed(elapsedMs: number, focused: boolean): IndeterminateProgressUi {
  const sec = elapsedMs / 1000;
  const predictedTotalSec = Math.min(90, Math.max(12, (focused ? 14 : 18) + sec * 0.9));

  if (sec < 3) {
    return {
      phaseLabel: focused ? "Loading neighborhood" : "Loading graph",
      detailLine: "Querying TypeDB and mapping entities for the canvas.",
      etaLine: formatEtaSeconds(predictedTotalSec, sec),
    };
  }
  if (sec < 15) {
    return {
      phaseLabel: "Building graph payload",
      detailLine: "Large graphs take longer to serialize and transfer.",
      etaLine: formatEtaSeconds(predictedTotalSec, sec),
    };
  }
  return {
    phaseLabel: "Almost ready",
    detailLine: "If this stalls for a long time, check TypeDB connectivity or clear focus.",
    etaLine: formatEtaSeconds(Math.max(predictedTotalSec, sec + 15), sec),
  };
}

/** Session publish to TypeDB. */
export function publishToDbProgressForElapsed(elapsedMs: number): IndeterminateProgressUi {
  const sec = elapsedMs / 1000;
  const predictedTotalSec = Math.min(120, Math.max(15, 12 + sec * 1.2));

  if (sec < 4) {
    return {
      phaseLabel: "Accepting candidates",
      detailLine: "Applying proposed graph state in the session.",
      etaLine: formatEtaSeconds(predictedTotalSec, sec),
    };
  }
  if (sec < 20) {
    return {
      phaseLabel: "Writing to TypeDB",
      detailLine: "Persisting entities and relationships.",
      etaLine: formatEtaSeconds(predictedTotalSec, sec),
    };
  }
  return {
    phaseLabel: "Finishing publish",
    detailLine: "Large batches or remote databases can extend this step.",
    etaLine: formatEtaSeconds(Math.max(predictedTotalSec, sec + 20), sec),
  };
}
