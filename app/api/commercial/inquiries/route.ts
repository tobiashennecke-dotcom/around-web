import { NextResponse } from "next/server";
import { getCommercialAccess, getCommercialAdminClient } from "@/lib/partner-os/commercial-access";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0" };
const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: privateHeaders });
const allowed = ["new","qualified","contacted","proposal","won","lost"] as const;

export async function GET() {
  if (!await getCommercialAccess()) return fail(403,"forbidden");
  const db = getCommercialAdminClient();
  if (!db) return fail(503,"not_configured");
  const { data, error } = await db.from("partner_inquiries")
    .select("id,created_at,organization_name,contact_name,email,website,message,plan_id,founding_requested,addon_ids,quoted_total_eur,status,source")
    .order("created_at",{ascending:false}).limit(100);
  if (error) return fail(503,"data_unavailable");
  return NextResponse.json({ inquiries:data ?? [] },{headers:privateHeaders});
}

export async function PATCH(request: Request) {
  if (!await getCommercialAccess()) return fail(403,"forbidden");
  const db = getCommercialAdminClient();
  if (!db) return fail(503,"not_configured");
  if (Number(request.headers.get("content-length")||0)>1024) return fail(413,"payload_too_large");
  let body:unknown;
  try { body=await request.json(); } catch { return fail(400,"invalid_json"); }
  if (!body || typeof body!=="object" || Array.isArray(body)) return fail(400,"invalid_body");
  const {id,status}=body as Record<string,unknown>;
  if (typeof id!=="string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
    typeof status!=="string" || !allowed.some(s=>s===status)) return fail(400,"invalid_fields");
  const {data,error}=await db.from("partner_inquiries").update({status}).eq("id",id)
    .select("id,status").maybeSingle();
  if (error) return fail(503,"update_failed");
  if (!data) return fail(404,"not_found");
  return NextResponse.json({inquiry:data},{headers:privateHeaders});
}
