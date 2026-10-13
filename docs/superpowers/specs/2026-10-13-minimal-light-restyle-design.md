# 学习地图 UI 改版设计：极简浅色 × 底部抽屉

日期：2026-10-13
状态：已与用户确认视觉方向与布局（通过浏览器视觉稿对比选择）

## 背景与目标

当前 `index.html` 采用 GitHub Dark 风格（`#0d1117` 底 / `#58a6ff` 蓝），与用户参考的他人页面雷同。本次改版目标：

1. **差异化**：整体气质与 GitHub 深色仪表盘彻底拉开。
2. **优化体验**：浅色暖白底更适合长时间阅读；详情改为底部抽屉后，图谱横向视野不被压缩。
3. **不动数据与交互逻辑**：`DATA` 常量、布局算法（`ERA_X` / `laneY`）、缩放/拖拽/搜索/图例筛选/悬停高亮等行为全部保留。

已选定的方向（视觉稿对比结果）：

- 风格：**极简浅色**（Linear / Notion 式：暖白底、发丝边框、白卡片、左侧类别色条）
- 布局：**左侧栏导航 + 右侧悬浮详情卡**（初版实现为底部抽屉，用户验收后改为侧栏方案：标题/搜索/图例收进左边 220px 常驻侧栏，中间图谱，详情为右侧悬浮圆角卡片）

## 范围

- 只改 `index.html` 的 CSS、少量 DOM 结构和极少量 JS（抽屉开关、Esc、panToPaper 偏移）。
- `tests/ui.test.mjs` 同步更新（新增 Esc 关闭用例；其余用例因 id 保留应无需改动，如有断言失效则适配）。
- `DATA` 中 `categories` 的 `color`/`bg` 字段需要换成浅色调色板（数据语义不变，仅换色值）。

## 设计令牌

| 令牌 | 值 | 用途 |
|---|---|---|
| 底色 | `#fbfaf8` | 页面/画布底（暖白） |
| 纸纹 | `radial-gradient(#e7e2da 1px, transparent 1px)` 22px 网格 | 画布网点（CSS background，屏幕固定） |
| 卡片面 | `#ffffff` | 节点、图例浮卡、抽屉、顶栏 |
| 发丝边 | `#e7e2da`（主）/ `#ece9e4`（次） | 卡片边框、分隔线 |
| 文字主 | `#1c1917` | 标题、节点标题 |
| 文字次 | `#78716c` | 正文辅助 |
| 文字弱 | `#a8a29e` | 节点副标题、年代标尺、提示 |
| 全局点缀 | `#dc2626`（朱红） | 选中环、高亮边、链接/按钮、搜索聚焦框、图例选中态浅底 `#fef2f2` |
| 边默认 | `#d6d3cd` | 依赖边与箭头 |
| 级别色 | 必读 `#dc2626` / 推荐 `#d97706` / 进阶 `#16a34a` | 节点角标、徽章 |

字体：UI 统一系统 sans（现状栈不变）；公式块保持等宽（`"SF Mono", Menlo, Consolas`）。

## 类别调色板（14 类，浅色可读版）

替换 `DATA.categories.*.color`；节点不再用整卡深色 `bg`（改为白卡 + 左侧色条），`bg` 字段删除：

foundation `#0ea5e9` / attention `#16a34a` / transformer `#ea580c` / bert `#7c3aed` / gpt `#b45309` / scaling `#e11d48` / efficiency `#059669` / alignment `#a16207` / opensource `#0d9488` / application `#9f1239` / agent `#c026d3` / prompting `#f59e0b` / context `#2563eb` / frontier `#57534e`

## 组件设计

### 左侧栏（`#sidebar`，替代原顶栏）

- fixed 左侧常驻，宽 220px，白底 + 右侧发丝边；纵向排列：标题（15px/700）→ 副标题（10.5px 弱色，两行）→ 胶囊搜索框（`#search`，全宽）→ 适应视图按钮（`#fitBtn`，全宽）→ 图例区。
- 画布 `#stage` 让出侧栏：`inset: 0 0 0 220px`，网点纸纹不变。
- 年代标签 `.era-label`：弱色、字距 0.15em；分隔虚线 `.era-line` 改 `#e7e2da`。

### 依赖边

- `.edge` 描边 `#d6d3cd`；`.edge.hi` 朱红 2.2px；`marker` 箭头填充色同步更换（`#d6d3cd` / `#dc2626`）。

### 论文节点（`.node`）

