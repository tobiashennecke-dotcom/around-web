import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ALL_PARTNER_PLANS, PARTNER_ADDONS } from "@/lib/partner-os/catalog";

export const runtime = "nodejs";
const bad = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const secret=process.env.SUPABASE_SECRET_KEY;
 const turnstileSecret=process.env.TURNSTILE_SECRET_KEY;
 if (!url || !secret || !turnstileSecret) return bad("not_configured",503);
 if (Number(request.headers.get("content-length")||0)>12000) return bad("payload_too_large",413);
 let raw: unknown;
 try { raw=await request.json(); } catch { return bad("invalid_json",400); }
 if (!raw || typeof raw!=="object" || Array.isArray(raw)) return bad("invalid_body",400);
 const data=raw as Record<string,unknown>;
 const str=(key:string,max:number)=>typeof data[key]==="string" && (data[key] as string).trim().length<=max?(data[key] as string).trim():null;
 const company=str("company",160), person=str("person",120), email=str("email",200), website=str("website",300), notes=str("notes",2000);
 const token=str("turnstileToken",2048);
 const plan=ALL_PARTNER_PLANS.find(p=>p.id===data.plan);
 const addons=Array.isArray(data.extras) && data.extras.length<=PARTNER_ADDONS.length && data.extras.every(id=>typeof id==="string" && PARTNER_ADDONS.some(a=>a.id===id)) ? [...new Set(data.extras as string[])]:null;
 if (!company || company.length<2 || !person || person.length<2 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || website===null || notes===null || !token || !plan || !addons || typeof data.founding!=="boolean" || data.honeypot) return bad("invalid_fields",400);
 if (website && !/^https?:\/\//i.test(website)) return bad("invalid_website",400);
 try {
  const verification=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
   method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},
   body:new URLSearchParams({secret:turnstileSecret,response:token})
  });
  const checked=await verification.json() as {success?:boolean;hostname?:string};
  const allowedHost=process.env.PARTNER_ALLOWED_HOSTNAME;
  if (!verification.ok || !checked.success || (allowedHost && checked.hostname!==allowedHost)) return bad("verification_failed",403);
 } catch { return bad("verification_unavailable",503); }
 const total=(data.founding?plan.foundingPrice:plan.price)+PARTNER_ADDONS.filter(a=>addons.includes(a.id)).reduce((sum,a)=>sum+a.price,0);
 const supabase=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error}=await supabase.from("partner_inquiries").insert({
  organization_name:company,contact_name:person,email,website:website||null,message:notes||null,
  plan_id:plan.id,founding_requested:data.founding,addon_ids:addons,quoted_total_eur:total
 });
 if(error) return bad("save_failed",503);
 return NextResponse.json({ok:true},{status:201});
}
