export type CampaignEvent={id:string;partner:string;title:string;kind:"launch"|"package"|"campaign";start:string;end:string;status:"requested"|"confirmed"|"active"|"completed";};
export const DEMO_EVENTS:CampaignEvent[]=[
{id:"sample-launch",partner:"Alpine Hideaway",title:"Partner Launch",kind:"launch",start:"2026-11-01",end:"2026-11-01",status:"requested"},
{id:"sample-package",partner:"Coastal Golf Club",title:"Autumn Golf Escape",kind:"package",start:"2026-11-08",end:"2026-12-15",status:"confirmed"},
{id:"sample-campaign",partner:"Mountain Region",title:"Winter Campaign",kind:"campaign",start:"2026-11-21",end:"2027-01-10",status:"confirmed"}
];
export const DEMO_SCHEDULE_KEY="around-partner-os-demo-schedule-v1";
export function readDemoEvents():CampaignEvent[]{
 try{const raw=window.localStorage.getItem(DEMO_SCHEDULE_KEY);if(!raw)return DEMO_EVENTS;const parsed:unknown=JSON.parse(raw);if(!Array.isArray(parsed))return DEMO_EVENTS;return parsed.filter((v):v is CampaignEvent=>Boolean(v&&typeof v==="object"&&typeof v.id==="string"&&typeof v.start==="string"&&typeof v.end==="string"&&typeof v.partner==="string"&&typeof v.title==="string"&&["requested","confirmed","active","completed"].includes(v.status)))}catch{return DEMO_EVENTS}
}
export function writeDemoEvents(events:CampaignEvent[]){window.localStorage.setItem(DEMO_SCHEDULE_KEY,JSON.stringify(events));window.dispatchEvent(new Event("around-demo-schedule-change"));}
export function formatDemoDate(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;return new Date(value+"T12:00:00").toLocaleDateString("de-DE",{day:"2-digit",month:"short",year:"numeric"});}
