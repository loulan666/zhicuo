import { chromium } from "playwright";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
const dir = await mkdtemp(join(tmpdir(), "zhicuo-adaptive-"));
process.env.DATA_DIR = dir;
process.env.PORT = "3186";
const { server } = await import("../server.mjs");
await new Promise((r) => server.listen(3186, "127.0.0.1", r));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3186/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "编程实验", exact: true })
    .click();
  const wrong = "def solve(numbers):\n    return sum(n >= 0 for n in numbers)";
  await page.getByRole("textbox", { name: "实验代码" }).fill(wrong);
  await page.getByRole("button", { name: "运行全部测试" }).click();
  await page
    .getByRole("button", { name: "AI 定位错因并生成练习 →" })
    .waitFor({ timeout: 90000 });
  await page.getByRole("button", { name: "AI 定位错因并生成练习 →" }).click();
  await page
    .getByRole("button", { name: "诊断并生成变式", exact: true })
    .click();
  console.log(
    "Real failure submitted; generating and validating with DeepSeek + Docker.",
  );
  const finished = await Promise.race([
    page
      .getByRole("heading", { name: "源码诊断与证据", exact: true })
      .waitFor({ timeout: 250000 })
      .then(() => true),
    page
      .getByText(/已拒绝发布|新题未发布|请求未完成|模型或校验超时/)
      .waitFor({ timeout: 250000 })
      .then(() => false),
  ]);
  assert.equal(
    finished,
    true,
    "Model generation rejected; inspect application status.",
  );
  const getState = async () =>
    await (await fetch("http://127.0.0.1:3186/api/platform/state")).json();
  let state = await getState();
  const task = state.generatedExercises[0];
  assert.equal(task.baseline.code, wrong);
  assert.ok(task.validation.checked >= 4);
  assert.equal(task.reference, undefined);
  assert.equal(task.tests, undefined);
  console.log(
    `Generated ${task.spec.aggregate}/${task.spec.predicate}/${task.spec.threshold}; ${task.validation.checked} independent validation cases passed.`,
  );
  await page
    .getByRole("textbox", { name: "AI 变式代码" })
    .fill("def solve(numbers):\n    return 123456");
  await page.getByRole("button", { name: "提交变式测试", exact: true }).click();
  await page
    .getByRole("heading", { name: "尚未全部通过", exact: true })
    .waitFor({ timeout: 180000 });
  const t = task.spec.threshold,
    predicate = {
      gt: `n > ${t}`,
      gte: `n >= ${t}`,
      lt: `n < ${t}`,
      lte: `n <= ${t}`,
      eq: `n == ${t}`,
      even: "n % 2 == 0",
      odd: "n % 2 != 0",
      all: "True",
    }[task.spec.predicate];
  const aggregate = {
    count: "len(values)",
    sum: "sum(values)",
    max: "max(values) if values else 0",
  }[task.spec.aggregate];
  const correct = `def solve(numbers):\n    values = [n for n in numbers if ${predicate}]\n    return ${aggregate}`;
  await page.getByRole("textbox", { name: "AI 变式代码" }).fill(correct);
  await page.getByRole("button", { name: "提交变式测试", exact: true }).click();
  await page
    .getByRole("heading", { name: "变式测试通过", exact: true })
    .waitFor({ timeout: 180000 });
  await page
    .getByText("同一道变式已从未通过变为通过。", { exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "AI 分析复测效果", exact: true })
    .click();
  await page
    .getByText("复测分析已保存。", { exact: true })
    .waitFor({ timeout: 75000 });
  state = await getState();
  assert.equal(state.generatedExercises[0].progress.sameTaskImproved, true);
  assert.equal(state.generatedExercises[0].reviews.length, 1);
  assert.equal(
    state.generatedExercises[0].reviews[0].attemptId,
    state.attempts.at(-1).id,
  );
  await mkdir("work/screenshots", { recursive: true });
  await page.screenshot({
    path: "work/screenshots/adaptive.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "work/screenshots/adaptive-mobile.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Code evidence, generated task, wrong/correct submissions, AI review, persistence and responsive UI passed.",
  );
} finally {
  if (browser) await browser.close();
  await new Promise((r) => server.close(r));
  await rm(dir, { recursive: true, force: true });
}
