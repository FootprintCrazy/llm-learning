# 学习地图 UI 改版（极简浅色 × 底部抽屉）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `index.html` 从 GitHub Dark 仪表盘风格改版为「极简浅色 + 底部抽屉详情」，与参考页面拉开差异，同时保留全部交互逻辑。

**Architecture:** 单文件零依赖页面。改动集中在 `<style>` 块换肤、节点/边 SVG 渲染参数调整、详情面板 DOM 由右侧滑入改为底部抽屉；`DATA` 仅替换类别色值。所有 DOM id 保留，现有测试断言基本不受影响。

**Tech Stack:** 原生 HTML/CSS/SVG/JS（无框架）；playwright-core + 本机 Chrome 做 L3 真实输入测试（`npm test`）。

**Spec:** `docs/superpowers/specs/2026-10-13-minimal-light-restyle-design.md`

## Global Constraints

- `index.html` 保持**单文件、零运行时依赖**：不引入构建步骤、框架、CDN 外链。
- `DATA` 只允许改 `categories.*.color` 色值并删除 `bg` 字段；论文字段一律不动。
- 保留 DOM id：`#topbar` `#search` `#fitBtn` `#stage` `#canvas` `#viewport` `#legend` `#hint` `#panel` `#panelBody` `#closeBtn`；保留 class 语义：`.open` `.hi` `.dim` `.item` `.chip` `.badge`。
- 交互逻辑不改：缩放/拖拽/搜索/图例筛选/悬停高亮/`clearHighlight` 恢复过滤状态。
- 验证必须走 L3 真实输入（`npm test`），交付前截图并用 ReadMediaFile 回读确认。
- 每个任务结束：`npm test` 全绿 → 截图目检 → 提交。

---

### Task 1: 全局换肤（底色/顶栏/画布/年代标尺/图例/提示）

**Files:**
- Modify: `index.html`（`<style>` 全局段、顶栏段、画布段、图例段；`<div id="legend">` 标题文字）

**Interfaces:**
- Produces: 浅色令牌（底 `#fbfaf8`、边 `#e7e2da`、点缀 `#dc2626`、文字 `#1c1917/#78716c/#a8a29e`），后续任务的组件 CSS 沿用这些值。

- [ ] **Step 1: 改全局底色与顶栏 CSS**

用 Edit 把：

```css
  html, body { height: 100%; overflow: hidden; background: #0d1117; color: #c9d1d9;
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif; }
```

改为：

```css
  html, body { height: 100%; overflow: hidden; background: #fbfaf8; color: #1c1917;
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif; }
```

再把顶栏整段（`#topbar` 到 `#fitBtn:hover`，当前在 `index.html:13-24`）替换为：

```css
  #topbar { position: fixed; top: 0; left: 0; right: 0; height: 44px; z-index: 20;
    display: flex; align-items: center; gap: 14px; padding: 0 16px;
    background: rgba(255,255,255,.92); border-bottom: 1px solid #ece9e4; backdrop-filter: blur(6px); }
  #topbar h1 { font-size: 14px; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }
  #topbar .sub { font-size: 11px; color: #a8a29e; white-space: nowrap; }
  #topbar .spacer { flex: 1; }
  #search { width: 220px; padding: 6px 14px; font-size: 12px; color: #1c1917;
    background: #f5f3ef; border: 1px solid #ece9e4; border-radius: 99px; outline: none; }
  #search:focus { border-color: #dc2626; background: #fff; }
  #fitBtn { padding: 6px 14px; font-size: 12px; color: #57534e; cursor: pointer;
    background: #fff; border: 1px solid #e7e2da; border-radius: 99px; }
  #fitBtn:hover { border-color: #dc2626; color: #dc2626; }
```

- [ ] **Step 2: 改画布与年代标尺 CSS**

把（当前 `index.html:27-31`）：

```css
  #stage { position: fixed; inset: 52px 0 0 0; cursor: grab; }
  #stage.dragging { cursor: grabbing; }
  svg { width: 100%; height: 100%; display: block; }
  .era-label { fill: #8b949e; font-size: 13px; font-weight: 700; text-anchor: middle; }
  .era-line { stroke: #21262d; stroke-width: 1; stroke-dasharray: 3 5; }
```

