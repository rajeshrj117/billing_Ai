export type Gran="day"|"week"|"month"|"year";
export type R={from:string;to:string};
export const keyOf=(ms:number)=>new Date(ms).toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"});
export const todayKey=()=>keyOf(Date.now());
export const addDays=(k:string,n:number)=>{const d=new Date(k+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
export const weekStart=(k:string)=>addDays(k,-((new Date(k+"T00:00:00Z").getUTCDay()+6)%7));
export const bucket=(k:string,g:Gran)=>g==="day"?k:g==="week"?weekStart(k):g==="month"?k.slice(0,7):k.slice(0,4);
export function range(p:string,c?:R):R{const t=todayKey(),m=t.slice(0,7);
 switch(p){case"today":return{from:t,to:t};
 case"yesterday":{const y=addDays(t,-1);return{from:y,to:y}}
 case"7d":return{from:addDays(t,-6),to:t};case"30d":return{from:addDays(t,-29),to:t};
 case"month":return{from:m+"-01",to:t};
 case"lastmonth":{const e=addDays(m+"-01",-1);return{from:e.slice(0,7)+"-01",to:e}}
 case"year":return{from:t.slice(0,4)+"-01-01",to:t};
 default:return c||{from:t,to:t}}}
type S={dateKey:string;total:number};
export const inRange=<T extends {dateKey:string}>(a:T[],r:R)=>a.filter(s=>s.dateKey>=r.from&&s.dateKey<=r.to);
export const sum=(a:{total:number}[])=>a.reduce((s,x)=>s+x.total,0);
export function series(scans:S[],r:R,g:Gran){const m=new Map<string,{k:string;total:number;count:number}>();
 if(g==="day")for(let k=r.from,i=0;k<=r.to&&i<800;k=addDays(k,1),i++)m.set(k,{k,total:0,count:0});
 for(const s of inRange(scans,r)){const k=bucket(s.dateKey,g),e=m.get(k)||{k,total:0,count:0};e.total+=s.total;e.count++;m.set(k,e)}
 return[...m.values()].sort((a,b)=>a.k<b.k?-1:1)}
