"use client";
import {useState} from "react";
import {range,todayKey} from "@/lib/dates";
const P=[["today","Today"],["yesterday","Yesterday"],["7d","Last 7 days"],["30d","Last 30 days"],["month","This month"],["lastmonth","Last month"],["year","This year"],["custom","Custom"]];
export function useRangeFilter(){const [p,setP]=useState("30d"),[c,setC]=useState({from:todayKey(),to:todayKey()});return{p,setP,c,setC,r:range(p,c)}}
export function FilterBar({f}:{f:ReturnType<typeof useRangeFilter>}){
 return <div className="mb-4 flex flex-wrap items-center gap-2">
  {P.map(([k,l])=><button key={k} onClick={()=>f.setP(k)} className={`rounded border px-3 py-1 text-sm ${f.p===k?"bg-indigo-600 text-white":"bg-white"}`}>{l}</button>)}
  {f.p==="custom"&&<><input type="date" value={f.c.from} onChange={e=>f.setC({...f.c,from:e.target.value})} className="rounded border px-2 py-1 text-sm"/><span>→</span><input type="date" value={f.c.to} onChange={e=>f.setC({...f.c,to:e.target.value})} className="rounded border px-2 py-1 text-sm"/></>}
 </div>}
export const Card=({t,v}:{t:string;v:string|number})=><div className="rounded-lg border bg-white p-4"><p className="text-xs text-gray-500">{t}</p><p className="mt-1 text-xl font-semibold">{v}</p></div>;
