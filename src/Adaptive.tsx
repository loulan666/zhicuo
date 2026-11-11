import React, { useEffect, useRef, useState } from "react";
import { starter, exercises } from "../public/exercises.js";
type Attempt = {
  id?: string;
  code?: string;
  exercise: string;
  language: string;
  time: number;
  passed: boolean;
  results: any[];
};
type Task = {
  id: string;
  title: string;
  description: string;
  purpose: string;
  language: string;
  time: number;
  diagnosis: {
    line: number;
    quote: string;
    observation: string;
    hypothesis: string;
    caseIndex: number;
  };
  baseline: Attempt;
  examples: { input: number[]; expected: number }[];
  testCount: number;
  validation: { checked: number; method: string; generationAttempts?: number };
  progress: any;
  reviews: any[];
};
const errors: Record<string, string> = {
  REPEATED_TASK: "新题与原题的计算要求相同，已拒绝发布。请重新生成。",
  SOURCE_CODE_REQUIRED:
    "请选择一条包含代码的失败提交。旧记录没有保存代码时，请先重新运行实验。",
  RUNTIME_NOT_READY: "请先启动 Docker 并检查语言镜像。",
  RUNNER_BUSY: "已有代码任务执行中，请稍后再试。",
  AI_NOT_CONFIGURED: "请先配置 DeepSeek。",
  PROVIDER_TIMEOUT: "模型或校验超时，请重试。",
  INVALID_DIAGNOSIS:
    "模型定位的行号或代码片段与原提交不符，已拒绝发布。请重试。",
  INVALID_GENERATION: "模型生成的题目格式或范围不符合约束，已拒绝发布。",
  REFERENCE_REJECTED: "参考实现未通过独立测试，新题未发布。可以重新生成。",
  PROVIDER_QUOTA: "模型服务限流或额度不足。",
  RATE_LIMIT: "调用频繁，请一分钟后重试。",
  PRACTICE_LIMIT: "已达到 50 道生成题的本地上限。",
};
export function Adaptive({
  language,
  attempts,
  tasks,
  onRefresh,
}: {
  language: string;
  attempts: Attempt[];
  tasks: Task[];
  onRefresh: () => Promise<void>;
}) {
  const failed = attempts
    .filter((a) => a.language === language && !a.passed && a.id && a.code)
    .slice()
    .reverse();
  const available = tasks
    .filter((t) => t.language === language)
    .slice()
    .reverse();
  const [source, setSource] = useState(failed[0]?.id || ""),
    [selected, setSelected] = useState(available[0]?.id || "");
  const [busy, setBusy] = useState(""),
    [message, setMessage] = useState(""),
    [code, setCode] = useState(""),
    [result, setResult] = useState<Attempt | null>(null);
  const abort = useRef<AbortController | null>(null),
    task = available.find((t) => t.id === selected);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    let draft = starter(language).replace("    # 返回严格正数的数量\n", "");
    try {
      draft = localStorage.getItem("adaptive-code:" + selected) || draft;
    } catch {}
    setCode(draft);
    setResult(null);
  }, [selected, language]);
  async function request(route: string, data: unknown, label: string) {
    setBusy(label);
    setMessage("");
    abort.current = new AbortController();
    try {
      const response = await fetch("/api/platform/" + route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: abort.current.signal,
      });
      const out = await response.json();
      if (!response.ok)
        throw Error(errors[out.error] || "请求未完成，请检查环境并重试。");
      await onRefresh();
      if (route === "generate-practice") setSelected(out.id);
      if (route === "run") setResult(out);
      setMessage(
        route === "generate-practice"
          ? "新题已通过参考实现校验，可以开始练习。"
          : route === "review-practice"
            ? "复测分析已保存。"
            : "测试记录已保存。",
      );
    } catch (e) {
      setMessage(
        (e as Error).name === "AbortError"
          ? "已取消等待。"
          : (e as Error).message,
      );
    } finally {
      setBusy("");
    }
  }
  const evidence = task?.baseline.results[task.diagnosis.caseIndex];
  return (
    <>
      <section className="panel learningbox">
        <div className="eyebrow">DIAGNOSE · GENERATE · VERIFY</div>
        <h2>从一次错误，生成下一道练习</h2>
        <p>
          选择真实失败记录，AI
          结合源码定位可能错因、设计条件变式并生成参考实现。系统独立计算答案，在
          Docker 内验证参考代码；校验通过才发布题目。
        </p>
        <label>
          诊断依据
          <select
            aria-label="失败提交"
            value={source}
            disabled={!!busy}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="">选择包含代码的失败提交</option>
            {failed.map((a) => (
              <option key={a.id} value={a.id}>
                {new Date(a.time).toLocaleString()} ·{" "}
                {exercises.find((e) => e.id === a.exercise)?.title || "AI 变式"}
              </option>
            ))}
          </select>
        </label>
        {!failed.length && (
          <p>
            还没有包含代码的失败记录。先到编程实验提交一次；旧版记录需要重新运行才能获取源码。
          </p>
        )}
        <button
          className="button primary"
          disabled={!!busy || !source}
          onClick={() =>
            request(
              "generate-practice",
              { language, id: source },
              "生成并验证中",
            )
          }
        >
          诊断并生成变式
        </button>
        <p className="subtle">
          会向 DeepSeek
          发送所选提交的代码和测试结果。生成范围为整数数组的条件筛选、计数、求和和最大值；校验可能需
          1–3 分钟，最多 4 分钟。
        </p>
        <p role="status">{busy ? busy + "…" : message}</p>
        {busy && busy !== "运行测试中" && (
          <button className="button" onClick={() => abort.current?.abort()}>
            取消
          </button>
        )}
      </section>
      {available.length > 0 && (
        <section className="panel learningbox spaced">
          <label>
            我的 AI 变式
            <select
              aria-label="我的 AI 变式"
              value={selected}
              disabled={!!busy}
              onChange={(e) => setSelected(e.target.value)}
            >
              {available.map((t) => (
                <option value={t.id} key={t.id}>
                  {new Date(t.time).toLocaleString()} · {t.title}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}
      {task && (
        <>
          <section className="panel learningbox spaced">
            <h2>源码诊断与证据</h2>
            <p>
              <strong>第 {task.diagnosis.line} 行：</strong>
              <code>{task.diagnosis.quote}</code>
            </p>
            <p>模型观察：{task.diagnosis.observation}</p>
            <p>可能原因（待验证）：{task.diagnosis.hypothesis}</p>
            {evidence && (
              <p>
                真实反例：输入 {JSON.stringify(evidence.input)}，预期{" "}
                {evidence.expected}，实际 {evidence.actual || "无输出"}。
              </p>
            )}
            <details>
              <summary>查看当时提交的源码</summary>
              <pre className="code-example">
                {task.baseline.code
                  ?.split("\n")
                  .map((line, i) => `${i + 1}  ${line}`)
                  .join("\n")}
              </pre>
            </details>
          </section>
          <section className="panel learningbox spaced">
            <h2>{task.title}</h2>
            <p>{task.description}</p>
            <p>AI 训练目标：{task.purpose}</p>
            <p>
              发布校验：{task.validation.checked} 个用例通过 ·{" "}
              {task.validation.method} · 模型生成{" "}
              {task.validation.generationAttempts || 1} 次
            </p>
            {task.examples.map((t, i) => (
              <p key={i}>
                示例 {i + 1}：{JSON.stringify(t.input)} → {t.expected}
              </p>
            ))}
            <p className="subtle">
              题目规则由结构化条件生成；有限用例通过不等于数学证明。请只写 solve
              函数，不添加主程序。
            </p>
            <textarea
              className="editor"
              aria-label="AI 变式代码"
              disabled={!!busy}
              maxLength={16000}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setResult(null);
                try {
                  localStorage.setItem(
                    "adaptive-code:" + selected,
                    e.target.value,
                  );
                } catch {}
              }}
            />
            <button
              className="button primary"
              disabled={!!busy}
              onClick={() =>
                request(
                  "run",
                  { language, exercise: task.id, code, hints: 0 },
                  "运行测试中",
                )
              }
            >
              提交变式测试
            </button>
            {result && (
              <div role="status">
                <h3>{result.passed ? "变式测试通过" : "尚未全部通过"}</h3>
                {result.results.map((r, i) => (
                  <p key={i}>
                    {r.pass ? "✓" : "×"} 输入 {JSON.stringify(r.input)} · 预期{" "}
                    {r.expected} · 实际 {r.actual || "无输出"} {r.error}
                  </p>
                ))}
              </div>
            )}
          </section>
          <section className="panel learningbox spaced">
            <h2>补弱效果追踪</h2>
            <p>
              当前状态：{task.progress.status} · 本题提交{" "}
              {task.progress.submissions} 次
            </p>
            {task.progress.first && (
              <p>
                本题首次：{task.progress.first.passedCases}/{task.testCount}{" "}
                用例通过；最近：{task.progress.latest.passedCases}/
                {task.testCount} 用例通过。
              </p>
            )}
            <p>
              {task.progress.sameTaskImproved
                ? "同一道变式已从未通过变为通过。"
                : task.progress.scope}
            </p>
            <button
              className="button"
              disabled={!!busy || !task.progress.latest}
              onClick={() =>
                request(
                  "review-practice",
                  { language, id: task.id },
                  "分析复测中",
                )
              }
            >
              AI 分析复测效果
            </button>
            {task.reviews
              .slice()
              .reverse()
              .map((r) => (
                <article className="record" key={r.id}>
                  <strong>
                    {new Date(r.time).toLocaleString()} · 针对当时提交的分析
                  </strong>
                  <p>观察：{r.observation}</p>
                  <p>解释与局限：{r.interpretation}</p>
                  <p>下一步：{r.nextStep}</p>
                  <p className="subtle">
                    报告对应提交：{r.attemptId}。新增提交后需重新分析。
                  </p>
                </article>
              ))}
          </section>
        </>
      )}
    </>
  );
}
