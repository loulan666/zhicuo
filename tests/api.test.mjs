import {test,after,before} from 'node:test';
import assert from 'node:assert/strict';
process.env.PORT='3181';
delete process.env.AI_API_KEY;
const {server}=await import('../server.mjs');
before(()=>new Promise(r=>server.listen(3181,'127.0.0.1',r)));
after(()=>new Promise(r=>server.close(r)));
const base='http://127.0.0.1:3181';
const post=(body,origin=base)=>fetch(base+'/api/hint',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:typeof body==='string'?body:JSON.stringify(body)});
test('serves app and restrictive CSP',async()=>{const r=await fetch(base);assert.equal(r.status,200);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.match(await r.text(),/知错/);});
test('rejects foreign origin',async()=>assert.equal((await post({},'https://evil.example')).status,403));
test('rejects malformed JSON and invalid fields',async()=>{assert.equal((await post('{')).status,400);assert.equal((await post({code:123})).status,400);});
test('bounds input size',async()=>assert.equal((await post('a'.repeat(21000))).status,413));
test('reports missing key without leaking credentials',async()=>{const r=await post({code:'function f(){}',task:'test',results:[],level:1});assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'AI_NOT_CONFIGURED'});});
test('blocks arbitrary file paths',async()=>assert.equal((await fetch(base+'/.env')).status,404));
test('provider success, timeout, quota, secret redaction and rate limit',async()=>{
 const original=globalThis.fetch; process.env.AI_API_KEY='test-secret-never-return';process.env.AI_MODEL='test-model';
 const payload={code:'function f(){}',task:'test',results:[],level:1};
 let mode='ok';
 globalThis.fetch=(url,options)=>{
  if(String(url).startsWith(base))return original(url,options);
  if(mode==='timeout')throw new DOMException('test-secret-never-return','TimeoutError');
  if(mode==='quota')return Promise.resolve(new Response('test-secret-never-return',{status:429}));
  return Promise.resolve(Response.json({choices:[{message:{content:'请检查边界值。'}}]}));
 };
 try{
  assert.equal((await post(payload)).status,200);
  mode='timeout';let r=await post(payload);assert.equal(r.status,504);assert.equal((await r.text()).includes('test-secret'),false);
  mode='quota';r=await post(payload);assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'PROVIDER_QUOTA'});
  mode='ok';for(let i=0;i<3;i++)await post(payload);
  assert.equal((await post(payload)).status,429);
 }finally{globalThis.fetch=original;delete process.env.AI_API_KEY;delete process.env.AI_MODEL;}
});
