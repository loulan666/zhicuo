import assert from "node:assert/strict";
import { execute } from "../lib/sandbox.mjs";
import { wrap } from "../public/exercises.js";
import { generatePractice } from "../lib/adaptive.mjs";
const incorrect = {
  python: "def solve(a):\n    return sum(n >= 0 for n in a)",
  javascript: "function solve(a){return a.filter(n=>n>=0).length;}",
  typescript:
    "function solve(a:number[]):number{return a.filter(n=>n>=0).length;}",
  java: "static int solve(int[] a){int n=0;for(int x:a)if(x>=0)n++;return n;}",
  c: "int solve(int a[], int length){int n=0;for(int i=0;i<length;i++)if(a[i]>=0)n++;return n;}",
  cpp: "int solve(const std::vector<int>& a){int n=0;for(int x:a)if(x>=0)n++;return n;}",
  go: "func solve(a []int) int { n:=0; for _,x:=range a {if x>=0 {n++}}; return n }",
};
const selected = process.argv.slice(2).length
  ? process.argv.slice(2)
  : Object.keys(incorrect);
let failures = 0;
for (const language of selected) {
  try {
    assert.ok(incorrect[language], "Unknown language");
    const code = incorrect[language],
      input = [-1, 0, 2],
      result = await execute(language, wrap(language, code, input));
    assert.equal(result.code, 0, JSON.stringify(result));
    assert.equal(result.stdout.trim(), "2");
    const source = {
      id: "verification-" + language,
      language,
      code,
      exercise: "positive",
      description: "返回严格大于零的整数数量，空输入返回0。",
      time: Date.now(),
      passed: false,
      hints: 0,
      results: [
        {
          input,
          expected: 1,
          actual: result.stdout.trim(),
          pass: false,
          error: "",
        },
      ],
    };
    let diagnosis;
    const fetcher = async (...args) => {
      const response = await fetch(...args);
      try {
        const content = (await response.clone().json()).choices[0].message
          .content;
        if (process.env.ADAPTIVE_DEBUG === "1")
          console.log("Model proposal: " + content);
        diagnosis = JSON.parse(content).diagnosis;
      } catch {}
      return response;
    };
    let task;
    try {
      task = await generatePractice(source, {
        signal: AbortSignal.timeout(240000),
        fetcher,
      });
    } catch (e) {
      if (e.message === "INVALID_DIAGNOSIS")
        console.error(
          language + ": rejected diagnosis " + JSON.stringify(diagnosis),
        );
      throw e;
    }
    console.log(
      `${language}: real failure → ${JSON.stringify(task.spec)} → ${task.validation.checked} reference execution cases passed`,
    );
  } catch (e) {
    failures++;
    console.error(`${language}: failed (${e.message})`);
  }
}
if (failures) process.exitCode = 1;
