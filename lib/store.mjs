import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
export function createStore(dir){
 let queue=Promise.resolve();
 const file=join(dir,'learning.json');
 const empty=()=>({version:1,attempts:[],assessments:[],documents:[]});
 async function read(){try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return empty();throw e;}}
 function update(fn){const next=queue.then(async()=>{await mkdir(dir,{recursive:true});const data=await read();const result=await fn(data);await writeFile(file+'.tmp',JSON.stringify(data,null,2));await rename(file+'.tmp',file);return result;});queue=next.catch(()=>{});return next;}
 return {read,update};
}
