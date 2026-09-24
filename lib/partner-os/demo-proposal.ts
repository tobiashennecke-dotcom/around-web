import { ALL_PARTNER_PLANS, PARTNER_ADDONS, type PartnerPlanId } from "@/lib/partner-os/catalog";
export type DemoProposal={partner:string;plan:PartnerPlanId;founding:boolean;extras:string[]};
export const DEMO_PROPOSAL:DemoProposal={partner:"Alpine Hideaway",plan:"featured",founding:true,extras:[]};
export function proposalFromParams(params:URLSearchParams):DemoProposal {
 const id=params.get("plan");
 const partner=(params.get("partner")||DEMO_PROPOSAL.partner).slice(0,160);
 const extras=(params.get("extras")||"").split(",").filter(x=>PARTNER_ADDONS.some(a=>a.id===x));
 return {partner,plan:ALL_PARTNER_PLANS.some(p=>p.id===id)?id as PartnerPlanId:DEMO_PROPOSAL.plan,founding:params.get("founding")!=="0",extras:[...new Set(extras)]};
}
export function proposalUrl(proposal:DemoProposal,path="/partner-portal/demo"){
 const params=new URLSearchParams({partner:proposal.partner,plan:proposal.plan,founding:proposal.founding?"1":"0",extras:proposal.extras.join(",")});
 return `${path}?${params.toString()}`;
}
export function proposalTotals(proposal:DemoProposal){
 const plan=ALL_PARTNER_PLANS.find(p=>p.id===proposal.plan)!;
 const addons=PARTNER_ADDONS.filter(a=>proposal.extras.includes(a.id));
 const net=(proposal.founding?plan.foundingPrice:plan.price)+addons.reduce((n,a)=>n+a.price,0);
 return {plan,addons,net,tax:Math.round(net*19)/100,gross:Math.round(net*119)/100};
}
