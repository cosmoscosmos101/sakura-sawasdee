/**
 * Vocab balance analysis — run with: npx tsx scripts/balanceAnalyzer.ts
 *
 * Reads all vocab content and reports quality metrics without touching IndexedDB.
 * Flags: duplicate IDs, missing mnemonics, needsReview entries, element skew.
 */

import { ALL_VOCAB } from "../src/content/allVocab";

const vocab = ALL_VOCAB;
const total = vocab.length;

const byLang: Record<string, number>    = { ja: 0, th: 0 };
const byElement: Record<string, number> = {};
const byLevel: Record<string, number>   = {};

const duplicateIds:     string[] = [];
const flaggedReview:    string[] = [];
const missingMnemonic:  string[] = [];
const noExamples:       string[] = [];

const seen = new Set<string>();

for (const v of vocab) {
  byLang[v.lang] = (byLang[v.lang] ?? 0) + 1;
  byElement[v.element] = (byElement[v.element] ?? 0) + 1;
  byLevel[v.level] = (byLevel[v.level] ?? 0) + 1;

  if (seen.has(v.id)) {
    duplicateIds.push(v.id);
  } else {
    seen.add(v.id);
  }

  if (v.needsReview) flaggedReview.push(v.id);
  if (!v.mnemonic || Object.keys(v.mnemonic).length === 0) missingMnemonic.push(v.id);
  if (!v.examples || v.examples.length === 0) noExamples.push(v.id);
}

// ── Output ────────────────────────────────────────────────────────────────────

const line = "═".repeat(48);
console.log(`\n${line}`);
console.log("  Sakura & Sawasdee — Vocab Balance Report");
console.log(line);

console.log(`\nTotal vocab entries : ${total}`);
console.log(`  Japanese (ja)     : ${byLang["ja"] ?? 0}`);
console.log(`  Thai     (th)     : ${byLang["th"] ?? 0}`);

console.log("\nElement distribution:");
const ELEMENTS = ["bloom", "spark", "flow", "echo", "stone", "light"] as const;
for (const el of ELEMENTS) {
  const count = byElement[el] ?? 0;
  const pct   = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
  const bar   = "█".repeat(Math.max(0, Math.round((count / Math.max(total, 1)) * 30)));
  console.log(`  ${el.padEnd(7)} ${String(count).padStart(4)}  ${pct.padStart(5)}%  ${bar}`);
}

console.log("\nLevel distribution:");
for (const [lvl, cnt] of Object.entries(byLevel).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  ${lvl.padEnd(12)} ${cnt}`);
}

// ── Quality flags ─────────────────────────────────────────────────────────────

console.log();
if (duplicateIds.length > 0) {
  console.log(`⚠  Duplicate IDs (${duplicateIds.length}):`);
  for (const id of duplicateIds) console.log(`   - ${id}`);
} else {
  console.log("✓  No duplicate IDs");
}

if (flaggedReview.length > 0) {
  const preview = flaggedReview.slice(0, 10).join(", ");
  const extra   = flaggedReview.length > 10 ? ` … +${flaggedReview.length - 10} more` : "";
  console.log(`⚠  needsReview (${flaggedReview.length}): ${preview}${extra}`);
} else {
  console.log("✓  No entries flagged needsReview");
}

if (missingMnemonic.length > 0) {
  console.log(`⚠  Missing mnemonics: ${missingMnemonic.length} entries`);
} else {
  console.log("✓  All entries have mnemonics");
}

if (noExamples.length > 0) {
  console.log(`⚠  Missing examples (schema violation): ${noExamples.length} entries`);
} else {
  console.log("✓  All entries have at least one example");
}

// ── Coverage warnings ─────────────────────────────────────────────────────────

console.log();
if ((byLang["ja"] ?? 0) < 100)
  console.log(`⚠  Japanese vocab (${byLang["ja"] ?? 0}) below recommended minimum of 100`);
if ((byLang["th"] ?? 0) < 100)
  console.log(`⚠  Thai vocab (${byLang["th"] ?? 0}) below recommended minimum of 100`);

const echoRatio = (byElement["echo"] ?? 0) / Math.max(total, 1);
if (echoRatio < 0.05)
  console.log(`⚠  Particle/grammar (echo) words are underrepresented — combos may be hard to form`);

console.log(`\n${line}\n`);
