/**
 * Build rename map for stripping legacy "aura-" prefix from TypeQL identifiers.
 * When stripping would collide with an existing non-aura name, maps to "migrated-<stripped>".
 * @param {string} schemaText - full define text (e.g. exported schema)
 * @returns {Map<string, string>} oldName -> newName
 */
export function buildAuraPrefixRenameMap(schemaText) {
  const AURA = "aura-";
  const nonAuraNames = new Set();
  const declRe = /^(attribute|entity|relation)\s+([^,\s]+)/gm;
  let m;
  while ((m = declRe.exec(schemaText)) !== null) {
    const name = m[2].replace(/,$/, "");
    if (!name.startsWith(AURA)) {
      nonAuraNames.add(name);
    }
  }

  const auraNames = new Set();
  const auraDeclRe = /^(attribute|entity|relation)\s+(aura-[^,\s]+)/gm;
  while ((m = auraDeclRe.exec(schemaText)) !== null) {
    auraNames.add(m[2].replace(/,$/, ""));
  }

  const sorted = [...auraNames].sort((a, b) => b.length - a.length);
  /** @type {Map<string, string>} */
  const rename = new Map();

  for (const oldName of sorted) {
    const stripped = oldName.slice(AURA.length);
    const next = nonAuraNames.has(stripped) ? `migrated-${stripped}` : stripped;
    rename.set(oldName, next);
  }

  const targets = new Set(nonAuraNames);
  for (const [, to] of rename) {
    if (targets.has(to)) {
      throw new Error(`Target name collision after rename: ${to}`);
    }
    targets.add(to);
  }

  return rename;
}

/** Apply renames longest-first (whole identifiers). */
export function applyRenamesToTypeql(text, rename) {
  let out = text;
  const entries = [...rename.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of entries) {
    if (from === to) continue;
    const re = new RegExp(`\\b${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    out = out.replace(re, to);
  }
  return out;
}
