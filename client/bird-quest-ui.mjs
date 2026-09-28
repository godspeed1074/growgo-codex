// Optional, account-scoped pilot. This module never alters capture eligibility.
import { createBirdProximityAudio } from "./bird-proximity-audio.mjs?v=bird-mobile-audio-unlock-20260912";
import { installLeonardQuestUI } from './leonard-quest-ui.mjs';

export function installBirdQuestUI({ uid, bridge, host }) {
  if (!host || !bridge?.birdQuests) throw new Error("Bird quest UI host is not ready.");
  let stopped = false, state = null, busy = false, syncing = false, timer = null, dialog = null;
  let nearbyBusy = false, nearbyTimer = null, nearbyBird = null, lastNearbyAt = 0, removeMapListener = null;
  let birdhouseView = 'entry';
  let selectedEarnedBird = null;
  let nearbyBirds = [];
  let leonard=null;
  const panels = [document.getElementById("birdQuestPilotPanel")].filter(Boolean);
  const style = document.createElement("link"); style.rel = "stylesheet"; style.href = "assets/ui/bird-quest-popup.css?v=animated-dove-20260912"; document.head.append(style);
  const collection = document.getElementById("collectionsScreen");
  const birdhouse = document.createElement("div"); birdhouse.className = "gg-bird-panel"; birdhouse.hidden = true;
  collection?.append(birdhouse); panels.push(birdhouse);
  const el = (tag, text, css) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (css) node.className = css; return node; };
  const current = () => !stopped && bridge.isActive() && bridge.getPlayerId() === uid;
  const birdAudio = host.audioPosition && host.audioVolume && host.audioContext && host.unlockAudio
    ? createBirdProximityAudio({ getPosition: () => host.audioPosition(), getVolume: () => host.audioVolume(),
        getAudioContext: () => host.audioContext(), unlockAudio: () => host.unlockAudio(), isCurrent: current }) : null;
  function drawNearbyBird() {
    if (host.showBirds) {
      const visits = nearbyBirds.filter(b => b.expiresAt > Date.now());
      host.showBirds(visits.map(b => ({ ...b.landing, id: b.id, expiresAt: b.expiresAt })), id => void openOffer(id));
      birdAudio?.setBird(visits.length ? { ...visits[0].landing, id: visits[0].id, expiresAt: visits[0].expiresAt } : null);
      return;
    }
    const landing = nearbyBird ? { ...nearbyBird.landing, id: nearbyBird.id, expiresAt: nearbyBird.expiresAt } : null;
    host.showBird(landing, () => void openOffer(nearbyBird?.id));
    birdAudio?.setBird(landing);
  }
  const call = async payload => { if (!current()) throw new Error("Please reconnect to your own account."); const result = await bridge.birdQuests(payload); if (!current()) throw new Error("Account changed."); return result; };
  const fail = error => { if (current()) host.toast("Bird quest", error?.message || "Please try again. Your progress is saved."); };
  const key = () => `growgo-bird-action-outbox:${uid}:${state?.run?.id || "none"}`;
  function outbox() { try { return JSON.parse(localStorage.getItem(key()) || "[]"); } catch { return []; } }
  function saveBox(entries) { localStorage.setItem(key(), JSON.stringify(entries)); }
  const button = (text, action, css = "gg-bird-primary") => { const b = el("button", text, css); b.type = "button"; b.addEventListener("click", action); return b; };
  function acceptState(result) {
    state = result;
    if(result?.leonardAvailable&&bridge.leonardQuest&&!leonard&&current()){
      leonard=installLeonardQuestUI({uid,bridge,host});globalThis.__GROWGO_LEONARD_UI__=leonard;
    }
    if (result?.player || result?.inventory || result?.cardCounts) host.applyRewards(result);
    render();
    // Shared-map markers come from the server's nearby response, never from
    // another player's private offer or a locally invented landing.
  }
  function render() {
    for (const panel of panels) {
      panel.hidden = !state?.eligible || (panel === birdhouse && !state.bird && !state.canDeploy && !state.earnedBirds?.length); panel.className = "gg-bird-panel"; panel.replaceChildren();
      if (panel.hidden) continue;
      if (panel === birdhouse) {
        const navigate = view => { birdhouseView = view; render(); };
        if (birdhouseView === 'entry') {
          const entry = button('', () => navigate('list'), 'gg-birdhouse-entry');
          entry.setAttribute('aria-label', 'Open Birdhouse');
          const art = el('img'); art.src = 'assets/ui/birdhouse-approved-v1.png'; art.alt = 'Birdhouse';
          entry.append(art); panel.append(entry); continue;
        }
        panel.append(button(birdhouseView === 'detail' ? 'Back to birds' : 'Back to Collections',
          () => navigate(birdhouseView === 'detail' ? 'list' : 'entry'), 'gg-bird-text'));
        if (birdhouseView === 'list') {
          panel.append(el('h2', 'Birdhouse'));
          if (state.bird) {
            const row = button('', () => { selectedEarnedBird = null; navigate('detail'); }, 'gg-birdhouse-row');
            const art = el('img'); art.src = 'assets/birds/dove-quest-portrait.png'; art.alt = '';
            const label = el('span', state.bird.name || 'Test Dove');
            label.append(el('small', `Level ${state.bird.level || 1} · ${state.deployment ? 'Deployed' : state.waitingDeployment ? 'Finding a plot' : 'Not deployed'}`));
            row.append(art, label); panel.append(row);
          } else if (!state.earnedBirds?.length) {
            panel.append(el('p', 'No birds in your Birdhouse yet.'));
            if (state.canDeploy) panel.append(button('Claim your test dove', () => void perform(async () => acceptState(await call({ action: 'claim-test-dove' })))));
          }
          for (const bird of state.earnedBirds || []) {
            const row = button('', () => { selectedEarnedBird = bird.id; navigate('detail'); }, 'gg-birdhouse-row');
            const art = el('img'); art.src = 'assets/birds/dove-quest-portrait.png'; art.alt = '';
            const label = el('span', bird.name); label.append(el('small', `Level ${bird.level} · Quest companion`));
            row.append(art, label); panel.append(row);
          }
          for (const b of panel.querySelectorAll('button')) b.disabled = busy;
          continue;
        }
        if (selectedEarnedBird) {
          const bird = state.earnedBirds?.find(b => b.id === selectedEarnedBird);
          if (bird) {
            panel.append(el('h2', bird.name), el('p', `Level ${bird.level} · ${bird.xp} XP · ${bird.questsCompleted} quests completed`), el('p', bird.status));
            if (bird.canDeploy) {
              const visit = bird.deployment || bird.waitingDeployment;
              if (bird.deployment) panel.append(button('Show dove on map', () => host.focusBird?.(bird.deployment.landing)));
              panel.append(button(visit ? 'Recall dove' : 'Deploy dove to a planted plot', () => void perform(async () => {
                acceptState(await call({ action: visit ? 'recall' : 'deploy', birdId: bird.id,
                  ...(visit ? { deploymentId: visit.id } : {}) }));
                await refreshNearby(true);
              })));
            }
            for (const b of panel.querySelectorAll('button')) b.disabled = busy;
          } else panel.append(el('p', 'This bird is no longer available. Return to your birds.'));
          continue;
        }
      }
      const heading = el("div", undefined, "gg-bird-panel-heading");
      const image = el("img"); image.src = "assets/birds/dove-quest-portrait.png"; image.alt = "";
      heading.append(image, el("strong", state.bird || state.canDeploy ? "Birdhouse · Test Dove" : "Bird quests")); panel.append(heading);
      if (!state.bird && state.canDeploy) { panel.append(button("Claim your test dove", () => void perform(async () => acceptState(await call({ action: "claim-test-dove" }))))); continue; }
      if (state.bird) {
        panel.append(el("p", `Level 1 · ${state.bird.xp} XP · ${state.bird.questsCompleted} quests completed`));
        const d = state.deployment, waiting = state.waitingDeployment;
        panel.append(el("p", d ? `Deployed · ${d.landing.lat.toFixed(5)}, ${d.landing.lng.toFixed(5)}`
          : waiting ? "Finding another planted plot · retries automatically" : "Not deployed"));
        if (d || waiting) {
          if (d) panel.append(button("Show dove on map", () => host.focusBird?.(d.landing)));
          panel.append(button("Recall dove", () => void perform(async () => {
            acceptState(await call({ action: "recall", deploymentId: (d || waiting).id })); await refreshNearby(true);
          }), "gg-bird-text"));
        } else {
          panel.append(el("p", "A random eligible planted plot, anywhere in the world."));
          panel.append(button("Deploy dove to a planted plot", () => void perform(async () => {
            acceptState(await call({ action: "deploy" }));
            if (state.deployment) {
              nearbyBird = state.deployment; nearbyBirds = [...nearbyBirds.filter(b => b.birdId !== nearbyBird.birdId), nearbyBird]; drawNearbyBird();
              host.toast("Dove deployed", "Your dove has landed on a planted plot. Use Show dove on map to find it.");
            }
            await refreshNearby(true);
          })));
        }
        if (state.pendingMailCount) panel.append(el("p", `${state.pendingMailCount} owner reward delivery saved · mailbox collection is coming next.`));
      }
      if (state.run) {
        const run = state.run, q = run.definition;
        panel.append(el("strong", q.title), el("p", `${q.label} · ${run.seen.length} / ${q.target}`));
        const progress = el("progress"); progress.max = q.target; progress.value = run.seen.length; progress.setAttribute("aria-label", q.label); panel.append(progress);
        panel.append(el("p", "100 points · 100 XP · 2 T1 resources · 2 T1 seeds · 10% card chance"));
        panel.append(button(run.status === "reward-pending" ? "Collect quest reward" : "Refresh quest progress", () => void sync()));
      } else if (state.offer) panel.append(button("View quest choices", () => void openOffer()));
      else if (!state.bird) panel.append(el("p", "Tap a visiting dove on a planted plot to choose a quest."));
      panel.append(button("Refresh birds", () => void perform(async () => { acceptState(await call({ action: "snapshot" })); await refreshNearby(true); }), "gg-bird-text"));
      panel.append(el("small", "Shared alpha trial · one active quest at a time"));
      for (const b of panel.querySelectorAll("button")) b.disabled = busy;
    }
  }
  async function perform(task) {
    if (busy || !current()) return;
    busy = true; render();
    try { await task(); } catch (error) { fail(error); } finally { busy = false; if (current()) render(); }
  }
  async function openOffer(deploymentId) {
    await perform(async () => {
      if (state?.run) { host.openQuests(); return; }
      if (deploymentId) acceptState(await call({ action: "offer", deploymentId, ...host.context() }));
      if (state.offer) showOffer();
    });
  }
  function closeDialog() { if (dialog) { dialog.close(); dialog.remove(); dialog = null; } }
  function showOffer() {
    closeDialog(); const offer = state.offer;
    dialog = el("dialog", undefined, "gg-bird-dialog"); dialog.setAttribute("aria-labelledby", "gg-bird-title");
    const popup = el("div", undefined, "gg-bird-popup");
    const header = el("header", undefined, "gg-bird-header");
    const art = el("img"); art.src = "assets/birds/dove-quest-portrait.png"; art.alt = "";
    const titles = el("div"); titles.append(el("small", "A little help · Level 1 dove")); const title = el("h2", "BIRD QUESTS"); title.id = "gg-bird-title"; titles.append(title);
    const close = button("×", closeDialog, "gg-bird-close"); close.setAttribute("aria-label", "Close quest choices"); header.append(art, titles, close);
    const scroll = el("div", undefined, "gg-bird-scroll"); scroll.append(el("p", "Choose one adventure to help the dove."));
    const choices = el("fieldset"); const legend = el("legend", "Choose one quest", "gg-bird-sr"); choices.append(legend);
    let selected = null;
    const accept = button("Choose a quest above", () => void choose("accept")); accept.disabled = true;
    const images = { base: "pin-base-blue.png", harvest: "assets/map/crop-wheat-harvest-yellow-pin-v1.png", park: "assets/map/poi-park-pin-v1.png", church: "assets/map/poi-church-pin-v2.png", water: "pin-water-blue.png", craft: "assets/crafting/flour.png" };
    for (const q of offer.quests) {
      const row = el("label", undefined, "gg-bird-choice"); const img = el("img"); img.src = images[q.kind]; img.alt = "";
      const copy = el("span"); copy.append(el("strong", q.title), el("span", q.label), el("small", q.kind === "craft" ? "Uses 2 Wheat · you keep the Flour" : "Suitable targets verified within 1 km"));
      const input = el("input"); input.type = "radio"; input.name = "bird-quest"; input.value = q.id;
      input.addEventListener("change", () => { selected = q.id; accept.disabled = false; accept.textContent = "Accept quest"; });
      row.append(img, copy, input); choices.append(row);
    }
    scroll.append(choices);
    const rewards = el("section", undefined, "gg-bird-rewards"); rewards.append(el("h3", "COMPLETION REWARDS"));
    const stats = el("div", undefined, "gg-bird-reward-stats");
    for (const label of ["Points", "XP"]) { const block = el("div"); block.append(el("strong", "100"), el("span", label)); stats.append(block); }
    rewards.append(stats, el("p", "2 random T1 resources · 2 random T1 seeds"), el("strong", "10% chance of a random card"));
    scroll.append(rewards, el("p", "No time limit. Progress starts after you accept.", "gg-bird-note"));
    const footer = el("footer"); const reject = button("Reject these quests", () => void choose("reject"), "gg-bird-text"); footer.append(accept, reject);
    popup.append(header, scroll, footer); dialog.append(popup); document.body.append(dialog);
    const activeDialog = dialog;
    async function choose(action) {
      if (busy || (action === "accept" && !selected)) return;
      await perform(async () => {
        accept.disabled = true; reject.disabled = true;
        try {
          const context = host.context();
          const result = await call({ action, offerId: offer.id, ...(selected && action === "accept" ? { questId: selected } : {}), latitude: context.latitude, longitude: context.longitude, accuracyMetres: context.accuracyMetres });
          closeDialog(); acceptState(result);
          if (action === "accept") { nearbyBirds = nearbyBirds.filter(b => b.id !== offer.deploymentId); nearbyBird = nearbyBirds[0] || null; drawNearbyBird(); host.toast("Quest accepted", "The dove has flown off. Follow your progress in Quests."); host.openQuests(); }
          await refreshNearby(true);
        } finally { if (activeDialog.isConnected) { accept.disabled = !selected; reject.disabled = false; } }
      });
    }
    activeDialog.addEventListener("cancel", e => { e.preventDefault(); closeDialog(); });
    let start = null;
    const outside = e => { const b = activeDialog.getBoundingClientRect(); return e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom; };
    activeDialog.addEventListener("pointerdown", e => { start = outside(e) ? { id: e.pointerId, x: e.clientX, y: e.clientY } : null; });
    activeDialog.addEventListener("pointercancel", () => { start = null; });
    activeDialog.addEventListener("pointerup", e => { if (start?.id === e.pointerId && outside(e) && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 12) closeDialog(); start = null; });
    activeDialog.showModal();
  }
  async function sync() {
    if (syncing || !current() || !state?.run) return;
    syncing = true;
    const runId = state.run.id, boxKey = key();
    try {
      const proofs = outbox().slice(0, 30);
      if (proofs.length) {
        const result = await call({ action: "sync", runId, receipts: proofs });
        // Remove only sent receipts, preserving captures that arrived in flight.
        const sent = new Set(result.resolvedReceipts || []);
        const remaining = JSON.parse(localStorage.getItem(boxKey) || "[]").filter(p => !sent.has(`${p.kind}:${p.id}`));
        localStorage.setItem(boxKey, JSON.stringify(remaining)); acceptState(result);
      } else acceptState(await call({ action: "snapshot" }));
      if (state?.run?.id === runId && state.run.status === "reward-pending") {
        const result = await call({ action: "claim", runId }); acceptState(result);
        localStorage.removeItem(boxKey);
        if (result.claimedNow) { host.recordCompletion(result.reward); host.toast("Dove quest complete!", "+100 points, +100 XP, 2 resources and 2 seeds."); }
      }
    } catch (error) { fail(error); }
    finally { syncing = false; }
  }
  function recordReceipt(proof, schedule = true) {
    if (!current() || state?.run?.status !== "active" || typeof proof?.id !== "string") return;
    const kind = state.run.definition.kind;
    if ((kind === "craft" && proof.kind !== "craft") || (["park", "church"].includes(kind) && proof.kind !== "poi") || (["base", "water", "harvest"].includes(kind) && !["capture", "beam"].includes(proof.kind))) return;
    const box = outbox(); if (!box.some(p => p.kind === proof.kind && p.id === proof.id)) { box.push(proof); saveBox(box); }
    if (schedule && !timer) timer = setTimeout(() => { timer = null; void sync(); }, 800);
  }
  async function refreshNearby(force = false) {
    if (!current() || nearbyBusy || document.visibilityState === "hidden" || !navigator.onLine) return;
    if (!force && Date.now() - lastNearbyAt < 30000) return;
    let context;
    try { context = host.context(); } catch { return; } // GPS can arrive after sign-in.
    nearbyBusy = true; lastNearbyAt = Date.now();
    try {
      const { latitude, longitude, accuracyMetres } = context;
      const result = await call({ action: "nearby", latitude, longitude, accuracyMetres });
      // The server also returns the owner's own active deployment outside the
      // nearby radius. Keep drawing it so Birdhouse → Show on map actually
      // reveals the bird. This never changes GPS checks for quest acceptance.
      nearbyBirds = [...new Map([...(result.birds || []), ...(result.ownDeployments || []), ...(result.ownDeployment ? [result.ownDeployment] : [])].map(b => [b.id, b])).values()];
      nearbyBird = nearbyBirds[0] || null;
      if (state && Object.hasOwn(result, "ownDeployment")) {
        state.deployment = result.ownDeployment;
        state.waitingDeployment = result.ownWaitingDeployment || null;
        render();
      }
      drawNearbyBird();
    } catch { /* A decoration failure must never interrupt map/capture gameplay. */ }
    finally { nearbyBusy = false; }
  }
  function scheduleNearby() {
    clearTimeout(nearbyTimer);
    if (stopped) return;
    nearbyTimer = setTimeout(async () => {
      const expired = Boolean(nearbyBird && nearbyBird.expiresAt <= Date.now()) || nearbyBirds.some(b => b.expiresAt <= Date.now());
      if (expired) { nearbyBirds = nearbyBirds.filter(b => b.expiresAt > Date.now()); nearbyBird = nearbyBirds[0] || null; drawNearbyBird(); }
      // Fetch the next landing on this update instead of dropping into the
      // two-minute no-bird interval after a recent, throttled map refresh.
      await refreshNearby(expired); scheduleNearby();
    }, nearbyBird ? 30000 : 120000);
  }
  const resume = () => { if (current() && document.visibilityState !== "hidden") { void sync(); void refreshNearby(); } };
  window.addEventListener("online", resume); document.addEventListener("visibilitychange", resume);
  removeMapListener = host.onMapChange?.(() => void refreshNearby());
  void perform(async () => {
    acceptState(await call({ action: "snapshot" }));
    if (state.eligible && state.canDeploy && !state.bird) acceptState(await call({ action: "claim-test-dove" }));
    await sync(); await refreshNearby(true); scheduleNearby();
  });
  return { uid, recordReceipt, refreshNearby, refreshBirdhouse:()=>perform(async()=>acceptState(await call({action:'snapshot'}))), stop() { stopped = true; leonard?.stop();if(globalThis.__GROWGO_LEONARD_UI__===leonard)delete globalThis.__GROWGO_LEONARD_UI__; birdAudio?.stop(); clearTimeout(timer); clearTimeout(nearbyTimer); removeMapListener?.(); closeDialog(); host.showBird(null); for (const panel of panels) panel.hidden = true; birdhouse.remove(); style.remove(); window.removeEventListener("online", resume); document.removeEventListener("visibilitychange", resume); delete globalThis.__GROWGO_BIRD_QUEST_UI__; } };
}
