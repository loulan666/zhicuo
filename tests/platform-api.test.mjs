import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const dir=await mkdtemp(join(tmpdir(),'zhicuo-api-'));
process.env.DATA_DIR=dir;process.env.PORT='3182';delete process.env.AI_API_KEY;
const {server}=await import('../server.mjs');
const base='http://127.0.0.1:3182';
before(()=>new Promise(r=>server.listen(3182,'127.0.0.1',r)));
after(async()=>{await new Promise(r=>server.close(r));await rm(dir,{recursive:true});});
const post=(route,data,origin=base)=>fetch(base+'/api/platform/'+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
test('platform refuses foreign mutation and validates assessment',async()=>{assert.equal((await post('assessment',{},'https://foreign.example')).status,403);assert.equal((await post('assessment',{language:'python',answers:[1]})).status,400);});
test('assessment persists evidence and server calculates score',async()=>{const r=await post('assessment',{language:'python',answers:[1,0,0,1,1,1],correct:0});assert.equal(r.status,200);assert.equal((await r.json()).correct,6);const state=await(await fetch(base+'/api/platform/state')).json();assert.equal(state.assessments.length,1);});
test('text upload, retrieval, export and delete complete roundtrip',async()=>{let r=await post('upload',{title:'课程笔记',language:'python',text:'Python 循环通过 range 产生整数序列。range(3) 产生0、1、2。'});assert.equal(r.status,200);const id=(await r.json()).id;r=await post('search',{language:'python',query:'循环 range'});const result=await r.json();assert.equal(result.sources[0].documentId,id);const data=await(await fetch(base+'/api/platform/export')).json();assert.equal(data.documents.length,1);assert.equal((await post('delete-document',{id})).status,200);});
test('tutor does not fake replies without a key',async()=>{const r=await post('tutor',{language:'python',query:'循环是什么'});assert.equal(r.status,503);assert.equal((await r.json()).error,'AI_NOT_CONFIGURED');});

test('v2 grading ignores client scores and validates version and length',async()=>{const {languages}=await import('../public/curriculum.js');const {assessmentQuestions}=await import('../public/assessment.js');const answers=assessmentQuestions(languages[0]).map(q=>q.answer);const response=await post('assessment',{language:'python',version:'foundation-v2',answers,correct:0,scores:[0]});assert.equal(response.status,200);const r=await response.json();assert.equal(r.correct,18);assert.equal(r.total,18);assert.equal(r.counts[0].total,3);assert.equal((await post('assessment',{language:'python',version:'foundation-v3',answers})).status,400);assert.equal((await post('assessment',{language:'python',version:'foundation-v2',answers:answers.slice(0,6)})).status,400);});

test('adaptive endpoints require owned source evidence and a configured model',async()=>{
 assert.equal((await post('generate-practice',{language:'python',id:'missing'})).status,400);
 const {createStore}=await import('../lib/store.mjs');await createStore(dir).update(s=>s.attempts.push({id:'source-test',language:'python',exercise:'positive',time:Date.now(),code:'def solve(a): return 0',passed:false,results:[{input:[1],expected:1,actual:'0',pass:false}]}));
 assert.equal((await post('generate-practice',{language:'java',id:'source-test'})).status,400);
 const r=await post('generate-practice',{language:'python',id:'source-test'});assert.equal(r.status,503);assert.equal((await r.json()).error,'AI_NOT_CONFIGURED');
 assert.equal((await post('review-practice',{language:'python',id:'missing'})).status,400);
});
