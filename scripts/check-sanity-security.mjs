// AROUND v1.27a - Sanity Content Lake security preflight.
//
// Operational check only: this supports the later public -> private dataset
// cutover (see docs/SANITY_SECURITY.md). It never mutates anything, never
// fails the app build, and never prints a token, an Authorization header, or
// any document content - only OPEN/CLOSED and WORKING/FAILED status lines.
//
// Usage (env vars must already be available to the process, e.g. via your
// shell, CI secrets, or `node --env-file=.env.local`):
//   npm run sanity:security-check

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = "2026-07-01";
const readToken = process.env.SANITY_API_READ_TOKEN;

const HARMLESS_QUERY = "count(*[])";

async function runCountQuery(token) {
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(HARMLESS_QUERY)}`;
  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) {
      return { ok: false, count: null };
    }
    const body = await response.json();
    const count = typeof body?.result === "number" ? body.result : null;
    return { ok: true, count };
  } catch {
    return { ok: false, count: null };
  }
}

async function main() {
  console.log("AROUND · Sanity Content Lake security preflight");

  if (!projectId || !dataset) {
    console.log("SKIPPED: NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET not set.");
    process.exit(0);
  }

  console.log(`Project: ${projectId}   Dataset: ${dataset}`);
  console.log("");

  // A. Anonymous read check - never sends a token. A private dataset may
  // still answer with HTTP 200 and an empty/zero result rather than a 401 -
  // so "OPEN" is decided by whether content is actually visible, not by
  // status code alone.
  const anonymous = await runCountQuery(undefined);
  const anonymousOpen = anonymous.ok && typeof anonymous.count === "number" && anonymous.count > 0;
  console.log(`ANONYMOUS READ: ${anonymousOpen ? "OPEN" : "CLOSED"}`);

  // B. Authenticated read check - only runs when a token is configured.
  if (!readToken) {
    console.log("AUTHENTICATED READ: SKIPPED (SANITY_API_READ_TOKEN not set)");
  } else {
    const authenticated = await runCountQuery(readToken);
    const authenticatedWorking = authenticated.ok && typeof authenticated.count === "number" && authenticated.count > 0;
    console.log(`AUTHENTICATED READ: ${authenticatedWorking ? "WORKING" : "FAILED"}`);
  }

  console.log("");
  console.log("This is an operational check only - it never fails the app build.");
  process.exit(0);
}

main();
