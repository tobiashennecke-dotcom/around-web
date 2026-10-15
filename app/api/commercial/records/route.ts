import { NextResponse } from "next/server";
import { ALL_PARTNER_PLANS, PARTNER_ADDONS } from "@/lib/partner-os/catalog";
import { getCommercialAccess,getCommercialAdminClient } from "@/lib/partner-os/commercial-access";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0"};
const fail=(status:number,error:string)=>NextResponse.json({error},{status,headers});
const uuid=(v:unknown):v is string=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const str=(v:unknown,max:number,min=1):v is string=>typeof v==="string"&&v.trim().length>=min&&v.trim().length<=max;
const date=(v:unknown):v is string=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+"T12:00:00"))&&new Date(v+"T12:00:00").toISOString().slice(0,10)===v;
const types=["hotel","golf_club","destination","restaurant","experience","other"];
const kinds=["launch","package","campaign"];
const statuses=["requested","confirmed","active","completed","cancelled"];
type Body=Record<string,unknown>;
async function context(){const access=await getCommercialAccess();const db=getCommercialAdminClient();return access&&db?{access,db}:null;}
export async function GET(request:Request){
 const ctx=await context();if(!ctx)return fail(403,"forbidden_or_not_configured");
 const url=new URL(request.url),resource=url.searchParams.get("resource");
 if(resource==="partners"){
  const {data,error}=await ctx.db.from("commercial_partners").select("id,display_name,partner_type,website,country,internal_status,source_inquiry_id,created_at").order("created_at",{ascending:false}).limit(100);
  return error?fail(503,"data_unavailable"):NextResponse.json({records:data??[]},{headers});
 }
 if(resource==="campaigns"){
  const {data,error}=await ctx.db.from("commercial_campaigns").select("id,partner_id,offer_id,kind,title,starts_on,ends_on,status,approved_by,approved_at,created_at,commercial_partners(display_name)").order("starts_on",{ascending:true}).limit(300);
  return error?fail(503,"data_unavailable"):NextResponse.json({records:data??[]},{headers});
 }
 const partnerId=url.searchParams.get("partner_id");if(!uuid(partnerId))return fail(400,"invalid_partner_id");
 const table=resource==="contacts"?"commercial_contacts":resource==="offers"?"commercial_offers":resource==="activities"?"commercial_activities":null;
 if(!table)return fail(400,"invalid_resource");
 const {data,error}=await ctx.db.from(table).select("*").eq("partner_id",partnerId).order("created_at",{ascending:false}).limit(100);
 return error?fail(503,"data_unavailable"):NextResponse.json({records:data??[]},{headers});
}
export async function POST(request:Request){
 const ctx=await context();if(!ctx)return fail(403,"forbidden_or_not_configured");
 if(Number(request.headers.get("content-length")||0)>16000)return fail(413,"payload_too_large");
 let raw:unknown;try{raw=await request.json();}catch{return fail(400,"invalid_json");}
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return fail(400,"invalid_body");
 const b=raw as Body;let table="";let row:Body={};let auditType="";
 if(b.resource==="partners"){
  if(!str(b.display_name,160,2)||!types.includes(String(b.partner_type))||b.website!=null&&!str(b.website,300)||b.country!=null&&!str(b.country,120)||b.source_inquiry_id!=null&&!uuid(b.source_inquiry_id))return fail(400,"invalid_fields");
  table="commercial_partners";auditType="partner";row={display_name:b.display_name.trim(),partner_type:b.partner_type,website:b.website||null,country:b.country||null,source_inquiry_id:b.source_inquiry_id||null};
 }else if(b.resource==="contacts"){
  if(!uuid(b.partner_id)||!str(b.full_name,120,2)||!str(b.email,200,5)||!/^\S+@\S+\.\S+$/.test(b.email)||b.role!=null&&!str(b.role,120)||typeof b.is_primary!=="boolean")return fail(400,"invalid_fields");
  table="commercial_contacts";auditType="contact";row={partner_id:b.partner_id,full_name:b.full_name.trim(),email:b.email.trim(),role:b.role||null,is_primary:b.is_primary};
 }else if(b.resource==="activities"){
  if(!uuid(b.partner_id)||!["note","call","email","meeting","task","follow_up"].includes(String(b.activity_type))||!str(b.summary,4000)||b.due_at!=null&&(typeof b.due_at!=="string"||Number.isNaN(Date.parse(b.due_at))))return fail(400,"invalid_fields");
  table="commercial_activities";auditType="activity";row={partner_id:b.partner_id,activity_type:b.activity_type,summary:b.summary.trim(),due_at:b.due_at||null,actor_user_id:ctx.access.userId};
 }else if(b.resource==="campaigns"){
  if(!uuid(b.partner_id)||!kinds.includes(String(b.kind))||!str(b.title,160,2)||!date(b.starts_on)||!date(b.ends_on)||b.ends_on<b.starts_on||b.offer_id!=null&&!uuid(b.offer_id))return fail(400,"invalid_fields");
  table="commercial_campaigns";auditType="campaign";row={partner_id:b.partner_id,kind:b.kind,title:b.title.trim(),starts_on:b.starts_on,ends_on:b.ends_on,offer_id:b.offer_id||null,status:"requested"};
 }else if(b.resource==="offers"){
  if(!uuid(b.partner_id)||!str(b.offer_number,80,2)||!Number.isSafeInteger(b.version)||Number(b.version)<1||!Number.isSafeInteger(b.net_amount_cents)||Number(b.net_amount_cents)<0||!Array.isArray(b.line_items)||!b.catalog_snapshot||typeof b.catalog_snapshot!=="object"||Array.isArray(b.catalog_snapshot)||b.terms_version!=null&&!str(b.terms_version,120)||b.valid_until!=null&&!date(b.valid_until))return fail(400,"invalid_fields");
  const snap=b.catalog_snapshot as Record<string,unknown>;
  if(snap.source==="around_catalog"){
   const plan=ALL_PARTNER_PLANS.find(p=>p.id===snap.plan_id);
   const ids=snap.addon_ids;
   if(!plan||typeof snap.founding!=="boolean"||!Array.isArray(ids)||ids.some(id=>typeof id!=="string"||!PARTNER_ADDONS.some(a=>a.id===id))||new Set(ids).size!==ids.length)return fail(400,"invalid_catalog_selection");
   const base=snap.founding?plan.foundingPrice:plan.price;
   const total=base+PARTNER_ADDONS.filter(a=>ids.includes(a.id)).reduce((sum,a)=>sum+a.price,0);
   if(b.net_amount_cents!==total*100)return fail(409,"catalog_price_mismatch");
   b.line_items=[{id:plan.id,name:plan.name,amount_cents:base*100},...PARTNER_ADDONS.filter(a=>ids.includes(a.id)).map(a=>({id:a.id,name:a.name,amount_cents:a.price*100}))];
   b.catalog_snapshot={source:"around_catalog",plan_id:plan.id,plan_name:plan.name,founding:snap.founding,addon_ids:ids,catalog_amount_cents:total*100};
  }
  table="commercial_offers";auditType="offer";row={partner_id:b.partner_id,offer_number:b.offer_number.trim(),version:b.version,state:"draft",net_amount_cents:b.net_amount_cents,line_items:b.line_items,catalog_snapshot:b.catalog_snapshot,terms_version:b.terms_version||null,valid_until:b.valid_until||null};
 }else return fail(400,"invalid_resource");
 const {data,error}=await ctx.db.from(table).insert(row).select("*").single();
 if(error)return fail(409,"save_failed");
 const {error:auditError}=await ctx.db.from("commercial_audit_events").insert({entity_type:auditType,entity_id:data.id,action:"created",actor_user_id:ctx.access.userId,after_data:data});
 if(auditError)return fail(503,"audit_failed_record_created");
 return NextResponse.json({record:data},{status:201,headers});
}
export async function PATCH(request:Request){
 const ctx=await context();if(!ctx)return fail(403,"forbidden_or_not_configured");
 if(Number(request.headers.get("content-length")||0)>2048)return fail(413,"payload_too_large");
 let raw:unknown;try{raw=await request.json();}catch{return fail(400,"invalid_json");}
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return fail(400,"invalid_body");
 const b=raw as Body;if(!uuid(b.id))return fail(400,"invalid_id");
 if(b.resource==="campaigns"){
  if(!statuses.includes(String(b.status))||b.status==="requested")return fail(400,"invalid_status");
  const {data:before,error:readError}=await ctx.db.from("commercial_campaigns").select("*").eq("id",b.id).maybeSingle();
  if(readError||!before)return fail(404,"not_found");
  if(before.status==="completed"||before.status==="cancelled")return fail(409,"terminal_status");
  if(before.status==="requested"&&!["confirmed","cancelled"].includes(String(b.status)))return fail(409,"confirm_first");
  if(before.status==="confirmed"&&!["active","cancelled"].includes(String(b.status)))return fail(409,"invalid_transition");
  if(before.status==="active"&&!["completed","cancelled"].includes(String(b.status)))return fail(409,"invalid_transition");
  const approval=before.approved_by?{}:{approved_by:ctx.access.userId,approved_at:new Date().toISOString()};
  const {data,error}=await ctx.db.from("commercial_campaigns").update({...approval,status:b.status,updated_at:new Date().toISOString()}).eq("id",b.id).eq("status",before.status).select("*").maybeSingle();
  if(error||!data)return fail(409,"update_conflict");
  const {error:auditError}=await ctx.db.from("commercial_audit_events").insert({entity_type:"campaign",entity_id:data.id,action:"status_"+b.status,actor_user_id:ctx.access.userId,before_data:before,after_data:data});
  if(auditError)return fail(503,"audit_failed_status_changed");
  return NextResponse.json({record:data},{headers});
 }
 if(b.resource==="activities"){
  const {data:before}=await ctx.db.from("commercial_activities").select("*").eq("id",b.id).maybeSingle();
  if(!before)return fail(404,"not_found");
  if(before.completed_at)return fail(409,"already_completed");
  const {data,error}=await ctx.db.from("commercial_activities").update({completed_at:new Date().toISOString()}).eq("id",b.id).is("completed_at",null).select("*").maybeSingle();
  if(error||!data)return fail(409,"update_conflict");
  const {error:auditError}=await ctx.db.from("commercial_audit_events").insert({entity_type:"activity",entity_id:data.id,action:"completed",actor_user_id:ctx.access.userId,before_data:before,after_data:data});
  if(auditError)return fail(503,"audit_failed_status_changed");
  return NextResponse.json({record:data},{headers});
 }
 return fail(400,"invalid_resource");
}
