import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

// Exercise the HTTP runner and persistence without changing the learner's data.
const dir=await mkdtemp(join(tmpdir(),'zhicuo-submissions-'));
process.env.DATA_DIR=dir;
process.env.PORT='3183';
const {server}=await import('../server.mjs');
const base='http://127.0.0.1:3183';
try {
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(3183,'127.0.0.1',resolve);});
 const cases=[
  ['python','def solve(numbers):\n    return sum(n > 0 for n in numbers)',true],
  ['go','func solve(a []int) int { n:=0; for _,x:=range a {if x>0 {n++}}; return n }',true],
  ['python','def solve(numbers):\n    return 0',false],
  ['python','def solve(:',false]
 ];
 for(const [language,code,expected] of cases){
  const response=await fetch(base+'/api/platform/run',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({language,exercise:'positive',code})});
  assert.equal(response.status,200);
  const record=await response.json();
  assert.equal(record.passed,expected,JSON.stringify(record));
  if(expected)assert.equal(record.results.length,4);
  console.log(`${language}: ${expected?'correct solution passes':'incorrect solution rejected'}`);
 }
 const state=await(await fetch(base+'/api/platform/state')).json();
 assert.equal(state.attempts.length,cases.length);
 assert.equal(state.attempts.filter(a=>a.passed).length,2);
 console.log('HTTP submissions and saved evidence passed.');
} finally {
 if(server.listening)await new Promise(resolve=>server.close(resolve));
 await rm(dir,{recursive:true,force:true});
}
