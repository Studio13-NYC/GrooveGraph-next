import { z } from "zod";
import { zodResponsesFunction, zodTextFormat } from "openai/helpers/zod";
import type OpenAI from "openai";
import type {
  Claim,
  EntityCandidate,
  EvidenceSnippet,
  RelationshipCandidate,
  ResearchConversationMode,
  ResearchSession,
  SourceDocument,
} from "@/src/types/research-session";
import { getExtractionModel, getResearchModel } from "./config";
import {
  logResearchInteraction,
  summarizeResponseOutput,
  truncateForLog,
} from "./research-interaction-log";
import { createEvent, createId } from "./session-store";

const confidenceSchema = z.enum(["low", "medium", "high"]);
const attributePairSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const extractionSchema = z.object({
  notes: z.array(z.string()).default([]),
  claims: z
    .array(
      z.object({
        text: z.string(),
        confidence: confidenceSchema,
        evidenceSnippetText: z.string().nullable(),
      }),
    )
    .default([]),
  entityCandidates: z
    .array(
      z.object({
        displayName: z.string(),
        provisionalKind: z.string(),
        aliases: z.array(z.string()).default([]),
        externalIds: z.array(z.string()).default([]),
        attributes: z.array(attributePairSchema).default([]),
      }),
    )
    .default([]),
  relationshipCandidates: z
    .array(
      z.object({
        sourceEntityName: z.string(),
        targetEntityName: z.string(),
        verb: z.string(),
        confidence: confidenceSchema,
      }),
    )
    .default([]),
});

const noteParamsSchema = z.object({
  note: z.string(),
});

const sourceParamsSchema = z.object({
  url: z.string(),
  title: z.string(),
  citationText: z.string().nullable(),
});

const snippetParamsSchema = z.object({
  text: z.string(),
  sourceUrl: z.string().nullable(),
  confidence: confidenceSchema.default("medium"),
});

const entityParamsSchema = z.object({
  displayName: z.string(),
  provisionalKind: z.string(),
  aliases: z.array(z.string()).default([]),
  externalIds: z.array(z.string()).default([]),
  attributes: z.array(attributePairSchema).default([]),
});

const relationshipParamsSchema = z.object({
  sourceEntityName: z.string(),
  targetEntityName: z.string(),
  verb: z.string(),
  confidence: confidenceSchema.default("medium"),
});

const decisionParamsSchema = z.object({
  itemType: z.enum(["claim", "entity", "relationship"]),
  itemId: z.string(),
  decision: z.enum(["accepted", "rejected", "deferred"]),
  note: z.string().nullable(),
});

function buildResearchTools() {
  return [
    { type: "web_search" as const },
    zodResponsesFunction({
      name: "save_session_note",
      description: "Save a short research note to the current session.",
      parameters: noteParamsSchema,
    }),
    zodResponsesFunction({
      name: "record_source_document",
      description: "Record a cited source document discovered during research.",
      parameters: sourceParamsSchema,
    }),
    zodResponsesFunction({
      name: "record_evidence_snippet",
      description: "Record a supporting snippet of evidence from a cited source.",
      parameters: snippetParamsSchema,
    }),
    zodResponsesFunction({
      name: "upsert_entity_candidate",
      description:
        "Create or update a provisional entity candidate. Reuses an existing candidate when the display name or aliases match (case-insensitive, trimmed) or when any externalIds overlap (e.g. same Wikipedia URL or Wikidata id). Prefer updating the same node over creating a near-duplicate.",
      parameters: entityParamsSchema,
    }),
    zodResponsesFunction({
      name: "upsert_relationship_candidate",
      description: "Create or update a provisional relationship candidate.",
      parameters: relationshipParamsSchema,
    }),
    zodResponsesFunction({
      name: "set_review_decision",
      description: "Record an explicit review decision for an existing provisional item.",
      parameters: decisionParamsSchema,
    }),
    zodResponsesFunction({
      name: "list_session_artifacts",
      description: "Return a compact snapshot of the current session artifacts.",
      parameters: z.object({}),
    }),
  ];
}

function attributePairsToRecord(attributes: Array<{ key: string; value: string }>): Record<string, string> {
  return Object.fromEntries(attributes.map((item) => [item.key, item.value]));
}

