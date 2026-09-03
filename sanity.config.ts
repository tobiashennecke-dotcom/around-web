"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { schemaTypes } from "./sanity/schemaTypes";
import { BayernSeedTool } from "./sanity/tools/BayernSeedTool";

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
  tools: [{ name: "bayern-seed", title: "Bayern Seed", component: BayernSeedTool }],
  schema: { types: schemaTypes }
});
