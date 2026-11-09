import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {lessons} from '../public/data.js';
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8').replace("import {lessons} from './data.js';",'');
function setup(){
 const elements=new Map();let stored;const workers=[];
 const context=vm.createContext({lessons,console,setTimeout,clearTimeout,confirm:()=>true,localStorage:{getItem:()=>stored,setItem:(k,v)=>stored=v},document:{querySelector:s=>{if(!elements.has(s))elements.set(s,{value:'',innerHTML:'',addEventListener(){},remove(){}});return elements.get(s);},querySelectorAll:()=>[]},fetch:()=>new Promise(()=>{}),Worker:class{constructor(){workers.push(this);}terminate(){}postMessage(){} }});
 vm.runInContext(source,context);
 return {context,workers,read:()=>JSON.parse(stored),exec:code=>vm.runInContext(code,context)};
}
test('hint attribution survives editing and revisiting a task',()=>{
 const a=setup();a.exec("results=[{pass:false,label:'边界'}];getHint(2);select('sum');select('count');");
 assert.equal(a.exec('level'),2);assert.equal(a.read().hintsByTask.count,2);
 a.exec("document.querySelector('#code').oninput({target:{value:'function countPositive(){return 0}'}})");assert.equal(a.exec('level'),2);
});
test('stale worker completion cannot clear new task busy state',()=>{
 const a=setup();a.exec("run();select('sum');run();");
 a.workers[0].onmessage({data:{results:[{pass:true}]}});assert.equal(a.exec('busy'),true);
 a.workers[1].onmessage({data:{error:'语法错误'}});assert.equal(a.exec('busy'),false);
 assert.equal(a.read().records[0].id,'sum');assert.equal(a.read().records[0].error,'语法错误');
});
