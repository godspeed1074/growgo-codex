// Pure transaction planner. Not exported by a callable endpoint yet.
// A live adapter MUST read coins and this run in one Firestore transaction,
// verify authenticated ownership/location, then commit both outputs atomically.
// Never accept this state or the clock from a client request.
export interface LeonardMaterials {
  uid: string;
  runId: string;
  stage: 'materials' | 'recipe' | 'craft' | 'use' | 'incubating';
  coins: number;
  sticks: number;
  cotton: number;
  egg: number;
  nest: number;
  cottonPurchased: boolean;
  hatchAt: number | null;
}
export type LeonardMaterialAction = 'buy-cotton' | 'craft-nest' | 'use-nest';
export function planLeonardMaterials(state: LeonardMaterials, uid: string, runId: string,
  action: LeonardMaterialAction, serverNow: number): LeonardMaterials {
  if (!state || state.uid !== uid || state.runId !== runId || !uid || !runId) throw Error('Wrong quest owner or run');
  if (!['materials', 'recipe', 'craft', 'use', 'incubating'].includes(state.stage)
    || typeof state.cottonPurchased !== 'boolean') throw Error('Invalid quest state');
  for (const key of ['coins', 'sticks', 'cotton', 'egg', 'nest'] as const) {
    if (!Number.isSafeInteger(state[key]) || state[key] < 0) throw Error('Invalid quest inventory');
  }
  if (state.sticks > 6 || state.cotton > 6 || state.egg > 1 || state.nest > 1
    || (!state.cottonPurchased && state.cotton !== 0)) throw Error('Invalid quest inventory');
  if (!Number.isSafeInteger(serverNow) || serverNow < 0 || !Number.isSafeInteger(serverNow + 86400000)) throw Error('Invalid server clock');
  if (state.stage === 'incubating') {
    if (!Number.isSafeInteger(state.hatchAt) || state.hatchAt! < 86400000 || state.egg !== 0 || state.nest !== 0) throw Error('Invalid incubation');
  } else if (state.hatchAt !== null) throw Error('Unexpected incubation');
  const next = { ...state };
  if (action === 'buy-cotton') {
    // Persistent receipt flag makes a retry a no-op, even after later steps.
    if (state.cottonPurchased) return next;
    if (state.stage !== 'materials') throw Error('Cotton is not available at this stage');
    if (state.coins < 300) throw Error('You need 300 coins');
    next.coins -= 300; next.cotton = 6; next.cottonPurchased = true;
  } else if (action === 'craft-nest') {
    if (['use', 'incubating'].includes(state.stage)) return next;
    if (state.stage !== 'craft') throw Error('Return to Leonard for the recipe first');
    if (state.sticks !== 6 || state.cotton !== 6 || !state.cottonPurchased || state.nest !== 0) throw Error('You need six sticks and six cotton');
    next.sticks = 0; next.cotton = 0; next.nest = 1; next.stage = 'use';
  } else if (action === 'use-nest') {
    if (state.stage === 'incubating') return next;
    if (state.stage !== 'use' || state.egg !== 1 || state.nest !== 1) throw Error('You need the nest and Leonard’s egg');
    next.egg = 0; next.nest = 0; next.hatchAt = serverNow + 86400000; next.stage = 'incubating';
  } else throw Error('Unknown quest action');
  return next;
}