function findSourceByUrl(session: ResearchSession, url: string): SourceDocument | undefined {
  return session.sources.find((source) => source.url === url);
}

function findSnippetByText(session: ResearchSession, text: string): EvidenceSnippet | undefined {
  return session.evidenceSnippets.find((snippet) => snippet.text === text);
}

/** Normalize for identity checks: trim, collapse whitespace, lowercase. */
function normalizeEntityMatchKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function findEntityByExternalIdOverlap(
  session: ResearchSession,
  externalIds: string[],
): EntityCandidate | undefined {
  const keys = new Set(
    externalIds.map((id) => id.trim().toLowerCase()).filter((id) => id.length > 0),
  );
  if (keys.size === 0) {
    return undefined;
  }
  for (const entity of session.entityCandidates) {
    for (const ext of entity.externalIds) {
      if (keys.has(ext.trim().toLowerCase())) {
        return entity;
      }
    }
  }
  return undefined;
}

function findEntityByName(session: ResearchSession, displayName: string): EntityCandidate | undefined {
  const key = normalizeEntityMatchKey(displayName);
  if (!key) {
    return undefined;
  }
  for (const entity of session.entityCandidates) {
    if (normalizeEntityMatchKey(entity.displayName) === key) {
      return entity;
    }
    for (const alias of entity.aliases) {
      if (normalizeEntityMatchKey(alias) === key) {
        return entity;
      }
    }
  }
  return undefined;
}

function resolveEntityCandidate(
  session: ResearchSession,
  displayName: string,
  externalIds: string[],
): EntityCandidate | undefined {
  return (
    findEntityByName(session, displayName) ?? findEntityByExternalIdOverlap(session, externalIds)
  );
}

function mergeEntityCandidateFields(
  entity: EntityCandidate,
  patch: {
    displayName: string;
    provisionalKind: string;
    aliases: string[];
    externalIds: string[];
    attributes: Record<string, string>;
  },
): void {
  entity.provisionalKind = patch.provisionalKind;
  entity.aliases = Array.from(
    new Set([...entity.aliases, ...patch.aliases].map((a) => a.trim()).filter(Boolean)),
  );
  entity.externalIds = Array.from(
    new Set([...entity.externalIds, ...patch.externalIds].map((id) => id.trim()).filter(Boolean)),
  );
  entity.attributes = { ...entity.attributes, ...patch.attributes };
  const patchName = patch.displayName.trim();
  if (patchName && normalizeEntityMatchKey(entity.displayName) !== normalizeEntityMatchKey(patchName)) {
    if (!entity.aliases.some((a) => normalizeEntityMatchKey(a) === normalizeEntityMatchKey(patchName))) {
      entity.aliases.push(patchName);
    }
  }
}

function findRelationship(
  session: ResearchSession,
  sourceEntityId: string,
  targetEntityId: string,
  verb: string,
): RelationshipCandidate | undefined {
  return session.relationshipCandidates.find(
    (item) =>
      item.sourceEntityId === sourceEntityId &&
      item.targetEntityId === targetEntityId &&
      item.verb.toLowerCase() === verb.toLowerCase(),
  );
}

