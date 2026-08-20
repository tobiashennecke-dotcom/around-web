import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const required = [
  "package.json",
  "app/page.tsx",
  "app/discover/page.tsx",
  "app/search/page.tsx",
  "app/saved/page.tsx",
  "app/destinations/[slug]/page.tsx",
  "app/places/[slug]/page.tsx",
  "app/stories/[slug]/page.tsx",
  "app/collections/[slug]/page.tsx",
  "app/account/page.tsx",
  "app/studio/[[...tool]]/page.tsx",
  "app/api/draft-mode/enable/route.ts",
  "app/api/draft-mode/disable/route.ts",
  "app/auth/callback/route.ts",
  "lib/supabase/client.ts",
  "lib/supabase/server.ts",
  "lib/supabase/proxy.ts",
  "lib/supabase/saves.ts",
  "lib/sanity/client.ts",
  "lib/sanity/queries.ts",
  "supabase/schema.sql",
  "sanity.config.ts",
  "proxy.ts"
];

const missing = required.filter(file => !fs.existsSync(path.join(root,file)));
const pkg = JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
const sql = fs.readFileSync(path.join(root,"supabase/schema.sql"),"utf8");
const css = fs.readFileSync(path.join(root,"app/globals.css"),"utf8");

const tables = [...sql.matchAll(/create table if not exists public\.([a-z_]+)/g)].map(m=>m[1]);
const policies = [...sql.matchAll(/create policy "([^"]+)"/g)].map(m=>m[1]);
const tokens = [
  "--around-ink","--around-warm","--around-lime","--around-blue","--around-pink"
].filter(t=>css.includes(t));

const report = {
  status: missing.length ? "FAIL" : "PASS",
  requiredFiles: required.length,
  missing,
  dependencies: Object.keys(pkg.dependencies || {}).length,
  supabaseTables: tables,
  rlsPolicies: policies.length,
  coreColorTokens: tokens.length
};

console.log(JSON.stringify(report,null,2));
process.exit(missing.length ? 1 : 0);
