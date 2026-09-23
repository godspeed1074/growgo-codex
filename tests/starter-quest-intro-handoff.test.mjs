import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const start = source.slice(source.indexOf('async function startStarterQuestForLivePlayer('), source.indexOf('async function claimAlphaSeedBundleForLivePlayer('));
const finish = source.slice(source.indexOf('async function completeInterfaceTutorialThenStartStarterQuest('), source.indexOf('function restartNavigationGuide('));
const longPressOptions = source.slice(source.indexOf('function showNavigationGuideLongPressOptions('), source.indexOf('async function completeInterfaceTutorialThenStartStarterQuest('));
const navigationIntro = source.slice(source.indexOf('function showNavigationGuideIntro('), source.indexOf('function renderNavigationGuide('));
const intro = source.slice(source.indexOf('function showStarterQuestIntro('), source.indexOf('function initQuestUi('));
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
test('actual intro saves acknowledgement only on click and routes completed captures forward', () => {
  for (const status of ['active', 'completed']) {
    const saved = new Map(); let click; let opened; let removed = false; let menuOpened = false; let questsOpened = false;
    const element = { setAttribute() {}, querySelector: () => ({ addEventListener: (_, handler) => { click = handler; } }), remove() { removed = true; } };
    const context = vm.createContext({
      document: { getElementById: () => null, createElement: () => element, body: { append() {} } },
      starterQuestStatus: status, STARTER_TUTORIAL_QUEST: { id: 'first' }, STARTER_OWNERSHIP_QUEST: { id: 'second' },
      getStarterQuestChainDefinitions: () => [{ id: 'second', description: 'Next task' }], isQuestInProgress: () => true,
      escapeHtml: value => String(value || ''), sideMenu: { classList: { contains: () => menuOpened } },
      toggleMenu: () => { menuOpened = true; }, openQuests: () => { questsOpened = true; },
      trackedQuestId: null, map: null, getQuestMapCoordinates: () => null, showToast() {},
      openQuestDetail: id => { opened = id; }, localStorage: { setItem: (key, value) => saved.set(key, value) }
    });
    vm.runInContext(intro, context); context.showStarterQuestIntro('receipt');
    assert.equal(saved.size, 0); click();
    assert.equal(saved.get('receipt'), 'acknowledged'); assert.equal(removed, true);
    assert.equal(menuOpened, true); assert.equal(questsOpened, true);
    if (status === 'completed') assert.equal(opened, 'second');
    else assert.equal(context.trackedQuestId, 'first');
  }
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
