import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {lessons} from '../public/data.js';
const source=readFileSync(new URL('../public/runner.js',import.meta.url),'utf8');
function run(code,t){let result;const ctx=vm.createContext({structuredClone,postMessage:r=>result=r});vm.runInContext(source,ctx);ctx.onmessage({data:{code,fn:t.fn,tests:t.tests}});return result;}
test('initial exercise exposes zero boundary errors',()=>{const t=lessons[0],r=run(t.starter,t);assert.equal(r.results.filter(x=>x.pass).length,2);});
test('correct implementations pass all course cases',()=>{
 const answers=['function countPositive(a){return a.filter(n=>n>0).length}', 'function countEven(a){return a.filter(n=>n%2===0).length}', 'function sumArray(a){return a.reduce((a,b)=>a+b,0)}', 'function findMax(a){return a.length?Math.max(...a):null}'];
 lessons.forEach((t,i)=>assert.ok(run(answers[i],t).results.every(r=>r.pass)));
});
test('syntax errors and exceptions are shown as failures',()=>{assert.ok(run('function {',lessons[0]).error);assert.ok(run('function countPositive(){throw Error("failure")}',lessons[0]).results.every(r=>!r.pass));});
