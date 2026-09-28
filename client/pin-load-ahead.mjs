// Bounded map loading: one normal request, with one foreground escape slot.
// No polling, paid warm instances or extra APIs.
import { createMapAreaDelivery } from "./map-area-delivery.mjs";
const METRES = 111_195;
const RADIUS = 0.006;
const MAX_AHEAD_PER_15_MIN = 4;
const MAX_SPEED = 40; // 144 km/h: preview support for passengers, not implausible GPS jumps.
const MAX_LEAD = 550; // Keep the player's current area inside the unchanged ~667m query radius.
const FOREGROUND_ESCAPE_MS = 1_500;
const validPoint = p => p && Number.isFinite(p.lat) && Math.abs(p.lat) < 85 &&
  Number.isFinite(p.lng) && Math.abs(p.lng) <= 180;
const dx = (a, b) => (b.lng - a.lng) * METRES * Math.cos(a.lat * Math.PI / 180);
const dy = (a, b) => (b.lat - a.lat) * METRES;
const distance = (a, b) => Math.hypot(dx(a, b), dy(a, b));
const contains = (a, b) => b.south >= a.south && b.north <= a.north && b.west >= a.west && b.east <= a.east;
const pointBounds = p => ({ south: p.lat, north: p.lat, west: p.lng, east: p.lng });
const intersects = (a, b) => a.south <= b.north && a.north >= b.south && a.west <= b.east && a.east >= b.west;
function queryBounds(center) {
  const lngRadius = Math.min(0.018, RADIUS / Math.max(0.25, Math.cos(center.lat * Math.PI / 180)));
  return { south: center.lat - RADIUS, north: center.lat + RADIUS, west: center.lng - lngRadius, east: center.lng + lngRadius };
}

