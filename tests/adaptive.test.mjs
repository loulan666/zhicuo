import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sameSpecification,
  oracle,
  validateProposal,
  validationCases,
  generatePractice,
  practiceView,
  progressEvidence,
  reviewProgress,
} from "../lib/adaptive.mjs";
const source = {
  id: "source",
  time: 1,
  language: "python",
  exercise: "positive",
  code: "def solve(a):\n    return sum(n >= 0 for n in a)",
  passed: false,
  results: [{ input: [0], expected: 0, actual: "1", pass: false }],
};
const proposal = {
  diagnosis: {
    line: 2,
    quote: "n >= 0",
    caseIndex: 0,
    observation: "零被计入",
    hypothesis: "可能混淆边界",
  },
  spec: { aggregate: "count", predicate: "gt", threshold: 2 },
  purpose: "区分严格边界",
  reference: "def solve(a):\n    return sum(n > 2 for n in a)",
  inputs: [
    [2, 3],
    [-1, 4, 5],
  ],
};
const fetcher = async () => ({
  ok: true,
  json: async () => ({
    choices: [{ message: { content: JSON.stringify(proposal) } }],
  }),
});
test("independent oracle handles empty, negative odd and filtered max", () => {
  assert.equal(
    oracle({ aggregate: "max", predicate: "all", threshold: 0 }, [-5, -3]),
    -3,
  );
  assert.equal(
    oracle({ aggregate: "max", predicate: "gt", threshold: 0 }, [-5, -3]),
    0,
  );
  assert.equal(
    oracle(
      { aggregate: "sum", predicate: "odd", threshold: 0 },
      [-3, -2, 0, 5],
    ),
    2,
  );
  assert.equal(
    oracle({ aggregate: "count", predicate: "gte", threshold: 0 }, [0, -1, 1]),
    2,
  );
  assert.equal(
    oracle({ aggregate: "sum", predicate: "all", threshold: 0 }, []),
    0,
  );
});
test("proposal rejects invented source locations, failed-case claims and unsafe spec", () => {
  assert.throws(
    () =>
      validateProposal(
        {
          ...proposal,
          diagnosis: { ...proposal.diagnosis, quote: "imaginary" },
        },
        source,
      ),
    /INVALID_DIAGNOSIS/,
  );
  assert.throws(
    () =>
      validateProposal(
        { ...proposal, diagnosis: { ...proposal.diagnosis, line: 5 } },
        source,
      ),
    /INVALID_DIAGNOSIS/,
  );
  assert.throws(
    () =>
      validateProposal(
        { ...proposal, spec: { ...proposal.spec, predicate: "exec" } },
        source,
      ),
    /INVALID_GENERATION/,
  );
  assert.throws(
    () => validateProposal({ ...proposal, inputs: [[1e9], [2]] }, source),
    /INVALID_GENERATION/,
  );
  assert.throws(
    () => validateProposal(proposal, { ...source, results: [{ pass: true }] }),
    /INVALID_DIAGNOSIS/,
  );
});
test("wrong reference is rejected; accepted task has server-computed expected values", async () => {
  await assert.rejects(
    generatePractice(source, {
      fetcher,
      executor: async () => ({ code: 0, reason: "", stdout: "999" }),
    }),
    /REFERENCE_REJECTED/,
  );
  let index = 0;
  const tests = validationCases(proposal);
  const task = await generatePractice(source, {
    fetcher,
    executor: async () => ({
      code: 0,
      reason: "",
      stdout: String(tests[index++].expected),
    }),
  });
  assert.equal(task.validation.checked, tests.length);
  assert.ok(tests.some((t) => t.input.length === 0));
  const view = practiceView(task);
  assert.equal(view.reference, undefined);
  assert.equal(view.tests, undefined);
  assert.equal(view.baseline.code, source.code);
  const failed = {
    id: "a",
    language: "python",
    exercise: task.id,
    time: task.time + 1,
    passed: false,
    results: [{ pass: false }],
  };
  const passed = {
    ...failed,
    id: "b",
    time: task.time + 2,
    passed: true,
    results: [{ pass: true }],
  };
  assert.equal(progressEvidence(task, [failed, passed]).sameTaskImproved, true);
  assert.equal(
    progressEvidence(task, [failed, passed, { ...failed, time: task.time + 3 }])
      .sameTaskImproved,
    false,
  );
  assert.equal(
    progressEvidence(task, [{ ...passed, language: "java" }]).latest,
    null,
  );
  await assert.rejects(reviewProgress(task, []), /NO_PRACTICE_ATTEMPT/);
});
test("cancellation prevents validation execution", async () => {
  const controller = new AbortController();
  controller.abort();
  let executions = 0;
  await assert.rejects(
    generatePractice(source, {
      signal: controller.signal,
      fetcher,
      executor: async () => {
        executions++;
      },
    }),
  );
  assert.equal(executions, 0);
});

test("variant must change semantics, not an unused threshold", async () => {
  assert.equal(
    sameSpecification(
      { aggregate: "count", predicate: "even", threshold: 0 },
      { aggregate: "count", predicate: "even", threshold: 3 },
    ),
    true,
  );
  const repeated = {
    ...proposal,
    spec: { aggregate: "count", predicate: "gt", threshold: 0 },
  };
  await assert.rejects(
    generatePractice(source, {
      fetcher: async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(repeated) } }],
        }),
      }),
    }),
    /REPEATED_TASK/,
  );
});

test("review binds to latest attempt and rejects contradicted improvement flags", async () => {
  const task = {
    id: "task",
    language: "python",
    time: 2,
    baseline: source,
    tests: [{ input: [], expected: 0 }],
    description: "test",
    diagnosis: proposal.diagnosis,
  };
  const runs = [
    {
      id: "first",
      exercise: "task",
      language: "python",
      time: 3,
      passed: false,
      code: "old",
      results: [{ pass: false }],
    },
    {
      id: "latest",
      exercise: "task",
      language: "python",
      time: 4,
      passed: true,
      code: "new",
      results: [{ pass: true }],
    },
  ];
  const provider = (improved) => async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              improved,
              interpretation: "条件已修改，仍需更多样本",
              nextStep: "测试其他边界",
            }),
          },
        },
      ],
    }),
  });
  await assert.rejects(
    reviewProgress(task, runs, { fetcher: provider(false) }),
    /INVALID_GENERATION/,
  );
  const result = await reviewProgress(task, runs, { fetcher: provider(true) });
  assert.equal(result.attemptId, "latest");
  assert.ok(result.observation.includes("共提交 2 次"));
  assert.equal(result.evidence.sameTaskImproved, true);
});

test("schema repair is bounded to one extra model call before execution", async () => {
  let calls = 0,
    index = 0;
  const cases = validationCases(proposal);
  const provider = async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify(
              ++calls === 1
                ? {
                    diagnosis: proposal.diagnosis,
                    spec: {
                      ...proposal.spec,
                      purpose: proposal.purpose,
                      reference: proposal.reference,
                      inputs: proposal.inputs,
                    },
                  }
                : proposal,
            ),
          },
        },
      ],
    }),
  });
  const task = await generatePractice(source, {
    fetcher: provider,
    executor: async () => ({
      code: 0,
      reason: "",
      stdout: String(cases[index++].expected),
    }),
  });
  assert.equal(calls, 2);
  assert.equal(task.validation.generationAttempts, 2);
  assert.equal(index, cases.length);
});
