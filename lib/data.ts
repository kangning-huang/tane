import categoriesJson from "@/data/categories.json";
import operations from "@/data/words/01-operations.json";
import verbs from "@/data/words/02-verbs.json";
import thingsGeneral from "@/data/words/03-things-general.json";
import thingsPicturable from "@/data/words/04-things-picturable.json";
import qualities from "@/data/words/05-qualities.json";
import expressions from "@/data/words/06-expressions.json";
import kanjiJson from "@/data/kanji.json";
import patternsJson from "@/data/patterns.json";
import type { WordEntry, KanjiEntry, PatternEntry, CategoryMeta } from "@/data/types";

// JSON imports widen string fields to `string`; cast through unknown to the
// authored schema types. The validate script (scripts/validate.mjs) guards
// that the data actually conforms.
export const words = [
  ...operations,
  ...verbs,
  ...thingsGeneral,
  ...thingsPicturable,
  ...qualities,
  ...expressions,
] as unknown as WordEntry[];

export const kanji = kanjiJson as unknown as KanjiEntry[];
export const patterns = patternsJson as unknown as PatternEntry[];
export const categories = categoriesJson as unknown as CategoryMeta[];
