/* =========================================================================
 * 互文 · 游戏文学考据 —— app.js
 * 纯前端、无依赖、无构建。直接用浏览器打开 index.html 即可。
 * ========================================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- data */
  var META = window.CODEX_META || { title: "互文", subtitle: "游戏文学考据", tagline: "", intro: "" };
  var ENTRIES = Array.isArray(window.CODEX_ENTRIES) ? window.CODEX_ENTRIES : [];
  var TOPICS = Array.isArray(window.CODEX_TOPICS) ? window.CODEX_TOPICS : [];
  var CATS = Array.isArray(window.CODEX_CATEGORIES) ? window.CODEX_CATEGORIES : [];
  var SERIES = Array.isArray(window.CODEX_SERIES) ? window.CODEX_SERIES : [];
  var MEDIA = Array.isArray(window.CODEX_MEDIA) ? window.CODEX_MEDIA : [];

  var CAT_NAME = {};
  CATS.forEach(function (c) { CAT_NAME[c.id] = c.name; });

  /* 媒介：默认「书」。游戏这一侧通常不写，写了就按影片/剧目处理。 */
  var MEDIA_NAME = { book: "书", film: "电影", play: "戏剧", poem: "诗", myth: "神话", manga: "漫画", tv: "剧集" };
  var MEDIA_INFO = {};
  MEDIA.forEach(function (m) { MEDIA_NAME[m.id] = m.name; MEDIA_INFO[m.id] = m; });

  function mediumName(m) { return MEDIA_NAME[m || "book"] || m || "书"; }

  /* 「绘画 · 第三艺术」——用在 chip 的 title 上，鼠标悬停可见 */
  function mediumTitle(m) {
    var info = MEDIA_INFO[m || "book"];
    if (!info) return "";
    return info.num ? info.art + " · " + info.num : (info.art || "");
  }

  /* 来源标记：* = AI 起草的示例，** = 社团成员撰写。
     条目没写 origin 时按 * 处理——宁可把人的东西标低，也不要冒认。 */
  var ORIGINS = {
    ai: { mark: "*", label: "示例（AI 起草）", tip: "AI 起草的示例条目，尚未由社团成员核实改写" },
    human: { mark: "**", label: "社团成员撰写", tip: "由社团成员撰写并对其内容负责" }
  };

  function originOf(o) { return ORIGINS[o === "human" ? "human" : "ai"]; }

  function originMark(o) {
    var key = o === "human" ? "human" : "ai";
    var d = ORIGINS[key];
    return '<sup class="mark mark-' + key + '" title="' + esc(d.tip) + '">' + d.mark + "</sup>";
  }

  function sideLabel(m) {
    if (m === "film") return "影 片";
    if (m === "tv") return "剧 集";
    if (m === "play") return "剧 目";
    if (m === "book") return "作 品";
    return "游 戏";
  }

  function creditLabel(m) {
    if (m === "film") return "导 演";
    if (m === "tv") return "主 创";
    if (m === "play") return "编 剧";
    if (m === "book") return "作 者";
    return "制 作";
  }

  function roleLabel(m) {
    if (m === "film") return "导 演";
    if (m === "tv") return "主 创";
    return "作 者";
  }

  function seriesById(id) {
    for (var i = 0; i < SERIES.length; i++) if (SERIES[i].id === id) return SERIES[i];
    return null;
  }

  /* 一张卡片该标什么媒介：优先看「游戏」那一侧的异常媒介（例如整条是电影），
     否则看「作品」那一侧是否不是书。两边都常规时返回空。 */
  function mediaTagOf(e) {
    if (e.game && e.game.medium && e.game.medium !== "game") return e.game.medium;
    if (e.work && e.work.medium && e.work.medium !== "book") return e.work.medium;
    return "";
  }

  /* 条目在门类筛选中归到哪一类：有异常媒介就按它，否则按作品那一侧，最后回落为书。 */
  function primaryMedium(e) {
    var tag = mediaTagOf(e);
    if (tag) return tag;
    return (e.work && e.work.medium) || "book";
  }

  var byId = {};
  ENTRIES.forEach(function (e) { byId[e.id] = e; });
  var topicById = {};
  TOPICS.forEach(function (t) { topicById[t.id] = t; });

  /* --------------------------------------------------------------- utils */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* 极简行内标记：**粗体**、`代码`。先转义再替换，顺序安全。 */
  function inline(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function catName(id) { return CAT_NAME[id] || "未分类"; }

  function catDesc(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].desc || "";
    return "";
  }

  function fmtDate(d) {
    if (!d) return "";
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    if (!m) return d;
    return m[1] + "." + m[2] + "." + m[3];
  }

  function sortByUpdated(list) {
    return list.slice().sort(function (a, b) {
      return String(b.updated || "").localeCompare(String(a.updated || ""));
    });
  }

  function countBy(list, key) {
    var out = {};
    list.forEach(function (x) { out[x[key]] = (out[x[key]] || 0) + 1; });
    return out;
  }

  function uniq(list) {
    var seen = {}, out = [];
    list.forEach(function (x) { if (x && !seen[x]) { seen[x] = 1; out.push(x); } });
    return out;
  }

  var STATE = { q: "", cat: "", media: "" };

  /* ------------------------------------------------------------- routing */
  function parseHash() {
    var raw = location.hash.replace(/^#/, "") || "/";
    var parts = raw.split("?");
    var seg = parts[0].split("/").filter(Boolean);
    return { seg: seg, params: new URLSearchParams(parts[1] || "") };
  }

  /* 写 hash 而不留历史记录；file:// 下个别浏览器会拒绝 replaceState，退回赋值 */
  function setHash(h) {
    try { history.replaceState(null, "", h); }
    catch (err) { location.hash = h; }
  }

  function hrefEntries(opts) {
    var p = new URLSearchParams();
    if (opts && opts.q) p.set("q", opts.q);
    if (opts && opts.cat) p.set("cat", opts.cat);
    if (opts && opts.m) p.set("m", opts.m);
    var qs = p.toString();
    return "#/entries" + (qs ? "?" + qs : "");
  }

  /* --------------------------------------------------------------- views */
  function stat(n, label) {
    return '<div class="stat"><span class="stat-num">' + n + '</span><span class="stat-label">' + esc(label) + "</span></div>";
  }

  function metaRow(k, v) {
    return '<div class="meta-row"><dt>' + k + "</dt><dd>" + v + "</dd></div>";
  }

  function cardEntry(e) {
    var q = (e.quote && e.quote.text) || e.summary || "";
    var h = '<a class="card" href="#/e/' + encodeURIComponent(e.id) + '">';
    h += '<div class="card-top"><span class="chip">' + esc(catName(e.category)) + "</span>";
    var mt = mediaTagOf(e);
    if (mt) h += '<span class="chip chip-media" title="' + esc(mediumTitle(mt)) + '">' + esc(mediumName(mt)) + "</span>";
    h += '<span class="card-date">' + esc(fmtDate(e.updated)) + "</span></div>";
    h += '<h3 class="card-title">' + esc(e.title) + originMark(e.origin) + "</h3>";
    h += '<p class="card-quote">「' + esc(q) + "」</p>";
    h += '<p class="card-meta">' + (e.game.title === e.work.title
      ? esc(e.game.title) + " · " + esc(mediumName(e.game.medium || "book")) + "改编"
      : esc(e.game.title) + " × " + esc(e.work.title)) + "</p>";
    h += '<p class="card-sum">' + esc(e.summary) + "</p>";
    h += "</a>";
    return h;
  }

  function seriesCard(s) {
    var n = ENTRIES.filter(function (e) { return e.series === s.id; }).length;
    var rows = (s.roster || []).length;
    var h = '<a class="series-card" href="#/s/' + encodeURIComponent(s.id) + '">';
    h += '<span class="series-eyebrow">' + esc(s.eyebrow || "专题") + "</span>";
    h += "<h3>" + esc(s.name) + "</h3>";
    h += '<p class="series-desc">' + esc(s.desc) + "</p>";
    h += '<span class="series-count">' + (rows ? rows + " 条原典对照 · " : "") + n + " 条考据</span>";
    h += "</a>";
    return h;
  }

  function matchEntry(e, q) {
    if (!q) return true;
    var hay = [
      e.title, e.summary, (e.tags || []).join(" "),
      e.game && e.game.title, e.game && e.game.studio,
      e.work && e.work.title, e.work && e.work.author, mediumName(e.work && e.work.medium),
      (e.body || []).join(" "),
      e.quote && e.quote.text, e.quote && e.quote.source
    ].join(" ").toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function viewHome() {
    var games = uniq(ENTRIES.filter(function (e) {
      return !e.game || !e.game.medium || e.game.medium === "game";
    }).map(function (e) { return e.game && e.game.title; }));
    var works = uniq(ENTRIES.map(function (e) { return e.work && e.work.title; }));
    var recent = sortByUpdated(ENTRIES).slice(0, 4);
    var counts = countBy(ENTRIES, "category");

    var html = "";

    html += '<section class="hero">';
    html += '<p class="eyebrow">' + esc(META.club || "考据档案") + "</p>";
    html += '<h1 class="hero-title">' + esc(META.title) + '<span class="hero-dot">·</span>' + esc(META.subtitle) + "</h1>";
    html += '<p class="hero-tagline">' + esc(META.tagline) + "</p>";
    html += '<p class="hero-intro">' + esc(META.intro) + "</p>";
    html += '<div class="hero-actions">';
    html += '<a class="btn btn-primary" href="#/entries">进入条目库</a>';
    html += '<a class="btn" href="#/topics">看议题板</a>';
    html += '<a class="btn btn-ghost" href="#/contribute">添加一条</a>';
    html += "</div></section>";

    html += '<section class="stats" aria-label="档案统计">';
    html += stat(ENTRIES.length, "条考据");
    html += stat(TOPICS.length, "个待考议题");
    html += stat(games.length, "款游戏");
    html += stat(works.length, "部作品");
    html += "</section>";

    var aiCount = ENTRIES.filter(function (e) { return e.origin !== "human"; }).length;
    var humanCount = ENTRIES.length - aiCount;
    html += '<p class="legend">';
    html += '<b class="mark-ai">*</b> AI 起草的示例，待社团成员改写核实';
    html += '<span class="legend-sep">／</span>';
    html += '<b class="mark-human">**</b> 社团成员撰写';
    html += '<span class="legend-sep">·</span>';
    html += "目前 <b>" + humanCount + "</b> 条由成员撰写，" + aiCount + " 条待改写。";
    html += "</p>";

    html += '<section class="block">';
    html += '<div class="block-head"><h2>按类别翻阅</h2><a class="link-more" href="#/entries">全部 →</a></div>';
    html += '<div class="cat-grid">';
    CATS.forEach(function (c) {
      html += '<a class="cat-card" href="' + hrefEntries({ cat: c.id }) + '">';
      html += '<span class="cat-num">' + String(counts[c.id] || 0).padStart(2, "0") + "</span>";
      html += '<span class="cat-name">' + esc(c.name) + "</span>";
      html += '<span class="cat-desc">' + esc(c.desc) + "</span>";
      html += "</a>";
    });
    html += "</div></section>";

    if (SERIES.length) {
      html += '<section class="block">';
      html += '<div class="block-head"><h2>专题</h2><a class="link-more" href="#/series">全部 →</a></div>';
      html += '<div class="series-grid">';
      SERIES.forEach(function (s) { html += seriesCard(s); });
      html += "</div></section>";
    }

    if (recent.length) {
      html += '<section class="block">';
      html += '<div class="block-head"><h2>最近更新</h2><a class="link-more" href="#/entries">全部 →</a></div>';
      html += '<div class="cards">';
      recent.forEach(function (e) { html += cardEntry(e); });
      html += "</div></section>";
    }

    html += '<section class="block">';
    html += '<div class="block-head"><h2>这个站怎么用</h2></div>';
    html += '<ol class="steps">';
    html += "<li><strong>查。</strong>左侧按类别进，或直接用顶栏搜索游戏名、书名、作者、关键词。</li>";
    html += "<li><strong>读。</strong>每条包含：引文、出处、考据正文、版本注记、相关条目。引文处理规则见「关于与凡例」。</li>";
    html += '<li><strong>补。</strong>还没查清的问题都在<a href="#/topics">议题板</a>；结论回填成新条目，步骤见<a href="#/contribute">添加条目</a>。</li>';
    html += "</ol></section>";

    return html;
  }

  function viewEntries() {
    var q = (STATE.q || "").trim().toLowerCase();
    var cat = STATE.cat || "";
    var media = STATE.media || "";
    var list = ENTRIES.filter(function (e) {
      if (cat && e.category !== cat) return false;
      if (media && primaryMedium(e) !== media) return false;
      return matchEntry(e, q);
    });
    list = q ? list : sortByUpdated(list);

    var html = "";
    html += '<div class="page-head">';
    html += "<h1>" + (cat ? esc(catName(cat)) : "条目库") + "</h1>";
    html += '<p class="page-sub">' + (cat ? esc(catDesc(cat)) : "按游戏、著作、作者或关键词检索。共 " + ENTRIES.length + " 条。") + "</p>";
    html += "</div>";

    html += '<div class="filters">';
    html += '<a class="pill' + (cat ? "" : " is-on") + '" href="' + hrefEntries({ q: STATE.q, m: media }) + '">全部</a>';
    CATS.forEach(function (c) {
      html += '<a class="pill' + (cat === c.id ? " is-on" : "") + '" href="' + hrefEntries({ q: STATE.q, cat: c.id, m: media }) + '">' + esc(c.name) + "</a>";
    });
    html += "</div>";

    /* 门类筛选：只列出数据里真正用到的媒介 */
    var mCounts = {};
    ENTRIES.forEach(function (e) {
      var k = primaryMedium(e);
      mCounts[k] = (mCounts[k] || 0) + 1;
    });
    var order = MEDIA.map(function (x) { return x.id; });
    var mIds = Object.keys(mCounts).sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    if (mIds.length > 1) {
      html += '<div class="filters filters-sub">';
      html += '<span class="filter-label">门类</span>';
      html += '<a class="pill pill-sm' + (media ? "" : " is-on") + '" href="' + hrefEntries({ q: STATE.q, cat: cat }) + '">全部</a>';
      mIds.forEach(function (id) {
        html += '<a class="pill pill-sm' + (media === id ? " is-on" : "") + '" title="' + esc(mediumTitle(id)) + '" href="' + hrefEntries({ q: STATE.q, cat: cat, m: id }) + '">' + esc(mediumName(id)) + '<b>' + mCounts[id] + "</b></a>";
      });
      html += "</div>";
    }

    if (q) {
      html += '<p class="result-line">搜索「' + esc(STATE.q) + "」：<strong>" + list.length + "</strong> 条结果。" +
        '<a href="' + hrefEntries({ cat: cat }) + '" class="reset">清除搜索</a></p>';
    }

    if (!list.length) {
      html += '<div class="empty">';
      html += "<p>这里还是空的。</p>";
      html += '<p class="empty-sub">换个关键词，或者——把这个空缺写成一条新考据。</p>';
      html += '<a class="btn btn-primary" href="#/contribute">如何添加条目</a>';
      html += "</div>";
      return html;
    }

    html += '<div class="cards">';
    list.forEach(function (e) { html += cardEntry(e); });
    html += "</div>";
    return html;
  }

  function viewEntry(id) {
    var e = byId[id];
    if (!e) return viewNotFound("没有找到这条考据。它可能被改过 id，或者还没写。");

    var idx = ENTRIES.indexOf(e);
    var prev = ENTRIES[idx - 1];
    var next = ENTRIES[idx + 1];

    var html = "";
    html += '<nav class="crumbs"><a href="#/entries">条目库</a> / <a href="' + hrefEntries({ cat: e.category }) + '">' + esc(catName(e.category)) + "</a></nav>";

    html += '<article class="entry">';
    html += '<header class="entry-head">';
    html += '<div class="chip-row"><span class="chip">' + esc(catName(e.category)) + "</span>";
    var mtE = mediaTagOf(e);
    if (mtE) {
      html += '<span class="chip chip-media" title="' + esc(mediumTitle(mtE)) + '">' + esc(mediumName(mtE)) + "</span>";
    }
    if (e.series && seriesById(e.series)) {
      html += '<a class="chip chip-series" href="#/s/' + encodeURIComponent(e.series) + '">专题 · ' + esc(seriesById(e.series).short || seriesById(e.series).name) + "</a>";
    }
    (e.tags || []).forEach(function (t) { html += '<span class="tag">' + esc(t) + "</span>"; });
    html += "</div>";
    html += '<h1 class="entry-title">' + esc(e.title) + originMark(e.origin) + "</h1>";
    html += '<p class="entry-sum">' + esc(e.summary) + "</p>";
    html += "</header>";

    html += '<dl class="meta-table">';
    html += metaRow(sideLabel(e.game.medium), esc(e.game.title) + (e.game.year ? ' <span class="dim">（' + esc(e.game.year) + "）</span>" : ""));
    html += metaRow(creditLabel(e.game.medium), esc(e.game.studio || "—"));
    html += metaRow(sideLabel(e.work.medium), esc(e.work.title) + (e.work.year ? ' <span class="dim">（' + esc(e.work.year) + "）</span>" : ""));
    html += metaRow(roleLabel(e.work.medium), esc(e.work.author || "—"));
    html += metaRow("来 源", '<span class="mark-label mark-' + (e.origin === "human" ? "human" : "ai") + '">' + esc(originOf(e.origin).label) + "</span>");
    html += metaRow("最后整理", esc(fmtDate(e.updated) || "—"));
    html += "</dl>";

    if (e.quote && e.quote.text) {
      html += '<figure class="quote">';
      html += '<blockquote><p>' + inline(e.quote.text) + "</p></blockquote>";
      html += "<figcaption>";
      if (e.quote.lang) html += '<span class="quote-lang">' + esc(e.quote.lang) + "</span>";
      html += "<span>" + esc(e.quote.source || "") + "</span>";
      html += "</figcaption>";
      if (e.quote.note) html += '<p class="quote-note">' + inline(e.quote.note) + "</p>";
      html += "</figure>";
    }

    html += '<div class="prose">';
    (e.body || []).forEach(function (p) { html += "<p>" + inline(p) + "</p>"; });
    html += "</div>";

    if ((e.notes || []).length) {
      html += '<section class="notes">';
      html += '<h2 class="notes-title">注记</h2>';
      html += "<dl>";
      e.notes.forEach(function (n) {
        html += '<div class="note-row' + (n.label === "待补" ? " is-todo" : "") + '">';
        html += "<dt>" + esc(n.label) + "</dt>";
        html += "<dd>" + inline(n.text) + "</dd>";
        html += "</div>";
      });
      html += "</dl></section>";
    }

    var rel = (e.related || []).map(function (x) { return byId[x]; }).filter(Boolean);
    if (rel.length) {
      html += '<section class="block related">';
      html += '<div class="block-head"><h2>相关条目</h2></div>';
      html += '<div class="cards cards-tight">';
      rel.forEach(function (r) { html += cardEntry(r); });
      html += "</div></section>";
    }

    html += '<nav class="pager">';
    html += prev ? '<a class="pager-link prev" href="#/e/' + encodeURIComponent(prev.id) + '"><span class="pager-dir">← 上一条</span><span class="pager-title">' + esc(prev.title) + "</span></a>" : "<span></span>";
    html += next ? '<a class="pager-link next" href="#/e/' + encodeURIComponent(next.id) + '"><span class="pager-dir">下一条 →</span><span class="pager-title">' + esc(next.title) + "</span></a>" : "<span></span>";
    html += "</nav>";

    html += "</article>";
    return html;
  }

  function statusSlug(s) {
    return { "征集": "open", "整理中": "wip", "已完成": "done" }[s] || "open";
  }

  function viewTopics() {
    var counts = countBy(TOPICS, "status");
    var html = "";
    html += '<div class="page-head">';
    html += "<h1>议题板</h1>";
    html += '<p class="page-sub">还没查清的问题。讨论在群聊里发生，结论回填成条目——这里只负责把问题攒住。</p>';
    html += "</div>";
    html += '<div class="status-line">';
    Object.keys(counts).forEach(function (k) {
      html += '<span class="status-chip">' + esc(k) + " <b>" + counts[k] + "</b></span>";
    });
    html += "</div>";
    html += '<div class="threads">';
    sortByUpdated(TOPICS).forEach(function (t) {
      html += '<a class="thread" href="#/t/' + encodeURIComponent(t.id) + '">';
      html += '<div class="thread-main">';
      html += '<h3 class="thread-title">' + esc(t.question) + originMark(t.origin) + "</h3>";
      html += '<p class="thread-pre">' + esc((t.body && t.body[0]) || "") + "</p>";
      html += '<div class="thread-meta">';
      html += '<span class="status-badge status-' + statusSlug(t.status) + '">' + esc(t.status) + "</span>";
      (t.tags || []).forEach(function (g) { html += '<span class="tag">' + esc(g) + "</span>"; });
      html += '<span class="thread-date">' + esc(fmtDate(t.updated)) + "</span>";
      html += "</div></div>";
      html += '<span class="thread-arrow">→</span>';
      html += "</a>";
    });
    html += "</div>";
    if (!TOPICS.length) html += '<div class="empty"><p>还没有议题。</p></div>';
    return html;
  }

  function viewTopic(id) {
    var t = topicById[id];
    if (!t) return viewNotFound("没有找到这个议题。");

    var html = "";
    html += '<nav class="crumbs"><a href="#/topics">议题板</a> / <span>' + esc(t.status) + "</span></nav>";
    html += '<article class="entry">';
    html += '<header class="entry-head">';
    html += '<div class="chip-row"><span class="status-badge status-' + statusSlug(t.status) + '">' + esc(t.status) + "</span>";
    (t.tags || []).forEach(function (g) { html += '<span class="tag">' + esc(g) + "</span>"; });
    html += "</div>";
    html += '<h1 class="entry-title">' + esc(t.question) + originMark(t.origin) + "</h1>";
    html += "</header>";

    html += '<div class="prose">';
    (t.body || []).forEach(function (p) { html += "<p>" + inline(p) + "</p>"; });
    html += "</div>";

    if ((t.leads || []).length) {
      html += '<section class="notes">';
      html += '<h2 class="notes-title">可以这样入手</h2>';
      html += '<ol class="leads">';
      t.leads.forEach(function (l) { html += "<li>" + inline(l) + "</li>"; });
      html += "</ol></section>";
    }

    var rel = (t.entries || []).map(function (x) { return byId[x]; }).filter(Boolean);
    if (rel.length) {
      html += '<section class="block related">';
      html += '<div class="block-head"><h2>相关条目</h2></div>';
      html += '<div class="cards cards-tight">';
      rel.forEach(function (r) { html += cardEntry(r); });
      html += "</div></section>";
    }

    html += '<div class="callout">';
    html += '<p><strong>结论写完了？</strong>把它变成条目：复制一条现成的，改内容，放进 <code>data/entries.js</code>。具体步骤见<a href="#/contribute">添加条目</a>。</p>';
    html += "</div>";

    html += "</article>";
    return html;
  }

  function viewSeriesList() {
    var html = "";
    html += '<div class="page-head"><h1>专题</h1>';
    html += '<p class="page-sub">围绕一个游戏、一部作品或一位作者聚起来的若干条目。</p></div>';
    if (!SERIES.length) return html + '<div class="empty"><p>还没有专题。</p></div>';
    html += '<div class="series-grid series-grid-lg">';
    SERIES.forEach(function (s) { html += seriesCard(s); });
    html += "</div>";
    return html;
  }

  function viewSeries(id) {
    var s = seriesById(id);
    if (!s) return viewNotFound("没有找到这个专题。");

    var items = ENTRIES.filter(function (e) { return e.series === s.id; });

    var html = "";
    html += '<nav class="crumbs"><a href="#/series">专题</a> / <span>' + esc(s.name) + "</span></nav>";
    html += '<div class="page-head">';
    html += '<p class="eyebrow">' + esc(s.eyebrow || "专题") + "</p>";
    html += "<h1>" + esc(s.name) + "</h1>";
    html += '<p class="page-sub">' + esc(s.desc) + "</p>";
    html += "</div>";

    if ((s.roster || []).length) {
      html += '<h2 class="sec-title">原典对照</h2>';
      html += '<div class="roster-wrap"><table class="roster">';
      html += "<thead><tr><th>人物</th><th>原典</th><th>作者</th><th>媒介</th><th>说明</th></tr></thead><tbody>";
      s.roster.forEach(function (r) {
        html += "<tr>";
        html += '<td class="r-name">' + esc(r.name) + "</td>";
        html += '<td class="r-work">' + esc(r.work) + "</td>";
        html += '<td class="r-author">' + esc(r.author) + "</td>";
        html += '<td class="r-medium">' + esc(mediumName(r.medium)) + "</td>";
        html += '<td class="r-note">' + esc(r.note || "") + "</td>";
        html += "</tr>";
      });
      html += "</tbody></table></div>";
      if (s.foot) html += '<p class="roster-foot">' + esc(s.foot) + "</p>";
    }

    html += '<h2 class="sec-title">本专题条目</h2>';
    if (items.length) {
      html += '<div class="cards">';
      sortByUpdated(items).forEach(function (e) { html += cardEntry(e); });
      html += "</div>";
    } else {
      html += '<div class="empty"><p>这个专题还没有条目。</p><p class="empty-sub">从议题板认领一个，写完就是第一条。</p></div>';
    }

    html += '<div class="callout"><p><strong>怎么加进来？</strong>在条目里写 <code>series: "' + esc(s.id) + '"</code>，它就会出现在这一页。</p></div>';
    return html;
  }

  function viewAbout() {
    var html = "";
    html += '<div class="page-head"><h1>关于与凡例</h1>';
    html += '<p class="page-sub">这份档案怎么来的，以及它遵守什么规矩。</p></div>';

    html += '<div class="prose">';
    html += "<h2>这是什么</h2>";
    html += "<p>" + esc(META.intro) + "</p>";
    html += "<p>它由社团成员共同维护。每一条考据回答四个问题：游戏引用了什么、出自哪里、原文在说什么、游戏把它改成了什么。我们不满足于「这里有个彩蛋」——彩蛋只说明作者读过，考据要说明他读的是哪一版、为什么这样用。</p>";

    html += "<h2>凡例</h2>";
    html += "<h3>一、引文的处理</h3>";
    html += "<p>凡引文，尽量给原文语种与出处（卷、章、节）。中文如非直接采用某一通行译本，即为编者据原文重译，并在「注记」中说明。若引文确取自某译本，必须注明译者与出版社——这是本档案最基本的规矩。</p>";
    html += "<h3>二、区分三种关系</h3>";
    html += "<p><strong>引用</strong>：游戏文本中直接出现该作品的字句。<strong>化用</strong>：结构、意象、人物关系上的借用，但无字句对应。<strong>同源</strong>：共享更早的母题，彼此并无直接影响。三者常被混为一谈，本档案要求标明属于哪一种。</p>";
    html += "<h3>三、不确定就写不确定</h3>";
    html += '<p>凡是推测，写「推测」；凡是没核实的，标「待补」并放进<a href="#/topics">议题板</a>。档案的价值在于可信，不在于显得什么都知道。</p>';
    html += "<h3>四、不做「作者本意」的独断</h3>";
    html += "<p>开发者访谈、设定集、制作人发言都可以引用，但它们是材料，不是判决。文本一旦发布，读者的读法就成立——只要说清楚依据。</p>";
    html += "<h3>五、跨媒介也算文本</h3>";
    html += "<p>电影、戏剧、神话改编与书同等对待。改编不是原著的降级版本，而是一次有代价的转写：语气、留白、时间感、视角，都会在换媒介时被迫具体化。我们关心的是「什么被保留、什么必然丢失」，而不是「像不像原著」。</p>";
    html += "<h3>六、两种标记</h3>";
    html += '<p>标题右上角的星号说明这条由谁写下：<b class="mark-ai">*</b> 是 AI 起草的示例，用来占位、搭骨架，尚未经人核实；<b class="mark-human">**</b> 是社团成员撰写，并对内容负责。这不是免责声明，是进度表——每一条从 * 变成 **，才算真正完成。</p>';
    html += "<p>示例条目允许存在，但不许被当成结论引用。对外引用本档案时，请连同标记一起注明。</p>";

    html += "<h2>艺术门类</h2>";
    html += "<p>本档案把游戏当作第九艺术来读。但这套编号本身就有考据可做：七艺通常指建筑、雕塑、绘画、音乐、诗、舞蹈、电影（第七）；此后摄影、电视、漫画、游戏陆续被排进第八、第九、第十。分歧在于——欧陆传统里「第九艺术」指漫画（bande dessinée），中文语境里则普遍用来指电子游戏。</p>";
    html += "<p>所以站内标注的「第几艺术」只是一个便于对话的坐标，不是定论。真要考据，该追问的是：谁在什么时候、为了什么，把游戏叫作第九艺术。</p>";
    html += '<div class="table-wrap"><table class="field-table"><thead><tr><th>门类</th><th>站内写法</th><th>编号</th><th>说明</th></tr></thead><tbody>';
    html += "<tr><td>游戏</td><td><code>game</code></td><td>第九艺术</td><td>本档案的主语，走 game 字段，不占 medium</td></tr>";
    MEDIA.forEach(function (m) {
      html += "<tr><td>" + esc(m.art || m.name) + "</td><td><code>" + esc(m.id) + "</code></td><td>" + esc(m.num || "—") + "</td><td>" + esc(m.name) + "</td></tr>";
    });
    html += "</tbody></table></div>";

    html += "<h2>技术说明</h2>";
    html += "<p>这是一个纯静态网站：三个文件（<code>index.html</code>、<code>assets/style.css</code>、<code>assets/app.js</code>）加两个数据文件（<code>data/entries.js</code>、<code>data/topics.js</code>）。没有数据库、没有后端、没有构建步骤，双击 <code>index.html</code> 就能看。所有内容都在数据文件里，随时可以导出、迁移、备份。</p>";
    html += '<p>要加东西，看<a href="#/contribute">添加条目</a>。要发布上线，看项目里的 <code>README.md</code>。</p>';
    html += "</div>";
    return html;
  }

  function field(k, v) {
    return "<tr><td><code>" + esc(k) + "</code></td><td>" + esc(v) + "</td></tr>";
  }

  function viewContribute() {
    var tpl = [
      "{",
      '  id: "short-slug",',
      '  title: "《游戏》与《著作》：副标题",',
      '  category: "quote",   // quote | motif | reading | edition | mechanic | adapt',
      '  origin: "human",     // human 成员撰写（**）| ai 示例（*）',
      '  series: "limbus",    // 可选：专题 id，见 data/series.js',
      '  game: { title: "游戏名", year: "2020", studio: "工作室" },',
      '  work: { title: "著作名", author: "作者", year: "1854", medium: "book" },',
      '  tags: ["关键词", "关键词"],',
      '  updated: "2026-11-03",',
      "  quote: {",
      '    text: "引文",',
      '    lang: "英",',
      '    source: "出处：卷 / 章 / 节",',
      '    note: "译文说明，或所据译本"',
      "  },",
      '  summary: "一句话概述，会显示在列表卡片上。",',
      '  body: ["第一段", "第二段"],',
      '  notes: [{ label: "版本", text: "……" }],',
      '  related: ["另一条的id"]',
      "}"
    ].join("\n");

    var html = "";
    html += '<div class="page-head"><h1>添加条目</h1>';
    html += '<p class="page-sub">没有后台，也不需要有。所有内容都是文本文件里的一段。</p></div>';

    html += '<ol class="steps steps-lg">';
    html += "<li><strong>打开 <code>data/entries.js</code>。</strong>用任何文本编辑器都行（记事本、VS Code、Typora）。文件里是一串 <code>{ ... }</code>，每条考据一块。</li>";
    html += "<li><strong>复制最后一块，粘在 <code>];</code> 之前。</strong>块与块之间要有英文逗号，最后一块后面不要逗号。</li>";
    html += "<li><strong>按下面的模板改字段。</strong><code>id</code> 用英文小写加连字符，不能重复；<code>category</code> 只能填六个类别之一。</li>";
    html += "<li><strong>保存，刷新浏览器。</strong>左边栏会自动多出这一条，首页统计也会变。</li>";
    html += "</ol>";

    html += '<h2 class="sec-title">条目模板</h2>';
    html += '<pre class="code"><code>' + esc(tpl) + "</code></pre>";

    html += '<h2 class="sec-title">字段说明</h2>';
    html += '<div class="table-wrap"><table class="field-table">';
    html += "<thead><tr><th>字段</th><th>说明</th></tr></thead><tbody>";
    html += field("id", "唯一标识，英文小写连字符。会出现在网址里，例如 #/e/disco-elysium-dostoevsky。");
    html += field("title", "标题。建议格式：《游戏》与《著作》：一个具体的判断。");
    html += field("category", "六选一：quote 引文与出处 / motif 母题与原型 / reading 文本细读 / edition 译本与版本 / mechanic 机制与叙事 / adapt 跨媒介改编。");
    html += field("series", "可选。填专题 id，条目就会自动出现在该专题页（专题在 data/series.js 里定义）。");
    html += field("origin", "谁写的：human 社团成员撰写（标 **）／ ai AI 起草的示例（标 *，待改写核实）。自己写的条目请填 human；忘了写会被当成 *。");
    html += field("medium", "作品这一侧的媒介：book 书（默认）/ film 电影 / painting 绘画·版画 / play 戏剧 / poem 诗 / myth 神话 / manga 漫画 / tv 剧集。悬停标签会显示所属门类与编号（如「绘画 · 第三艺术」）。整条以电影为主时，在 game 里写 medium: 「film」，标签会自动变成「影片 / 导演」。");
    html += field("game / work", "游戏与著作的基本信息。year 写发行年或成书年，不确定可留空字符串。");
    html += field("tags", "三到五个关键词，用于搜索。不要写得太泛（避免「游戏」「文学」）。");
    html += field("quote", "引文。text 是引文本身；lang 是原文语种；source 精确到卷章节；note 写译文处理或所据译本。没有直接引文时可整块删掉。");
    html += field("summary", "一句话概述。列表卡片只显示这一句，所以要能独立成立。");
    html += field("body", "正文段落数组，一段一个字符串。用 **文字** 加粗，用 `文字` 标代码或书名原文。");
    html += field("notes", "注记数组，label 常用：版本、译本、史实、理论、对照、待补。标「待补」的会高亮。");
    html += field("related", "相关条目的 id 数组，会显示为卡片。");
    html += "</tbody></table></div>";

    html += '<h2 class="sec-title">三条规矩</h2>';
    html += '<div class="prose">';
    html += "<p><strong>一、引文必须有出处。</strong>宁可少写一句，也不要写「某处曾提到」。出处精确到卷章节，译本精确到译者。</p>";
    html += "<p><strong>二、区分子类型。</strong>在正文里说清楚这是引用、化用还是同源。三者的证据强度完全不同。</p>";
    html += "<p><strong>三、写不动就写「待补」。</strong>把问题挪到 <code>data/topics.js</code>，标上征集。空着的条目比编出来的条目有用。</p>";
    html += "</div>";

    html += '<div class="callout"><p><strong>批量添加？</strong>条目就是 JavaScript 对象，可以从表格（CSV/Excel）批量生成。有余力的话，这一步可以脚本化。</p></div>';
    return html;
  }

  function viewNotFound(msg) {
    return '<div class="empty"><p>' + esc(msg) + '</p><p class="empty-sub"><a href="#/entries">回到条目库</a></p></div>';
  }

  /* ------------------------------------------------------------- sidebar */
  function sideLink(href, label, on) {
    return '<a class="side-link' + (on ? " is-active" : "") + '" href="' + href + '">' + esc(label) + "</a>";
  }

  function renderSidebar() {
    var route = parseHash();
    var top = route.seg[0] || "";
    var cat = route.params.get("cat") || "";

    var counts = countBy(ENTRIES, "category");
    var h = "";

    h += '<div class="side-brand"><a href="#/">';
    h += '<span class="side-title">' + esc(META.title) + "</span>";
    h += '<span class="side-sub">' + esc(META.subtitle) + "</span>";
    h += "</a></div>";

    h += '<nav class="side-nav">';
    h += sideLink("#/", "首页", top === "");
    h += sideLink("#/entries", "条目库", top === "entries" && !cat);
    h += sideLink("#/topics", "议题板", top === "topics");
    h += sideLink("#/series", "专题", top === "series");
    h += sideLink("#/contribute", "添加条目", top === "contribute");
    h += sideLink("#/about", "关于与凡例", top === "about");
    h += "</nav>";

    h += '<div class="side-group"><p class="side-label">类别</p><nav class="side-nav side-cats">';
    CATS.forEach(function (c) {
      var on = top === "entries" && cat === c.id;
      h += '<a class="side-link side-cat' + (on ? " is-active" : "") + '" href="' + hrefEntries({ cat: c.id }) + '">';
      h += "<span>" + esc(c.name) + "</span>";
      h += '<span class="side-count">' + (counts[c.id] || 0) + "</span>";
      h += "</a>";
    });
    h += "</nav></div>";

    if (SERIES.length) {
      h += '<div class="side-group"><p class="side-label">专题</p><nav class="side-nav side-cats">';
      SERIES.forEach(function (s) {
        var on = top === "s" && route.seg[1] === s.id;
        var n = ENTRIES.filter(function (e) { return e.series === s.id; }).length;
        h += '<a class="side-link side-cat' + (on ? " is-active" : "") + '" href="#/s/' + encodeURIComponent(s.id) + '">';
        h += "<span>" + esc(s.short || s.name) + "</span>";
        h += '<span class="side-count">' + n + "</span>";
        h += "</a>";
      });
      h += "</nav></div>";
    }

    h += '<div class="side-foot">';
    h += "<p>" + ENTRIES.length + " 条考据 · " + TOPICS.length + " 个议题</p>";
    h += "<p>更新于 " + esc(fmtDate(META.updated)) + "</p>";
    h += "</div>";

    document.getElementById("sidebar-inner").innerHTML = h;
  }

  /* -------------------------------------------------------------- render */
  function render() {
    var route = parseHash();
    var top = route.seg[0] || "";

    /* 先把筛选状态落定，再算视图——顺序错了会沿用上一页的搜索词 */
    STATE.cat = route.params.get("cat") || "";
    STATE.q = top === "entries" ? (route.params.get("q") || "") : "";
    STATE.media = top === "entries" ? (route.params.get("m") || "") : "";

    var main = document.getElementById("main");
    var html = "";
    var title = META.title;

    if (top === "") {
      html = viewHome();
      title = META.title + " · " + META.subtitle;
    } else if (top === "entries") {
      html = viewEntries();
      title = "条目库 · " + META.title;
    } else if (top === "e") {
      var e = byId[route.seg[1]];
      html = viewEntry(route.seg[1]);
      title = (e ? e.title : "未找到") + " · " + META.title;
    } else if (top === "topics") {
      html = viewTopics();
      title = "议题板 · " + META.title;
    } else if (top === "series") {
      html = viewSeriesList();
      title = "专题 · " + META.title;
    } else if (top === "s") {
      var se = seriesById(route.seg[1]);
      html = viewSeries(route.seg[1]);
      title = (se ? se.name : "未找到") + " · " + META.title;
    } else if (top === "t") {
      var t = topicById[route.seg[1]];
      html = viewTopic(route.seg[1]);
      title = (t ? t.question : "未找到") + " · " + META.title;
    } else if (top === "about") {
      html = viewAbout();
      title = "关于与凡例 · " + META.title;
    } else if (top === "contribute") {
      html = viewContribute();
      title = "添加条目 · " + META.title;
    } else {
      html = viewNotFound("这个地址不存在。");
      title = "未找到 · " + META.title;
    }

    main.innerHTML = html;
    document.title = title;

    /* 同步搜索框：只在条目列表页显示当前查询词 */
    var input = document.getElementById("search");
    if (top === "entries") {
      if (input.value !== STATE.q) input.value = STATE.q;
    } else if (document.activeElement !== input) {
      input.value = "";
    }
    document.getElementById("search-clear").hidden = !input.value;
    document.getElementById("foot-meta").textContent = META.title + " · " + META.subtitle + " · " + ENTRIES.length + " 条";

    renderSidebar();
  }

  /* --------------------------------------------------------------- boot */
  function closeMenu() {
    document.getElementById("sidebar").classList.remove("is-open");
    document.getElementById("scrim").hidden = true;
    document.getElementById("menu-btn").setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    document.getElementById("sidebar").classList.add("is-open");
    document.getElementById("scrim").hidden = false;
    document.getElementById("menu-btn").setAttribute("aria-expanded", "true");
  }

  function onRouteChange() {
    render();
    closeMenu();
    window.scrollTo(0, 0);
  }

  /* 主题 */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("codex-theme", t); } catch (err) { /* 忽略 */ }
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem("codex-theme"); } catch (err) { /* 忽略 */ }
    if (saved === "light" || saved === "dark") { applyTheme(saved); return; }
    var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(dark ? "dark" : "light");
  }

  /* 事件绑定 */
  document.getElementById("theme-btn").addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "dark" ? "light" : "dark");
  });

  document.getElementById("menu-btn").addEventListener("click", function () {
    var sb = document.getElementById("sidebar");
    if (sb.classList.contains("is-open")) closeMenu(); else openMenu();
  });

  document.getElementById("scrim").addEventListener("click", closeMenu);

  var searchInput = document.getElementById("search");
  searchInput.addEventListener("input", function () {
    var v = searchInput.value;
    document.getElementById("search-clear").hidden = !v;
    var route = parseHash();
    var p = new URLSearchParams();
    if (v) p.set("q", v);
    if (route.seg[0] === "entries" && STATE.cat) p.set("cat", STATE.cat);
    if (route.seg[0] === "entries" && STATE.media) p.set("m", STATE.media);
    var qs = p.toString();
    setHash("#/entries" + (qs ? "?" + qs : ""));
    render();
  });

  document.getElementById("search-clear").addEventListener("click", function () {
    searchInput.value = "";
    document.getElementById("search-clear").hidden = true;
    setHash(hrefEntries({ cat: STATE.cat, m: STATE.media }));
    render();
    searchInput.focus();
  });

  document.addEventListener("keydown", function (ev) {
    var tag = (ev.target && ev.target.tagName) || "";
    var typing = tag === "INPUT" || tag === "TEXTAREA" || (ev.target && ev.target.isContentEditable);
    if (ev.key === "/" && !typing) {
      ev.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    if (ev.key === "Escape") {
      if (document.activeElement === searchInput) {
        searchInput.blur();
      } else {
        closeMenu();
      }
    }
  });

  window.addEventListener("hashchange", onRouteChange);

  initTheme();
  if (!location.hash) setHash("#/");
  render();
})();
