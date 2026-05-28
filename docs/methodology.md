# 方法论与数据来源 · Methodology & Sources

本文件说明《日本語 Basic 850》词表是如何选词、分级与标注的，以及数据来源与授权。

## 1. 定位

这不是"把 Ogden 的 850 个英语词逐词翻成日语"。英语可按 word 计数，日语必须同时处理词、助词、助动词、活用、汉字读音与句型。

本系统面向**中文母语者**，目标是：学完 **850 个核心词条 + 300 个核心汉字 + 80 个句型**后，能理解和表达大部分日常意思，并能用简单日语解释更复杂的词。这继承 Ogden 的精神——不是覆盖所有词，而是训练用少量核心词进行解释、组合与表达。

> 它**不**承诺"学完即可无障碍读新闻、小说、论文"。

## 2. 三层结构

| 层级 | 规模 | 作用 |
| --- | ---: | --- |
| 假名与发音 | 不计入 850 | 入门前置（ひらがな・カタカナ・长音・促音・拗音） |
| 850 词条 | 850 | 学习主线，分 6 类（见 `data/categories.json`） |
| 300 核心汉字 | 300 | 嵌入词条，按构词力 / 高频读音 / 中文迁移风险挑选 |
| 80 句型 | 80 | 把词组织成可控句子 |

六类目标配额：Operations 150 · Core Verbs 180 · General Things 220 · Picturable 180 · Qualities 100 · Expressions 20 = **850**。

## 3. 选词的五个维度

每个候选词按下列维度综合打分后入选/排序（体现在 `frequency_band` 与 `tags`）：

1. **频率** —— 在日常语料/教材中的出现频率。
2. **跨场景广度** —— 能用于多少不同话题。
3. **构词 / 造句能力** —— 能否与大量词搭配（如 する・こと・もの・ある・いる 极高）。
4. **教学必要性** —— 入门教材与 JLPT N5/N4 的核心地位。
5. **中文母语者风险权重** —— 同形异义、易误读、易误用的词会被**提前**收录并重点标注（`chinese_learner_note`），即便它不是最"基础"的物品词。例如 勉強・大丈夫・結構・手紙・娘・愛人。

## 4. 数据来源与授权（重要）

原则：**词频与排序参考公开/授权数据；例句与短文全部原创；释义经人工改写。**

### 4.1 参考来源（用于选词、分级、覆盖率验证）

- **BCCWJ（现代日本語書き言葉均衡コーパス, NINJAL）** — 约 1.043 亿词的现代书面语平衡语料，含形态分析。用于词频/教材频率参考。商业用途需个案申请。
  https://clrd.ninjal.ac.jp/bccwj/en/
- **NINJAL 词表 / 汉字表研究资源** — 基于 BCCWJ 与教材语料的频率排序。
  https://clrd.ninjal.ac.jp/bccwj/en/freq-list.html
- **JLPT N5/N4 参考词表** — 作为"最小表达系统"的边界参考，**不**等同于本词表。
- **EDRDG · JMdict / KANJIDIC2** — 词典与汉字读音/义/学年/频率字段，用于辅助生成。使用须 **署名（attribution）**，衍生数据注意 **ShareAlike** 条件。
  https://www.edrdg.org/edrdg/licence.html · https://www.edrdg.org/wiki/KANJIDIC_Project.html

### 4.2 本仓库实际产出的授权立场

- 所有 `example_sentences`、阅读短文 **均为原创**，不从受版权保护语料中摘抄。
- `chinese_simplified` / `chinese_traditional` / `basic_japanese_definition` / `chinese_learner_note` 为**人工改写**的释义，不直接复制词典文本。
- 若后续引入 JMdict/KANJIDIC2 派生字段，需在发布物中加入 EDRDG 署名并遵守其许可。
- 网站上线时应设 About / Sources 页，列出全部来源与许可证。

## 5. v0.1 的诚实声明（已知局限）

- **`frequency_band` 尚未用语料校准。** 本环境无法直接查询 BCCWJ；v0.1 的频率分级是基于 JLPT 等级与公认教学频率的**近似值**，待接入真实语料后重排。
- **`review` 字段标注真实状态。** `"verified"` = 全字段已撰写并核对（含例句与陷阱注）；`"draft"` = 仅骨架（身份字段 + 中文释义），富字段可能为空或未核对。**v0.1 实际只收录 `verified` 词条**（372 条，覆盖全部 6 类），不以 `draft` 占位条目充数；剩余至 850 的词条留待 v0.2 补充。`draft` 状态保留在 schema 中，供后续增量录入时标注「已列入词表但尚未充实」之用。
- **`audio_url` 暂为 `null`。** 计划用 TTS（如 VOICEVOX / 商用日语 TTS）批量生成，按 `kana` 字段合成；需遵守对应 TTS 的授权。
- 汉字 `stroke_count` / `radical` 等字段如缺失记为 `null`，不臆造。

## 6. 数据如何被前端消费

前端（Next.js）只读取 `data/` 下的 JSON 渲染：
- `data/categories.json` — 分类与子类元数据
- `data/words/*.json` — 6 个分类的词条数组
- `data/kanji.json` — 300 核心汉字
- `data/patterns.json` — 80 句型

`data/types.ts` 是 schema 的唯一真相来源；`scripts/validate.mjs` 校验一致性（id 唯一、必填字段、分类合法、交叉引用存在）。
