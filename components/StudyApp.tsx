"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  WordEntry,
  KanjiEntry,
  PatternEntry,
  CategoryMeta,
} from "@/data/types";

type Props = {
  words: WordEntry[];
  kanji: KanjiEntry[];
  patterns: PatternEntry[];
  categories: CategoryMeta[];
};

type Script = "simp" | "trad";
type Mode = "cards" | "list";

const TABS = [
  { id: "all", label: "全部", sub: "All" },
  { id: "operations", label: "操作词", sub: "Operations" },
  { id: "verbs", label: "动词", sub: "Verbs" },
  { id: "things-general", label: "抽象名词", sub: "General" },
  { id: "things-picturable", label: "实物名词", sub: "Picturable" },
  { id: "qualities", label: "性质词", sub: "Qualities" },
  { id: "expressions", label: "固定表达", sub: "Expressions" },
  { id: "kanji", label: "汉字", sub: "Kanji" },
  { id: "pitfalls", label: "易混淆", sub: "Pitfalls" },
  { id: "patterns", label: "句型", sub: "Patterns" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function Speaker({ text, lg }: { text: string; lg?: boolean }) {
  return (
    <button
      className={lg ? "speak lg" : "speak"}
      title="发音"
      aria-label="发音"
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
    >
      🔊
    </button>
  );
}

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function StudyApp({
  words,
  kanji,
  patterns,
  categories,
}: Props) {
  const [mode, setMode] = useState<Mode>("cards");
  const [tab, setTab] = useState<TabId>("all");
  const [script, setScript] = useState<Script>("simp");
  const [shuffle, setShuffle] = useState(false);
  const [seed, setSeed] = useState(0);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [query, setQuery] = useState("");

  const patternName = useMemo(() => {
    const m = new Map<string, string>();
    patterns.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [patterns]);

  const wordsByCat = useMemo(() => {
    const m = new Map<string, WordEntry[]>();
    words.forEach((w) => {
      const arr = m.get(w.category);
      if (arr) arr.push(w);
      else m.set(w.category, [w]);
    });
    return m;
  }, [words]);

  const curMode: "word" | "kanji" | "pattern" =
    tab === "kanji" ? "kanji" : tab === "patterns" ? "pattern" : "word";

  const deck = useMemo<(WordEntry | KanjiEntry | PatternEntry)[]>(() => {
    if (tab === "kanji") return kanji;
    if (tab === "patterns") return patterns;
    if (tab === "all") return words;
    if (tab === "pitfalls")
      return words.filter(
        (w) => w.chinese_learner_note || w.tags.includes("false-friend"),
      );
    return words.filter((w) => w.category === tab);
  }, [tab, words, kanji, patterns]);

  const order = useMemo(() => {
    void seed; // reshuffle trigger
    return shuffle ? shuffled(deck.length) : deck.map((_, i) => i);
  }, [deck, shuffle, seed]);

  const total = deck.length;
  const safeIndex = total ? Math.min(index, total - 1) : 0;
  const current = total ? deck[order[safeIndex]] : undefined;

  const selectTab = useCallback((id: TabId) => {
    setTab(id);
    setIndex(0);
    setFlipped(false);
  }, []);

  const toggleScript = useCallback(
    () => setScript((s) => (s === "simp" ? "trad" : "simp")),
    [],
  );

  const go = useCallback(
    (delta: number) => {
      if (!total) return;
      setFlipped(false);
      setIndex((i) => (i + delta + total) % total);
    },
    [total],
  );

  const flip = useCallback(() => setFlipped((f) => !f), []);

  // jump from the overview list straight to a card
  const jumpToWord = useCallback(
    (id: string) => {
      const w = words.find((x) => x.id === id);
      if (!w) return;
      const list = words.filter((x) => x.category === w.category);
      const idx = list.findIndex((x) => x.id === id);
      setShuffle(false);
      setTab(w.category as TabId);
      setIndex(idx < 0 ? 0 : idx);
      setFlipped(false);
      setQuery("");
      setMode("cards");
      if (typeof window !== "undefined")
        window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [words],
  );

  const jumpToKanji = useCallback(
    (id: string) => {
      const idx = kanji.findIndex((k) => k.id === id);
      setShuffle(false);
      setTab("kanji");
      setIndex(idx < 0 ? 0 : idx);
      setFlipped(false);
      setQuery("");
      setMode("cards");
      if (typeof window !== "undefined")
        window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [kanji],
  );

  const jumpToPattern = useCallback(
    (id: string) => {
      const idx = patterns.findIndex((p) => p.id === id);
      setShuffle(false);
      setTab("patterns");
      setIndex(idx < 0 ? 0 : idx);
      setFlipped(false);
      setQuery("");
      setMode("cards");
      if (typeof window !== "undefined")
        window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [patterns],
  );

  // keyboard navigation — only active in card mode (so typing in search works)
  useEffect(() => {
    if (mode !== "cards") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flip();
      } else if (e.key.toLowerCase() === "s") setShuffle((s) => !s);
      else if (e.key.toLowerCase() === "t") toggleScript();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, go, flip, toggleScript]);

  // ---- search (list mode) ----
  const q = query.trim().toLowerCase();
  const wordHits = q
    ? words.filter((w) =>
        `${w.lemma} ${w.kana} ${w.romaji} ${w.kanji ?? ""} ${w.chinese_simplified} ${w.chinese_traditional}`
          .toLowerCase()
          .includes(q),
      )
    : [];
  const kanjiHits = q
    ? kanji.filter((k) =>
        `${k.kanji} ${k.on_readings.join(" ")} ${k.kun_readings.join(" ")} ${k.meaning_zh}`
          .toLowerCase()
          .includes(q),
      )
    : [];
  const patternHits = q
    ? patterns.filter((p) =>
        `${p.name} ${p.meaning_zh}`.toLowerCase().includes(q),
      )
    : [];

  const wordItem = (w: WordEntry) => (
    <button
      key={w.id}
      className="idx-item"
      onClick={() => jumpToWord(w.id)}
      title="跳到这张卡片"
    >
      <span className="il">{w.lemma}</span>
      {w.kana !== w.lemma && <span className="ik">{w.kana}</span>}
      <span className="iz">
        {script === "trad" ? w.chinese_traditional : w.chinese_simplified}
      </span>
    </button>
  );

  const kanjiItem = (k: KanjiEntry) => (
    <button
      key={k.id}
      className="idx-item kanji"
      onClick={() => jumpToKanji(k.id)}
      title="跳到这张卡片"
    >
      <span className="ki">{k.kanji}</span>
      <span className="kz">{k.meaning_zh}</span>
    </button>
  );

  const patternItem = (p: PatternEntry) => (
    <button
      key={p.id}
      className="idx-item"
      onClick={() => jumpToPattern(p.id)}
      title="跳到这张卡片"
    >
      <span className="il">{p.name}</span>
      <span className="iz">{p.meaning_zh}</span>
    </button>
  );

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1 className="app-title">
            種 <span>种子日语</span>
          </h1>
          <p className="app-sub">
            面向中文母语者的最小日语学习系统 · v0.1（{words.length} 词 ·{" "}
            {kanji.length} 汉字 · {patterns.length} 句型）
          </p>
        </div>
      </header>

      <div className="modebar">
        <button
          className={`btn${mode === "list" ? " on" : ""}`}
          onClick={() => setMode((m) => (m === "cards" ? "list" : "cards"))}
        >
          {mode === "cards" ? "📋 总览列表" : "🃏 卡片学习"}
        </button>
        <button className="btn" onClick={toggleScript} title="简体 / 繁体（T）">
          {script === "simp" ? "简体" : "繁體"}
        </button>
      </div>

      {mode === "list" ? (
        <section className="list-view">
          <div className="search">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索：词 / 假名 / 罗马音 / 汉字 / 中文…"
              aria-label="搜索"
            />
          </div>

          {q ? (
            wordHits.length + kanjiHits.length + patternHits.length === 0 ? (
              <div className="search-empty">没有找到「{query}」。</div>
            ) : (
              <>
                {wordHits.length > 0 && (
                  <div className="idx-cat">
                    <div className="search-group-h">词 · {wordHits.length}</div>
                    <div className="idx-grid">{wordHits.map(wordItem)}</div>
                  </div>
                )}
                {kanjiHits.length > 0 && (
                  <div className="idx-cat">
                    <div className="search-group-h">
                      汉字 · {kanjiHits.length}
                    </div>
                    <div className="idx-grid kanji">
                      {kanjiHits.map(kanjiItem)}
                    </div>
                  </div>
                )}
                {patternHits.length > 0 && (
                  <div className="idx-cat">
                    <div className="search-group-h">
                      句型 · {patternHits.length}
                    </div>
                    <div className="idx-grid">
                      {patternHits.map(patternItem)}
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            <>
              {categories.map((cat) => {
                const catWords = wordsByCat.get(cat.id) ?? [];
                if (catWords.length === 0) return null;
                const seen = new Set<string>();
                return (
                  <section className="idx-cat" key={cat.id}>
                    <h3 className="idx-cat-h">
                      {cat.name_zh}
                      <small>
                        {cat.name_en} · {catWords.length}
                      </small>
                    </h3>
                    {cat.subcategories.map((sc) => {
                      const items = catWords.filter(
                        (w) => w.subcategory === sc.id,
                      );
                      items.forEach((w) => seen.add(w.id));
                      if (items.length === 0) return null;
                      return (
                        <div className="idx-sub" key={sc.id}>
                          <h4 className="idx-sub-h">{sc.name_zh}</h4>
                          <div className="idx-grid">{items.map(wordItem)}</div>
                        </div>
                      );
                    })}
                    {(() => {
                      const rest = catWords.filter((w) => !seen.has(w.id));
                      return rest.length ? (
                        <div className="idx-sub">
                          <div className="idx-grid">{rest.map(wordItem)}</div>
                        </div>
                      ) : null;
                    })()}
                  </section>
                );
              })}

              <section className="idx-cat">
                <h3 className="idx-cat-h">
                  汉字<small>Kanji · {kanji.length}</small>
                </h3>
                <div className="idx-grid kanji">{kanji.map(kanjiItem)}</div>
              </section>

              <section className="idx-cat">
                <h3 className="idx-cat-h">
                  句型<small>Patterns · {patterns.length}</small>
                </h3>
                <div className="idx-grid">{patterns.map(patternItem)}</div>
              </section>
            </>
          )}
        </section>
      ) : (
        <>
          <nav className="tabs" aria-label="分类">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab${tab === t.id ? " active" : ""}`}
                onClick={() => selectTab(t.id)}
              >
                {t.label}
                <small>{t.sub}</small>
              </button>
            ))}
          </nav>

          <div className="controls">
            <button
              className={`btn${shuffle ? " on" : ""}`}
              onClick={() => {
                setShuffle((s) => !s);
                setSeed((n) => n + 1);
                setIndex(0);
                setFlipped(false);
              }}
              title="随机顺序（S）"
            >
              🔀 随机
            </button>
            {shuffle && (
              <button
                className="btn"
                onClick={() => {
                  setSeed((n) => n + 1);
                  setIndex(0);
                  setFlipped(false);
                }}
                title="重新洗牌"
              >
                ♻︎ 重洗
              </button>
            )}
            <span className="spacer" />
            <span className="progress">
              {total ? safeIndex + 1 : 0} / {total}
            </span>
          </div>

          {!current ? (
            <div className="empty">这一类暂时没有词条。</div>
          ) : (
            <>
              <div className="scene">
                <div
                  className={`card${flipped ? " flipped" : ""}`}
                  onClick={flip}
                  role="button"
                  tabIndex={-1}
                >
                  <div className="face front">
                    {curMode === "word" && renderWordFront(current as WordEntry)}
                    {curMode === "kanji" &&
                      renderKanjiFront(current as KanjiEntry)}
                    {curMode === "pattern" &&
                      renderPatternFront(current as PatternEntry)}
                  </div>
                  <div className="face back">
                    {curMode === "word" &&
                      renderWordBack(current as WordEntry, script, patternName)}
                    {curMode === "kanji" &&
                      renderKanjiBack(current as KanjiEntry)}
                    {curMode === "pattern" &&
                      renderPatternBack(current as PatternEntry)}
                  </div>
                </div>
              </div>

              <div className="nav">
                <button className="btn" onClick={() => go(-1)}>
                  ◀ 上一个
                </button>
                <button className="btn primary" onClick={flip}>
                  {flipped ? "看正面" : "翻转 / 看答案"}
                </button>
                <button className="btn" onClick={() => go(1)}>
                  下一个 ▶
                </button>
              </div>
            </>
          )}

          <p className="foot">
            快捷键：<kbd>←</kbd> <kbd>→</kbd> 切换 · <kbd>空格</kbd> 翻转 ·{" "}
            <kbd>S</kbd> 随机 · <kbd>T</kbd> 简繁 ｜ 点击卡片也可翻转
          </p>
        </>
      )}
    </main>
  );
}

/* ------------------------------ word ------------------------------ */
function renderWordFront(w: WordEntry) {
  return (
    <div className="front-center">
      <span className="face-tag">{posLabel(w.part_of_speech)}</span>
      <div className="term">{w.lemma}</div>
      {w.kana !== w.lemma && <div className="reading">{w.kana}</div>}
      <div className="romaji">{w.romaji}</div>
      <div className="meta-row">
        {w.jlpt_ref && <span className="chip jlpt">{w.jlpt_ref}</span>}
        <span className="chip gray">{w.subcategory}</span>
      </div>
      <Speaker text={w.kana} lg />
      <div className="flip-hint">点击查看释义</div>
    </div>
  );
}

function renderWordBack(
  w: WordEntry,
  script: Script,
  patternName: Map<string, string>,
) {
  const gloss = script === "trad" ? w.chinese_traditional : w.chinese_simplified;
  return (
    <div>
      <span className="face-tag">{w.lemma}</span>
      <div className="gloss">{gloss}</div>
      {w.basic_japanese_definition && (
        <div className="section">
          <h4>日本語で</h4>
          <div className="def">{w.basic_japanese_definition}</div>
        </div>
      )}
      {w.example_sentences.length > 0 && (
        <div className="section">
          <h4>例文</h4>
          {w.example_sentences.map((ex, i) => (
            <div className="example" key={i}>
              <div className="jp">
                <span>{ex.jp}</span>
                <Speaker text={ex.jp} />
              </div>
              <div className="kana">{ex.kana}</div>
              <div className="zh">{ex.zh}</div>
            </div>
          ))}
        </div>
      )}
      {w.grammar_patterns.length > 0 && (
        <div className="section">
          <h4>句型</h4>
          <div className="tags">
            {w.grammar_patterns.map((id) => (
              <span className="chip" key={id}>
                {patternName.get(id) ?? id}
              </span>
            ))}
          </div>
        </div>
      )}
      {w.chinese_learner_note && (
        <div className="section">
          <div className="note">
            <strong>⚠ 中文母语者注意</strong>
            {w.chinese_learner_note}
          </div>
        </div>
      )}
      {w.tags.length > 0 && (
        <div className="tags">
          {w.tags.map((t) => (
            <span className="chip gray" key={t}>
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ kanji ------------------------------ */
function renderKanjiFront(k: KanjiEntry) {
  return (
    <div className="front-center">
      <span className="face-tag">汉字</span>
      <div className="term" style={{ fontSize: "clamp(80px,20vw,160px)" }}>
        {k.kanji}
      </div>
      <div className="romaji">
        {k.on_readings.join("・")}
        {k.on_readings.length && k.kun_readings.length ? " / " : ""}
        {k.kun_readings.join("・")}
      </div>
      <Speaker text={k.example_words[0]?.kana ?? k.kanji} lg />
      <div className="flip-hint">点击查看读音与释义</div>
    </div>
  );
}

function renderKanjiBack(k: KanjiEntry) {
  return (
    <div>
      <span className="face-tag">{k.kanji}</span>
      <div className="gloss">{k.meaning_zh}</div>
      <div className="meta-row" style={{ justifyContent: "flex-start" }}>
        {k.jlpt_ref && <span className="chip jlpt">{k.jlpt_ref}</span>}
        {k.grade != null && <span className="chip gray">教育 {k.grade} 年</span>}
        {k.stroke_count != null && (
          <span className="chip gray">{k.stroke_count} 画</span>
        )}
      </div>
      <div className="section">
        <div className="kv">
          <span className="k">音読み</span>
          <span>{k.on_readings.join("・") || "—"}</span>
        </div>
        <div className="kv">
          <span className="k">訓読み</span>
          <span>{k.kun_readings.join("・") || "—"}</span>
        </div>
      </div>
      {k.example_words.length > 0 && (
        <div className="section">
          <h4>例語</h4>
          {k.example_words.map((ex, i) => (
            <div className="example" key={i}>
              <div className="jp">
                <span>
                  {ex.word}
                  <span className="kana">（{ex.kana}）</span>
                </span>
                <Speaker text={ex.kana} />
              </div>
              <div className="zh">{ex.zh}</div>
            </div>
          ))}
        </div>
      )}
      {k.chinese_note && (
        <div className="section">
          <div className="note">
            <strong>⚠ 中文母语者注意</strong>
            {k.chinese_note}
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- pattern ----------------------------- */
function renderPatternFront(p: PatternEntry) {
  return (
    <div className="front-center">
      <span className="face-tag">句型 · L{p.level}</span>
      <div className="term" style={{ fontSize: "clamp(30px,6vw,52px)" }}>
        {p.name}
      </div>
      <div className="meta-row">
        {p.jlpt_ref && <span className="chip jlpt">{p.jlpt_ref}</span>}
      </div>
      <div className="section" style={{ maxWidth: 520, margin: "16px auto 0" }}>
        <div className="def">{p.meaning_zh}</div>
      </div>
      <div className="flip-hint">点击查看接续与例句</div>
    </div>
  );
}

function renderPatternBack(p: PatternEntry) {
  return (
    <div>
      <span className="face-tag">{p.name}</span>
      <div className="section">
        <h4>怎么造</h4>
        <div className="def">{p.formation_zh}</div>
      </div>
      {p.examples.length > 0 && (
        <div className="section">
          <h4>例文</h4>
          {p.examples.map((ex, i) => (
            <div className="example" key={i}>
              <div className="jp">
                <span>{ex.jp}</span>
                <Speaker text={ex.jp} />
              </div>
              <div className="kana">{ex.kana}</div>
              <div className="zh">{ex.zh}</div>
            </div>
          ))}
        </div>
      )}
      {p.chinese_learner_note && (
        <div className="section">
          <div className="note">
            <strong>⚠ 中文母语者注意</strong>
            {p.chinese_learner_note}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ utils ------------------------------ */
function posLabel(pos: string): string {
  const map: Record<string, string> = {
    particle: "助词",
    auxiliary: "助动词",
    pronoun: "代词",
    demonstrative: "指示词",
    interrogative: "疑问词",
    conjunction: "连词",
    adverb: "副词",
    prefix: "前缀",
    suffix: "后缀",
    counter: "量词",
    number: "数词",
    noun: "名词",
    "verb-godan": "五段动词",
    "verb-ichidan": "一段动词",
    "verb-suru": "する动词",
    "verb-kuru": "カ变动词",
    "i-adjective": "い形容词",
    "na-adjective": "な形容词",
    interjection: "感叹词",
    expression: "固定表达",
  };
  return map[pos] ?? pos;
}
