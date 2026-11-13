/**
 * Pure aggregation for the admin Insights page. No I/O here, so it can be
 * unit-tested; lib/admin/insights.ts loads the rows and calls buildInsights.
 */

export type SaveRow = {
  user_id: string;
  source_id: string;
  source_type: string;
  source_role: string | null;
  title_snapshot: string | null;
  slug_snapshot: string | null;
  created_at: string;
};

export type TripRow = { id: string; user_id: string; created_at: string };

export type AccountRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string | null;
};

/** Sanity context per saved entity: which destination(s) it belongs to. */
export type EntityContext = {
  id: string;
  title?: string;
  destinationIds: string[];
};

export type DestinationRef = { id: string; title: string; slug: string };

export type RankedItem = {
  sourceId: string;
  sourceType: string;
  sourceRole: string | null;
  title: string;
  slug: string | null;
  saves: number;
  lastSavedAt: string;
};

export type DestinationInsight = {
  id: string;
  title: string;
  slug: string | null;
  total: number;
  direct: number;
  places: number;
  stories: number;
  accounts: number;
};

export type AccountInsight = AccountRow & {
  saves: number;
  trips: number;
  lastSaveAt: string | null;
};

export type RecentSave = {
  email: string | null;
  sourceType: string;
  sourceRole: string | null;
  title: string;
  slug: string | null;
  createdAt: string;
};

export type Insights = {
  totals: {
    accounts: number;
    accountsWithSaves: number;
    saves: number;
    trips: number;
    savesLast7Days: number;
  };
  byType: { type: string; saves: number }[];
  destinations: DestinationInsight[];
  unassignedSaves: number;
  topStories: RankedItem[];
  topPlaces: RankedItem[];
  topOther: RankedItem[];
  accounts: AccountInsight[];
  recent: RecentSave[];
};

const DAY = 24 * 60 * 60 * 1000;

function rank(rows: SaveRow[]): RankedItem[] {
  const map = new Map<string, RankedItem>();
  for (const row of rows) {
    const current = map.get(row.source_id);
    if (current) {
      current.saves += 1;
      if (row.created_at > current.lastSavedAt) current.lastSavedAt = row.created_at;
      continue;
    }
    map.set(row.source_id, {
      sourceId: row.source_id,
      sourceType: row.source_type,
      sourceRole: row.source_role,
      title: row.title_snapshot || row.slug_snapshot || row.source_id,
      slug: row.slug_snapshot,
      saves: 1,
      lastSavedAt: row.created_at
    });
  }
  return [...map.values()].sort((a, b) => b.saves - a.saves || b.lastSavedAt.localeCompare(a.lastSavedAt));
}

export function buildInsights(input: {
  saves: SaveRow[];
  trips: TripRow[];
  accounts: AccountRow[];
  context: EntityContext[];
  destinations: DestinationRef[];
  now?: Date;
  recentLimit?: number;
  topLimit?: number;
}): Insights {
  const now = (input.now || new Date()).getTime();
  const topLimit = input.topLimit ?? 15;
  const { saves, trips, accounts } = input;

  const contextById = new Map(input.context.map(entry => [entry.id, entry]));
  const destinationById = new Map(input.destinations.map(entry => [entry.id, entry]));
  const emailById = new Map(accounts.map(account => [account.id, account.email]));

  // Per destination: direct saves, place saves, story saves, distinct accounts.
  const destinationStats = new Map<string, { direct: number; places: number; stories: number; users: Set<string> }>();
  let unassignedSaves = 0;
  for (const row of saves) {
    const destinationIds = row.source_type === "destination"
      ? [row.source_id]
      : contextById.get(row.source_id)?.destinationIds || [];
    const unique = [...new Set(destinationIds.filter(Boolean))];
    if (unique.length === 0) {
      unassignedSaves += 1;
      continue;
    }
    for (const destinationId of unique) {
      const stats = destinationStats.get(destinationId) || { direct: 0, places: 0, stories: 0, users: new Set<string>() };
      if (row.source_type === "destination") stats.direct += 1;
      else if (row.source_type === "place") stats.places += 1;
      else if (row.source_type === "story") stats.stories += 1;
      stats.users.add(row.user_id);
      destinationStats.set(destinationId, stats);
    }
  }

  const directTitles = new Map(saves.filter(row => row.source_type === "destination").map(row => [row.source_id, row]));
  const destinationInsights: DestinationInsight[] = [...destinationStats.entries()].map(([id, stats]) => {
    const ref = destinationById.get(id);
    const snapshot = directTitles.get(id);
    return {
      id,
      title: ref?.title || snapshot?.title_snapshot || id,
      slug: ref?.slug || snapshot?.slug_snapshot || null,
      total: stats.direct + stats.places + stats.stories,
      direct: stats.direct,
      places: stats.places,
      stories: stats.stories,
      accounts: stats.users.size
    };
  }).sort((a, b) => b.total - a.total || b.accounts - a.accounts);

  const typeCounts = new Map<string, number>();
  for (const row of saves) typeCounts.set(row.source_type, (typeCounts.get(row.source_type) || 0) + 1);

  const savesByUser = new Map<string, { count: number; last: string }>();
  for (const row of saves) {
    const current = savesByUser.get(row.user_id) || { count: 0, last: "" };
    current.count += 1;
    if (row.created_at > current.last) current.last = row.created_at;
    savesByUser.set(row.user_id, current);
  }
  const tripsByUser = new Map<string, number>();
  for (const trip of trips) tripsByUser.set(trip.user_id, (tripsByUser.get(trip.user_id) || 0) + 1);

  const accountInsights: AccountInsight[] = accounts.map(account => ({
    ...account,
    saves: savesByUser.get(account.id)?.count || 0,
    trips: tripsByUser.get(account.id) || 0,
    lastSaveAt: savesByUser.get(account.id)?.last || null
  })).sort((a, b) => b.saves - a.saves || b.created_at.localeCompare(a.created_at));

  const recent: RecentSave[] = [...saves]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, input.recentLimit ?? 30)
    .map(row => ({
      email: emailById.get(row.user_id) ?? null,
      sourceType: row.source_type,
      sourceRole: row.source_role,
      title: row.title_snapshot || row.slug_snapshot || row.source_id,
      slug: row.slug_snapshot,
      createdAt: row.created_at
    }));

  return {
    totals: {
      accounts: accounts.length,
      accountsWithSaves: savesByUser.size,
      saves: saves.length,
      trips: trips.length,
      savesLast7Days: saves.filter(row => now - new Date(row.created_at).getTime() <= 7 * DAY).length
    },
    byType: [...typeCounts.entries()].map(([type, count]) => ({ type, saves: count })).sort((a, b) => b.saves - a.saves),
    destinations: destinationInsights,
    unassignedSaves,
    topStories: rank(saves.filter(row => row.source_type === "story")).slice(0, topLimit),
    topPlaces: rank(saves.filter(row => row.source_type === "place")).slice(0, topLimit),
    topOther: rank(saves.filter(row => !["story", "place", "destination"].includes(row.source_type))).slice(0, topLimit),
    accounts: accountInsights,
    recent
  };
}
