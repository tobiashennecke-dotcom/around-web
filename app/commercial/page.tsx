import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CommercialDesk from "./desk";
export const metadata:Metadata={title:"Commercial Desk — AROUND LAB",robots:{index:false,follow:false}};
export default function CommercialPage(){
 // Demo-only. Never serve this unprotected sample dashboard on the production deployment.
 if(process.env.VERCEL_ENV!=="preview" && process.env.COMMERCIAL_DESK_DEMO!=="true") notFound();
 return <CommercialDesk/>;
}
