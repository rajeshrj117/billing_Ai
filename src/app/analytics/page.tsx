"use client";
import {Area,AreaChart,Bar,BarChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import {useApp} from "@/lib/store";
import {addDays,inRange,series,sum} from "@/lib/dates";
import {Card,FilterBar,useRangeFilter} from "@/components/FilterBar";
const Box=({t,children}:{t:string;children:React.ReactElement})=><div className="rounded-lg border bg-white p-4"><p className="mb-2 text-sm font-medium">{t}</p><div className="h-60"><ResponsiveContainer>{children}</ResponsiveContainer></div></div>;
export default function Analytics(){
 const {scans,fmt}=useApp(),f=useRangeFilter(),{r}=f,days=series(scans,r,"day"),sold=days.filter(d=>d.count),total=sum(inRange(scans,r));
 const hi=sold.reduce((a,b)=>b.total>(a?.total??-1)?b:a,null as any),lo=sold.reduce((a,b)=>b.total<(a?.total??Infinity)?b:a,null as any);
 const n=days.length,prev=sum(inRange(scans,{from:addDays(r.from,-n),to:addDays(r.from,-1)})),growth=prev?((total-prev)/prev)*100:null;
 const all={from:"2000-01-01",to:"2999-12-31"},ax=<><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="k" fontSize={11}/><YAxis fontSize={11}/><Tooltip formatter={(v:number)=>fmt(v)}/></>;
 return <div className="space-y-4"><h2 className="text-xl font-semibold">Sales Analytics</h2><FilterBar f={f}/>
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
   <Card t="Highest sales day" v={hi?`${hi.k}: ${fmt(hi.total)}`:"—"}/><Card t="Lowest sales day" v={lo?`${lo.k}: ${fmt(lo.total)}`:"—"}/>
   <Card t="Average daily sales" v={fmt(n?total/n:0)}/><Card t="Growth vs previous period" v={growth==null?"—":growth.toFixed(1)+"%"}/></div>
  <div className="grid gap-4 md:grid-cols-2">
   <Box t="Daily sales trend"><AreaChart data={days}>{ax}<Area dataKey="total" stroke="#4f46e5" fill="#c7d2fe"/></AreaChart></Box>
   <Box t="Scans per day"><BarChart data={days}>{ax}<Bar dataKey="count" fill="#059669"/></BarChart></Box>
   <Box t="Monthly sales trend"><BarChart data={series(scans,all,"month")}>{ax}<Bar dataKey="total" fill="#4f46e5"/></BarChart></Box>
   <Box t="Yearly comparison"><BarChart data={series(scans,all,"year")}>{ax}<Bar dataKey="total" fill="#d97706"/></BarChart></Box></div>
  <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-sm"><thead className="bg-gray-100 text-left"><tr><th className="p-2">Date</th><th>Scans</th><th>Sales</th></tr></thead>
   <tbody>{[...days].reverse().map(d=><tr key={d.k} className="border-t"><td className="p-2">{d.k}</td><td>{d.count}</td><td>{fmt(d.total)}</td></tr>)}</tbody></table></div></div>}
