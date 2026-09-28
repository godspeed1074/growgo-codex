export const leaderboardPeriods = ["daily", "seasonal", "all-time"] as const;
export type LeaderboardPeriod = (typeof leaderboardPeriods)[number];

export interface GrowGoSeason {
  key: string;
  label: string;
  startsOn: string;
}

// The game changes seasons at 00:00 UTC on the UTC date of the astronomical
// equinox or solstice. These published dates cover the closed-alpha window and
// the next few live seasons; extend the table before the final listed boundary.
const PUBLISHED_SEASON_STARTS: readonly GrowGoSeason[] = [
  { key: "winter-2025", label: "Winter 2025", startsOn: "2025-12-21" },
  { key: "spring-2026", label: "Spring 2026", startsOn: "2026-03-20" },
  { key: "summer-2026", label: "Summer 2026", startsOn: "2026-06-21" },
  { key: "autumn-2026", label: "Autumn 2026", startsOn: "2026-09-23" },
  { key: "winter-2026", label: "Winter 2026", startsOn: "2026-12-21" },
  { key: "spring-2027", label: "Spring 2027", startsOn: "2027-03-20" },
  { key: "summer-2027", label: "Summer 2027", startsOn: "2027-06-21" },
  { key: "autumn-2027", label: "Autumn 2027", startsOn: "2027-09-23" },
  { key: "winter-2027", label: "Winter 2027", startsOn: "2027-12-21" },
  { key: "spring-2028", label: "Spring 2028", startsOn: "2028-03-20" },
  { key: "summer-2028", label: "Summer 2028", startsOn: "2028-06-20" },
  { key: "autumn-2028", label: "Autumn 2028", startsOn: "2028-09-22" },
  { key: "winter-2028", label: "Winter 2028", startsOn: "2028-12-21" }
] as const;

const FALLBACK_SEASON: GrowGoSeason = PUBLISHED_SEASON_STARTS[0];

export function getGrowGoUtcDayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function getGrowGoSeasonAt(now: Date): GrowGoSeason {
  const utcDay = getGrowGoUtcDayKey(now);
  let active = FALLBACK_SEASON;

  for (const season of PUBLISHED_SEASON_STARTS) {
    if (season.startsOn > utcDay) break;
    active = season;
  }

  return active;
}
