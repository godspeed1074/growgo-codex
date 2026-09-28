// Static area readiness only. Never cache captures, crops, fish or player data.
const M = 111_195;
const DAY = 86_400_000;
const contains = (a, b) => b.south >= a.south && b.north <= a.north && b.west >= a.west && b.east <= a.east;
const pointOK = p => p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) < 85 && Math.abs(p.lng) <= 180;
const distance = (a, b) => Math.hypot((b.lat - a.lat) * M, (b.lng - a.lng) * M * Math.cos(a.lat * Math.PI / 180));
function viewport(p) {
  const lng = Math.min(0.018, 0.006 / Math.max(0.25, Math.cos(p.lat * Math.PI / 180)));
  return { south: p.lat - 0.006, north: p.lat + 0.006, west: p.lng - lng, east: p.lng + lng };
}

export function isMapDeliveryPreviewEnabled(href) {
  try {
    const u = new URL(href);
    return u.searchParams.get("mapDelivery") === "1" &&
      (u.protocol === "file:" || ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname));
  } catch { return false; }
}

export function createMapAreaDelivery({ now = Date.now } = {}) {
  const areas = new Map(), failures = new Map();
  let attempts = [], last = null, refresh = null;
  const counts = { prepared: 0, prepareFailed: 0, refreshes: 0, budgetLimited: 0 };

  function observe(response, center, displayed = true) {
    const d = response?.mapDelivery;
    const b = d?.coverage;
    if (!pointOK(center) || d?.version !== 1 || !/^v1-\d+-\d+$/.test(d.cellKey) ||
        !b || ![b.south, b.north, b.west, b.east].every(Number.isFinite) ||
        b.south < -90 || b.north > 90 || b.west < -180 || b.east > 180 ||
        !contains(b, viewport(center)) || !Number.isFinite(d.fetchedAt) || d.fetchedAt > now() + 60_000 ||
        !Number.isFinite(d.expiresAt) || d.expiresAt <= now() || d.expiresAt > d.fetchedAt + 30 * DAY ||
        !Number.isFinite(d.retryAfter) || typeof d.refreshNeeded !== "boolean") return false;
    const latIndex = Math.min(44999, Math.max(0, Math.floor((center.lat + 90) / 0.004)));
    const lngIndex = Math.min(89999, Math.max(0, Math.floor((center.lng + 180) / 0.004)));
    if (d.cellKey !== `v1-${latIndex}-${lngIndex}`) return false;
    // Do not let a late older response replace a fresher readiness record.
    const old = areas.get(d.cellKey);
    if (old && old.fetchedAt > d.fetchedAt) return true;
    areas.delete(d.cellKey);
    areas.set(d.cellKey, { ...d, center: { ...center }, displayed: displayed || old?.displayed === true,
      readyUntil: Math.min(d.expiresAt, d.fetchedAt + DAY) });
    while (areas.size > 24) areas.delete(areas.keys().next().value);
    if (d.refreshNeeded && d.retryAfter <= now()) refresh = { ...center, reason: "refresh", cellKey: d.cellKey };
    else if (refresh?.cellKey === d.cellKey) refresh = null;
    return true;
  }

  function target(c, direction, refreshOnly = false) {
    if (!c?.visible || !c.online || !c.uid || !c.enabled || c.zoom < 15 || !pointOK(c.center)) return null;
    attempts = attempts.filter(at => now() - at < 15 * 60_000);
    if (attempts.length >= 30) { counts.budgetLimited++; return null; }
    if (last && now() - last.at < 20_000) return null;
    const allowed = p => (failures.get(`${p.lat.toFixed(4)}|${p.lng.toFixed(4)}`) ?? 0) <= now();
    // Only refresh an area relevant to the current view; never roam through a
    // queue of old regions after a map jump. Its map pins are already visible.
    if (refresh && contains(viewport(refresh), c.bounds) && allowed(refresh)) return refresh;
    if (refreshOnly) return null;
    if (!direction || now() - direction.at > 30_000 || !pointOK(c.player) ||
        !Number.isFinite(c.player.accuracy) || c.player.accuracy < 0 || c.player.accuracy > 50 ||
        distance(c.player, c.center) > 200 || (last && distance(last.player, c.player) < 400)) return null;
    const forward = p => (p.lat - c.player.lat) * M * direction.y +
      (p.lng - c.player.lng) * M * Math.cos(c.player.lat * Math.PI / 180) * direction.x;
    // Keep one useful prepared area ahead, rather than spending the budget on
    // intermediate cells while that area has not even reached the screen.
    if ([...areas.values()].some(a => !a.displayed && a.readyUntil > now() &&
      forward(a.center) > 0 && distance(a.center, c.player) <= 2200)) return null;
    const anchors = [...areas.values()].filter(a => a.displayed && a.readyUntil > now() && contains(viewport(a.center), c.bounds));
    const anchorLead = anchors.length ? Math.max(...anchors.map(a => forward(a.center))) + 1000 : 0;
    const lead = Math.min(2000, Math.max(600, direction.speed * 40, anchorLead));
    const p = { lat: c.player.lat + direction.y * lead / M,
      lng: c.player.lng + direction.x * lead / (M * Math.cos(c.player.lat * Math.PI / 180)), reason: "ahead" };
    if (!pointOK(p) || !allowed(p)) return null;
    if ([...areas.values()].some(a => a.readyUntil > now() && contains(a.coverage, viewport(p)))) return null;
    return p;
  }

  return {
    observe, target,
    centerForView(c) {
      // Reuse the actual prepared query centre. Arbitrarily shifting it into
      // the next cell could turn a prepared neighbourhood into another miss.
      return [...areas.values()].filter(a => a.readyUntil > now() && contains(viewport(a.center), c.bounds))
        .sort((a, b) => distance(a.center, c.center) - distance(b.center, c.center))[0]?.center ?? null;
    },
    started(p, c) {
      attempts.push(now()); last = { at: now(), player: { ...(pointOK(c.player) ? c.player : c.center) } };
      if (p.reason === "refresh") { counts.refreshes++; refresh = null; }
    },
    completed(response, p) {
      if (observe(response, p, false) && response.mapDelivery.refreshNeeded === false) { counts.prepared++; return true; }
      this.failed(p); return false;
    },
    failed(p) {
      counts.prepareFailed++;
      failures.set(`${p.lat.toFixed(4)}|${p.lng.toFixed(4)}`, now() + 60_000);
      while (failures.size > 30) failures.delete(failures.keys().next().value);
    },
    reset() { areas.clear(); failures.clear(); attempts = []; last = null; refresh = null; },
    diagnostics: () => ({ ...counts, readyAreas: [...areas.values()].filter(a => a.readyUntil > now()).length,
      preparationAttempts: attempts.filter(at => now() - at < 15 * 60_000).length })
  };
}
