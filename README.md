# 日本語 Basic 850

面向**中文母语者**的最小日语学习系统，灵感来自 Ogden 的 Basic English 850。
目标：用最小词汇、最小汉字、最小句型，覆盖日常的**理解与表达**。

> 学完 **850 词条 + 300 核心汉字 + 80 句型**后，能理解和表达大部分日常意思，并能用简单日语解释更复杂的词。
> 这不是"学完即可无障碍读新闻/小说/论文"——而是 Ogden 式的"用少量核心词进行解释、组合与表达"。

本仓库当前阶段 = **v0.1 数据集 + Next.js 卡片学习前端**（数据驱动渲染）。

## 运行前端（Web）

```bash
npm install
npm run dev      # 开发服务器 http://localhost:3000
# 或：npm run build && npm run start   生产构建
```

前端是数据驱动的卡片学习应用，直接读取 `data/` 下的 JSON：

- **分类标签**：全部 / 操作词 / 动词 / 抽象名词 / 实物名词 / 性质词 / 固定表达 / 汉字 / 易混淆 / 句型
- **翻卡学习**：正面显示词形·假名·罗马音·发音；背面显示中文释义、基础日语解释、例句、句型、中文母语者陷阱注
- **简 / 繁切换**、**随机顺序（洗牌）**、**键盘操作**（← → 切换、空格翻转、S 随机、T 简繁）
- **自动发音**：浏览器 Web Speech API（`ja-JP`），无需音频文件
- **「易混淆」视图**：自动汇集所有带中文母语者陷阱注 / false-friend 标签的词

## 仓库结构

```
app/                # Next.js App Router（layout / page / globals.css）
components/
  StudyApp.tsx      # 卡片学习主组件（标签 / 翻卡 / 简繁 / 随机 / 键盘 / TTS）
lib/
  data.ts           # 读取并合并 data/ 下的 JSON，按 types.ts 定型
data/
  types.ts          # schema 唯一真相来源（TypeScript 接口）
  categories.json   # 6 大分类 + 子类元数据
  words/            # 词条数组，按分类拆分
    01-operations.json        操作词 / 功能词  (目标 150)
    02-verbs.json             核心动词        (目标 180)
    03-things-general.json    通用 / 抽象名词  (目标 220)
    04-things-picturable.json 可图示名词       (目标 180)
    05-qualities.json         性质词          (目标 100)
    06-expressions.json       固定表达        (目标 20)
  kanji.json        # 300 核心汉字
  patterns.json     # 80 句型
docs/
  methodology.md    # 选词标准、数据来源与授权、v0.1 诚实声明
scripts/
  validate.mjs      # 数据一致性校验（id 唯一 / 必填 / 交叉引用）
```

## 词条字段（节选，完整见 `data/types.ts`）

| 字段 | 说明 |
| --- | --- |
| `id` | 稳定 slug，按分类加前缀（op- / vb- / tg- / tp- / ql- / fx-） |
| `lemma` / `kana` / `kanji` / `romaji` | 词形、假名读音、汉字形（无则 null）、罗马音 |
| `part_of_speech` / `category` / `subcategory` | 词性、分类、子类 |
| `jlpt_ref` / `frequency_band` | JLPT 参考级、频率带（v0.1 为近似值，见 methodology） |
| `core_kanji` | 该词用到的、属于 300 字集的汉字（用于交叉链接） |
| `chinese_simplified` / `chinese_traditional` | 简 / 繁中文释义 |
| `basic_japanese_definition` | 用基础日语解释自身（Ogden 式） |
| `example_sentences` | 原创例句（jp / kana / zh） |
| `grammar_patterns` | 该词示范的句型 id |
| `chinese_learner_note` | **中文母语者陷阱**（同形异义 / 误读 / 误用），无则 null |
| `audio_url` | TTS 生成，v0.1 暂为 null |
| `review` | `verified`（全字段已核对）/ `draft`（仅骨架待充实） |

## v0.1 状态

完整产出：分类 / schema / 校验脚本 / 方法论与授权文档。本期**只收录已逐字核对的 `verified` 词条**（不塞未核对的占位条目）——质量优先于数量。

| 层级 | 本期 | 目标 |
| --- | ---: | ---: |
| Operations 操作词 | 107 | 150 |
| Core Verbs 核心动词 | 70 | 180 |
| General Things 通用/抽象名词 | 55 | 220 |
| Picturable Things 可图示名词 | 60 | 180 |
| Qualities 性质词 | 60 | 100 |
| Fixed Expressions 固定表达 | 20 | 20 |
| **词条合计** | **372** | **850** |
| 核心汉字 | 111 | 300 |
| 句型 | 50 | 80 |

运行 `node scripts/validate.mjs` 可随时核对上表与数据一致性（当前 0 错误、0 交叉引用警告）。

**诚实声明**：
- 本期所有词条均为 `verified`（全字段已撰写并核对，含例句与中文母语者陷阱注）；尚未铺到 850，剩余词条留待 v0.2，不以 `draft` 占位。
- `frequency_band` 尚未用 BCCWJ 校准，为 JLPT/教学频率近似值。
- 汉字的 `grade` / `stroke_count` 为人工录入，v1.0 前应对照 KANJIDIC2 校验。
- `audio_url` 暂为 `null`，待 TTS 流程生成。
- 详见 [`docs/methodology.md`](docs/methodology.md)。

## 路线图

- **v0.1（当前）** 372 个 verified 词条 + 111 汉字 + 50 句型 + 完整 schema/校验/文档。
- **v0.2** 补齐至 850 词条 / 300 汉字 / 80 句型；接入 BCCWJ 频率校准；生成 TTS 音频。
- **前端（已上线 MVP）** 卡片 / 汉字 / 句型 / 易混淆视图，简繁切换、随机复习、键盘操作、浏览器 TTS。
- **前端（待办）** 阅读模式（只用已学词的短文）、学习进度持久化（localStorage）、搜索、ruby 注音、深色模式。

数据来源与授权见 [`docs/methodology.md`](docs/methodology.md)。
