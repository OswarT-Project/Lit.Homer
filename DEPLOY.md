# 发布上线

三种方式，从简到繁。**都不需要装 Git**。

---

## 方式一：GitHub Pages 网页上传（推荐，长期可用）

不需要命令行，全程在浏览器里点。约 5 分钟。

### 1. 建仓库

登录 <https://github.com> → 右上角 `+` → **New repository**

- **Repository name**：`huiwen`（或你喜欢的任意英文名）
- 选 **Public**
  > 免费账号的 Pages 只支持公开仓库。内容本来就是给社员看的，公开没问题。
- **不要**勾「Add a README file」
- 点 **Create repository**

### 2. 上传文件

进入刚建好的空仓库 → 点 **Add file** → **Upload files**

把 `game-lit-codex` 文件夹**里面的**东西全选，拖进网页的虚线框：

```
index.html
README.md
DEPLOY.md
.nojekyll
assets/      （整个文件夹）
data/        （整个文件夹）
tools/       （整个文件夹，可要可不要）
```

⚠️ 注意两点：

- 拖的是文件夹**里面的内容**，不是把 `game-lit-codex` 这个文件夹本身拖进去。否则网址会变成 `/game-lit-codex/` 而且根目录没有 index.html。
- `assets/` 和 `data/` 必须保持文件夹结构。网页上传支持直接拖文件夹，浏览器会自动保留层级。

拖完点下面的 **Commit changes**。

### 3. 开启 Pages

仓库上方 **Settings** → 左侧 **Pages**

- **Source**：Deploy from a branch
- **Branch**：`main`，目录选 `/ (root)`
- 点 **Save**

等 1—2 分钟，刷新这个页面，顶部会出现：

> Your site is live at `https://你的用户名.github.io/huiwen/`

点进去就是你的站。

### 以后怎么更新

**Add file** → **Upload files** → 拖入修改过的文件（同名会覆盖）→ **Commit changes**。
一分钟内自动生效。

---

## 方式二：Netlify Drop（最快，连账号都可以先不注册）

1. 打开 <https://app.netlify.com/drop>
2. 把整个 `game-lit-codex` 文件夹拖进虚线区域
3. 几秒后得到一个临时网址 `https://xxxx.netlify.app`
4. 想长期保留，注册一下（邮箱即可）就把站点认领到账号下

**更新**：Site 页面 → **Deploys** → 把文件夹再拖一次。

> 国内部分地区访问 Netlify 偏慢；GitHub Pages 也时快时慢。都要顾及的话，可以两个都传，海报上印快的那个。

---

## 方式三：不发网上，直接发给社员

把 `game-lit-codex` 整个文件夹压缩成 zip，发群里。对方解压后双击 `index.html` 即可，断网也能看。

**注意**：压缩包里必须包含 `assets/` 和 `data/`，只发 `index.html` 会白屏。

---

## 常见问题

**打开是一堆代码 / 下载了文件，没显示网页**
说明浏览器没把它当网页。确认文件后缀是 `.html` 而不是 `.html.txt`（Windows 默认隐藏后缀，容易中招）。

**Pages 显示 404**
- 检查仓库根目录有没有 `index.html`（不是 `game-lit-codex/index.html`）
- Settings → Pages 里等状态变成 "Your site is live at ..."
- 有时要等 3—5 分钟

**样式全丢，只有光秃秃的字**
说明 `assets/` 没上传成功，或者目录层级变了。检查仓库里是不是 `assets/style.css` 而不是 `style.css`。

**中文显示成方块**
与本项目无关，是对方系统缺字体。站内字体栈已包含常见中文字体，一般不会出现。

**要绑自己的域名**
Pages 的 Settings → Pages → Custom domain。服务器在境外不需要备案，但国内访问速度不变。
