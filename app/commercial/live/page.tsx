import type { Metadata } from "next";
import { getCommercialAccess } from "@/lib/partner-os/commercial-access";
import { redirect } from "next/navigation";
import LiveDesk from "./live-desk";
export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"Commercial Desk / Private — AROUND",robots:{index:false,follow:false}};
export default async function LiveCommercialPage(){
  const access=await getCommercialAccess();
  if(!access) redirect("/account");
  return <LiveDesk/>;
}
