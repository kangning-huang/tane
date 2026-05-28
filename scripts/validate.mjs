#!/usr/bin/env node
// Validates the Basic 850 dataset for internal consistency.
// Run: node scripts/validate.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");
const WORDS_DIR = join(DATA, "words");

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    err(`Cannot parse JSON: ${p}\n    ${e.message}`);
    return null;
  }
};

const CATEGORY_IDS = [
  "operations",
  "verbs",
  "things-general",
  "things-picturable",
  "qualities",
  "expressions",
];
const ID_PREFIX = {
  operations: "op-",
  verbs: "vb-",
  "things-general": "tg-",
  "things-picturable": "tp-",
  qualities: "ql-",
  expressions: "fx-",
};
const POS = new Set([
  "particle", "auxiliary", "pronoun", "demonstrative", "interrogative",
  "conjunction", "adverb", "prefix", "suffix", "counter", "number", "noun",
  "verb-godan", "verb-ichidan", "verb-suru", "verb-kuru",
  "i-adjective", "na-adjective", "interjection", "expression",
]);
const JLPT = new Set(["N5", "N4", "N3", null]);
const REVIEW = new Set(["verified", "draft"]);

const WORD_REQUIRED = [
  "id", "lemma", "kana", "kanji", "romaji", "part_of_speech", "category",
  "subcategory", "jlpt_ref", "frequency_band", "core_kanji",
  "chinese_simplified", "chinese_traditional", "basic_japanese_definition",
  "example_sentences", "grammar_patterns", "chinese_learner_note",
  "audio_url", "tags", "review",
];

// --- load category meta ---
const categories = readJson(join(DATA, "categories.json")) || [];
const catById = new Map(categories.map((c) => [c.id, c]));
for (const id of CATEGORY_IDS) {
  if (!catById.has(id)) err(`categories.json missing category "${id}"`);
}
const subcatsByCat = new Map(
  categories.map((c) => [c.id, new Set((c.subcategories || []).map((s) => s.id))])
);

// --- load kanji + patterns for cross-refs ---
const kanji = existsSync(join(DATA, "kanji.json")) ? readJson(join(DATA, "kanji.json")) || [] : [];
const patterns = existsSync(join(DATA, "patterns.json")) ? readJson(join(DATA, "patterns.json")) || [] : [];
const kanjiSet = new Set(kanji.map((k) => k.kanji));
const patternIds = new Set(patterns.map((p) => p.id));

// --- load all word files ---
const allWords = [];
const seenIds = new Set();
const wordFiles = existsSync(WORDS_DIR)
  ? readdirSync(WORDS_DIR).filter((f) => f.endsWith(".json")).sort()
  : [];

for (const f of wordFiles) {
  const arr = readJson(join(WORDS_DIR, f));
  if (!Array.isArray(arr)) {
    err(`${f}: expected a JSON array`);
    continue;
  }
  arr.forEach((w, i) => {
    const where = `${f}[${i}]${w && w.id ? ` id=${w.id}` : ""}`;
    if (!w || typeof w !== "object") return err(`${where}: not an object`);
    for (const k of WORD_REQUIRED) {
      if (!(k in w)) err(`${where}: missing field "${k}"`);
    }
    if (w.id) {
      if (seenIds.has(w.id)) err(`${where}: duplicate id`);
      seenIds.add(w.id);
    }
    if (!CATEGORY_IDS.includes(w.category)) err(`${where}: bad category "${w.category}"`);
    else if (w.id && !w.id.startsWith(ID_PREFIX[w.category]))
      err(`${where}: id should start with "${ID_PREFIX[w.category]}"`);
    if (w.category && subcatsByCat.has(w.category) && w.subcategory &&
        !subcatsByCat.get(w.category).has(w.subcategory))
      warn(`${where}: subcategory "${w.subcategory}" not declared in categories.json`);
    if (!POS.has(w.part_of_speech)) err(`${where}: bad part_of_speech "${w.part_of_speech}"`);
    if (!JLPT.has(w.jlpt_ref)) err(`${where}: bad jlpt_ref "${w.jlpt_ref}"`);
    if (![1, 2, 3, 4, 5].includes(w.frequency_band)) err(`${where}: bad frequency_band`);
    if (!REVIEW.has(w.review)) err(`${where}: bad review "${w.review}"`);
    if (!Array.isArray(w.example_sentences)) err(`${where}: example_sentences must be array`);
    else w.example_sentences.forEach((s, j) => {
      if (!s.jp || !s.kana || !s.zh) err(`${where}: example[${j}] needs jp/kana/zh`);
    });
    if (Array.isArray(w.grammar_patterns))
      w.grammar_patterns.forEach((pid) => {
        if (patternIds.size && !patternIds.has(pid))
          warn(`${where}: grammar_pattern "${pid}" not found in patterns.json`);
      });
    if (Array.isArray(w.core_kanji))
      w.core_kanji.forEach((kj) => {
        if (kanjiSet.size && !kanjiSet.has(kj))
          warn(`${where}: core_kanji "${kj}" not in kanji.json (300-set)`);
      });
    if (w.review === "verified") {
      if (!w.basic_japanese_definition) warn(`${where}: verified but no basic_japanese_definition`);
      if (!w.example_sentences || w.example_sentences.length === 0)
        warn(`${where}: verified but no example_sentences`);
    }
    allWords.push(w);
  });
}

