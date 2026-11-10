import {test} from 'node:test';
import assert from 'node:assert/strict';
import {coachTool,runCoach} from '../lib/coach.mjs';
const state={assessments:[],attempts:[{language:'java',exercise:'positive',passed:true,results:[]}],documents:[]};
test('coach tool boundary rejects unknown tools and isolates language',()=>{
 assert.throws(()=>coachTool('exec',{command:'anything'},{state,language:'python'}));
 assert.throws(()=>coachTool('read_evidence',{language:'java'},{state,language:'python'}));
 assert.equal(coachTool('read_evidence',{}, {state,language:'python'}).attempts.length,0);
 assert.throws(()=>coachTool('search_materials',{query:'x'.repeat(201)}, {state,language:'python'}));
});
test('coach gathers real evidence before final answer and records calls',async()=>{
 let calls=0;
 const fetcher=async(url,options)=>{
  const body=JSON.parse(options.body);calls++;
  if(calls<=2){const name=body.tool_choice.function.name;return {ok:true,json:async()=>({choices:[{message:{role:'assistant',tool_calls:[{id:String(calls),type:'function',function:{name,arguments:'{}'}}]}}]})};}
  assert.ok(body.messages.some(m=>m.role==='tool'));
  return {ok:true,json:async()=>({choices:[{message:{content:'证据不足，请先完成基础测评。'}}]})};
 };
 const result=await runCoach({state,language:'python',query:'下一步',fetcher});
 assert.deepEqual(result.trace.map(t=>t.name),['read_evidence','get_practice_plan']);
 assert.equal(result.text,'证据不足，请先完成基础测评。');
 assert.equal(calls,3);
});
test('coach rejects provider errors and premature ungrounded answers',async()=>{
 await assert.rejects(runCoach({state,language:'python',query:'x',fetcher:async()=>({ok:false,status:429})}),/PROVIDER_QUOTA/);
 await assert.rejects(runCoach({state,language:'python',query:'x',fetcher:async()=>({ok:true,json:async()=>({choices:[{message:{content:'编造诊断'}}]})})}),/PROVIDER_RESPONSE/);
});
