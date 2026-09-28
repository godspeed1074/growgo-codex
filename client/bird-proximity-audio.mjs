// Local-only cue: reuse existing GPS and bird state, never poll the server.
export const BIRD_ALERT_RADIUS_METRES = 1000;
export const BIRD_ALERT_INTERVAL_MS = 60000;
export const BIRD_ALERT_SOUND_URL = new URL("../assets/birds/dove-nearby-hey-v1.m4a", import.meta.url).href;
export const BIRD_ALERT_FALLBACK_URL = new URL("../assets/birds/dove-nearby-hey-v1.wav", import.meta.url).href;

export function birdDistanceMetres(position, bird) {
  const lat = position?.latitude, lng = position?.longitude;
  if (![lat, lng, bird?.lat, bird?.lng].every(Number.isFinite)
      || Math.abs(lat) > 90 || Math.abs(bird.lat) > 90
      || Math.abs(lng) > 180 || Math.abs(bird.lng) > 180) return Infinity;
  const rad = Math.PI / 180;
  const a = Math.sin((bird.lat - lat) * rad / 2) ** 2
    + Math.cos(lat * rad) * Math.cos(bird.lat * rad) * Math.sin((bird.lng - lng) * rad / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

export function createBirdProximityAudio({ getPosition, getVolume, getAudioContext, unlockAudio, isCurrent,
  document: doc = globalThis.document, window: win = globalThis.window,
  now = Date.now, setInterval: startTimer = globalThis.setInterval, clearInterval: clearTimer = globalThis.clearInterval,
  fetch: fetchAsset = globalThis.fetch }) {
  let bird = null, stopped = false, pending = false, bufferPromise = null, active = null;
  let lastPlayedAt = -Infinity, retryAfter = 0, generation = 0, pageHidden = false;
  const volume = () => Math.max(0, Math.min(1, Number(getVolume()) || 0));
  function eligible() {
    if (stopped || pageHidden || !bird || !isCurrent() || doc.visibilityState === "hidden" || volume() <= 0) return false;
    const expiry = typeof bird.expiresAt === "number" ? bird.expiresAt : Date.parse(bird.expiresAt);
    if (!Number.isFinite(expiry) || expiry <= now()) return false;
    const position = getPosition();
    if (!Number.isFinite(position?.accuracyMetres) || position.accuracyMetres < 0 || position.accuracyMetres > 100) return false;
    return birdDistanceMetres(position, bird) <= BIRD_ALERT_RADIUS_METRES;
  }
  function silence() {
    if (!active) return;
    try { active.source.stop(); } catch { /* It may already have ended. */ }
    active.source.disconnect(); active.gain.disconnect(); active = null;
  }
  async function check() {
    // Sound must never make map, quest or capture interaction fail.
    try {
      if (!eligible()) { silence(); return; }
      if (active) active.gain.gain.value = volume();
      if (pending || now() < retryAfter || now() - lastPlayedAt < BIRD_ALERT_INTERVAL_MS) return;
      // Do not create/resume a context from a background timer. Mobile browsers
      // require the existing gameplay context to be unlocked by a real tap.
      const context = getAudioContext();
      if (!context || context.state !== "running") return;
      pending = true;
      const requestedGeneration = generation;
      try {
        if (!bufferPromise) {
          bufferPromise = Promise.resolve().then(async () => {
            // Some browsers cannot decode AAC/M4A. Download the PCM copy of
            // this same clip only if needed, then reuse the decoded buffer.
            for (const url of [BIRD_ALERT_SOUND_URL, BIRD_ALERT_FALLBACK_URL]) {
              try {
                const response = await fetchAsset(url, { cache: "force-cache" });
                if (!response.ok) continue;
                return await context.decodeAudioData(await response.arrayBuffer());
              } catch { /* Try the compatible copy before giving up silently. */ }
            }
            throw new Error("Bird sound unavailable");
          }).catch(error => { bufferPromise = null; throw error; });
        }
        const buffer = await bufferPromise;
        if (requestedGeneration !== generation || !eligible() || context.state !== "running") return;
        silence();
        const source = context.createBufferSource(), gain = context.createGain();
        source.buffer = buffer; source.loop = false; gain.gain.value = volume();
        source.connect(gain).connect(context.destination);
        active = { source, gain };
        source.onended = () => { source.disconnect(); gain.disconnect(); if (active?.source === source) active = null; };
        source.start(); lastPlayedAt = now();
      } catch { silence(); retryAfter = now() + 10000; }
      finally { pending = false; }
    } catch { silence(); }
  }
  function unlock(event) {
    if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
    try {
      if (stopped || pageHidden || doc.visibilityState === "hidden" || !isCurrent() || volume() <= 0) return;
      unlockAudio();
      const context = getAudioContext();
      // A phone can leave the shared audio session interrupted after locking,
      // changing apps or an incoming call. Resume on this gesture, never on the
      // minute timer, and recheck eligibility when the asynchronous resume ends.
      if (["suspended", "interrupted"].includes(context?.state) && typeof context.resume === "function") {
        Promise.resolve(context.resume()).then(() => check()).catch(() => {});
      }
    } catch { /* Optional audio only. */ }
    void check();
  }
  const onChange = event => {
    // Recheck after settings handlers too: the gesture enabling sound occurs
    // before its new volume value is available to capture-phase listeners.
    if (event && ["click", "input"].includes(event.type)) unlock(event);
    void check();
  };
  const onHide = () => { pageHidden = true; silence(); };
  const onShow = () => { pageHidden = false; void check(); };
  // Map/menu controls intentionally stop bubbling to prevent accidental
  // captures or dismissal. Listen before those handlers; never prevent or
  // stop the gesture ourselves. Touch releases unlock audio on mobile too.
  const gestures = ["pointerdown", "pointerup", "touchend", "click", "keydown"];
  for (const type of gestures) doc.addEventListener(type, unlock, { capture: true, passive: true });
  doc.addEventListener("visibilitychange", onChange);
  // Existing settings mutate their values in click/input handlers. Recheck on
  // bubbling events so turning sounds off also stops a currently playing cue.
  doc.addEventListener("click", onChange); doc.addEventListener("input", onChange);
  win.addEventListener("pagehide", onHide); win.addEventListener("pageshow", onShow);
  const timer = startTimer(onChange, 1000);
  return Object.freeze({
    setBird(next) {
      if (stopped) return;
      if (bird?.id !== next?.id) { generation++; silence(); }
      bird = next ? { ...next } : null;
      // Keep the minute cooldown across map refreshes, exits/re-entries and
      // replacement birds; never build up missed sounds in the background.
      void check();
    },
    check,
    stop() {
      stopped = true; bird = null; generation++; clearTimer(timer); silence();
      for (const type of gestures) doc.removeEventListener(type, unlock, { capture: true });
      doc.removeEventListener("visibilitychange", onChange);
      doc.removeEventListener("click", onChange); doc.removeEventListener("input", onChange);
      win.removeEventListener("pagehide", onHide); win.removeEventListener("pageshow", onShow);
    }
  });
}
