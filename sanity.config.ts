"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { schemaTypes } from "./sanity/schemaTypes";
import { ReitWinklSeedTool } from "./sanity/tools/ReitWinklSeedTool";
import { BayernSeedTool } from "./sanity/tools/BayernSeedTool";
import { PlayV2SeedTool } from "./sanity/tools/PlayV2SeedTool";
import { StayV2SeedTool } from "./sanity/tools/StayV2SeedTool";
import { ExperienceV2SeedTool } from "./sanity/tools/ExperienceV2SeedTool";
import { EditorialPilotSeedTool } from "./sanity/tools/EditorialPilotSeedTool";

export default defineConfig({
  name: "around",
  title: "AROUND Editorial",
  basePath: "/studio",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "replace-me",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  plugins: [
    structureTool(),
    presentationTool({
      previewUrl: {
        origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        previewMode: {
          enable: "/api/draft-mode/enable"
        }
      }
    })
  ],
  tools: [
    { name: "bayern-seed", title: "Bayern Seed", component: BayernSeedTool },
    { name: "reit-winkl-seed", title: "Reit im Winkl Seed 02", component: ReitWinklSeedTool },
    { name: "play-v2-seed", title: "PLAY V2 Seed", component: PlayV2SeedTool },
    { name: "stay-v2-seed", title: "STAY V2 Seed", component: StayV2SeedTool },
    { name: "experience-v2-seed", title: "EXPERIENCE V2 Seed", component: ExperienceV2SeedTool },
    { name: "editorial-pilot-pack-seed", title: "Editorial Pilot Pack v0.1", component: EditorialPilotSeedTool }
  ],
  schema: { types: schemaTypes }
});
