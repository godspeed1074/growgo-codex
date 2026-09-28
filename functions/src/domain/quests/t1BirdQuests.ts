import { randomInt } from "node:crypto";
import { HttpsError } from "firebase-functions/v2/https";

// Pilot deliberately lives outside player/bootstrap documents. Nothing here
// changes capture permission, crop timers, crafting costs or existing quests.
export const DOVE_PILOT_EMAIL = "godspeed1074@gmail.com";
export const DOVE_PILOT_VERSION = 1;
export const DOVE_OFFER_RADIUS = 1000;
export const DOVE_ENCOUNTER_MS = 6 * 60 * 60 * 1000;
export interface T1QuestDefinition {
  id: string; title: string; description: string; label: string;
  kind: "base" | "harvest" | "park" | "church" | "water" | "craft"; target: number;
}
export const T1_BIRD_QUESTS: readonly T1QuestDefinition[] = [
  { id: "dove-1-stretch-your-wings", title: "Stretch Your Wings", description: "Help the dove explore by capturing 10 different base pins after accepting this quest.", label: "Capture 10 different base pins", kind: "base", target: 10 },
  { id: "dove-1-a-little-harvest", title: "A Little Harvest", description: "Harvest 3 different crop pins after accepting this quest. Any crop resource counts.", label: "Harvest 3 different crop pins", kind: "harvest", target: 3 },
  { id: "dove-1-a-walk-in-the-park", title: "A Walk in the Park", description: "Capture a park POI after accepting the dove's quest.", label: "Capture 1 park POI", kind: "park", target: 1 },
  { id: "dove-1-a-quiet-perch", title: "A Quiet Perch", description: "The dove is looking for a peaceful perch. Capture 1 church POI after accepting this quest.", label: "Capture 1 church POI", kind: "church", target: 1 },
  { id: "dove-1-by-the-water", title: "By the Water", description: "Help the dove explore the waterside. Capture 3 different water pins after accepting this quest.", label: "Capture 3 different water pins", kind: "water", target: 3 },
  { id: "dove-1-flour-power", title: "Flour Power", description: "Show the dove what you can make from wheat. Craft 1 Flour after accepting this quest. The current recipe uses 2 Wheat, and you keep the Flour.", label: "Craft 1 Flour", kind: "craft", target: 1 }
];
export function getT1Quest(id: unknown): T1QuestDefinition {
  const quest = T1_BIRD_QUESTS.find(q => q.id === id);
  if (!quest) throw new HttpsError("invalid-argument", "Choose an available dove quest.");
  return quest;
}
export const T1_RESOURCE_POOL = ["corn", "wheat", "sugar_cane", "water", "fish"] as const;
export const T1_SEED_POOL = ["corn_seed", "wheat_seed", "sugar_cane_seed"] as const;
export const BIRD_CARD_POOL = [
  ...Array.from({ length: 24 }, (_, i) => `dino-${String(i + 1).padStart(3, "0")}`),
  ...Array.from({ length: 40 }, (_, i) => `fish-${String(i + 1).padStart(3, "0")}`),
  ...Array.from({ length: 40 }, (_, i) => `land_of_oz_${String(i + 1).padStart(3, "0")}_${[
    "kansas_prairie", "dorothy_and_toto", "aunt_em_and_uncle_henry", "the_cyclone", "the_house_takes_flight",
    "the_witch_of_the_east", "munchkin_country", "the_munchkins", "good_witch_of_the_north", "silver_shoes",
    "yellow_brick_road", "the_scarecrow", "the_tin_woodman", "the_cowardly_lion", "the_kalidahs",
    "the_river_crossing", "the_deadly_poppy_field", "queen_of_the_field_mice", "the_emerald_city_gates", "guardian_of_the_gates",
    "the_marvelous_emerald_city", "the_great_oz", "ozs_command", "the_western_country", "the_wolves", "the_wild_crows",
    "the_black_bees", "the_winged_monkeys", "wicked_witchs_fortress", "the_wicked_witch_of_the_west", "dorothy_melts_the_witch",
    "the_winkies_set_free", "the_golden_cap", "oz_unmasked", "scarecrows_new_brains", "tin_woodmans_silken_heart",
    "lions_courage_potion", "the_balloon_escape", "glinda_good_witch_of_the_south", "home_at_last"
  ][i]}`)
];
export interface BirdReward {
  points: number; xp: number; items: Record<string, number>;
  card: { cardId: string; rarity: "common" | "rare" } | null;
}
export function rollT1Reward(draw: (max: number) => number = randomInt): BirdReward {
  const pick = (max: number) => {
    const n = draw(max);
    if (!Number.isSafeInteger(n) || n < 0 || n >= max) throw new Error("Invalid server reward roll");
    return n;
  };
  const items: Record<string, number> = {};
  for (let i = 0; i < 2; i++) {
    for (const pool of [T1_RESOURCE_POOL, T1_SEED_POOL]) {
      const item = pool[pick(pool.length)]; items[item] = (items[item] || 0) + 1;
    }
  }
  const card = pick(100) < 10
    ? { cardId: BIRD_CARD_POOL[pick(BIRD_CARD_POOL.length)], rarity: (pick(100) < 10 ? "rare" : "common") as "rare" | "common" }
    : null;
  return { points: 100, xp: 100, items, card };
}

export interface BirdRun {
  schemaVersion: 1; id: string; questId: string; uid: string; birdId: string;
  // Absent on the original own-bird pilot runs, which must remain claimable.
  birdOwnerUid?: string; deploymentId?: string;
  acceptedAt: number; status: "active" | "reward-pending" | "completed";
  seen: string[]; completedAt: number | null; reward: BirdReward | null;
}
export interface VerifiedBirdAction {
  // Produced only from a Firestore capture/crafting receipt, never request data.
  uid: string; id: string; at: number; kind: T1QuestDefinition["kind"];
  recipeId?: string;
}
export function advanceBirdRun(run: BirdRun, actions: readonly VerifiedBirdAction[], now: number): BirdRun {
  const definition = getT1Quest(run.questId);
  if (run.schemaVersion !== 1 || !Number.isSafeInteger(run.acceptedAt) || !Array.isArray(run.seen)
    || !["active", "reward-pending", "completed"].includes(run.status)) {
    throw new HttpsError("failed-precondition", "This bird quest needs support. Your other gameplay is unaffected.");
  }
  if (run.status !== "active") return run;
  const seen = new Set(run.seen);
  for (const action of actions) {
    if (seen.size >= definition.target) break;
    if (action.uid !== run.uid || action.kind !== definition.kind || !action.id
      || !Number.isSafeInteger(action.at) || action.at < run.acceptedAt || action.at > now
      || (definition.kind === "craft" && action.recipeId !== "flour")) continue;
    seen.add(action.id);
  }
  return { ...run, seen: [...seen], status: seen.size >= definition.target ? "reward-pending" : "active" };
}
export function chooseT1Offers(available: Record<string, string[]>, flourUnlocked: boolean): T1QuestDefinition[] {
  return T1_BIRD_QUESTS.filter(q => q.kind === "craft" ? flourUnlocked : new Set(available[q.kind] || []).size >= q.target).slice(0, 3);
}