替换为（注意 `inset` 顶部跟随顶栏改为 44px；网点纸纹为屏幕固定背景）：

```css
  #stage { position: fixed; inset: 44px 0 0 0; cursor: grab;
    background: radial-gradient(circle, #e7e2da 1px, transparent 1px); background-size: 22px 22px; }
  #stage.dragging { cursor: grabbing; }
  svg { width: 100%; height: 100%; display: block; }
  .era-label { fill: #a8a29e; font-size: 12px; font-weight: 600; letter-spacing: .15em; text-anchor: middle; }
  .era-line { stroke: #e7e2da; stroke-width: 1; stroke-dasharray: 3 5; }
```

- [ ] **Step 3: 改图例与提示 CSS + 图例标题文字**

把图例/提示段（当前 `index.html:42-51`）：

```css
  #legend { position: fixed; left: 12px; bottom: 12px; z-index: 15; width: 168px;
    max-height: 46vh; overflow: auto; padding: 10px 12px; font-size: 11px;
    background: rgba(22,27,34,.92); border: 1px solid #30363d; border-radius: 8px; }
  #legend h3 { font-size: 11px; color: #8b949e; margin-bottom: 6px; }
  #legend .item { display: flex; align-items: center; gap: 7px; padding: 2.5px 4px;
    border-radius: 4px; cursor: pointer; }
  #legend .item:hover { background: #21262d; }
  #legend .dot { width: 9px; height: 9px; border-radius: 3px; flex: none; }
  #hint { position: fixed; right: 12px; bottom: 12px; z-index: 15; font-size: 11px; color: #6e7681; }
```

替换为：

```css
  #legend { position: fixed; left: 12px; bottom: 12px; z-index: 15; width: 168px;
    max-height: 46vh; overflow: auto; padding: 10px 12px; font-size: 11px;
    background: rgba(255,255,255,.94); border: 1px solid #e7e2da; border-radius: 10px;
    box-shadow: 0 4px 16px rgba(28,25,23,.08); backdrop-filter: blur(4px); }
  #legend h3 { font-size: 11px; color: #a8a29e; letter-spacing: .08em; margin-bottom: 6px; }
  #legend .item { display: flex; align-items: center; gap: 7px; padding: 2.5px 6px;
    border-radius: 5px; cursor: pointer; color: #57534e; }
  #legend .item:hover { background: #f5f3ef; }
  #legend .item.on { background: #fef2f2; color: #dc2626; font-weight: 600; }
  #legend .dot { width: 9px; height: 9px; border-radius: 3px; flex: none; }
  #hint { position: fixed; right: 12px; bottom: 12px; z-index: 15; font-size: 11px; color: #a8a29e; }
```

HTML 中 `<div id="legend"><h3>图例</h3></div>` 改为 `<div id="legend"><h3>图例筛选</h3></div>`。

- [ ] **Step 4: 跑测试确认无回归**

Run: `npm test`
Expected: `结果: 13 通过, 0 失败`（现有用例全部不受影响；通过数以实际输出为准，但必须 0 失败）

- [ ] **Step 5: 截图目检**

测试会自动刷新 `tests/screenshot.png`。用 ReadMediaFile 回读确认：暖白底、白色顶栏、白图例浮卡、网点纸纹可见。此时节点仍是旧深色配色，属预期（Task 2 处理）。

- [ ] **Step 6: Commit**

```bash
git add index.html tests/screenshot.png
git commit -m "style: 全局换肤为极简浅色（顶栏/画布/图例）"
```

---

### Task 2: 节点与边重绘（类别调色板/白卡色条/选中环/边色）

**Files:**
- Modify: `index.html`（边与节点 CSS 段、SVG marker defs、`DATA.categories`、`LEVELS`、节点渲染 JS）

**Interfaces:**
- Consumes: Task 1 的浅色令牌。
- Produces: `.node.selected` 样式与 `.strip` 色条元素（Task 3 的 JS 会切换 `.selected`）；`DATA.categories.*.color` 浅色版色值。

- [ ] **Step 1: 改边与节点 CSS**

把（当前 `index.html:32-40`）：

