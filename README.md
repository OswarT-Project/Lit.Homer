# 互文 · 游戏文学考据

一份持续生长的游戏文学考据档案：游戏引用了哪部作品、用的是哪个译本、原文在说什么、它被改动成了什么。基于 Nuxt 4 + Nuxt Content 构建。

```
lit-homer/
├─ content/                 ← 全部内容（Markdown，可用 Nuxt Studio 在线编辑）
│  ├─ entries/              条目：每条考据一个 .md
│  ├─ topics/               议题：待考问题
│  └─ series/               专题：把若干条目聚成一组
├─ app/
│  ├─ lib/codex.ts          类别/媒介/站点常量与纯函数
│  ├─ composables/          数据获取与筛选
│  ├─ components/           条目卡、引文、注记、对照表等
│  ├─ layouts/default.vue   站壳：侧栏 + 顶栏搜索 + 主题切换
│  └─ pages/                首页 / 条目库 / 议题板 / 专题 / 关于 / 添加
└─ content.config.ts        zod 校验（内容体检，构建时执行）
```

## 开发

```bash
bun install
bun run dev        # http://localhost:3000
```

## 生产

```bash
bun run build      # SSR 构建
bun run generate   # 静态生成（可选）
bun run preview
```

## 添加一条考据

没有后台，也不需要有。所有内容都是 `content/` 里的 Markdown 文件，字段说明见站内「添加条目」页（`/contribute`）。

两种方式：

1. **直接用 Nuxt Studio**：连接仓库后在网页上编辑，frontmatter 会自动生成表单。
2. **直接写文件**：在 `content/entries/` 新建 `<slug>.md`，顶部写 YAML frontmatter，后面是正文。

示例：

```md
---
title: 《游戏》与《著作》：副标题
category: quote        # quote | motif | reading | edition | mechanic | adapt | image
origin: human          # human 成员撰写（**）| ai 示例（*）
game:
  title: 游戏名
  year: "2020"
  studio: 工作室
work:
  title: 著作名
  author: 作者
  year: "1854"
  medium: book         # book | poem | play | film | painting | myth | manga | tv
tags:
  - 关键词
updated: 2026-11-03
quote:
  text: 引文
  lang: 英
  source: 出处：卷 / 章 / 节
  note: 译文说明，或所据译本
summary: 一句话概述，会显示在列表卡片上。
notes:
  - label: 版本
    text: ……
related:
  - 另一条的slug
---

正文段落。**加粗**用两个星号，`代码或书名`用反引号。
```

结构校验在 `content.config.ts` 里（zod），构建或启动时自动体检：id 重复、类别写错、引用指向不存在的条目等都会报错。

## 三条规矩

1. **引文必须有出处**——精确到卷章节，译本精确到译者。
2. **区分引用 / 化用 / 同源**——三者证据强度完全不同。
3. **不确定就写「待补」**——把问题挪到 `content/topics/`，空着的条目比编出来的条目有用。
