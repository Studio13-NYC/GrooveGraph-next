import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applySessionGraphHygiene } from "./session-graph-hygiene";
import type { ResearchSession } from "@/src/types/research-session";

function minimalSession(overrides: Partial<ResearchSession> = {}): ResearchSession {
  const now = new Date().toISOString();
  return {
    id: "rs_test",
    title: "t",
    seedQuery: "q",
    status: "ready",
    createdAt: now,
    updatedAt: now,
    messages: [],
    sources: [],
    evidenceSnippets: [],
    claims: [],
    entityCandidates: [],
    relationshipCandidates: [],
    reviewDecisions: [],
    notes: [],
    events: [],
    ...overrides,
  };
}

describe("applySessionGraphHygiene", () => {
  it("merges two entities with the same normalized display name and rewires edges", () => {
    const iso = "2020-01-01T00:00:00.000Z";
    const session = minimalSession({
      entityCandidates: [
        {
          id: "ent_a",
          displayName: "Talking Heads",
          provisionalKind: "band",
          aliases: [],
          externalIds: [],
          attributes: {},
          evidenceSnippetIds: [],
          status: "proposed",
          createdAt: "2020-01-01T00:00:00.000Z",
        },
        {
          id: "ent_b",
          displayName: "  talking heads ",
          provisionalKind: "band",
          aliases: [],
          externalIds: [],
          attributes: { era: "70s" },
          evidenceSnippetIds: [],
          status: "proposed",
          createdAt: "2020-01-02T00:00:00.000Z",
        },
      ],
      relationshipCandidates: [
        {
          id: "rel_1",
          sourceEntityId: "ent_b",
          targetEntityId: "ent_x",
          verb: "member of",
          confidence: "high",
          evidenceSnippetIds: [],
          status: "proposed",
          createdAt: iso,
        },
      ],
    });
    session.entityCandidates.push({
      id: "ent_x",
      displayName: "David Byrne",
      provisionalKind: "person",
      aliases: [],
      externalIds: [],
      attributes: {},
      evidenceSnippetIds: [],
      status: "proposed",
      createdAt: iso,
    });

    const report = applySessionGraphHygiene(session);
    assert.equal(report.entitiesRemoved, 1);
    assert.equal(session.entityCandidates.length, 2);
    const canon = session.entityCandidates.find((e) => e.id === "ent_a");
    assert.ok(canon);
    assert.equal(canon!.attributes.era, "70s");
    const rel = session.relationshipCandidates[0];
    assert.equal(rel?.sourceEntityId, "ent_a");
  });

  it("merges entities that share an external id", () => {
    const now = new Date().toISOString();
    const session = minimalSession({
      entityCandidates: [
        {
          id: "e1",
          displayName: "Band A",
          provisionalKind: "band",
          aliases: [],
          externalIds: ["https://en.wikipedia.org/wiki/Talking_Heads"],
          attributes: {},
          evidenceSnippetIds: [],
          status: "proposed",
          createdAt: now,
        },
        {
          id: "e2",
          displayName: "Talking Heads (band)",
          provisionalKind: "group",
          aliases: [],
          externalIds: ["https://en.wikipedia.org/wiki/Talking_Heads"],
          attributes: {},
          evidenceSnippetIds: [],
          status: "proposed",
          createdAt: now,
        },
      ],
      relationshipCandidates: [],
    });
    const report = applySessionGraphHygiene(session);
    assert.equal(report.entitiesRemoved, 1);
    assert.equal(session.entityCandidates.length, 1);
  });
});