```css
  .edge { fill: none; stroke: #3d444d; stroke-width: 1.4; }
  .edge.hi { stroke: #58a6ff; stroke-width: 2.4; }
  .edge.dim, .node.dim { opacity: .12; }
  .node { cursor: pointer; }
  .node rect.body { stroke-width: 1.8; transition: filter .12s; }
  .node:hover rect.body, .node.hi rect.body { filter: brightness(1.35); }
  .node .t { font-size: 12px; font-weight: 700; text-anchor: middle; }
  .node .s { font-size: 9.5px; fill: #8b949e; text-anchor: middle; }
  .node .lv { font-size: 8px; text-anchor: end; }
```

替换为：

```css
  .edge { fill: none; stroke: #d6d3cd; stroke-width: 1.4; }
  .edge.hi { stroke: #dc2626; stroke-width: 2.2; }
  .edge.dim, .node.dim { opacity: .15; }
  .node { cursor: pointer; }
  .node rect.body { fill: #fff; stroke: #e7e2da; stroke-width: 1; transition: stroke .12s, filter .12s; }
  .node:hover rect.body, .node.hi rect.body { stroke: #a8a29e; stroke-width: 1.5;
    filter: drop-shadow(0 2px 6px rgba(28,25,23,.12)); }
  .node.selected rect.body { stroke: #dc2626; stroke-width: 2;
    filter: drop-shadow(0 3px 8px rgba(220,38,38,.18)); }
  .node .t { font-size: 12px; font-weight: 650; text-anchor: middle; fill: #1c1917; }
  .node .s { font-size: 9.5px; fill: #a8a29e; text-anchor: middle; }
  .node .lv { font-size: 8px; text-anchor: end; }
```

- [ ] **Step 2: 改箭头 marker 颜色**

`<defs>` 里两个 marker 的填充色：`fill="#3d444d"` → `fill="#d6d3cd"`；`fill="#58a6ff"` → `fill="#dc2626"`。

- [ ] **Step 3: 替换类别调色板与级别色**

`DATA.categories` 整段替换为（删除全部 `bg` 字段）：

```js
"categories":{"foundation":{"name":"前置基础","color":"#0ea5e9"},"attention":{"name":"Seq2Seq与注意力","color":"#16a34a"},"transformer":{"name":"Transformer架构","color":"#ea580c"},"bert":{"name":"BERT系列","color":"#7c3aed"},"gpt":{"name":"GPT系列","color":"#b45309"},"scaling":{"name":"规模化定律","color":"#e11d48"},"efficiency":{"name":"高效Transformer","color":"#059669"},"alignment":{"name":"对齐与RLHF","color":"#a16207"},"opensource":{"name":"开源模型","color":"#0d9488"},"application":{"name":"应用与涌现","color":"#9f1239"},"agent":{"name":"Agent 设计范式","color":"#c026d3"},"prompting":{"name":"Prompt 工程","color":"#f59e0b"},"context":{"name":"Context 工程","color":"#2563eb"},"frontier":{"name":"前沿进展","color":"#57534e"}}
```

`LEVELS` 替换为：

```js
const LEVELS = {
  must: { label: "必读", color: "#dc2626" },
  rec:  { label: "推荐", color: "#d97706" },
  adv:  { label: "进阶", color: "#16a34a" },
};
```

- [ ] **Step 4: 改节点渲染 JS**

把节点渲染段（当前 `index.html:192-205`，`const g = el("g", ...` 到圆点 for 循环结束）替换为（白卡由 CSS 控制、新增左侧色条、标题不再用类别色、圆点未命中色改浅灰）：

```js
  const g = el("g", { class: "node", transform: `translate(${p.x - NODE_W/2},${p.y})` }, nodesG);
  el("rect", { class: "body", width: NODE_W, height: NODE_H, rx: 7, ry: 7 }, g);
  el("rect", { class: "strip", x: 6, y: 6, width: 3.5, height: NODE_H - 12, rx: 1.75, fill: cat.color }, g);
  const title = el("text", { class: "t", x: NODE_W / 2, y: 21 }, g);
  title.textContent = trunc(p.title, 15);
  const sub = el("text", { class: "s", x: NODE_W / 2, y: 37 }, g);
  sub.textContent = trunc(`${p.authors} · ${p.year}`, 24);
  const lvT = el("text", { class: "lv", x: NODE_W - 7, y: 11, fill: lv.color }, g);
  lvT.textContent = lv.label;
  for (let i = 0; i < 5; i++) {  // 重要性圆点
    el("circle", { cx: NODE_W / 2 - 14 + i * 7, cy: 49, r: 2.4,
      fill: i < p.importance ? cat.color : "#e7e2da" }, g);
  }
```

