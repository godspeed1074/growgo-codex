import { planLeonardMaterials, type LeonardMaterialAction, type LeonardMaterials } from './leonardMaterials';

export interface LeonardRun extends Omit<LeonardMaterials, 'stage'> {
  stage: 'meet-leonard' | 'lost-eggs' | 'return-eggs' | LeonardMaterials['stage'];
  locations: { eggPins: string[]; stickPins: string[] };
  collectedEggPins: string[];
  collectedStickPins: string[];
}
export type LeonardAction =
  | { stage: LeonardRun['stage']; kind: 'talk' }
  | { stage: LeonardRun['stage']; kind: 'collect-egg' | 'collect-stick'; pinId: string }
  | { stage: LeonardRun['stage']; kind: LeonardMaterialAction };

// Requires trusted saved state and server-verified actions. Does not itself
// authenticate, verify location, write inventory, or grant a Birdhouse entry.
export function advanceLeonardRun(state: LeonardRun, uid: string, runId: string,
  action: LeonardAction, now: number): LeonardRun {
  if (state.uid !== uid || state.runId !== runId) throw Error('Wrong quest owner or run');
  for (const [targets, collected] of [[state.locations.eggPins,state.collectedEggPins],
    [state.locations.stickPins,state.collectedStickPins]]) {
    if (!Array.isArray(targets) || targets.length !== 6 || new Set(targets).size !== 6
      || !targets.every(id => typeof id === 'string' && id.length > 0)
      || !Array.isArray(collected) || new Set(collected).size !== collected.length
      || collected.some(id => !targets.includes(id))) throw Error('Invalid personal quest targets');
  }
  const next = structuredClone(state);
  // Stage-scoped actions prevent an old talk retry from advancing a later visit.
  if (action.stage !== state.stage) return next;
  if (action.kind === 'talk') {
    if (state.stage === 'meet-leonard') next.stage = 'lost-eggs';
    else if (state.stage === 'return-eggs') {
      if (state.collectedEggPins.length !== 6 || state.egg !== 0) throw Error('Find all six eggs first');
      next.egg = 1; next.stage = 'materials';
    } else if (state.stage === 'materials') {
      if (state.sticks !== 6 || state.collectedStickPins.length !== 6
        || state.cotton !== 6 || !state.cottonPurchased) throw Error('Collect all nest materials first');
      next.stage = 'craft';
    } else throw Error('Leonard has no handoff at this stage');
    return next;
  }
  if (action.kind === 'collect-egg' || action.kind === 'collect-stick') {
    const egg = action.kind === 'collect-egg';
    if (state.stage !== (egg ? 'lost-eggs' : 'materials')) throw Error('Collection is not active');
    const targets = egg ? state.locations.eggPins : state.locations.stickPins;
    const collected = egg ? next.collectedEggPins : next.collectedStickPins;
    if (!targets.includes(action.pinId)) throw Error('Not a personal quest target');
    if (!collected.includes(action.pinId)) collected.push(action.pinId);
    if (egg && collected.length === 6) next.stage = 'return-eggs';
    if (!egg) next.sticks = collected.length;
    return next;
  }
  if (!['materials','recipe','craft','use','incubating'].includes(state.stage)) throw Error('Materials are not active');
  return { ...next, ...planLeonardMaterials(state as LeonardMaterials,uid,runId,action.kind,now) };
}
