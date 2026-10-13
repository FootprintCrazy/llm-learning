// UI 交互测试：通过 playwright-core 驱动本机 Chrome，走真实输入管线
// 运行：npm test
import { chromium } from "playwright-core";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE = "file://" + path.resolve(__dirname, "../index.html");

let passed = 0, failed = 0;
function check(name, cond, extra = "") {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name} ${extra}`); }
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on("pageerror", e => { failed++; console.log("  ❌ 页面 JS 报错:", e.message); });
await page.goto(PAGE);
await page.waitForSelector("#nodes .node rect");

const panelOpen = () => page.$eval("#panel", el => el.classList.contains("open"));
const word2vec = page.locator("#nodes .node").first();

// 1) 真实点击节点 -> 面板打开，标题为完整论文名
await word2vec.click();
check("点击节点后面板打开", await panelOpen());
check("面板标题正确",
  (await page.textContent("#panelBody h2"))?.includes("Efficient Estimation of Word Representations"),
  "got: " + (await page.textContent("#panelBody h2")));
check("摘要/公式/贡献/前置要求齐全",
  (await page.textContent("#panelBody")).includes("Skip-gram: max Σ log p(w_c | w_t)"));

// 2) 点击空白画布 -> 面板关闭（先在页内找一个确认真空白的坐标）
const blank = await page.evaluate(() => {
  for (let x = 40; x < innerWidth - 420; x += 60)
    for (let y = 80; y < innerHeight - 60; y += 60) {
      const el = document.elementFromPoint(x, y);
      if (el && el.closest("#stage") && !el.closest(".node")) return { x, y };
    }
  return null;
});
check("找到空白测试点", !!blank);
await page.mouse.click(blank.x, blank.y);
check("点击空白后面板关闭", !(await panelOpen()));

// 3) 拖拽画布（起点在节点上）-> 视图平移且不误开面板
if (await panelOpen()) await page.click("#closeBtn");  // 确保初始状态干净
const before = await page.$eval("#viewport", el => el.getAttribute("transform"));
const box = await word2vec.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x + 120, box.y + 80, { steps: 5 });
await page.mouse.up();
const after = await page.$eval("#viewport", el => el.getAttribute("transform"));
check("拖拽后画布已平移", before !== after, `${before} -> ${after}`);
check("拖拽后没有误开面板", !(await panelOpen()));

// 4) 搜索 -> 命中高亮、其余变暗
await page.fill("#search", "lora");
await page.waitForTimeout(100);
const dimCount = await page.$$eval("#nodes .node.dim", n => n.length);
check("搜索 LoRA 后无关节点变暗", dimCount > 45, `dim=${dimCount}`);
await page.fill("#search", "");

// 5) 图例点击 -> 仅该分类高亮
await page.click("#legend .item >> nth=3");  // BERT系列
const bertHi = await page.$$eval("#nodes .node.hi", n => n.length);
check("图例过滤 BERT 系列", bertHi === 4, `hi=${bertHi}`);

// 6) 面板内跳转：打开 BERT -> 依赖论文里点 Transformer
await page.click("#legend .item");  // 取消过滤
await page.locator("#nodes .node", { hasText: "BERT" }).first().click();
check("打开 BERT 面板", (await page.textContent("#panelBody h2"))?.includes("BERT"));
await page.click("#panelBody .chip[data-id='transformer']");
check("面板内跳转到 Transformer",
  (await page.textContent("#panelBody h2"))?.includes("Attention Is All You Need"));

// 7) 左侧栏结构 + 右侧浮卡形态 + 选中态 + Esc 关闭
check("侧栏包含搜索框与图例",
  await page.locator("#sidebar #search").count() === 1 &&
  await page.locator("#sidebar #legend").count() === 1);
await page.locator("#nodes .node", { hasText: "Word2Vec" }).first().click();
check("详情浮卡打开", await panelOpen());
const pbox = await page.$eval("#panel", el => {
  const r = el.getBoundingClientRect();
  return { top: Math.round(r.top), right: Math.round(r.right), w: Math.round(r.width) };
});
check("浮卡贴右侧悬浮", pbox.top === 16 && pbox.right === 1584 && pbox.w === 360, JSON.stringify(pbox));
check("选中节点带 selected 标记", await page.locator("#nodes .node.selected").count() === 1);
await page.keyboard.press("Escape");
check("Esc 关闭浮卡", !(await panelOpen()));
check("关闭后无 selected 节点", await page.locator("#nodes .node.selected").count() === 0);

// 截图前重开一个抽屉（等过渡动画结束，避免拍到中间帧）
await page.locator("#nodes .node", { hasText: "Transformer" }).first().click();
await page.waitForTimeout(300);

await page.screenshot({ path: path.join(__dirname, "screenshot.png") });
await browser.close();

console.log(`\n结果: ${passed} 通过, ${failed} 失败`);
process.exit(failed ? 1 : 0);
