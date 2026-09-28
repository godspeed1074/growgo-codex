import { calculateHaversineDistanceMetres } from '../pins/canonicalPinGenerator';
import type { LeonardAction, LeonardRun } from './leonardProgress';

export interface LeonardPosition { latitude: number; longitude: number }
export interface LeonardActionLocations {
  leonard: LeonardPosition;
  seller: LeonardPosition;
  targets: Record<string, LeonardPosition>;
}
const valid = (p: LeonardPosition | undefined): p is LeonardPosition => !!p
  && Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90
  && Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180;

// Only use positions persisted by the trusted server resolver. Never accept
// this manifest or a capture radius from the caller's request payload.
export function verifyLeonardActionLocation(
  state: LeonardRun, action: LeonardAction, saved: LeonardActionLocations,
  location: (LeonardPosition & { accuracyMetres: number }) | undefined,
  captureRadiusMetres: number
) {
  if (!Number.isFinite(captureRadiusMetres) || captureRadiusMetres <= 0)
    throw Error('Invalid server capture radius');
  // Inventory actions have no physical destination, including incubation.
  if (action.kind === 'craft-nest' || action.kind === 'use-nest') return;
  let target: LeonardPosition | undefined;
  if (action.kind === 'talk') target = saved.leonard;
  else if (action.kind === 'buy-cotton') target = saved.seller;
  else if (action.kind === 'collect-egg' || action.kind === 'collect-stick') {
    const ids = action.kind === 'collect-egg' ? state.locations.eggPins : state.locations.stickPins;
    if (!ids.includes(action.pinId)) throw Error('Not one of your quest pins');
    target = saved.targets[action.pinId];
  } else throw Error('Unknown quest action');
  if (!valid(target)) throw Error('Quest location needs support; no reward changed');
  if (!valid(location) || !Number.isFinite(location.accuracyMetres)
    || location.accuracyMetres < 0 || location.accuracyMetres > 100)
    throw Error('Wait for an accurate GPS location');
  if (calculateHaversineDistanceMetres(location, target) > captureRadiusMetres)
    throw Error('Move closer to this quest character or pin');
}
