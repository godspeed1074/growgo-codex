import { HttpsError } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

export const STARTER_QUEST_STATE_SCHEMA_VERSION = 1 as const;
export const STARTER_QUEST_ID = "bingles-first-base-pin" as const;
export const STARTER_QUEST_REWARD_COINS = 100 as const;
export const STARTER_QUEST_REWARD_ITEM_ID = "wheat_seed" as const;
export const STARTER_QUEST_REWARD_ITEM_QUANTITY = 1 as const;

export interface StarterQuestState {
  schemaVersion: 1;
  starterTutorial: {
    id: typeof STARTER_QUEST_ID;
    status: "active" | "completed";
    step: "capture-first-base";
    startedAt: Timestamp;
    completedAt?: Timestamp;
  };
}

export function createStarterQuestState(startedAt: Timestamp): StarterQuestState {
  return {
    schemaVersion: STARTER_QUEST_STATE_SCHEMA_VERSION,
    starterTutorial: {
      id: STARTER_QUEST_ID,
      status: "active",
      step: "capture-first-base",
      startedAt
    }
  };
}

export function completeStarterQuestState(
  state: StarterQuestState,
  completedAt: Timestamp
): StarterQuestState {
  if (state.starterTutorial.status === "completed") return state;

  return {
    ...state,
    starterTutorial: {
      ...state.starterTutorial,
      status: "completed",
      completedAt
    }
  };
}

export function readStarterQuestState(value: unknown): StarterQuestState | null {
  if (value === undefined) return null;
  if (!value || typeof value !== "object") {
    throw new HttpsError("internal", "Stored quest state is invalid.");
  }

  const candidate = value as Record<string, unknown>;
  const starterTutorial = candidate.starterTutorial as Record<string, unknown> | undefined;
  const completedAt = starterTutorial?.completedAt;
  if (
    candidate.schemaVersion !== STARTER_QUEST_STATE_SCHEMA_VERSION ||
    !starterTutorial ||
    starterTutorial.id !== STARTER_QUEST_ID ||
    (starterTutorial.status !== "active" && starterTutorial.status !== "completed") ||
    starterTutorial.step !== "capture-first-base" ||
    !(starterTutorial.startedAt instanceof Timestamp) ||
    (completedAt !== undefined && !(completedAt instanceof Timestamp))
  ) {
    throw new HttpsError("internal", "Stored quest state is invalid.");
  }

  return {
    schemaVersion: STARTER_QUEST_STATE_SCHEMA_VERSION,
    starterTutorial: {
      id: STARTER_QUEST_ID,
      status: starterTutorial.status,
      step: "capture-first-base",
      startedAt: starterTutorial.startedAt,
      ...(completedAt instanceof Timestamp ? { completedAt } : {})
    }
  };
}

export function serializeStarterQuestState(state: StarterQuestState) {
  return {
    id: state.starterTutorial.id,
    status: state.starterTutorial.status,
    step: state.starterTutorial.step,
    startedAt: state.starterTutorial.startedAt.toDate().toISOString(),
    completedAt: state.starterTutorial.completedAt?.toDate().toISOString() ?? null,
    reward: state.starterTutorial.status === "completed"
      ? {
          coins: STARTER_QUEST_REWARD_COINS,
          itemId: STARTER_QUEST_REWARD_ITEM_ID,
          quantity: STARTER_QUEST_REWARD_ITEM_QUANTITY
        }
      : null
  };
}
