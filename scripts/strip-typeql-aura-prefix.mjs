/**
 * Strip the legacy "aura-" prefix from TypeQL schema text (TypeDB export file).
 * When stripping would collide with an existing non-aura type name, renames to
 * "migrated-<stripped>" instead.
 *
 * Usage: node scripts/strip-typeql-aura-prefix.mjs <input.typeql> <output.typeql>
 */
import fs from "fs";
import path from "path";
import { buildAuraPrefixRenameMap, applyRenamesToTypeql } from "./lib/typedb-prefix-rename.mjs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("Usage: node scripts/strip-typeql-aura-prefix.mjs <input.typeql> <output.typeql>");
  process.exit(1);
}

const text = fs.readFileSync(inPath, "utf8");
const rename = buildAuraPrefixRenameMap(text);
const out = applyRenamesToTypeql(text, rename);

fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
fs.writeFileSync(outPath, out, "utf8");
console.log(`Wrote ${outPath} (${rename.size} aura types renamed)`);
