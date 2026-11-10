import {test} from 'node:test';
import assert from 'node:assert/strict';
import {learningPlan,diagnose} from '../public/remediation.js';
const run=(exercise,time,passed,hints=0,language='python')=>({exercise,time,passed,hints,language,results:[]});
const item=runs=>learningPlan('python',[],runs).find(p=>p.id==='positive');
test('verification requires a later unassisted pass and stays language specific',()=>{
 assert.equal(item([run('positive-retest',1,true)]).verified,false);
 assert.equal(item([run('positive',1,true),run('positive-retest',2,true,1)]).verified,false);
 assert.equal(item([run('positive',1,true),run('positive-retest',2,true,0,'java')]).verified,false);
 assert.equal(item([run('positive',1,true),run('positive-retest',2,true)]).verified,true);
 assert.equal(item([run('positive',1,true),run('positive-retest',2,true),run('positive',3,false)]).verified,false);
 assert.equal(item([run('positive',1,true),run('positive-retest',2,true),run('positive-retest',3,false)]).verified,false);
});
test('unknown evidence remains untested and failure has priority',()=>{
 assert.equal(item([]).status,'待实践');
 const plan=learningPlan('python',[],[run('sum',1,false)]);
 assert.equal(plan[0].id,'sum');
});
test('diagnostics distinguish execution errors from value boundaries',()=>{
 const result=error=>({results:[{input:[],actual:'',expected:0,pass:false,error}]});
 assert.equal(diagnose(result('TIMEOUT'))[0].kind,'执行超时');
 assert.equal(diagnose(result(''))[0].kind,'空输入处理');
});
