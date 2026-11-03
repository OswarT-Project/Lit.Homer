/* =========================================================================
 * tools/render-test.js —— 渲染自检
 *
 * 用法（需要 Node.js）：
 *     node tools/render-test.js
 *
 * 在 Node 里用一个极简的 DOM 模拟层加载 app.js，逐条路由跑一遍，
 * 检查有没有报错、有没有渲染出 undefined / NaN、搜索过滤是否正确。
 * 不依赖浏览器，改完代码随手跑。
 * ========================================================================= */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

/* --------------------------------------------------------- DOM 模拟层 */
function makeEl(id) {
  const el = {
    id,
    tagName: id === "search" ? "INPUT" : "DIV",
    isContentEditable: false,
    innerHTML: "",
    textContent: "",
    value: "",
    hidden: false,
    _handlers: {},
    classList: {
      _s: new Set(["x"]),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    setAttribute() {},
    getAttribute() { return null; },
    addEventListener(t, fn) { el._handlers[t] = fn; },
    focus() {},
    select() {},
    blur() {}
  };
  return el;
}

const els = new Map();
function getEl(id) {
  if (!els.has(id)) els.set(id, makeEl(id));
  return els.get(id);
}

const winHandlers = {};
const docHandlers = {};

const location = { hash: "" };

const documentStub = {
  title: "",
  documentElement: {
    _attrs: {},
    setAttribute(k, v) { this._attrs[k] = v; },
    getAttribute(k) { return this._attrs[k] || null; }
  },
  body: makeEl("body"),
  activeElement: null,
  getElementById: getEl,
  addEventListener(t, fn) { docHandlers[t] = fn; },
  querySelectorAll() { return []; }
};

const windowStub = {
  matchMedia() { return { matches: false }; },
  scrollTo() {},
  addEventListener(t, fn) { winHandlers[t] = fn; }
};

const sandbox = {
  window: windowStub,
  document: documentStub,
  location,
  history: { replaceState() {} },
  localStorage: {
    _d: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = String(v); }
  },
  URLSearchParams,
  console,
  setTimeout,
  encodeURIComponent,
  decodeURIComponent
};
sandbox.window.CODEX_META = null;

vm.createContext(sandbox);
const ctx = vm.createContext(sandbox);

/* 数据文件挂在 window 上 */
for (const f of ["data/entries.js", "data/topics.js", "data/series.js"]) {
  vm.runInContext(read(f), ctx, { filename: f });
}
const ENTRIES = sandbox.window.CODEX_ENTRIES;
const TOPICS = sandbox.window.CODEX_TOPICS;
const SERIES = sandbox.window.CODEX_SERIES || [];

vm.runInContext(read("assets/app.js"), ctx, { filename: "assets/app.js" });

const main = getEl("main");
const sidebar = getEl("sidebar-inner");

/* ------------------------------------------------------------- 断言 */
const fails = [];
const oks = [];

function check(name, cond, detail) {
  if (cond) oks.push(name);
  else fails.push(name + (detail ? " —— " + detail : ""));
}

function nav(hash) {
  location.hash = hash;
  if (winHandlers.hashchange) winHandlers.hashchange();
  return main.innerHTML;
}

/* 初始（首页） */
check("首页渲染出主标题", /hero-title/.test(main.innerHTML));
check("首页有统计块", /stat-num/.test(main.innerHTML));
check("侧边栏渲染出类别", (sidebar.innerHTML.match(/side-cat/g) || []).length >= 5);
check("侧边栏条目数正确", sidebar.innerHTML.includes(ENTRIES.length + " 条考据"));

/* 每条条目 */
for (const e of ENTRIES) {
  const html = nav("#/e/" + encodeURIComponent(e.id));
  check(`条目「${e.id}」渲染`, html.includes(e.game.title) && html.includes(e.work.title));
  check(`条目「${e.id}」有正文`, /class="prose"/.test(html));
  check(`条目「${e.id}」无 undefined/NaN`, !/undefined|NaN/.test(html));
  check(`条目「${e.id}」标题进 document.title`, documentStub.title.includes(e.title.slice(0, 8)));
}

