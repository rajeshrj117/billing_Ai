"use client";
import {Amt,sumAmts,useApp} from "@/lib/store";
export function AmountEditor({amounts,onChange}:{amounts:Amt[];onChange:(a:Amt[])=>void}){
 const {fmt}=useApp(),set=(i:number,p:Partial<Amt>)=>onChange(amounts.map((a,j)=>j===i?{...a,...p}:a));
 return <div className="space-y-2">
  {amounts.map((a,i)=><div key={i} className="flex flex-wrap items-center gap-2">
   <input type="number" value={a.value} onChange={e=>set(i,{value:+e.target.value,confidence:1})} className={`w-32 rounded border px-2 py-1 ${a.crossed?"line-through opacity-50":""}`}/>
   {a.confidence<0.7&&!a.crossed&&<span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Unsure {Math.round(a.confidence*100)}%</span>}
   <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!a.crossed} onChange={e=>set(i,{crossed:e.target.checked})}/>Crossed out</label>
   <button onClick={()=>onChange(amounts.filter((_,j)=>j!==i))} className="text-xs text-red-600">Delete</button>
  </div>)}
  <button onClick={()=>onChange([...amounts,{value:0,confidence:1}])} className="text-sm text-indigo-600">+ Add amount</button>
  <p className="pt-2 text-lg font-semibold">Total: {fmt(sumAmts(amounts))}</p></div>}
