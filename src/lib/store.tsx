 "use client";
import {createContext,useContext,useEffect,useState,ReactNode} from "react";
export type Amt={value:number;confidence:number;crossed?:boolean};
export type Scan={id:string;imageUrls:string[];amounts:Amt[];total:number;createdAt:number;dateKey:string};
export type Settings={businessName:string;currency:string};
type Ctx={scans:Scan[];setScans:(v:Scan[]|((p:Scan[])=>Scan[]))=>void;settings:Settings;setSettings:(v:Settings)=>void;fmt:(n:number)=>string};
const C=createContext<Ctx>(null as any); export const useApp=()=>useContext(C);
export const sumAmts=(a:Amt[])=>a.filter(x=>!x.crossed).reduce((s,x)=>s+(+x.value||0),0);
export function Provider({children}:{children:ReactNode}){
 const [scans,setScans]=useState<Scan[]>([]),[settings,setSettings]=useState<Settings>({businessName:"ScanBill",currency:"INR"}),[ready,setReady]=useState(false);
 useEffect(()=>{try{const s=localStorage.getItem("scanbill-scans");if(s)setScans(JSON.parse(s));const p=localStorage.getItem("scanbill-settings");if(p)setSettings({...{businessName:"ScanBill",currency:"INR"},...JSON.parse(p)});}catch{}setReady(true)},[]);
 useEffect(()=>{if(ready)localStorage.setItem("scanbill-scans",JSON.stringify(scans))},[scans,ready]);
 useEffect(()=>{if(ready)localStorage.setItem("scanbill-settings",JSON.stringify(settings))},[settings,ready]);
 const fmt=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:settings.currency,maximumFractionDigits:2}).format(n||0);
 return <C.Provider value={{scans,setScans,settings,setSettings,fmt}}>{children}</C.Provider>
}