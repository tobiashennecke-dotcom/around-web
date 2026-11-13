import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanity } from "@/lib/sanity/client";
import {
  buildInsights,
  type AccountRow,
  type DestinationRef,
  type EntityContext,
  type Insights,
  type SaveRow,
  type TripRow
} from "./insights-aggregate";

export type InsightsResult =
  | { ok: true; insights: Insights; generatedAt: string }
  | { ok: false; reason: "missing_secret_key" | "query_failed"; detail?: string };

const PAGE = 1000;
const MAX_ROWS = 20000;

async function fetchAll<T>(load: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await load(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

/** Which destination each saved Place / Story belongs to, from Sanity (published). */
const CONTEXT_QUERY = `{
  "entities": *[_id in $ids]{
    "id": _id,
    title,
    "destinationIds": select(
      _type == "place" => [destination._ref],
      _type == "story" => related[]->{"d": select(_type == "destination" => _id, _type == "place" => destination._ref, null)}.d,
      []
    )
  },
  "destinations": *[_type == "destination" && defined(slug.current)]{ "id": _id, title, "slug": slug.current }
}`;

export async function loadInsights(): Promise<InsightsResult> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, reason: "missing_secret_key" };

  try {
    const [saves, trips, accounts] = await Promise.all([
      fetchAll<SaveRow>((from, to) =>
        admin.from("saved_items")
          .select("user_id,source_id,source_type,source_role,title_snapshot,slug_snapshot,created_at")
          .order("created_at", { ascending: false })
          .range(from, to)
      ),
      fetchAll<TripRow>((from, to) =>
        admin.from("trips").select("id,user_id,created_at").order("created_at", { ascending: false }).range(from, to)
      ),
      (async () => {
        const rows: AccountRow[] = [];
        for (let page = 1; page <= MAX_ROWS / PAGE; page += 1) {
          const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE });
          if (error) throw new Error(error.message);
          rows.push(...data.users.map(user => ({
            id: user.id,
            email: user.email ?? null,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at ?? null,
            provider: (user.app_metadata?.provider as string | undefined) ?? null
          })));
          if (data.users.length < PAGE) break;
        }
        return rows;
      })()
    ]);

    let context: EntityContext[] = [];
    let destinations: DestinationRef[] = [];
    const ids = [...new Set(saves.filter(row => row.source_type !== "destination").map(row => row.source_id))];
    if (sanity) {
      try {
        const result = await sanity.fetch<{ entities: EntityContext[]; destinations: DestinationRef[] }>(
          CONTEXT_QUERY,
          { ids },
          { cache: "no-store" }
        );
        context = (result.entities || []).map(entry => ({ ...entry, destinationIds: (entry.destinationIds || []).filter(Boolean) }));
        destinations = result.destinations || [];
      } catch {
        // Sanity context is an enrichment: without it, destination grouping falls back to direct saves.
      }
    }

    return {
      ok: true,
      insights: buildInsights({ saves, trips, accounts, context, destinations }),
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    return { ok: false, reason: "query_failed", detail: error instanceof Error ? error.message : String(error) };
  }
}
