"use client";
import {useState} from "react";
import {Bar,BarChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import {useApp} from "@/lib/store";
import {Gran,addDays,inRange,series,sum,todayKey,weekStart} from "@/lib/dates";
import {Card,FilterBar,useRangeFilter} from "@/components/FilterBar";
export default function Dashboard(){
 const {scans,fmt}=useApp(),f=useRangeFilter(),[g,setG]=useState<Gran>("day"),t=todayKey();
 const tot=(from:string,to:string)=>fmt(sum(inRange(scans,{from,to})));
 const cur=inRange(scans,f.r),total=sum(cur);
 return <div className="space-y-4"><h2 className="text-xl font-semibold">Dashboard</h2>
  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
   <Card t="Today" v={tot(t,t)}/><Card t="Yesterday" v={tot(addDays(t,-1),addDays(t,-1))}/><Card t="This week" v={tot(weekStart(t),t)}/><Card t="This month" v={tot(t.slice(0,7)+"-01",t)}/><Card t="This year" v={tot(t.slice(0,4)+"-01-01",t)}/></div>
  <FilterBar f={f}/>
  <div className="grid grid-cols-3 gap-3"><Card t="Sales (selected range)" v={fmt(total)}/><Card t="Bills scanned" v={cur.length}/><Card t="Average bill" v={fmt(cur.length?total/cur.length:0)}/></div>
  <div className="rounded-lg border bg-white p-4"><div className="mb-3 flex gap-2">{(["day","week","month","year"] as Gran[]).map(x=><button key={x} onClick={()=>setG(x)} className={`rounded border px-3 py-1 text-sm ${g===x?"bg-indigo-600 text-white":""}`}>{{day:"Daily",week:"Weekly",month:"Monthly",year:"Yearly"}[x]}</button>)}</div>
   <div className="h-72"><ResponsiveContainer><BarChart data={series(scans,f.r,g)}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="k" fontSize={11}/><YAxis fontSize={11}/><Tooltip formatter={(v:number)=>fmt(v)}/><Bar dataKey="total" fill="#4f46e5"/></BarChart></ResponsiveContainer></div></div></div>}
