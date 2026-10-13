# llm-learning 项目规范（Harness Rules）

大语言模型学习地图：单文件交互式论文知识图谱（54 篇里程碑论文，SVG 渲染）。

## 项目结构

```
index.html          # 页面本体：单文件、零运行时依赖，双击即可打开
tests/ui.test.mjs   # UI 交互测试（playwright-core 驱动本机 Chrome）
tests/screenshot.png# 测试结束自动截图（视觉校验用，可删除重建）
package.json        # 仅测试设施用；index.html 本身不依赖 node_modules
papers/             # 论文 PDF 及对应中文解读 md（arXiv编号-短名.pdf / .md 成对）
```

## 命令

- 运行交互测试：`npm test`
- 打开页面：`open index.html`

## 代码约定

- `index.html` 保持**单文件、零依赖**：不引入构建步骤、不引入框架/CDN 外链。
- 论文数据全部在文件内 `const DATA = {...}`，改数据只动这一处。
- 图谱布局：x = `ERA_X[era]`（时间列），y = `TOP + laneY * LANE_H`；依赖边由 `deps` 自动生成。
- 新增交互功能时，同步在 `tests/ui.test.mjs` 补一条对应测试。

## 交互验证规则（强制）

核心原则：**验证手段的保真度必须匹配被测的交互层级**。交付前必须完成对应等级的验证，不允许只做低等级验证就宣称交互功能可用。

| 等级 | 手段 | 适用 |
|---|---|---|
| L1 直接调函数 | 控制台/脚本调用渲染函数 | 纯渲染逻辑（面板内容、数据展示） |
| L2 合成 DOM 事件 | `dispatchEvent(...)` | 事件处理器接线 |
| L3 真实输入管线 | Playwright `page.click()` / `mouse.*` / `fill()` | **一切鼠标/键盘交互**（点击、拖拽、悬停、输入） |

L3 的具体要求：

1. **走真实输入**：点击、拖拽、悬停类功能必须用 `tests/ui.test.mjs` 里的真实输入 API 验证。合成事件会绕过浏览器的事件定目标逻辑（命中测试、指针捕获、悬停重派发），历史上已两次因此漏 bug：
   - `setPointerCapture` 导致 click 事件目标被改派发到画布，节点点击失效——L1/L2 均未发现，L3 才暴露。
   - 搜索后视图平移触发浏览器对静止鼠标重新命中测试，派发 `mouseleave` 清掉了搜索高亮——只有真实输入序列能复现。
2. **状态清理函数（如 hover 的 clearHighlight）不得覆盖过滤状态**（搜索词、图例筛选），应重新应用过滤而不是简单清空 class。
3. **视觉校验**：改动样式/布局后必须截图并用 ReadMediaFile 回读确认，不能只看断言。
4. **全绿才交付**：`npm test` 未全部通过时，必须如实说明哪些项失败及原因，不得宣称完成。

## 测试编写要点（踩过的坑）

- **不要用硬编码坐标点"空白处"**——图谱密集，很可能点到节点。用页内 `document.elementFromPoint` 扫描找一个确认空白的坐标再点（参考测试用例 2）。
- **用例间隔离状态**：每个用例开始前确认面板开合、搜索框、图例筛选等状态，必要时先复位。
- **headless 截图可能拍到 CSS 过渡动画中间帧**：截图前等待动画结束，或临时去掉 transition 再截。
- **调试页内时序问题**：注入 `MutationObserver` 监听 class/属性变化、用 `page.on("console")` + 页内 `console.log` 把运行时状态变成可读文本。
- **pageerror 监听必须挂**：`page.on("pageerror")` 能在第一时间暴露页面 JS 报错。

## 工作流程

1. 改 `index.html`（需要时同步改测试）。
2. `npm test` 全绿。
3. 看 `tests/screenshot.png` 做视觉确认。
4. 如实汇报：测试通过项、截图观察结果、未能验证的部分。
