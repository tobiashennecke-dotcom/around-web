export type PartnerPlanId = "essential" | "featured" | "signature" | "discover" | "explore" | "destination";
export type PartnerPlan = { id: PartnerPlanId; name: string; tagline: string; price: number; foundingPrice: number; features: readonly string[]; };
export const PARTNER_PLANS: readonly PartnerPlan[] = [
 {id:"essential",name:"ESSENTIAL",tagline:"A beautiful home for your place.",price:290,foundingPrice:190,features:["Eigene Place Page","Bis zu 8 Bilder","Einbindung in eine Destination","Zwei Aktualisierungen pro Jahr","Jährlicher Leistungsbericht"]},
 {id:"featured",name:"FEATURED",tagline:"More reasons to visit.",price:590,foundingPrice:390,features:["Alles aus Essential","Erweiterte Präsentation mit bis zu 15 Bildern","Bis zu 3 Packages","Definierte, gekennzeichnete Werbeplatzierung","Newsletter-Teaser nach vereinbarter Planung","Vierteljährlicher Bericht"]},
 {id:"signature",name:"SIGNATURE",tagline:"A story worth telling.",price:990,foundingPrice:690,features:["Alles aus Featured","Gekennzeichnete Partner Story","Ein Social-Media-Karussell","Zwei Newsletter-Platzierungen nach Planung","Bis zu 4 Package-Aktualisierungen","Individueller Jahresbericht"]}
] as const;
export const DESTINATION_PLANS: readonly PartnerPlan[] = [
 {id:"discover",name:"DISCOVER",tagline:"The essential destination.",price:990,foundingPrice:690,features:["Destination Page","3 Basis-Places","Eine saisonale Aktualisierung","Eine Newsletter-Platzierung"]},
 {id:"explore",name:"EXPLORE",tagline:"More than a round.",price:1990,foundingPrice:1390,features:["Destination Page","6 Basis-Places","Eine gekennzeichnete Partner Story","48-Hours-Guide","Zwei Newsletter-Platzierungen","Ein Social-Media-Post"]},
 {id:"destination",name:"DESTINATION PARTNER",tagline:"The full picture.",price:3490,foundingPrice:2490,features:["Destination Page","10 Basis-Places","Zwei gekennzeichnete Partner Stories","48-Hours-Guide","Vier Newsletter-Platzierungen","Zwei Social-Media-Posts"]}
] as const;
export const ALL_PARTNER_PLANS: readonly PartnerPlan[] = [...PARTNER_PLANS,...DESTINATION_PLANS];
export const PARTNER_ADDONS = [
 {id:"story",name:"Zusätzliche Partner Story",price:390},
 {id:"reel",name:"Reel aus angeliefertem Material",price:250},
 {id:"package",name:"Zusätzliches Saison-Package / 90 Tage",price:99}
] as const;
