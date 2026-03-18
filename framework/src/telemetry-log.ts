import { mkdir, appendFile, readFile } from "node:fs/promises";
import path from "node:path";

import type { ModelLane } from "./subagent-registry.js";
import type { SliceCostSummary } from "./usage-accounting.js";

export const DEFAULT_TELEMETRY_DIRECTORY = ".telemetry";
export const DEFAULT_SLICE_COST_LOG_PATH = path.join(
  DEFAULT_TELEMETRY_DIRECTORY,
  "slice-costs.jsonl",
);

export interface SliceCostLogRecord {
  recordedAt: string;
  sliceId: string;
  sessionId?: string;
  task?: string;
  orchestratorModel?: ModelLane;
  summary: SliceCostSummary;
}

export interface CreateSliceCostLogRecordInput {
  sliceId: string;
  summary: SliceCostSummary;
  sessionId?: string;
  task?: string;
  orchestratorModel?: ModelLane;
  recordedAt?: string;
}

export function createSliceCostLogRecord(
  input: CreateSliceCostLogRecordInput,
): SliceCostLogRecord {
  return {
    recordedAt: input.recordedAt ?? new Date().toISOString(),
    sliceId: input.sliceId,
    sessionId: input.sessionId,
    task: input.task,
    orchestratorModel: input.orchestratorModel,
    summary: input.summary,
  };
}

export async function appendSliceCostLog(
  record: SliceCostLogRecord,
  logPath = DEFAULT_SLICE_COST_LOG_PATH,
): Promise<void> {
  const absoluteLogPath = path.resolve(logPath);
  await mkdir(path.dirname(absoluteLogPath), { recursive: true });
  await appendFile(absoluteLogPath, `${JSON.stringify(record)}\n`, "utf8");
}

export async function readSliceCostLog(
  logPath = DEFAULT_SLICE_COST_LOG_PATH,
): Promise<SliceCostLogRecord[]> {
  const absoluteLogPath = path.resolve(logPath);
  const content = await readFile(absoluteLogPath, "utf8");

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as SliceCostLogRecord);
}