- [ ] **Step 5: 跑测试确认无回归**

Run: `npm test`
Expected: 0 失败（纯样式与渲染参数变化，不改变交互断言）。

- [ ] **Step 6: 截图目检**

ReadMediaFile 回读 `tests/screenshot.png`：节点应为白卡 + 左侧色条、标题墨色、边浅灰、面板仍是旧深色右侧栏（Task 3 处理，属预期）。确认 14 个类别色条在浅底上可分辨。

- [ ] **Step 7: Commit**

```bash
git add index.html tests/screenshot.png
git commit -m "style: 节点白卡化 + 类别色条 + 浅色边与箭头"
```

---

### Task 3: 详情面板 → 底部抽屉（TDD：先写测试）

**Files:**
- Test: `tests/ui.test.mjs`（新增用例 7 与结尾截图前重开抽屉）
- Modify: `index.html`（`#panel` CSS 段、`selectPaper`/`closePanel`/`panToPaper`、新增 Esc 监听）

**Interfaces:**
- Consumes: Task 2 的 `.node.selected` 样式。
- Produces: `#panelBody` 内两栏结构 `.p-main` / `.p-side`；`closePanel()` 清除 `.selected`；Esc 关闭。

- [ ] **Step 1: 写失败测试**

在 `tests/ui.test.mjs` 用例 6 之后、`await page.screenshot(...)` 之前插入：

```js
// 7) 底部抽屉形态 + 选中态 + Esc 关闭
await page.locator("#nodes .node", { hasText: "Word2Vec" }).first().click();
check("抽屉打开", await panelOpen());
const pbox = await page.$eval("#panel", el => {
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x), w: Math.round(r.width), bottom: Math.round(r.bottom) };
});
check("抽屉全宽贴底", pbox.x === 0 && pbox.w === 1600 && pbox.bottom === 1000, JSON.stringify(pbox));
check("选中节点带 selected 标记", await page.locator("#nodes .node.selected").count() === 1);
await page.keyboard.press("Escape");
check("Esc 关闭抽屉", !(await panelOpen()));
check("关闭后无 selected 节点", await page.locator("#nodes .node.selected").count() === 0);

// 截图前重开一个抽屉（等过渡动画结束，避免拍到中间帧）
await page.locator("#nodes .node", { hasText: "Transformer" }).first().click();
await page.waitForTimeout(300);
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test`
Expected: 「抽屉全宽贴底」失败（此时面板仍是右侧 360px 栏）、「Esc 关闭抽屉」失败（Esc 尚未接线）。

- [ ] **Step 3: 替换面板 CSS 为抽屉样式**

把详情面板整段 CSS（当前 `index.html:53-83`，从 `/* ===== 详情面板 ===== */` 注释到 `.arxiv:hover` 规则）替换为：

