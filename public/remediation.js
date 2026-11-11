import {exercises} from './exercises.js';
export function diagnose(attempt){
 if(!attempt)return [];
 const failed=attempt.results.filter(r=>!r.pass);
 return failed.map(r=>({
  kind:r.error==='TIMEOUT'?'执行超时':r.error==='OUTPUT_LIMIT'?'输出过量':r.error?'编译或运行错误':r.input.length===0?'空输入处理':r.input.every(n=>n<0)?'全负数处理':r.input.includes(0)?'零值边界':'计算结果不符',
  evidence:`输入 ${JSON.stringify(r.input)}，预期 ${r.expected}，实际 ${r.actual||'无输出'}`,
  advice:r.error?'先阅读运行错误；超时检查循环是否结束，输出过量检查循环内打印。':r.input.length===0?'检查空集合时的初值与返回值。':r.input.every(n=>n<0)?'检查负数是否正确参与计算；最大值任务尤其要检查是否误用 0 作为初值。':r.input.includes(0)?'逐项检查比较符号及零是否应被计入。':'手动列出每轮变量值，核对遍历范围、更新和返回值。'
 }));
}
export function learningPlan(language,assessments,attempts){
 const latest=assessments.filter(a=>a.language===language).at(-1);
 const history=attempts.filter(a=>a.language===language);
 return exercises.filter(e=>!e.retestOf).map(task=>{
  const runs=history.filter(a=>a.exercise===task.id);
  const last=runs.at(-1);
  const failures=runs.filter(a=>!a.passed);
  const lastFailure=failures.at(-1);
  const repaired=last?.passed;
  const variant=exercises.find(e=>e.retestOf===task.id);
  // A verification must follow the latest successful base submission and be unassisted.
  const verification=variant&&repaired?history.filter(a=>a.exercise===variant.id&&a.time>last.time).at(-1):null;
  const verified=!!verification?.passed&&!verification.hints;
  const weak=!!latest&&task.dimensions.some(d=>Number.isFinite(latest.scores[d])&&latest.scores[d]<67);
  return {id:task.id,title:task.title,dimensions:task.dimensions,variant:variant?.id,
   status:verified?'复测通过':repaired?'待独立复测':last?'待修正':weak?'建议补练':'待实践',
   priority:last&&!last.passed?0:weak&&!verified?1:repaired&&!verified?2:verified?4:3,
   diagnosis:diagnose(last&&!last.passed?last:lastFailure),
   failures:failures.length,verified,verification,
   next:repaired&&variant?variant.id:task.id};
 }).sort((a,b)=>a.priority-b.priority);
}