export function createPinLoadAhead({ getContext, fetchPins, apply, onError = () => {}, now = Date.now,
  deliveryPreview = false, fallbackRetryMs = 5_500 }) {
  let deliveryEnabled = deliveryPreview;
  const delivery = createMapAreaDelivery({ now });
  const running = new Set();
  let generation = 0, scope = null, forcePending = false, disposed = false;
  let serial = 0, appliedSerial = 0, priorityTimer = null, fallbackRetryTimer = null,
    fallbackRetryPendingKey = null;
  let sample = null, heading = null, direction = null, lastAhead = null, aheadTimes = [], failures = new Map();
  const areas = [], views = new Set(), fallbackRetries = new Map();
  const denseAreas = [];
  const counts = { foreground: 0, ahead: 0, reused: 0, discarded: 0, failed: 0, applied: 0,
    shiftedForeground: 0, denseFallbacks: 0, priorityBypasses: 0, warmRetries: 0,
    revisionDiscards: 0, obsoleteDiscards: 0, maxConcurrent: 0,
    fallbackResponses: 0, fallbackRetries: 0 };
  const active = c => !disposed && c?.enabled && c.uid && c.revision && c.visible && c.online &&
    c.zoom >= 15 && validPoint(c.center) && c.bounds && c.bounds.west <= c.bounds.east;
  const covered = c => views.has(c.key) || areas.some(area => contains(area, c.bounds));

  function motion(c) {
    if (!active(c) || !validPoint(c.player) || c.player.accuracy < 0 || c.player.accuracy > 50 || !Number.isFinite(c.player.accuracy)) {
      sample = null; heading = null; direction = null; return;
    }
    const stamp = now();
    if (!sample || stamp - sample.at > 120_000) {
      sample = { ...c.player, at: stamp }; heading = null; direction = null; return;
    }
    const travel = distance(sample, c.player);
    if (travel < Math.max(30, c.player.accuracy * 2)) return; // Ignore GPS jitter and stationary callbacks.
    const seconds = (stamp - sample.at) / 1000;
    const speed = travel / seconds;
    const next = { x: dx(sample, c.player) / travel, y: dy(sample, c.player) / travel, at: stamp, speed };
    const consistent = heading && (speed <= 15 || stamp - heading.at <= 30_000) &&
      heading.x * next.x + heading.y * next.y >= 0.8;
    const plausible = seconds > 0 && speed <= MAX_SPEED;
    // Fast travel needs two consecutive, agreeing movement samples. A turn
    // suspends prediction until another sample confirms the new direction.
    direction = plausible && (consistent || (!heading && speed <= 15)) ? next : null;
    heading = plausible ? next : null;
    sample = { ...c.player, at: stamp };
  }

  function predictedTarget(c) {
    if (!direction || now() - direction.at > 30_000 || !validPoint(c.player) ||
        distance(c.player, c.center) > 200) return null;
    // Roughly 20 seconds' travel, with the existing walking lead as a floor.
    const lead = Math.min(MAX_LEAD, Math.max(350, direction.speed * 20));
    const target = {
      lat: c.player.lat + direction.y * lead / METRES,
      lng: c.player.lng + direction.x * lead / (METRES * Math.cos(c.player.lat * Math.PI / 180))
    };
    return validPoint(target) ? target : null;
  }

  function knownDense(c) {
    return denseAreas.some(area => area.until > now() && intersects(area.bounds, c.bounds));
  }

  function earlyDeliveryCenter(c) {
    if (!deliveryEnabled || knownDense(c) || !direction || now() - direction.at > 30_000 ||
        !validPoint(c.player) || distance(c.player, c.center) > 200) return null;
    // Once static preparation is complete, fetch the next area's live state
    // five seconds before the viewport reaches the edge, not after it is blank.
    // This advances the next necessary read; it does not poll or fake captures.
    const lat = direction.y * direction.speed * 5 / METRES;
    const lng = direction.x * direction.speed * 5 / (METRES * Math.cos(c.player.lat * Math.PI / 180));
    const future = { ...c, bounds: { south: c.bounds.south + lat, north: c.bounds.north + lat,
      west: c.bounds.west + lng, east: c.bounds.east + lng } };
    if (areas.some(area => contains(area, future.bounds))) return null;
    const prepared = delivery.centerForView(future);
    return prepared && contains(queryBounds(prepared), c.bounds) ? prepared : null;
  }

  function foregroundCenter(c) {
    const prepared = deliveryEnabled && !knownDense(c) ? delivery.centerForView(c) : null;
    if (prepared) return { ...prepared };
    const base = { ...c.center }, target = predictedTarget(c);
    if (!target || direction.speed <= 15 || knownDense(c) || !contains(queryBounds(base), c.bounds)) return base;
    // Bias necessary loads too, so a slow reply does not continually arrive
    // behind a travelling passenger. Never enlarge the query or exclude any
    // of the original viewport to get a longer lead; reduce the shift instead.
    let low = 0, high = 1;
    const pointAt = n => ({ lat: base.lat + (target.lat - base.lat) * n, lng: base.lng + (target.lng - base.lng) * n });
    for (let i = 0; i < 16; i++) {
      const mid = (low + high) / 2;
      if (contains(queryBounds(pointAt(mid)), c.bounds)) low = mid;
      else high = mid;
    }
    return pointAt(low);
  }

  function aheadTarget(c) {
    const ahead = predictedTarget(c);
    if (!ahead || knownDense(c) || !areas.some(area => contains(area, pointBounds(c.player)))) return null;
    if (lastAhead && (now() - lastAhead.at < 60_000 || distance(lastAhead, c.player) < 250)) return null;
    aheadTimes = aheadTimes.filter(at => now() - at < 15 * 60_000);
    if (aheadTimes.length >= MAX_AHEAD_PER_15_MIN) return null;
    if (areas.some(area => contains(area, pointBounds(ahead)))) return null;
    return ahead;
  }

  function reset() {
    generation++; areas.length = 0; views.clear(); failures.clear();
    fallbackRetries.clear();
    if (fallbackRetryTimer !== null) clearTimeout(fallbackRetryTimer);
    fallbackRetryTimer = null;
    fallbackRetryPendingKey = null;
    sample = null; heading = null; direction = null; lastAhead = null; aheadTimes = []; denseAreas.length = 0;
    clearPriorityTimer();
    delivery.reset();
  }

  function clearPriorityTimer() {
    if (priorityTimer !== null) clearTimeout(priorityTimer);
    priorityTimer = null;
  }

  function dispatch(c, retryCenter = null) {
    clearPriorityTimer();
    const nextScope = c?.uid ? `${c.uid}|${c.day}` : null;
    if (scope !== nextScope) { reset(); scope = nextScope; retryCenter = null; }
    if (!active(c)) return;
    if (running.size === 0) { pump(c, retryCenter); return; }
    counts.reused++;
    if (running.size >= 2 || (!forcePending && covered(c))) return;
    // A wide/zoomed-out viewport can exceed the server's fixed query bounds.
    // That does not make its own pending request obsolete. Reuse identical
    // views, but never reuse a result from before a player-state change.
    if ([...running].some(task => !task.preparation && task.generation === generation &&
        task.revision === c.revision && task.viewKey === c.key &&
        task.viewCenter.lat === c.center.lat && task.viewCenter.lng === c.center.lng)) return;
    // A preparation response contains no player state or pins to display.
    // Never wait for it before a necessary foreground load; the shared static
    // cache can serve a saved area while an explicit refresh is in flight.
    if ([...running].every(task => task.preparation)) { pump(c, retryCenter); return; }
    // An incoming result already covering this view should be reused. Only
    // an obsolete/off-screen request may be bypassed; never duplicate an
    // identical slow cold-cell lookup or speculate in the second slot.
    if ([...running].some(task => task.generation === generation && contains(task.bounds, c.bounds))) return;
    const oldest = Math.min(...[...running].map(task => task.at));
    const remaining = FOREGROUND_ESCAPE_MS - (now() - oldest);
    if (remaining > 0) {
      // One wake-up tied to a blocked foreground change, not a polling loop.
      priorityTimer = setTimeout(() => { priorityTimer = null; dispatch(getContext()); }, remaining);
      return;
    }
    counts.priorityBypasses++;
    pump(c, retryCenter);
  }

  function update({ force = false } = {}) {
    const c = getContext();
    const nextScope = c?.uid ? `${c.uid}|${c.day}` : null;
    if (scope !== nextScope) { reset(); scope = nextScope; }
    if (force) {
      generation++; areas.length = 0; views.clear(); failures.clear(); fallbackRetries.clear();
      if (fallbackRetryTimer !== null) clearTimeout(fallbackRetryTimer);
      fallbackRetryTimer = null; fallbackRetryPendingKey = null; forcePending = true;
    }
    if (!active(c)) { generation++; sample = null; heading = null; direction = null; clearPriorityTimer(); return; }
    motion(c);
    dispatch(c);
  }

  function pump(c, retryCenter = null, refreshOnly = false) {
    if (!active(c) || running.size >= 2) return;
    const earlyCenter = earlyDeliveryCenter(c);
    const foreground = forcePending || !covered(c) || Boolean(earlyCenter);
    if (running.size && !foreground) return;
    const useWarmCenter = foreground && !forcePending && retryCenter && contains(queryBounds(retryCenter), c.bounds);
    const center = foreground ? useWarmCenter ? retryCenter : earlyCenter || foregroundCenter(c)
      : deliveryEnabled ? delivery.target(c, direction, refreshOnly) : aheadTarget(c);
    if (!center) return;
    const key = foreground ? c.key : `ahead:${center.lat.toFixed(3)}|${center.lng.toFixed(3)}`;
    if ((failures.get(key) || 0) > now()) return;
    const token = generation, requestScope = scope, revision = c.revision;
    const bounds = queryBounds(center);
    if (fallbackRetryPendingKey === key) return;
    const shifted = foreground && distance(center, c.center) > 1;
    forcePending = false;
    const preparation = deliveryEnabled && !foreground;
    const interactive = deliveryEnabled && foreground;
    if (!foreground) {
      if (preparation) delivery.started(center, c);
      else { aheadTimes.push(now()); lastAhead = { ...c.player, at: now() }; }
      counts.ahead++;
    } else { counts.foreground++; if (shifted) counts.shiftedForeground++; }
    if (useWarmCenter) counts.warmRetries++;
    const task = { generation: token, bounds, at: now(), serial: ++serial, preparation,
      revision, viewKey: c.key, viewCenter: { ...c.center } };
    running.add(task);
    counts.maxConcurrent = Math.max(counts.maxConcurrent, running.size);
    let needsFollowUp = false, warmRetry = null, fallbackRetryRequested = false;
    void Promise.resolve().then(() => fetchPins({ latitude: center.lat, longitude: center.lng,
      ...(preparation ? { delivery: "prepare" } : interactive ? { delivery: "interactive" } : {}) }))
      .then(response => {
        const latest = getContext();
        if (preparation) {
          if (active(latest) && token === generation && requestScope === `${latest.uid}|${latest.day}`) {
            delivery.completed(response, center);
          }
          // A crop/capture revision does not invalidate static geometry, but
          // preparation must never mark the foreground player view complete.
          needsFollowUp = active(latest) && (forcePending || !covered(latest));
          return;
        }
        if (!active(latest) || token !== generation || requestScope !== `${latest.uid}|${latest.day}` ||
            revision !== latest.revision || !intersects(bounds, latest.bounds) || task.serial < appliedSerial) {
          counts.discarded++;
          if (active(latest) && revision !== latest.revision) counts.revisionDiscards++;
          else counts.obsoleteDiscards++;
          // Do not use replies from before a capture/crop mutation, reset or
          // account change. A new foreground view gets priority after completion.
          needsFollowUp = active(latest) && (forcePending || !covered(latest));
          if (active(latest) && token === generation && requestScope === `${latest.uid}|${latest.day}` &&
              task.serial >= appliedSerial && revision !== latest.revision && contains(bounds, latest.bounds)) {
            // Re-read fresh player/world state from the cell just warmed by
            // this request, rather than moving into another cold cell loop.
            warmRetry = center;
          }
          return;
        }
        if (!Array.isArray(response?.pins)) throw new Error("Pin response is unavailable.");
        const expiry = Date.parse(response.fishCycle?.expiresAt);
        if (Number.isFinite(expiry) && expiry <= now()) throw new Error("Pin response has expired.");
        if (response.mapPinsFallback === true) {
          // Keep known pins visible, but this cached subset cannot certify that
          // a newly visited area is complete. Make only one delayed retry per
          // viewport so a provider outage cannot turn into a request loop.
          apply(response, center, null);
          counts.applied++;
          counts.fallbackResponses++;
          if ((fallbackRetries.get(key) || 0) < 1) fallbackRetryRequested = true;
          else {
            fallbackRetries.delete(key);
            failures.set(key, now() + 30_000);
            onError(Object.assign(new Error("Map pins are still being refreshed."), { code: "map/pin-fallback" }));
          }
          needsFollowUp = false;
          return;
        }
        fallbackRetries.delete(key);
        failures.delete(key);
        if (interactive) delivery.observe(response, center);
        const dense = response.pins.length >= 350;
        if (dense) {
          denseAreas.unshift({ bounds, until: now() + 5 * 60_000 });
          if (denseAreas.length > 16) denseAreas.length = 16;
          if (shifted) counts.denseFallbacks++;
        }
        // A truncated, shifted result may favour pins ahead over pins near
        // the player. Merge what arrived, but do not mark that view fulfilled:
        // the follow-up must query the actual current centre, once.
        const viewKey = foreground && !(shifted && dense) ? key : null;
        apply(response, center, viewKey);
        appliedSerial = task.serial;
        counts.applied++;
        if (viewKey !== null) {
          views.add(key);
          while (views.size > 160) views.delete(views.values().next().value);
        }
        // Dense 350-pin results are truncated: never pretend they cover a whole area.
        if (!dense) {
          areas.unshift(bounds);
          if (areas.length > 64) areas.length = 64;
        }
        needsFollowUp = forcePending || !covered(latest);
      }).catch(error => {
        if ((interactive || preparation) && (error?.details?.reason === "map-delivery-disabled" ||
            /(^|\/)invalid-argument$/.test(error?.code || ""))) {
          // Old/disabled backend: fall back once to the unchanged live loader,
          // without an auth bypass or repeated unsupported requests.
          deliveryEnabled = false;
          if (foreground) { forcePending = true; needsFollowUp = true; }
          return;
        }
        if (preparation) delivery.failed(center);
        counts.failed++;
        failures.set(key, now() + 15_000);
        while (failures.size > 64) failures.delete(failures.keys().next().value);
        const latest = getContext();
        if (foreground && active(latest) && token === generation && latest.key === key) onError(error);
        needsFollowUp = active(latest) && (forcePending || latest.key !== c.key);
      }).finally(() => {
        running.delete(task);
        clearPriorityTimer();
        if (fallbackRetryRequested) {
          fallbackRetries.set(key, 1);
          while (fallbackRetries.size > 64) fallbackRetries.delete(fallbackRetries.keys().next().value);
          counts.fallbackRetries++;
          if (fallbackRetryTimer !== null) clearTimeout(fallbackRetryTimer);
          fallbackRetryPendingKey = key;
          fallbackRetryTimer = setTimeout(() => {
            fallbackRetryTimer = null;
            fallbackRetryPendingKey = null;
            const latest = getContext();
            if (fallbackRetries.get(key) !== 1) return;
            if (!active(latest) || token !== generation || requestScope !== `${latest.uid}|${latest.day}` || latest.key !== key) {
              fallbackRetries.delete(key);
              return;
            }
            dispatch(latest);
          }, Math.max(0, fallbackRetryMs));
        }
        // No endless background chaining. Only fulfil a still-uncovered current
        // view (or explicit refresh), then wait for another real movement update.
        if (needsFollowUp) dispatch(getContext(), warmRetry);
        else if (running.size) dispatch(getContext());
        else if (deliveryEnabled && delivery.target(getContext(), direction, true)) pump(getContext(), null, true);
      });
  }
  return {
    update,
    dispose() { disposed = true; reset(); },
    getDiagnostics: () => ({ ...counts, inFlight: running.size > 0, activeRequests: running.size, coverageAreas: areas.length,
      deliveryPreviewEnabled: deliveryEnabled, ...delivery.diagnostics() })
  };
}
