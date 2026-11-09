// Local learning only. A Worker isolates UI execution, not a hostile-code security boundary.
globalThis.fetch=undefined;globalThis.XMLHttpRequest=undefined;globalThis.WebSocket=undefined;globalThis.importScripts=undefined;
onmessage=({data})=>{
 try {
  const fn=new Function('"use strict";\n'+data.code+'\nreturn '+data.fn+';')();
  if(typeof fn!=='function') throw new Error('未找到指定函数');
  const results=data.tests.map(t=>{try{const actual=fn(...structuredClone(t.input));const encoded=JSON.stringify(actual);return {label:t.label,input:t.input,expected:t.expected,actual:encoded===undefined?'undefined':encoded.slice(0,300),pass:encoded===JSON.stringify(t.expected)};}catch(e){return {label:t.label,input:t.input,expected:t.expected,actual:String(e.message).slice(0,200),pass:false};}});
  postMessage({results});
 }catch(e){postMessage({error:String(e.message).slice(0,300)});}
};