- 结构微调：白卡 `fill:#fff`、1px 发丝边（SVG 用 `stroke:#e7e2da`）、`rx:6`；**左侧 3px 类别色条**（在卡内左侧画一个圆角 rect，宽 3.5、高 `NODE_H-10`、fill 为类别色）。
- 节点标题 `#1c1917`、副标题 `#a8a29e`（不再用类别色着色标题，避免浅底上花哨）。
- 级别角标（必读/推荐/进阶）位置、重要性圆点保留；圆点：命中=类别色，未命中 `#e7e2da`。
- hover / `.hi`：不再用 `brightness()` 滤镜（白卡无效），改为描边加深为类别色 + 投影（SVG `filter` drop-shadow 或直接 stroke 换色 + stroke-width 2）。
- 选中态：朱红外环（描边 `#dc2626`、stroke-width 2）——用 `.selected` class 驱动，JS 在 `selectPaper`/`closePanel` 里切换。

### 图例（`#legend`）

- 收进侧栏底部常驻（不再是左下浮卡）：`flex:1` 占满剩余高度、可滚动，顶部分隔线；标题「图例筛选」。
- `.item` 行内色块改为 9px 圆角小方块；选中（`.on`）行：`#fef2f2` 浅底 + 朱红文字。
- 交互不变（单选切换 + `applyNodeFilter`）。

### 详情浮卡（`#panel`）

- id 保留 `#panel` / `#panelBody` / `#closeBtn`，class 语义不变（`.open`）。
- 形态：fixed 右侧悬浮卡片，`top/right/bottom: 16px`，宽 360px，圆角 14px，发丝边 + 大投影；`transform: translateX(calc(100% + 24px))` ↔ `translateX(0)`，过渡 .18s。
- 内部单栏可滚动（`#panelBody`）：徽章行（类别 + 级别，胶囊描边样式）→ 标题 h2 → meta 行（作者/年份/会议，弱色）→ 摘要 → 核心公式块（`#fbfaf8` 底等宽）→ 主要贡献列表 → 阅读前置要求 → 依赖论文 chips → 后续延伸 chips → arXiv 按钮（朱红描边胶囊）。
- 关闭途径：✕、点击空白画布（现有逻辑）、Esc 键。
- `panToPaper`：水平方向让出浮卡宽度的一半，即 `view.x = (rect.width - cardW)/2 - p.x*view.k`（`cardW` 取浮卡实际宽 + 32px 外边距，仅在浮卡打开时计入）；垂直居中不变。

### 提示（`#hint`）

- 位置、内容不变，弱色；z-index 低于抽屉（抽屉打开时自然遮挡，无需特殊处理）。

## 交互保留与变更清单

保留（逻辑不动）：滚轮缩放、拖拽平移、拖拽后抑制误点击、点击节点开详情、点击空白关详情、悬停高亮依赖链（`highlightDeps` / `clearHighlight` 恢复过滤状态）、搜索高亮+平移、图例单选过滤、`fitView`、chips 面板内跳转。

变更：

1. 顶栏移除，标题/搜索/适应视图收进左侧常驻侧栏；图例从浮卡改为侧栏内常驻列表。
2. 详情容器由右侧滑入面板 → 右侧悬浮圆角卡片（DOM id 不变）。
3. 新增 Esc 关闭浮卡。
4. 新增节点选中态 `.selected`（朱红环）：`selectPaper` 时给当前节点加、并清除旧节点的选中态；`closePanel` 时清除。
5. hover 高亮由滤镜改为描边/投影方案。

## 测试计划

- 现有 6 个用例因 id/交互语义保留，预期不改动；跑 `npm test` 验证。
- 新增用例：侧栏结构断言（`#sidebar` 内含 `#search` 与 `#legend`）；浮卡打开时 `boundingBox` 贴右侧悬浮（top=16、right=视口宽-16、宽 360）；Esc 关闭浮卡；`.selected` 标记随开关增减。
- 用例 2 的空白点扫描逻辑天然跳过非 `#stage` 元素，侧栏与浮卡均不影响。
- 交付前按 AGENTS.md 走 L3 真实输入验证 + 截图 ReadMediaFile 视觉回读。

## 约束与风险

- `index.html` 保持单文件、零运行时依赖（AGENTS.md 硬性约定）。
- 浅色底上 14 个类别色需逐一目检可辨识度（截图确认）。
- `filter: drop-shadow` 在大量节点上可能有性能开销；如卡顿则退化为纯描边方案。