```css
  /* ===== 详情抽屉 ===== */
  #panel { position: fixed; left: 0; right: 0; bottom: 0; height: min(320px, 42vh); z-index: 18;
    background: #fff; border-top: 1px solid #e7e2da; box-shadow: 0 -8px 30px rgba(28,25,23,.10);
    transform: translateY(101%); transition: transform .18s ease; }
  #panel.open { transform: translateY(0); }
  #panel .close { position: absolute; top: 10px; right: 14px; z-index: 2; cursor: pointer;
    color: #a8a29e; font-size: 16px; background: none; border: none; }
  #panel .close:hover { color: #1c1917; }
  #panelBody { display: flex; width: 100%; min-height: 0; }
  #panelBody .p-main { flex: 1; min-width: 0; padding: 16px 24px 24px; overflow-y: auto; }
  #panelBody .p-side { width: 300px; flex: none; border-left: 1px solid #ece9e4;
    background: #fbfaf8; padding: 16px 18px 24px; overflow-y: auto; }
  #panelBody .p-main > :first-child, #panelBody .p-side > :first-child { margin-top: 0; }
  #panel h2 { font-size: 17px; line-height: 1.45; color: #1c1917; margin-bottom: 8px; }
  #panel .meta-row { display: flex; flex-wrap: wrap; gap: 18px;
    font-size: 12.5px; color: #a8a29e; margin-bottom: 4px; }
  #panel .badges { display: flex; gap: 8px; margin-bottom: 12px; }
  .badge { font-size: 11px; font-weight: 600; padding: 2px 10px;
    border-radius: 99px; border: 1px solid; }
  #panel h4 { font-size: 12px; font-weight: 700; letter-spacing: .06em; color: #78716c;
    margin: 16px 0 8px; }
  #panel p.abs { font-size: 13px; line-height: 1.85; color: #44403c; }
  #panel .formula { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 12px;
    color: #1c1917; background: #fff; border: 1px solid #e7e2da; border-radius: 6px;
    padding: 10px 12px; line-height: 1.6; word-break: break-all; }
  #panel ul { padding-left: 20px; font-size: 13px; line-height: 1.9; color: #44403c; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { font-size: 11px; padding: 3px 10px; border-radius: 99px; cursor: pointer;
    background: #fff; border: 1px solid #e7e2da; color: #57534e; }
  .chip:hover { border-color: #dc2626; color: #dc2626; }
  #panel .arxiv { display: inline-block; margin-top: 16px; font-size: 12px;
    color: #dc2626; text-decoration: none; border: 1px solid #fecaca;
    padding: 6px 14px; border-radius: 99px; }
  #panel .arxiv:hover { background: #fef2f2; }
```

- [ ] **Step 4: 改 selectPaper 为两栏结构 + 选中态切换**

`selectPaper` 函数体中，在 `selectedId = id;` 之后加一行选中态切换：

```js
  papers.forEach(pp => nodeEls[pp.id].classList.toggle("selected", pp.id === id));
```

`panelBody.innerHTML` 整段模板替换为两栏结构（徽章透明度 `1f`→`14`，公式/依赖/延伸/arXiv 移入右栏）：