function addCitationSources(session: ResearchSession, response: OpenAI.Responses.Response): void {
  for (const outputItem of response.output) {
    if (outputItem.type !== "message") {
      continue;
    }

    for (const contentPart of outputItem.content) {
      if (contentPart.type !== "output_text") {
        continue;
      }

      for (const annotation of contentPart.annotations ?? []) {
        if (annotation.type !== "url_citation") {
          continue;
        }

        if (findSourceByUrl(session, annotation.url)) {
          continue;
        }

        session.sources.push({
          id: createId("src"),
          url: annotation.url,
          title: annotation.title ?? annotation.url,
          citationText: contentPart.text.slice(annotation.start_index, annotation.end_index),
          sessionId: session.id,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
}

function sessionArtifactSummary(session: ResearchSession): string {
  return JSON.stringify(
    {
      sessionId: session.id,
      title: session.title,
      notes: session.notes,
      sources: session.sources.map((source) => ({ id: source.id, title: source.title, url: source.url })),
      entityCandidates: session.entityCandidates.map((entity) => ({
        id: entity.id,
        displayName: entity.displayName,
        provisionalKind: entity.provisionalKind,
        status: entity.status,
      })),
      relationshipCandidates: session.relationshipCandidates.map((item) => ({
        id: item.id,
        sourceEntityId: item.sourceEntityId,
        targetEntityId: item.targetEntityId,
        verb: item.verb,
        status: item.status,
      })),
      claims: session.claims.map((claim) => ({ id: claim.id, text: claim.text, status: claim.status })),
    },
    null,
    2,
  );
}

async function handleToolCall(
  session: ResearchSession,
  toolCall: OpenAI.Responses.ResponseFunctionToolCall,
): Promise<string> {
  let rawArguments: unknown;
  try {
    const s = toolCall.arguments;
    const raw = typeof s === "string" && s.trim().length > 0 ? s : "{}";
    rawArguments = JSON.parse(raw);
  } catch {
    return JSON.stringify({ error: "Tool arguments were not valid JSON; retry with valid JSON only." });
  }

  session.events.push(
    createEvent("tool_called", "success", "/api/sessions/[sessionId]/turn", "Tool called by model.", {
      session_id: session.id,
      tool_name: toolCall.name,
    }),
  );

  if (toolCall.name === "save_session_note") {
    const args = noteParamsSchema.parse(rawArguments);
    session.notes.push(args.note);
    return JSON.stringify({ saved: true, noteCount: session.notes.length });
  }

  if (toolCall.name === "record_source_document") {
    const args = sourceParamsSchema.parse(rawArguments);
    let source = findSourceByUrl(session, args.url);
    if (!source) {
      source = {
        id: createId("src"),
        url: args.url,
        title: args.title,
        citationText: args.citationText ?? undefined,
        sessionId: session.id,
        createdAt: new Date().toISOString(),
      };
      session.sources.push(source);
    }

    return JSON.stringify({ sourceId: source.id, url: source.url, title: source.title });
  }

  if (toolCall.name === "record_evidence_snippet") {
    const args = snippetParamsSchema.parse(rawArguments);
    let snippet = findSnippetByText(session, args.text);
    if (!snippet) {
      const source = args.sourceUrl ? findSourceByUrl(session, args.sourceUrl) : undefined;
      snippet = {
        id: createId("snip"),
        sourceId: source?.id,
        text: args.text,
        confidence: args.confidence,
        sessionId: session.id,
        createdAt: new Date().toISOString(),
      };
      session.evidenceSnippets.push(snippet);
    }

    return JSON.stringify({ snippetId: snippet.id });
  }

  if (toolCall.name === "upsert_entity_candidate") {
    const args = entityParamsSchema.parse(rawArguments);
    const attrRecord = attributePairsToRecord(args.attributes);
    let entity = resolveEntityCandidate(session, args.displayName, args.externalIds);
    if (!entity) {
      entity = {
        id: createId("ent"),
        displayName: args.displayName.trim(),
        provisionalKind: args.provisionalKind,
        aliases: args.aliases.map((a) => a.trim()).filter(Boolean),
        externalIds: args.externalIds.map((id) => id.trim()).filter(Boolean),
        attributes: attrRecord,
        evidenceSnippetIds: [],
        status: "proposed",
        createdAt: new Date().toISOString(),
      };
      session.entityCandidates.push(entity);
    } else {
      mergeEntityCandidateFields(entity, {
        displayName: args.displayName,
        provisionalKind: args.provisionalKind,
        aliases: args.aliases,
        externalIds: args.externalIds,
        attributes: attrRecord,
      });
    }

    return JSON.stringify({ entityId: entity.id, displayName: entity.displayName });
  }

  if (toolCall.name === "upsert_relationship_candidate") {
    const args = relationshipParamsSchema.parse(rawArguments);
    const source = resolveEntityCandidate(session, args.sourceEntityName, []);
    const target = resolveEntityCandidate(session, args.targetEntityName, []);
    if (!source || !target) {
      return JSON.stringify({
        error: "Both source and target entities must exist before creating a relationship candidate.",
      });
    }

    let relationship = findRelationship(session, source.id, target.id, args.verb);
    if (!relationship) {
      relationship = {
        id: createId("rel"),
        sourceEntityId: source.id,
        targetEntityId: target.id,
        verb: args.verb,
        confidence: args.confidence,
        evidenceSnippetIds: [],
        status: "proposed",
        createdAt: new Date().toISOString(),
      };
      session.relationshipCandidates.push(relationship);
    } else {
      relationship.confidence = args.confidence;
    }

    return JSON.stringify({ relationshipId: relationship.id });
  }

  if (toolCall.name === "set_review_decision") {
    const args = decisionParamsSchema.parse(rawArguments);
    session.reviewDecisions.push({
      id: createId("dec"),
      itemType: args.itemType,
      itemId: args.itemId,
      decision: args.decision,
      note: args.note ?? undefined,
      createdAt: new Date().toISOString(),
    });

    return JSON.stringify({ recorded: true, itemId: args.itemId, decision: args.decision });
  }

  if (toolCall.name === "list_session_artifacts") {
    return sessionArtifactSummary(session);
  }

  return JSON.stringify({ ignored: true });
}

function latestAssistantText(response: OpenAI.Responses.Response): string {
  return response.output_text ?? "";
}

function ensureSnippet(session: ResearchSession, text: string, confidence: "low" | "medium" | "high"): string {
  let snippet = findSnippetByText(session, text);
  if (!snippet) {
    snippet = {
      id: createId("snip"),
      text,
      confidence,
      sessionId: session.id,
      createdAt: new Date().toISOString(),
    };
    session.evidenceSnippets.push(snippet);
  }

  return snippet.id;
}

async function extractArtifacts(
  client: OpenAI,
  session: ResearchSession,
  response: OpenAI.Responses.Response,
): Promise<void> {
  const assistantText = latestAssistantText(response);
  if (!assistantText.trim()) {
    return;
  }

  const sourceSummary =
    session.sources.length === 0
      ? "No explicit citations were captured."
      : session.sources.map((source) => `- ${source.title}: ${source.url}`).join("\n");

  const extraction = await client.responses.parse({
    model: getExtractionModel(),
    instructions:
      "Extract discovery artifacts from the assistant answer. Keep results conservative and phase-1 friendly. Prefer a small number of strong claims and provisional graph candidates over exhaustive speculation.",
    input: [
      {
        role: "user",
        content: `Session seed: ${session.seedQuery}\n\nSources:\n${sourceSummary}\n\nAssistant answer:\n${assistantText}`,
      },
    ],
    text: {
      format: zodTextFormat(extractionSchema, "research_artifact_extraction"),
    },
  });

  const parsed = extraction.output_parsed;
  if (!parsed) {
    return;
  }

  session.notes.push(...parsed.notes);

  for (const extractedClaim of parsed.claims) {
    const snippetIds = extractedClaim.evidenceSnippetText
      ? [ensureSnippet(session, extractedClaim.evidenceSnippetText, extractedClaim.confidence)]
      : [];

    if (!session.claims.some((claim) => claim.text.toLowerCase() === extractedClaim.text.toLowerCase())) {
      const claim: Claim = {
        id: createId("claim"),
        text: extractedClaim.text,
        confidence: extractedClaim.confidence,
        evidenceSnippetIds: snippetIds,
        status: "proposed",
        createdAt: new Date().toISOString(),
      };
      session.claims.push(claim);
    }
  }

  for (const extractedEntity of parsed.entityCandidates) {
    const attrRecord = attributePairsToRecord(extractedEntity.attributes);
    const existing = resolveEntityCandidate(
      session,
      extractedEntity.displayName,
      extractedEntity.externalIds,
    );
    if (existing) {
      mergeEntityCandidateFields(existing, {
        displayName: extractedEntity.displayName,
        provisionalKind: extractedEntity.provisionalKind,
        aliases: extractedEntity.aliases,
        externalIds: extractedEntity.externalIds,
        attributes: attrRecord,
      });
      continue;
    }
    const entity: EntityCandidate = {
      id: createId("ent"),
      displayName: extractedEntity.displayName.trim(),
      provisionalKind: extractedEntity.provisionalKind,
      aliases: extractedEntity.aliases.map((a) => a.trim()).filter(Boolean),
      externalIds: extractedEntity.externalIds.map((id) => id.trim()).filter(Boolean),
      attributes: attrRecord,
      evidenceSnippetIds: [],
      status: "proposed",
      createdAt: new Date().toISOString(),
    };
    session.entityCandidates.push(entity);
  }

  for (const extractedRelationship of parsed.relationshipCandidates) {
    const source = resolveEntityCandidate(session, extractedRelationship.sourceEntityName, []);
    const target = resolveEntityCandidate(session, extractedRelationship.targetEntityName, []);
    if (!source || !target) {
      continue;
    }

    if (!findRelationship(session, source.id, target.id, extractedRelationship.verb)) {
      const relationship: RelationshipCandidate = {
        id: createId("rel"),
        sourceEntityId: source.id,
        targetEntityId: target.id,
        verb: extractedRelationship.verb,
        confidence: extractedRelationship.confidence,
        evidenceSnippetIds: [],
        status: "proposed",
        createdAt: new Date().toISOString(),
      };
      session.relationshipCandidates.push(relationship);
    }
  }
}

function buildResearchInstructions(
  session: ResearchSession,
  mode: ResearchConversationMode = "explore",
): string {
  const tail = `Current session title: ${session.title}`;
  if (mode === "build") {
    return [
      "You are GrooveGraph Research Workspace in build mode: prioritize expanding a grounded provisional graph.",
      "Aggressively use web_search to validate facts, discover entities, and collect primary or reputable sources.",
      "Before adding entities for a subject the user already named, call list_session_artifacts and reuse those candidate ids via upsert_entity_candidate (merge attributes and aliases) instead of creating parallel copies.",
      "When mining sources (e.g. Wikipedia), put stable URLs or Wikidata-style ids into externalIds so the same real-world entity collapses to one candidate.",
      "Extract many grounded entity candidates and relationship candidates; prefer breadth with evidence over a single shallow answer.",
      "Use clear, descriptive provisionalKind labels (consistent strings when the same kind repeats) so downstream review can cluster and filter.",
      "Use the same tools as explore mode: record_source_document, record_evidence_snippet, upsert_entity_candidate, upsert_relationship_candidate, save_session_note, set_review_decision, list_session_artifacts.",
      "After entities exist, connect them with upsert_relationship_candidate; tie claims and snippets to sources where possible.",
      "Keep the narrative concise, but do not hold back on tool calls needed to populate the session artifacts.",
      tail,
    ].join(" ");
  }
  return [
    "You are GrooveGraph Research Workspace, a discovery-first investigation assistant.",
    "Your job is to help the user search widely, gather evidence, and persist provisional graph artifacts without hardening a rigid ontology too early.",
    "Use web_search when current or sourced information is needed.",
    "When you identify a useful source, call record_source_document.",
    "When you identify a strong supporting quote or summary, call record_evidence_snippet.",
    "When an entity seems worth keeping, call upsert_entity_candidate with a conservative provisional kind; if the session already has that person or band under a slightly different label, merge via upsert_entity_candidate (same tools) rather than introducing a second node.",
    "When a relationship seems plausible and grounded, call upsert_relationship_candidate after the related entities exist.",
    "If you form a compact internal takeaway for the session, call save_session_note.",
    "Keep the response concise, cite what you found, and make uncertainty explicit.",
    tail,
  ].join(" ");
}

function responsesConversationOption(session: ResearchSession): { conversation: string } | Record<string, never> {
  const id = session.openaiConversationId?.trim();
  if (!id) {
    return {};
  }
  return { conversation: id };
}

export async function runResearchTurn(
  client: OpenAI,
  session: ResearchSession,
  userMessage: string,
  mode: ResearchConversationMode = "explore",
): Promise<OpenAI.Responses.Response> {
  const effectiveMode = mode === "build" ? "build" : "explore";
  const tools = buildResearchTools();
  const conv = responsesConversationOption(session);
  const researchModel = getResearchModel();

  logResearchInteraction(session.id, "turn_runtime_start", {
    mode: effectiveMode,
    model: researchModel,
    hasConversationId: Boolean(session.openaiConversationId?.trim()),
    sessionTitle: truncateForLog(session.title, 160),
    seedQueryPreview: truncateForLog(session.seedQuery, 200),
    entityCandidateCount: session.entityCandidates.length,
    relationshipCandidateCount: session.relationshipCandidates.length,
    priorMessageCount: session.messages.length,
    userMessagePreview: truncateForLog(userMessage, 500),
  });

  logResearchInteraction(session.id, "model_request", {
    modelRound: 0,
    inputKind: "user_message",
    model: researchModel,
  });

  let response = await client.responses.create({
    model: researchModel,
    reasoning: { effort: "low" },
    ...conv,
    instructions: buildResearchInstructions(session, effectiveMode),
    store: true,
    tools,
    input: [{ role: "user", content: userMessage }],
  });

  addCitationSources(session, response);
  logResearchInteraction(session.id, "model_response", {
    modelRound: 0,
    ...summarizeResponseOutput(response),
  });

  let modelRound = 0;
  while (response.output.some((item) => item.type === "function_call")) {
    modelRound += 1;
    const calls = response.output.filter((item) => item.type === "function_call");
    logResearchInteraction(session.id, "tool_cycle_start", {
      modelRound,
      pendingFunctionCalls: calls.length,
      callNames: calls.map((c) => (c as { name?: string }).name).filter(Boolean),
    });

    const toolOutputs = [];
    for (const item of response.output) {
      if (item.type !== "function_call") {
        continue;
      }

      const fc = item as OpenAI.Responses.ResponseFunctionToolCall;
      logResearchInteraction(session.id, "tool_call", {
        modelRound,
        tool: fc.name,
        callId: fc.call_id,
        argsPreview: truncateForLog(typeof fc.arguments === "string" ? fc.arguments : "", 500),
      });

      let output: string;
      try {
        output = await handleToolCall(session, fc);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Tool handler failed.";
        output = JSON.stringify({
          error: message,
          hint: "Check argument types and required fields, then call the tool again if appropriate.",
        });
        logResearchInteraction(session.id, "tool_handler_threw", {
          modelRound,
          tool: fc.name,
          callId: fc.call_id,
          error: message,
        });
        session.events.push(
          createEvent("workflow_failed", "failure", "/api/sessions/[sessionId]/turn", "Tool handler threw.", {
            session_id: session.id,
            tool_name: fc.name,
            call_id: fc.call_id,
            error: message,
          }),
        );
      }

      logResearchInteraction(session.id, "tool_result", {
        modelRound,
        tool: fc.name,
        callId: fc.call_id,
        outputChars: output.length,
        outputPreview: truncateForLog(output, 400),
      });

      session.events.push(
        createEvent("tool_completed", "success", "/api/sessions/[sessionId]/turn", "Tool output returned to model.", {
          session_id: session.id,
          tool_name: fc.name,
          call_id: fc.call_id,
        }),
      );

      toolOutputs.push({
        type: "function_call_output" as const,
        call_id: fc.call_id,
        output,
      });
    }

    logResearchInteraction(session.id, "model_request", {
      modelRound,
      inputKind: "function_call_outputs",
      toolOutputCount: toolOutputs.length,
      model: researchModel,
    });

    response = await client.responses.create({
      model: researchModel,
      reasoning: { effort: "low" },
      ...conv,
      instructions: buildResearchInstructions(session, effectiveMode),
      store: true,
      tools,
      input: toolOutputs,
    });

    addCitationSources(session, response);
    logResearchInteraction(session.id, "model_response", {
      modelRound,
      ...summarizeResponseOutput(response),
    });
  }

  const assistantLen = (response.output_text ?? "").length;
  logResearchInteraction(session.id, "extract_artifacts_start", {
    assistantTextChars: assistantLen,
    extractionModel: getExtractionModel(),
  });
  try {
    await extractArtifacts(client, session, response);
    logResearchInteraction(session.id, "extract_artifacts_ok", {
      entityCandidateCount: session.entityCandidates.length,
      relationshipCandidateCount: session.relationshipCandidates.length,
    });
  } catch (err) {
    logResearchInteraction(session.id, "extract_artifacts_error", {
      error: err instanceof Error ? err.message : "unknown",
    });
    session.events.push(
      createEvent(
        "workflow_failed",
        "failure",
        "/api/sessions/[sessionId]/turn",
        "Post-turn artifact extraction failed; assistant reply is still saved.",
        {
          session_id: session.id,
          error: err instanceof Error ? err.message : "unknown",
        },
      ),
    );
  }

  logResearchInteraction(session.id, "turn_runtime_complete", {
    lastResponseId: response.id,
    assistantTextChars: (response.output_text ?? "").length,
  });
  return response;
}
