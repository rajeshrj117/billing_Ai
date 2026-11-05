"use client";
import { useEffect, useRef, useState } from "react";
import {Amt,sumAmts,useApp} from "@/lib/store";
export function AmountEditor({amounts,onChange}:{amounts:Amt[];onChange:(a:Amt[])=>void}){
 const {fmt}=useApp();
 const inputs = useRef<Array<HTMLInputElement | null>>([]);
 const [focusIndex, setFocusIndex] = useState<number | null>(null);
 const set=(i:number,p:Partial<Amt>)=>onChange(amounts.map((a,j)=>j===i?{...a,...p}:a));
 useEffect(() => {
  if (focusIndex === null) return;
  inputs.current[focusIndex]?.focus();
  setFocusIndex(null);
 }, [amounts.length, focusIndex]);
 return <div className="space-y-2">
  {amounts.map((a,i)=><div key={i} className="flex flex-wrap items-center gap-2">
   <input ref={el => { inputs.current[i] = el; }} type="number" inputMode="decimal" step="any" value={a.value === 0 ? "" : String(a.value)} placeholder="Enter amount" onChange={e=>set(i,{value:e.target.value === "" ? 0 : Number(e.target.value),confidence:1})} className={`w-32 rounded border px-2 py-1 ${a.crossed?"line-through opacity-50":""}`}/>
   {a.confidence<0.7&&!a.crossed&&<span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Unsure {Math.round(a.confidence*100)}%</span>}
   <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!a.crossed} onChange={e=>set(i,{crossed:e.target.checked})}/>Crossed out</label>
   <button onClick={()=>{ onChange(amounts.filter((_,j)=>j!==i)); inputs.current.splice(i,1); }} className="text-xs text-red-600">Delete</button>
  </div>)}
  <button onClick={()=>{ const nextIndex=amounts.length; onChange([...amounts,{value:0,confidence:1}]); setFocusIndex(nextIndex); }} className="text-sm text-indigo-600">+ Add amount</button>
  <p className="pt-2 text-lg font-semibold">Total: {fmt(sumAmts(amounts))}</p></div>}
