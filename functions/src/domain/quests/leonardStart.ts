import { randomUUID } from 'node:crypto';
import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { selectLeonardLocations } from './leonardLocations';
import { acquireLeonardShops } from './leonardShops';
import { leonardSpawn } from './leonardSpawn';

const PILOT_UID = 'LkR8ugTK6lXGFfUlLvKSiqMoMBh1';
type Evidence = Parameters<typeof selectLeonardLocations>[1];
// Server service only: deliberately not exported from index.ts. The eventual
// callable must enforce App Check, invitation and active-device checks first.
// Resolver must read canonical evidence, not trust a client's safe/captured flags.
export async function startLeonardIntroduction(db: Firestore,
  identity: { uid: string; email: string; emailVerified: boolean },
  origin: { latitude: number; longitude: number },
  resolve: (tx: Transaction) => Promise<Evidence>, enabled = false,
  clock = () => Date.now(),
  shopTransport?: Parameters<typeof acquireLeonardShops>[1],
  replay = false) {
  if (!enabled) throw Error('Leonard test is not enabled');
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(identity.uid) || identity.emailVerified !== true)
    throw Error('A verified player account is required');
  const ref = db.collection(replay?'leonardIntroductionReplays':'leonardIntroductionPlayers').doc(identity.uid);
  const playerRef = db.collection('players').doc(identity.uid);
  const resume = (saved: FirebaseFirestore.DocumentData) => {
    if (saved.schemaVersion !== 1 || saved.uid !== identity.uid || typeof saved.runId !== 'string'
      || saved.questId !== 'a-little-help-from-my-friends') throw Error('Existing introduction needs support; it has not been reset');
    return { started: false, run: saved };
  };
  let shops: Evidence['shops'] | undefined;
  if (shopTransport) {
    // Resume before any network lookup. Fetch only outside the retrying
    // transaction; its final read still protects concurrent quest starts.
    const existing = await ref.get();
    if (existing.exists) return resume(existing.data()!);
    const player = await playerRef.get();
    if (!player.exists || player.data()?.profileComplete !== true) throw Error('Complete your player profile first');
    shops = await acquireLeonardShops(origin, shopTransport);
    if (!shops.length) throw Error('No suitable store found within 7 km; no quest started');
  }
  const runId = randomUUID();
  return db.runTransaction(async tx => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      return resume(existing.data()!);
    }
    const player = await tx.get(playerRef);
    if (!player.exists || player.data()?.profileComplete !== true) throw Error('Complete your player profile first');
    const evidence = await resolve(tx);
    const locations = selectLeonardLocations(origin, { ...evidence, shops: shops ?? evidence.shops });
    if (!locations.ready) throw Error(`Quest locations unavailable: ${locations.missing.join(', ')}`);
    const startedAt = clock();
    if (!Number.isSafeInteger(startedAt) || startedAt < 0) throw Error('Invalid server time');
    const seller = (shops ?? evidence.shops).find(shop => shop.id === locations.shop)!;
    const chosen = new Map([...evidence.churches.flatMap(p=>p.basePins),
      ...evidence.parks.flatMap(p=>p.basePins)].map(p=>[p.id,p]));
    const targets = Object.fromEntries([...locations.eggPins,...locations.stickPins].map(id=>{
      const p=chosen.get(id)!;return [id,{latitude:p.latitude,longitude:p.longitude}];
    }));
    const run = { schemaVersion: 1, questId: 'a-little-help-from-my-friends',
      uid: identity.uid, runId, stage: 'meet-leonard', startedAt,
      ...(replay?{replay:true,testCoins:500}:{}),
      origin: { latitude: origin.latitude, longitude: origin.longitude }, locations,
      sellerLocation: { id: seller.id, latitude: seller.latitude, longitude: seller.longitude },
      actionLocations: { leonard: leonardSpawn(origin), seller: { latitude:seller.latitude, longitude:seller.longitude }, targets },
      collectedEggPins: [], collectedStickPins: [], sticks: 0, cotton: 0,
      egg: 0, nest: 0, cottonPurchased: false, hatchAt: null };
    tx.create(ref, run);
    return { started: true, run };
  });
}

// Keep the existing live pilot entry point unchanged until global integration
// and deployment tests pass. The general service is not a callable by itself.
export async function startLeonardPilot(...args: Parameters<typeof startLeonardIntroduction>) {
 const identity=args[1];
 if(identity.uid!==PILOT_UID||identity.email.toLowerCase()!=='godspeed1074@gmail.com')
  throw Error('This test is reserved for Rubberlips');
 return startLeonardIntroduction(...args);
}
