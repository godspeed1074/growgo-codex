import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const questStyle = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const questMock = readFileSync(new URL('./starter-quest-flow-mock.html', import.meta.url), 'utf8');
const start = source.slice(source.indexOf('async function startStarterQuestForLivePlayer('), source.indexOf('async function claimAlphaSeedBundleForLivePlayer('));
const finish = source.slice(source.indexOf('async function completeInterfaceTutorialThenStartStarterQuest('), source.indexOf('function restartNavigationGuide('));
const longPressOptions = source.slice(source.indexOf('function showNavigationGuideLongPressOptions('), source.indexOf('async function completeInterfaceTutorialThenStartStarterQuest('));
const navigationIntro = source.slice(source.indexOf('function showNavigationGuideIntro('), source.indexOf('function renderNavigationGuide('));
const intro = source.slice(source.indexOf('function showStarterQuestIntro('), source.indexOf('function initQuestUi('));
const starterPinTarget = source.slice(source.indexOf('function isStarterQuestBasePinTarget('), source.indexOf('function buildPinIcon('));
const syncStarterMapGuide = source.slice(source.indexOf('function getStarterQuestMapHighlightStorageKey('), source.indexOf('function beginStarterQuestMapGuide('));
const clearStarterMapGuide = source.slice(source.indexOf('function clearStarterQuestMapHighlight('), source.indexOf('function initQuestUi('));
test('starter quest portrait is half-size and capture halo is centered on the pin head', () => {
  assert.match(questStyle, /\.starter-quest-intro > img\s*\{[^}]*width:\s*322\.5px;[^}]*height:\s*270px;/s);
  assert.match(questStyle, /\.starter-quest-intro > img\s*\{[^}]*width:\s*195px;[^}]*height:\s*157\.5px;/s);
  // The 64×84 pin head is centered around y=32; leave the pointed tail outside
  // the ring so its visible center aligns with the white circular face.
  assert.match(questStyle, /\.base-pin-marker\.starter-quest-capture-glow::after\s*\{[^}]*inset:\s*3px 3px 22px;/s);
  assert.match(questMock, /width:\s*min\(322px, 76vw\); height:\s*min\(270px, 49vh\)/);
});
test('Bingles introduces the controls tutorial before the first navigation prompt', () => {
  let click = null;
  let guideRendered = 0;
  const element = {
    setAttribute() {},
    querySelector: () => ({ addEventListener: (_, handler) => { click = handler; } }),
    remove() {}
  };
  const context = vm.createContext({
    navigationGuideStage: 'open-menu',
    document: {
      getElementById: () => null,
      createElement: () => element,
      body: { append() {} }
    },
    renderNavigationGuide: () => { guideRendered += 1; }
  });
  vm.runInContext(navigationIntro, context);
  context.showNavigationGuideIntro();
  assert.equal(guideRendered, 0);
  click();
  assert.equal(guideRendered, 1);
});
test('the final hold options require acknowledgement before Bingles begins', async () => {
  let starterQuestRequested = 0;
  let click = null;
  const overlay = {
    setAttribute() {},
    remove() {},
    addEventListener(type, handler) { if (type === 'click') click = handler; }
  };
  const context = vm.createContext({
    navigationGuideStage: 'long-press-options',
    NAVIGATION_GUIDE_COMPLETED_STAGE: 'complete',
    saveNavigationGuideStage(stage) { context.navigationGuideStage = stage; },
    document: {
      getElementById: () => null,
      createElement: () => overlay,
      body: { appendChild() {} }
    },
    completeInterfaceTutorialThenStartStarterQuest: async () => { starterQuestRequested += 1; }
  });
  vm.runInContext(longPressOptions, context);
  context.showNavigationGuideLongPressOptions();
  assert.equal(context.navigationGuideStage, 'long-press-options');
  assert.equal(starterQuestRequested, 0);
  click({ target: { closest: selector => selector === '[data-navigation-guide-finish]' ? {} : null } });
  await Promise.resolve();
  assert.equal(context.navigationGuideStage, 'complete');
  assert.equal(starterQuestRequested, 1);
});
test('first-capture intro returns to the map while later starter steps still open their quest', () => {
  for (const status of ['active', 'completed']) {
    const saved = new Map(); let click; let opened; let removed = false; let menuOpened = status === 'active'; let questsOpened = false; let pinRedraws = 0;
    const element = { setAttribute() {}, querySelector: () => ({ addEventListener: (_, handler) => { click = handler; } }), remove() { removed = true; } };
    const context = vm.createContext({
      document: { getElementById: () => null, createElement: () => element, body: { append() {} } },
      starterQuestStatus: status, STARTER_TUTORIAL_QUEST: { id: 'first' }, STARTER_OWNERSHIP_QUEST: { id: 'second' },
      getStarterQuestChainDefinitions: () => [{ id: 'second', description: 'Next task' }], isQuestInProgress: () => true,
      escapeHtml: value => String(value || ''), sideMenu: { classList: { contains: () => menuOpened } },
      toggleMenu: () => { menuOpened = true; }, openQuests: () => { questsOpened = true; },
      trackedQuestId: null, map: null, getQuestMapCoordinates: () => null, showToast() {},
      starterQuestChain: { step: status === 'active' ? 'capture-first-base' : 'claim-first-base' },
      starterQuestStartedAt: 'run-1', starterQuestMapHighlightActive: false, starterQuestMapHighlightPlayerId: '',
      getActivePlayerId: () => 'player-1', scheduleRedrawPins: () => { pinRedraws++; },
      closeMenu: () => { menuOpened = false; },
      openQuestDetail: id => { opened = id; }, localStorage: {
        getItem: key => saved.get(key) ?? null,
        setItem: (key, value) => saved.set(key, value),
        removeItem: key => saved.delete(key)
      },
      showToast() {}, map: { invalidateSize() {} }
    });
    vm.runInContext(intro, context); context.showStarterQuestIntro('receipt');
    assert.equal(saved.size, 0); click();
    assert.equal(saved.get('receipt'), 'acknowledged'); assert.equal(removed, true);
    if (status === 'completed') {
      assert.equal(menuOpened, true); assert.equal(questsOpened, true); assert.equal(opened, 'second');
      assert.equal(pinRedraws, 0);
    } else {
      assert.equal(menuOpened, false); assert.equal(questsOpened, false); assert.equal(opened, undefined);
      assert.equal(context.trackedQuestId, 'first'); assert.equal(context.starterQuestMapHighlightActive, true);
      assert.equal(saved.get('growgo-starter-quest-map-highlight:player-1:run-1'), 'active');
      assert.equal(pinRedraws, 1);
    }
  }
});
test('starter capture glow targets only uncaptured, unowned base pins for the active player', () => {
  const context = vm.createContext({
    starterQuestMapHighlightActive: true,
    starterQuestMapHighlightPlayerId: 'player-1',
    starterQuestStatus: 'active',
    starterQuestChain: { step: 'capture-first-base' },
    getActivePlayerId: () => 'player-1'
  });
  vm.runInContext(starterPinTarget, context);
  assert.equal(context.isStarterQuestBasePinTarget({ id: 'open', type: 'base' }, false), true);
  assert.equal(context.isStarterQuestBasePinTarget({ id: 'legacy-base' }, false), true);
  assert.equal(context.isStarterQuestBasePinTarget({ id: 'owned', type: 'base', ownerId: 'someone' }, false), false);
  assert.equal(context.isStarterQuestBasePinTarget({ id: 'captured', type: 'base' }, true), false);
  assert.equal(context.isStarterQuestBasePinTarget({ id: 'water', type: 'water' }, false), false);
  context.starterQuestMapHighlightPlayerId = 'other-player';
  assert.equal(context.isStarterQuestBasePinTarget({ id: 'other-player-view', type: 'base' }, false), false);
});
test('starter map glow restores only for the acknowledged player and run, then clears', () => {
  const saved = new Map([['growgo-starter-quest-map-highlight:player-1:run-1', 'active']]);
  let playerId = 'player-1'; let redraws = 0;
  const context = vm.createContext({
    starterQuestStatus: 'active', starterQuestChain: { step: 'capture-first-base' },
    starterQuestStartedAt: 'run-1', starterQuestMapHighlightActive: false,
    starterQuestMapHighlightPlayerId: '', getActivePlayerId: () => playerId,
    localStorage: { getItem: key => saved.get(key) ?? null, removeItem: key => saved.delete(key) },
    scheduleRedrawPins: () => { redraws++; }
  });
  vm.runInContext(syncStarterMapGuide + '\n' + clearStarterMapGuide, context);
  context.syncStarterQuestMapHighlight(); assert.equal(context.starterQuestMapHighlightActive, true);
  playerId = 'player-2'; context.syncStarterQuestMapHighlight(); assert.equal(context.starterQuestMapHighlightActive, false);
  playerId = 'player-1'; context.starterQuestMapHighlightActive = true;
  context.clearStarterQuestMapHighlight();
  assert.equal(saved.has('growgo-starter-quest-map-highlight:player-1:run-1'), false);
  assert.equal(context.starterQuestMapHighlightActive, false); assert.equal(redraws, 1);
});
test('missed introduction is offered at every unfinished starter step', async () => {
  for (const step of ['claim-first-base', 'plant-two-base-pins', 'grow-and-harvest', 'craft-energy-bar']) {
    const h = harness(); h.state.quest.status = 'completed'; h.context.starterQuestChain.step = step;
    await h.start(); assert.equal(h.state.shown, 1, step);
  }
});
function harness() {
  const saved = new Map();
  const state = { status: 'completed', shown: 0, calls: 0, fail: false,
    quest: { id: 'bingles-first-base-pin', status: 'active', startedAt: 'reset-1' } };
  const bridge = {
    async startStarterQuest() { state.calls++; if (state.fail) throw Error('offline'); return { started: false, quest: state.quest }; },
    async completeInterfaceTutorial() { state.status = 'completed'; return {}; }
  };
  const context = vm.createContext({
    starterQuestStartRequested: false, interfaceTutorialCompletionRequested: false,
    STARTER_TUTORIAL_QUEST: { id: 'bingles-first-base-pin' },
    starterQuestChain: { step: 'claim-first-base' },
    getInterfaceTutorialStatusForLivePlayer: () => state.status,
    getServerGameplayBridge: () => bridge, getActivePlayerId: () => 'rubberlips-uid',
    applyStarterQuestServerResult() {}, applyServerCapturePlayerState() {}, showToast() {},
    showStarterQuestIntro(key) { state.shown++; state.introKey = key; }, console: { warn() {} },
    localStorage: { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) }
  });
  vm.runInContext(start + '\n' + finish, context);
  return { state, context, saved, start: () => context.startStarterQuestForLivePlayer(), finish: () => context.completeInterfaceTutorialThenStartStarterQuest() };
}
test('finishing navigation immediately opens an existing active starter quest', async () => {
  const h = harness(); h.state.status = 'pending';
  await h.start(); assert.equal(h.state.calls, 0);
  await h.finish(); assert.equal(h.state.status, 'completed'); assert.equal(h.state.shown, 1);
});
test('the atomic tutorial handoff opens Bingles without a second quest request', async () => {
  const h = harness();
  h.state.status = 'pending';
  h.state.quest.status = 'active';
  h.state.calls = 0;
  h.context.getServerGameplayBridge = () => ({
    async completeInterfaceTutorial() {
      h.state.status = 'completed';
      return { player: {}, quest: h.state.quest };
    },
    async startStarterQuest() {
      h.state.calls += 1;
      return { quest: h.state.quest };
    }
  });
  await h.finish();
  assert.equal(h.state.calls, 0);
  assert.equal(h.state.shown, 1);
});
test('a reset active quest opens once per run, not on every reload', async () => {
  const h = harness(); await h.start(); assert.equal(h.state.shown, 1);
  h.saved.set(h.state.introKey, 'acknowledged');
  h.context.starterQuestStartRequested = false; await h.start(); assert.equal(h.state.shown, 1);
  h.state.quest.startedAt = 'reset-2'; h.context.starterQuestStartRequested = false;
  await h.start(); assert.equal(h.state.shown, 2);
});
test('tutorial completion can recheck a previously requested quest', async () => {
  const h = harness(); h.context.starterQuestStartRequested = true;
  await h.finish(); assert.equal(h.state.calls, 1); assert.equal(h.state.shown, 1);
});
test('completed quests never reopen or replay rewards', async () => {
  const h = harness(); h.state.quest.status = 'completed';
  h.context.starterQuestChain.step = 'starter-complete';
  await h.finish(); assert.equal(h.state.shown, 0);
});
test('rendering or a legacy shown receipt does not acknowledge the introduction', async () => {
  const h = harness(); await h.start();
  assert.equal(h.saved.size, 0);
  h.saved.set(h.state.introKey, 'shown');
  h.context.starterQuestStartRequested = false;
  await h.start(); assert.equal(h.state.shown, 2);
});
test('early completed capture offers the next step without restarting the quest', async () => {
  const h = harness(); h.state.quest.status = 'completed';
  await h.start(); assert.equal(h.state.shown, 1);
  assert.equal(h.state.quest.status, 'completed');
});
test('a failed start stays retryable without displaying an unconfirmed quest', async () => {
  const h = harness(); h.state.fail = true; await h.start();
  assert.equal(h.state.shown, 0); assert.equal(h.context.starterQuestStartRequested, false);
  h.state.fail = false; await h.start(); assert.equal(h.state.shown, 1);
});