/* 来源标记 */
check(
  "每个条目都带来源标记",
  ENTRIES.every((e) => nav("#/e/" + encodeURIComponent(e.id)).includes('class="mark mark-'))
);
check("首页有标记图例", /class="legend"/.test(nav("#/")));
nav("#/e/" + encodeURIComponent(ENTRIES[0].id));
check("星号不进 document.title", !documentStub.title.includes("*"));

/* 议题 */
for (const t of TOPICS) {
  const html = nav("#/t/" + encodeURIComponent(t.id));
  check(`议题「${t.id}」渲染`, html.includes(t.status));
  check(`议题「${t.id}」无 undefined/NaN`, !/undefined|NaN/.test(html));
}

/* 专题 */
for (const s of SERIES) {
  const sh = nav("#/s/" + encodeURIComponent(s.id));
  check(`专题「${s.id}」渲染`, sh.includes(s.name));
  check(`专题「${s.id}」无 undefined/NaN`, !/undefined|NaN/.test(sh));
  if ((s.roster || []).length) check(`专题「${s.id}」有原典表`, /class="roster"/.test(sh));
}
check("专题列表渲染", /class="series-card"/.test(nav("#/series")));

/* 媒介：电影条目的标签应变成「影片 / 导演」 */
const filmHtml = nav("#/e/letranger-film");
check("电影条目用「影片 / 导演」标签", filmHtml.includes("影 片") && filmHtml.includes("导 演"));
check("电影条目带媒介标记", /chip-media/.test(filmHtml));
check("专题条目标出所属专题", /chip-series/.test(nav("#/e/limbus-meursault")));

/* 列表与搜索 */
let html = nav("#/entries");
check("列表页列出全部条目", (html.match(/class="card"/g) || []).length === ENTRIES.length);

html = nav("#/entries?q=" + encodeURIComponent("俳句"));
check("搜索「俳句」命中 1 条", (html.match(/class="card"/g) || []).length === 1, "实际 " + (html.match(/class="card"/g) || []).length);

html = nav("#/entries?q=" + encodeURIComponent("不存在的关键词xyz"));
check("空结果有提示", /这里还是空的/.test(html));

html = nav("#/entries?cat=motif");
const motifCount = ENTRIES.filter((e) => e.category === "motif").length;
check("按类别筛选正确", (html.match(/class="card"/g) || []).length === motifCount, "应 " + motifCount);

html = nav("#/entries?m=painting");
check("按门类筛选（绘画）", (html.match(/class="card"/g) || []).length === 1, "实际 " + (html.match(/class="card"/g) || []).length);

html = nav("#/entries?m=film");
check("按门类筛选（电影）", (html.match(/class="card"/g) || []).length === 1, "实际 " + (html.match(/class="card"/g) || []).length);

/* 固定页 */
for (const h of ["#/about", "#/contribute", "#/topics"]) {
  html = nav(h);
  check(h + " 渲染", html.length > 500);
  check(h + " 无 undefined", !html.includes("undefined"));
}

check("添加条目页有代码模板", /id: &quot;short-slug&quot;/.test(nav("#/contribute")));
check("未知路由给出提示", /这个地址不存在/.test(nav("#/nonsense")));

/* XSS 转义：搜索词会原样回显到结果行 */
const xs = nav("#/entries?q=" + encodeURIComponent('<script>alert(1)</script>'));
check("搜索词被转义", xs.includes("&lt;script&gt;") && !xs.includes("<script>alert"));

/* 结果 */
console.log("互文 · 渲染自检");
console.log("----------------------------------------");
console.log(`通过 ${oks.length} 项`);
if (fails.length) {
  console.log(`\n失败 ${fails.length} 项：`);
  fails.forEach((f) => console.log("  ✕ " + f));
  process.exitCode = 1;
} else {
  console.log("全部通过。");
}
