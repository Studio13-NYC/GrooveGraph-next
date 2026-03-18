export type PacketOutputFormat =
  | "bullets"
  | "table"
  | "patch"
  | "brief"
  | "review"
  | "summary";

export type PacketMeasurementMode = "exact" | "estimated" | "unknown";

export interface PacketScope {
  writable: string[];
  readable: string[];
}

export interface PacketInputs {
  files?: string[];
  docs?: string[];
  priorFindings?: string[];
}

export interface PacketReferenceBoundary {
  readOnly: string[];
  writable: string[];
}

export interface PacketExpectedOutput {
  format: PacketOutputFormat;
  mustInclude: string[];
}

export interface PacketTracking {
  sessionId: string;
  chunkId: string;
  parentChunkId?: string;
  measurementMode: PacketMeasurementMode;
}

export interface ContextPacket {
  goal: string;
  whyNow: string;
  tracking?: PacketTracking;
  scope: PacketScope;
  inputs: PacketInputs;
  constraints: string[];
  referenceBoundary: PacketReferenceBoundary;
  expectedOutput: PacketExpectedOutput;
  stopConditions: string[];
  followOnHints: string[];
}

const REQUIRED_FIELDS: Array<keyof ContextPacket> = [
  "goal",
  "whyNow",
  "scope",
  "inputs",
  "constraints",
  "referenceBoundary",
  "expectedOutput",
  "stopConditions",
  "followOnHints",
];

export function createContextPacket(packet: ContextPacket): ContextPacket {
  const validationErrors = validateContextPacket(packet);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid context packet:\n- ${validationErrors.join("\n- ")}`);
  }

  return packet;
}

export function validateContextPacket(packet: Partial<ContextPacket>): string[] {
  const errors: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (packet[field] == null) {
      errors.push(`Missing required field '${field}'.`);
    }
  }

  if (!packet.goal?.trim()) {
    errors.push("Packet goal must be a non-empty string.");
  }

  if (!packet.whyNow?.trim()) {
    errors.push("Packet whyNow must be a non-empty string.");
  }

  if (packet.tracking && !packet.tracking.sessionId?.trim()) {
    errors.push("Packet tracking.sessionId must be a non-empty string.");
  }

  if (packet.tracking && !packet.tracking.chunkId?.trim()) {
    errors.push("Packet tracking.chunkId must be a non-empty string.");
  }

  if (packet.tracking && !packet.tracking.measurementMode) {
    errors.push("Packet tracking.measurementMode is required.");
  }

  if (!packet.scope?.writable?.length) {
    errors.push("Packet scope.writable must include at least one writable target.");
  }

  if (!packet.scope?.readable?.length) {
    errors.push("Packet scope.readable must include at least one readable target.");
  }

  if (!packet.referenceBoundary?.writable?.length) {
    errors.push("Packet referenceBoundary.writable must include at least one writable surface.");
  }

  if (!packet.referenceBoundary?.readOnly?.length) {
    errors.push("Packet referenceBoundary.readOnly must include at least one read-only reference.");
  }

  if (!packet.expectedOutput?.format) {
    errors.push("Packet expectedOutput.format is required.");
  }

  if (!packet.expectedOutput?.mustInclude?.length) {
    errors.push("Packet expectedOutput.mustInclude must include at least one required item.");
  }

  if (!packet.stopConditions?.length) {
    errors.push("Packet stopConditions must include at least one stop condition.");
  }

  return errors;
}

export function formatContextPacketAsMarkdown(packet: ContextPacket): string {
  return [
    "```yaml",
    `goal: >\n  ${packet.goal}`,
    `why_now: >\n  ${packet.whyNow}`,
    ...(packet.tracking
      ? [
          "tracking:",
          `  session_id: ${packet.tracking.sessionId}`,
          `  chunk_id: ${packet.tracking.chunkId}`,
          ...(packet.tracking.parentChunkId ? [`  parent_chunk_id: ${packet.tracking.parentChunkId}`] : []),
          `  measurement_mode: ${packet.tracking.measurementMode}`,
        ]
      : []),
    "scope:",
    ...formatYamlList("  writable", packet.scope.writable),
    ...formatYamlList("  readable", packet.scope.readable),
    "inputs:",
    ...formatYamlList("  files", packet.inputs.files ?? []),
    ...formatYamlList("  docs", packet.inputs.docs ?? []),
    ...formatYamlList("  prior_findings", packet.inputs.priorFindings ?? []),
    ...formatYamlList("constraints", packet.constraints),
    "reference_boundary:",
    ...formatYamlList("  read_only", packet.referenceBoundary.readOnly),
    ...formatYamlList("  writable", packet.referenceBoundary.writable),
    "expected_output:",
    `  format: ${packet.expectedOutput.format}`,
    ...formatYamlList("  must_include", packet.expectedOutput.mustInclude),
    ...formatYamlList("stop_conditions", packet.stopConditions),
    ...formatYamlList("follow_on_hints", packet.followOnHints),
    "```",
  ].join("\n");
}

function formatYamlList(label: string, values: string[]): string[] {
  if (values.length === 0) {
    return [`${label}: []`];
  }

  return [`${label}:`, ...values.map((value) => `    - ${value}`)];
}