// --- kanji checks ---
const seenKanjiIds = new Set();
kanji.forEach((k, i) => {
  const where = `kanji.json[${i}]${k && k.id ? ` id=${k.id}` : ""}`;
  for (const f of ["id", "kanji", "on_readings", "kun_readings", "meaning_zh", "review"])
    if (!(f in k)) err(`${where}: missing "${f}"`);
  if (k.id) {
    if (seenKanjiIds.has(k.id)) err(`${where}: duplicate id`);
    seenKanjiIds.add(k.id);
  }
  if (k.review && !REVIEW.has(k.review)) err(`${where}: bad review`);
});

// --- pattern checks ---
const seenPatIds = new Set();
patterns.forEach((p, i) => {
  const where = `patterns.json[${i}]${p && p.id ? ` id=${p.id}` : ""}`;
  for (const f of ["id", "name", "level", "meaning_zh", "formation_zh", "examples", "review"])
    if (!(f in p)) err(`${where}: missing "${f}"`);
  if (p.id) {
    if (seenPatIds.has(p.id)) err(`${where}: duplicate id`);
    seenPatIds.add(p.id);
  }
});

// --- summary ---
const counts = {};
for (const id of CATEGORY_IDS) counts[id] = { total: 0, verified: 0 };
for (const w of allWords) {
  if (counts[w.category]) {
    counts[w.category].total++;
    if (w.review === "verified") counts[w.category].verified++;
  }
}

console.log("\n=== 日本語 Basic 850 — dataset report ===\n");
let total = 0, verified = 0;
for (const id of CATEGORY_IDS) {
  const c = counts[id];
  const target = catById.get(id)?.target_count ?? "?";
  total += c.total;
  verified += c.verified;
  console.log(
    `  ${id.padEnd(18)} ${String(c.total).padStart(3)}/${String(target).padEnd(3)} 词` +
    `  (verified ${c.verified}, draft ${c.total - c.verified})`
  );
}
console.log(`  ${"—".repeat(46)}`);
console.log(`  words total        ${total}/850  (verified ${verified})`);
console.log(`  kanji              ${kanji.length}/300`);
console.log(`  patterns           ${patterns.length}/80\n`);

if (warnings.length) {
  console.log(`⚠ ${warnings.length} warning(s):`);
  warnings.slice(0, 40).forEach((w) => console.log(`  - ${w}`));
  if (warnings.length > 40) console.log(`  … and ${warnings.length - 40} more`);
  console.log("");
}
if (errors.length) {
  console.log(`✗ ${errors.length} error(s):`);
  errors.forEach((e) => console.log(`  - ${e}`));
  console.log("");
  process.exit(1);
}
console.log("✓ no errors\n");
