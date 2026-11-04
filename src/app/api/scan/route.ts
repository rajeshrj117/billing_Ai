export const runtime = "nodejs";
const PROMPT = `You are an expert at reading handwritten shop bill notes and receipts, including messy handwritten digits. Inspect every supplied image carefully. Return ONLY a valid JSON object with this exact shape: {"amounts":[{"value":200,"confidence":0.98,"crossed":false}]}.
Rules:
- Extract each individual line-item monetary amount in reading order, top to bottom, left to right.
- Do not include serial numbers, dates, check marks, page numbers, or a written subtotal/grand total that summarizes the line items.
- Mark crossed=true for amounts visibly struck through, scribbled out, or cancelled. Still include them in the response.
- Never guess confidently. If a digit is unclear, provide your best reading with confidence below 0.65.
- Values must be numeric, without currency symbols or thousands separators.
- Ignore handwritten arithmetic totals that repeat the sum of line items.
- Do not add amounts that are not visible.`;
export async function POST(req:Request){
 try{
  const {images}=await req.json();
  if(!Array.isArray(images)||!images.length)return Response.json({error:"Upload or capture at least one bill image."},{status:400});
  const key=process.env.GROQ_API_KEY;
  if(!key)return Response.json({error:"Groq API key is missing. Add GROQ_API_KEY to .env.local and restart the server."},{status:500});
  const content:any[]=[{type:"text",text:PROMPT},...images.slice(0,5).map((url:string)=>({type:"image_url",image_url:{url}}))];
  const response=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model: "qwen/qwen3.8-27b",temperature:0,max_completion_tokens:2048,response_format:{type:"json_object"},messages:[{role:"user",content}]})});
  const raw=await response.json();
  if(!response.ok)return Response.json({error:raw?.error?.message||"Groq could not process this image."},{status:502});
  const text=raw?.choices?.[0]?.message?.content;if(!text)throw new Error("Empty AI response");
  const parsed=JSON.parse(text);
  const amounts=(Array.isArray(parsed.amounts)?parsed.amounts:[]).filter((a:any)=>Number.isFinite(Number(a.value))&&Number(a.value)>0).map((a:any)=>({value:Number(a.value),confidence:Math.max(0,Math.min(1,Number(a.confidence??0.5))),crossed:Boolean(a.crossed)}));
  return Response.json({amounts});
 }catch(e:any){return Response.json({error:e?.message||"Unable to read bill."},{status:500})}
}
