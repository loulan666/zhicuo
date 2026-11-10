import React,{useEffect,useRef,useState} from 'react';
type Report={id:string;language:string;time:number;query:string;text:string;trace:{name:string;label:string;items:number}[];sources:{documentId:string;title:string;index:number;text:string}[];durationMs:number};
function ReportText({text}:{text:string}){
 // Render a small text-only subset; never interpret model HTML or links.
 const inline=(line:string)=>line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part,i)=>part.startsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part.startsWith('`')?<code key={i}>{part.slice(1,-1)}</code>:part);
 return <div className="coach-answer">{text.split('\n').filter(line=>line.trim()).map((line,i)=>/^\*\*[^*]+\*\*[:：]?$/.test(line.trim())?<h3 key={i}>{line.replaceAll('**','')}</h3>:<p key={i}>{inline(line.replace(/^#{1,4}\s+/,''))}</p>)}</div>;
}
export function Coach({language,reports,onComplete}:{language:string;reports:Report[];onComplete:()=>Promise<void>}){
 const [query,setQuery]=useState('请根据我的测评和实际实验记录，找出最值得先补的知识点，并安排下一步练习。');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 async function generate(){
  setBusy(true);setError('');controller.current=new AbortController();
  try{
   const r=await fetch('/api/platform/coach',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.current.signal,body:JSON.stringify({language,query})});
   const data=await r.json();if(!r.ok)throw Error(({AI_NOT_CONFIGURED:'请先配置模型密钥。',RATE_LIMIT:'调用较频繁，请一分钟后再试。',PROVIDER_TIMEOUT:'诊断超时，请稍后重试。',PROVIDER_QUOTA:'模型服务限流或额度不足。'} as Record<string,string>)[data.error]||'诊断未完成，请稍后重试；已有学习记录不受影响。');
   await onComplete();
  }catch(e){setError((e as Error).name==='AbortError'?'已停止等待，本次未展示新报告。':(e as Error).message);}finally{setBusy(false);}
 }
 return <><section className="panel learningbox"><div className="eyebrow">EVIDENCE → TOOLS → GUIDANCE</div><h2>AI 诊断工作台</h2><p>教练通过只读工具查看当前语言的测评和实验记录、选择补练候选，并可检索你的课程资料。模型建议不会改变成绩。</p><label htmlFor="coach-question">这次想解决什么问题？</label><textarea id="coach-question" className="text-input" maxLength={1000} disabled={busy} value={query} onChange={e=>setQuery(e.target.value)}/><p className="subtle">开始诊断会将当前语言最近的学习记录和匹配资料片段发送给 DeepSeek。最多 4 轮模型请求，可能需要约一分钟。</p><div className="actionrow"><button className="button primary" disabled={busy||!query.trim()} onClick={generate}>{busy?'正在收集证据并生成建议…':'开始证据诊断'}</button>{busy&&<button className="button" onClick={()=>controller.current?.abort()}>取消诊断</button>}</div><p role="status">{error}</p>{busy&&<p role="status">模型可能调用：读取学习证据 → 获取补练候选 → 检索课程资料。完成后显示实际调用记录。</p>}</section>
 {reports.filter(r=>r.language===language).slice().reverse().map(r=><article className="panel learningbox spaced" key={r.id}><h2>诊断报告 · {new Date(r.time).toLocaleString()}</h2><p>{r.query}</p><div className="coach-trace">{r.trace.map((t,i)=><div className="record" key={i}><strong>{i+1}. {t.label}</strong><p>实际调用 {t.name} · 返回 {t.items} 项证据</p></div>)}</div><ReportText text={r.text}/><p className="subtle">模型建议，需由实验验证 · 用时 {(r.durationMs/1000).toFixed(1)} 秒</p>{r.sources.map(s=><details key={s.documentId+':'+s.index}><summary>{s.title} · 段 {s.index+1}</summary><p>{s.text}</p></details>)}{!r.sources.length&&<p>本次没有检索到引用资料；请结合实际代码核对建议。</p>}</article>)}</>;
}
