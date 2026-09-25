/**
 * Small zero-dependency repository safety guard. NOT a replacement for ESLint.
 * Keep it runnable in clean CI checkouts with no credentials.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const failures = [];
const envFile = /(?:^|\/)\.env(?:\.[^/]+)?$/;
const publicSecret = /\bNEXT_PUBLIC_[A-Z0-9_]*(?:SERVICE_ROLE|SECRET|PRIVATE_KEY|PASSWORD|API_SECRET|BREVO_API_KEY)\b/;
const codeFile = /\.(?:cjs|mjs|js|jsx|ts|tsx)$/;
const ignoredForSourceScan = /(?:^|\/)(?:node_modules|\.next|content-seed)(?:\/|$)/;

for (const file of files) {
  if (envFile.test(file) && !file.endsWith(".env.example")) {
    failures.push(`Tracked environment file: ${file}`);
  }
  if (/(?:^|\/)\.DS_Store$/.test(file)) {
    console.warn(`Consider removing tracked macOS metadata: ${file}`);
  }
  if (!codeFile.test(file) || ignoredForSourceScan.test(file) || file === "scripts/repository-lint.mjs") continue;
  const content = readFileSync(file, "utf8");
  if (publicSecret.test(content)) {
    failures.push(`Possible confidential NEXT_PUBLIC_ variable name in ${file}`);
  }
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (/^next lint(?:\s|$)/.test(pkg.scripts?.lint || "")) {
  failures.push("Next.js 16 removed next lint; use a supported check");
}
if (!files.includes("package-lock.json")) {
  failures.push("Commit package-lock.json for reproducible npm ci");
}

if (failures.length) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log("Repository guards passed (not a full ESLint/security audit).");
}
