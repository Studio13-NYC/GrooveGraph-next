import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { candidateKey, mergeAttributes, mergeStringLists, uniqueStrings } from "./helpers";

describe("graph-persistence helpers", () => {
  it("uniqueStrings dedupes and trims", () => {
    assert.deepEqual(uniqueStrings([" a ", "a", "b"]), ["a", "b"]);
  });

  it("mergeStringLists unions string arrays", () => {
    assert.deepEqual(mergeStringLists(["x"], ["y", "x"]), ["x", "y"]);
  });

  it("mergeAttributes parses JSON object and overlays", () => {
    const merged = mergeAttributes('{"a":"1","b":"2"}', { b: "3", c: "4" });
    assert.deepEqual(merged, { a: "1", b: "3", c: "4" });
  });

  it("candidateKey joins session and entity ids", () => {
    assert.equal(candidateKey("s1", "e1"), "s1:e1");
  });
});
