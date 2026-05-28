// 日本語 Basic 850 — data schema (v0.1)
// These interfaces are the single source of truth for the dataset shape.
// The future Next.js app imports these; the validation script enforces them.

/** The six top-level learning categories. Counts are targets for the full 850. */
export type CategoryId =
  | "operations" // 操作词 / 功能词 — particles, copula, aux, demonstratives, question words, conjunctions, numbers, degree/time adverbs (target 150)
  | "verbs" // 核心动词 (target 180)
  | "things-general" // 通用 / 抽象名词 (target 220)
  | "things-picturable" // 可图示名词 / 日常实体 (target 180)
  | "qualities" // 性质词 — i-adj, na-adj, descriptive (target 100)
  | "expressions"; // 固定表达 / 寒暄 (target 20)

export type PartOfSpeech =
  | "particle"
  | "auxiliary" // です/だ/ない/た… copula & verbal auxiliaries
  | "pronoun"
  | "demonstrative"
  | "interrogative"
  | "conjunction"
  | "adverb"
  | "prefix"
  | "suffix"
  | "counter"
  | "number"
  | "noun"
  | "verb-godan" // 五段 (u-verb)
  | "verb-ichidan" // 一段 (ru-verb)
  | "verb-suru" // する複合 / 不規則 する
  | "verb-kuru" // 来る
  | "i-adjective" // 形容詞
  | "na-adjective" // 形容動詞
  | "interjection"
  | "expression"; // multi-word fixed phrase

export type Jlpt = "N5" | "N4" | "N3" | null;

/**
 * frequency_band: 1 (most frequent / earliest to teach) … 5 (least).
 * v0.1 NOTE: bands are JLPT- and teaching-frequency approximations.
 * They are NOT yet calibrated against a corpus (e.g. BCCWJ). See docs/methodology.md.
 */
export type FrequencyBand = 1 | 2 | 3 | 4 | 5;

/**
 * review status — honesty marker.
 * "verified": all fields authored & checked, including examples + learner note.
 * "draft":    backbone only (identity fields + zh gloss); rich fields may be empty / unreviewed.
 */
export type ReviewStatus = "verified" | "draft";

export interface ExampleSentence {
  jp: string; // written form, with kanji where natural
  kana: string; // full kana reading of jp
  zh: string; // 简体中文 translation
  romaji?: string; // Hepburn, optional (beginner aid)
}

export interface WordEntry {
  id: string; // stable slug, prefixed by category: op- / vb- / tg- / tp- / ql- / fx-
  lemma: string; // dictionary form (kana for words normally written in kana)
  kana: string; // reading (hiragana; katakana for loanwords)
  kanji: string | null; // common kanji form, or null if usually kana
  romaji: string; // Hepburn
  part_of_speech: PartOfSpeech;
  category: CategoryId;
  subcategory: string; // finer grouping within the category (see categories.json)
  jlpt_ref: Jlpt;
  frequency_band: FrequencyBand;
  core_kanji: string[]; // kanji from the 300-set that appear in this word (for cross-linking)
  chinese_simplified: string; // 简体 gloss
  chinese_traditional: string; // 繁體 gloss
  basic_japanese_definition: string | null; // Ogden-style: explained with basic Japanese only
  example_sentences: ExampleSentence[]; // original, simple, reuse in-scope vocab
  grammar_patterns: string[]; // PatternEntry ids this word illustrates
  chinese_learner_note: string | null; // false-friend / usage warning for 中文母语者; null if none
  audio_url: string | null; // filled by TTS pipeline later; see methodology
  tags: string[];
  review: ReviewStatus;
}

export interface KanjiExampleWord {
  word: string;
  kana: string;
  zh: string;
}

export interface KanjiEntry {
  id: string; // kj-###
  kanji: string;
  on_readings: string[]; // 音読み, katakana
  kun_readings: string[]; // 訓読み, hiragana (okurigana shown with '.')
  meaning_zh: string; // 核心意义（中文）
  meaning_en: string | null;
  grade: number | null; // 教育漢字 学年 (1-6) or null for 中学+
  jlpt_ref: Jlpt;
  stroke_count: number | null;
  example_words: KanjiExampleWord[]; // high-frequency words using this kanji (link to 850 where possible)
  chinese_note: string | null; // 与中文同形字的异同 / 简繁差异 / 误读提醒
  tags: string[];
  review: ReviewStatus;
}

export interface PatternExample {
  jp: string;
  kana: string;
  zh: string;
}

export interface PatternEntry {
  id: string; // pt-###
  name: string; // canonical skeleton, e.g. "AはBです" / "Vたいです"
  level: 1 | 2 | 3; // teaching tier (1 = earliest)
  jlpt_ref: Jlpt;
  meaning_zh: string; // 这个句型表达什么
  formation_zh: string; // 怎么造（活用/接续规则）
  examples: PatternExample[];
  related_patterns: string[]; // other pattern ids
  chinese_learner_note: string | null;
  tags: string[];
  review: ReviewStatus;
}

export interface CategoryMeta {
  id: CategoryId;
  name_ja: string;
  name_zh: string;
  name_en: string;
  target_count: number;
  description_zh: string;
  subcategories: { id: string; name_zh: string }[];
}
