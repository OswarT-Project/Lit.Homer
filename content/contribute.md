---
title: 添加条目
description: 没有后台，也不需要有。所有内容都是 content/ 里的一个 Markdown 文件。
---

## 步骤

1. **新建一个 Markdown 文件。**放进 `content/entries/`，文件名用英文小写连字符（它会成为网址），例如 `disco-elysium-dostoevsky.md`。
2. **填 frontmatter 与正文。**顶部 YAML 是结构化字段，后面是正文段落。也可以用 Nuxt Studio 在网页上直接编辑，字段会自动生成表单。
3. **按模板改字段。**`category` 对应 `content/categories/` 里的文件名；`series`、`related` 写文件名（slug）。
4. **保存，刷新。**首页统计、索引、专题进度会自动更新。

## 条目模板

```yaml [content/entries/short-slug.md]
---
title: 《游戏》与《著作》：副标题
description: 一句话概述，会显示在列表与搜索结果里。
category: quote
relation: 引用          # 引用 | 化用 | 同源，可省略
origin: human           # human 成员撰写 | ai AI 草稿
series: limbus          # 可选：content/series/ 里的文件名
game:
  title: 游戏名
  year: "2020"
  studio: 工作室
work:
  title: 著作名
  author: 作者
  year: "1854"
  medium: book          # content/media/ 里的文件名；省略即书
tags:
  - 关键词
updated: 2026-11-03
quote:
  text: 引文（中文）
  original: 原文
  lang: 英
  source: 出处：卷 / 章 / 节
  note: 译者与译本说明
notes:
  - label: 版本
    text: ……
related:
  - 另一条的slug
---

正文段落。**加粗**用两个星号。
```

## 字段说明

| 字段 | 说明 |
| --- | --- |
| `description` | 一句话概述。列表卡片与搜索只显示这一句，所以要能独立成立。 |
| `category` | `content/categories/` 里的文件名：quote、motif、reading、edition、mechanic、adapt、image。 |
| `relation` | 引用、化用或同源。不确定就留空，不要猜。 |
| `origin` | `human` 为成员撰写；忘了写会被当成 AI 草稿。 |
| `game` / `work` | 游戏与著作的基本信息。整条以电影为主时，在 `game` 里写 `medium: film`。 |
| `quote` | `text` 是中文引文，`original` 是原文，`lang` 是原文语种，`source` 精确到卷章节，`note` 写译文处理或所据译本。 |
| `notes` | 注记，`label` 常用：版本、译本、史实、理论、对照、待补。标「待补」的会汇总到议题板。 |
| `related` | 手选的相关条目。同一原典、同一游戏的条目会自动关联，不必手填。 |

## 三条规矩

::tip
**一、引文必须有出处。**宁可少写一句，也不要写「某处曾提到」。出处精确到卷章节，译本精确到译者。
::

::tip
**二、区分引用、化用、同源。**三者证据强度完全不同，写在 `relation` 里。
::

::note
**三、写不动就写「待补」。**把问题挪到 `content/topics/`，标上征集。空着的条目比编出来的条目有用。
::
