/* =========================================================================
 * tools/check.js —— 内容体检
 *
 * 用法（需要 Node.js）：
 *     node tools/check.js
 *
 * 检查：id 是否重复、必填字段是否缺失、类别是否合法、
 *       相关条目是否指向不存在的 id、日期格式是否正确。
 * 改完内容跑一遍，比在浏览器里点半天可靠。
 * ========================================================================= */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

function loadData(file) {
  const code = fs.readFileSync(path.join(root, file), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file });
  return sandbox.window;
}

const win = loadData(path.join("data", "entries.js"));
Object.assign(win, loadData(path.join("data", "topics.js")));
Object.assign(win, loadData(path.join("data", "series.js")));

const ENTRIES = win.CODEX_ENTRIES || [];
const TOPICS = win.CODEX_TOPICS || [];
const CATS = win.CODEX_CATEGORIES || [];
const SERIES = win.CODEX_SERIES || [];
const MEDIA = win.CODEX_MEDIA || [];
const CAT_IDS = new Set(CATS.map((c) => c.id));
const MEDIA_IDS = new Set(["book"].concat(MEDIA.map((m) => m.id)));
const SERIES_IDS = new Set(SERIES.map((s) => s.id));

const errors = [];
const warnings = [];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function need(cond, msg) {
  if (!cond) errors.push(msg);
}

function suggest(msg) {
  warnings.push(msg);
}

if (!ENTRIES.length) errors.push("data/entries.js: CODEX_ENTRIES 为空");
if (!TOPICS.length) errors.push("data/topics.js: CODEX_TOPICS 为空");

const ids = new Set();

for (const e of ENTRIES) {
  const tag = `条目「${e.id || "(无 id)"}」`;
  need(e.id, `${tag}: 缺少 id`);
  need(!ids.has(e.id), `${tag}: id 重复`);
  ids.add(e.id);

  need(e.title, `${tag}: 缺少 title`);
  need(CAT_IDS.has(e.category), `${tag}: category「${e.category}」不在类别表中`);
  need(e.summary, `${tag}: 缺少 summary`);
  need(e.game && e.game.title, `${tag}: 缺少 game.title`);
  need(e.work && e.work.title, `${tag}: 缺少 work.title`);

  if (e.work && e.work.medium && !MEDIA_IDS.has(e.work.medium)) {
    need(false, `${tag}: work.medium「${e.work.medium}」不在媒介表中`);
  }
  if (e.game && e.game.medium && !MEDIA_IDS.has(e.game.medium)) {
    need(false, `${tag}: game.medium「${e.game.medium}」不在媒介表中`);
  }
  if (e.series && !SERIES_IDS.has(e.series)) {
    need(false, `${tag}: series 指向不存在的专题「${e.series}」`);
  }
  if (!e.origin) {
    suggest(`${tag}: 缺少 origin（ai / human），页面上会按 * 处理`);
  } else if (e.origin !== "ai" && e.origin !== "human") {
    need(false, `${tag}: origin「${e.origin}」只能是 ai 或 human`);
  }

  if (!e.updated || !DATE_RE.test(e.updated || "")) {
    suggest(`${tag}: updated 应为 YYYY-MM-DD，当前为「${e.updated}」`);
  }
  if (!Array.isArray(e.body) || !e.body.length) suggest(`${tag}: body 为空，正文会没有内容`);
  if (e.quote && !e.quote.source) suggest(`${tag}: 有引文但缺少 quote.source（出处）`);
  if (e.quote && e.quote.text && !e.quote.note) {
    suggest(`${tag}: 引文未注明译文处理，按凡例应补 quote.note`);
  }
  if (!Array.isArray(e.tags) || e.tags.length < 2) suggest(`${tag}: 建议至少两个 tags，方便搜索`);
}

/* 相关条目只能指向真实存在的 id（跨文件检查） */
for (const e of ENTRIES) {
  for (const r of e.related || []) {
    need(ids.has(r), `条目「${e.id}」: related 指向不存在的 id「${r}」`);
    need(r !== e.id, `条目「${e.id}」: related 不能指向自己`);
  }
}

const topicIds = new Set();
for (const t of TOPICS) {
  const tag = `议题「${t.id || "(无 id)"}」`;
  need(t.id, `${tag}: 缺少 id`);
  need(!topicIds.has(t.id), `${tag}: id 重复`);
  topicIds.add(t.id);
  need(t.question, `${tag}: 缺少 question`);
  need(t.status, `${tag}: 缺少 status（征集 / 整理中 / 已完成）`);
  if (!["征集", "整理中", "已完成"].includes(t.status)) {
    suggest(`${tag}: status「${t.status}」不是约定的三种之一`);
  }
  for (const r of t.entries || []) {
    need(ids.has(r), `议题「${t.id}」: entries 指向不存在的条目「${r}」`);
  }
  if (!t.origin) suggest(`议题「${t.id}」: 缺少 origin（ai / human）`);
}

for (const s of SERIES) {
  const tag = `专题「${s.id || "(无 id)"}」`;
  need(s.id, `${tag}: 缺少 id`);
  need(s.name, `${tag}: 缺少 name`);
  for (const r of s.roster || []) {
    need(r.name && r.work, `${tag}: roster 里有缺人物名或原典名的行`);
    if (r.medium && !MEDIA_IDS.has(r.medium)) {
      suggest(`${tag}: roster「${r.name}」的 medium「${r.medium}」不在媒介表中`);
    }
  }
}

const games = new Set(
  ENTRIES.filter((e) => e.game && (!e.game.medium || e.game.medium === "game"))
    .map((e) => e.game.title)
    .filter(Boolean)
);
const works = new Set(ENTRIES.map((e) => e.work && e.work.title).filter(Boolean));

console.log("互文 · 内容体检");
console.log("----------------------------------------");
console.log(`条目 ${ENTRIES.length} 条 / 议题 ${TOPICS.length} 个 / 专题 ${SERIES.length} 个 / 类别 ${CATS.length} 个`);
console.log(`涉及游戏 ${games.size} 款 / 著作 ${works.size} 部`);
console.log(`成员撰写 ${ENTRIES.filter((e) => e.origin === "human").length} 条 / 待改写 ${ENTRIES.filter((e) => e.origin !== "human").length} 条`);
console.log("");

if (warnings.length) {
  console.log(`提示（${warnings.length}）：`);
  warnings.forEach((w) => console.log("  · " + w));
  console.log("");
}

if (errors.length) {
  console.log(`错误（${errors.length}）：`);
  errors.forEach((e) => console.log("  ✕ " + e));
  process.exitCode = 1;
} else {
  console.log("没有发现结构错误。");
}