```js
  panelBody.innerHTML = `
    <div class="p-main">
      <div class="badges">
        <span class="badge" style="color:${cat.color};border-color:${cat.color};background:${cat.color}14">${cat.name}</span>
        <span class="badge" style="color:${lv.color};border-color:${lv.color};background:${lv.color}14">${lv.label}</span>
      </div>
      <h2>${esc(p.fullTitle)}</h2>
      <div class="meta-row">
        <span>👥 ${esc(p.authors)}</span>
        <span>📅 ${p.year}</span>
        <span>🏛 ${esc(p.venue)}</span>
      </div>
      <h4>摘要</h4><p class="abs">${esc(p.abstract)}</p>
      <h4>主要贡献</h4><ul>${p.contributions.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
      ${p.prerequisites?.length ? `<h4>阅读前置要求</h4><ul>${
        p.prerequisites.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
    </div>
    <div class="p-side">
      ${p.keyFormula ? `<h4>核心公式 / 关键思想</h4><div class="formula">${esc(p.keyFormula)}</div>` : ""}
      ${p.deps.length ? `<h4>依赖论文</h4><div class="chips">${p.deps.map(d => chip(d)).join("")}</div>` : ""}
      ${p.dependents.length ? `<h4>后续延伸</h4><div class="chips">${p.dependents.map(d => chip(d)).join("")}</div>` : ""}
      <a class="arxiv" href="${p.arxiv}" target="_blank" rel="noopener">📄 arXiv / 原文</a>
    </div>`;
```

- [ ] **Step 5: 改 closePanel + 新增 Esc + 改 panToPaper**

`closePanel` 替换为：

```js
function closePanel() {
  panel.classList.remove("open");
  selectedId = null;
  papers.forEach(pp => nodeEls[pp.id].classList.remove("selected"));
}
```

在 `$("#closeBtn").addEventListener("click", closePanel);` 之后新增：

```js
window.addEventListener("keydown", e => { if (e.key === "Escape") closePanel(); });
```

`panToPaper` 替换为（垂直方向让出抽屉高度的一半）：

```js
function panToPaper(p) {
  const rect = stage.getBoundingClientRect();
  if (view.k < 0.7) view.k = 0.9;
  const drawerH = panel.classList.contains("open") ? panel.getBoundingClientRect().height : 0;
  view.x = rect.width / 2 - p.x * view.k;
  view.y = (rect.height - drawerH) / 2 - (p.y + NODE_H / 2) * view.k;
  applyView();
}
```

- [ ] **Step 6: 跑测试确认全部通过**

Run: `npm test`
Expected: `结果: 18 通过, 0 失败`（6 原有用例展开为多条断言 + 用例 7 的 5 条断言；以实际输出为准，必须 0 失败）。

- [ ] **Step 7: 截图目检**

ReadMediaFile 回读 `tests/screenshot.png`：底部抽屉展开（左摘要/贡献、右公式/chips/arXiv）、Transformer 节点带朱红选中环、整体浅色风格统一。逐项核对设计稿令牌：底 `#fbfaf8`、网点纹、朱红点缀、白卡节点。

- [ ] **Step 8: Commit**

```bash
git add index.html tests/ui.test.mjs tests/screenshot.png
git commit -m "feat: 详情面板改为底部抽屉 + Esc 关闭 + 节点选中态"
```

---

### Task 4: 全量回归与收尾

**Files:**
- Modify: 无（仅验证；如发现视觉问题回到对应任务修）

**Interfaces:**
- Consumes: Task 1–3 的全部产物。

- [ ] **Step 1: 全量测试**

Run: `npm test`
Expected: 全部通过，0 失败。

- [ ] **Step 2: 完整视觉回读**

ReadMediaFile 回读 `tests/screenshot.png`，对照设计稿逐区域检查：顶栏 / 年代标尺 / 节点（白卡、色条、级别角标、重要性圆点）/ 边与箭头 / 图例浮卡 / 底部抽屉两栏 / 选中环。发现偏差则定位到对应任务的 CSS 修复并重跑测试。

- [ ] **Step 3: 手动开页抽查交互（L3 已由 npm test 覆盖，此步为人工可选）**

如需要，`open index.html` 人工抽查拖拽/缩放/搜索手感。

- [ ] **Step 4: 推送远端**

仓库已配 `http.proxy=http://127.0.0.1:7897`（需 Clash Verge 在运行）：

```bash
git push
```

---

## Self-Review 记录

- **Spec 覆盖**：令牌/顶栏/画布/标尺（T1）；类别色板/节点/边/选中环样式（T2）；抽屉/两栏/Esc/selected 逻辑/panToPaper/级别色（T2+T3）；测试更新（T3）；验证与交付（T4）。设计文档「交互保留清单」由 Global Constraints 兜底。
- **占位符**：无 TBD；所有代码步骤含完整代码。
- **一致性**：`.p-main`/`.p-side`/`.selected`/`.strip` 命名在 CSS、JS、测试中一致；`closePanel`/`selectPaper`/`panToPaper` 签名未变。

---

## 修订（2026-10-13，用户验收后）

布局从 Task 3 的「底部抽屉」改为「左侧栏导航 + 右侧悬浮详情卡」：

- `#topbar` 移除，新增 `#sidebar`（220px 常驻侧栏，含标题/副标题/`#search`/`#fitBtn`/`#legend`）；`#stage` 改为 `inset: 0 0 0 220px`。
- `#panel` 改为右侧浮卡（`top/right/bottom:16px`，宽 360px，圆角 14px，translateX 滑入）；`#panelBody` 恢复单栏滚动，`.p-main`/`.p-side` 两栏结构移除。
- `panToPaper` 改为水平让出浮卡宽度：`(rect.width - cardW)/2 - p.x*view.k`。
- 测试用例 7 改为：侧栏结构断言 + 浮卡几何断言（top=16 / right=1584 / w=360）+ Esc + `.selected`。
- 已执行完毕：`npm test` 17 通过 0 失败，截图目检通过。
