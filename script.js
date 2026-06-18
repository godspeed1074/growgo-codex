/* ============================= */
/* GrowGo script.js */
/* Map + Stats + Leaders + Crafting */
/* Performance-pass replacement */
/* ============================= */

const DEFAULT_CENTER = [-38.4537, 145.2381];

const BASE_PIN_VALUE = 5;
const WATER_PIN_VALUE = 10;
const WATER_PIN_RESOURCE_DROP_CHANCE = 0.25;
const WATER_PIN_BLUE_FISH_CHANCE = 1 / 250;
const WATER_PIN_SALMON_CHANCE = 1 / 1000;
const WATER_PIN_FISH_LIFETIME_MS = 4 * 60 * 60 * 1000;
const POINTS_GROWTH_HOURS = 168;
const CAPTURE_RADIUS_METERS = 100;
const WATER_PIN_DISTANCE_METERS = 50;
const BASE_PIN_PURCHASE_COST = 100;
const PIN_OWNER_CAPTURE_REWARD = 5;
const PIN_LONG_PRESS_MS = 500;
const PIN_PLANT_STAGE_HOURS = 168;
const BASE_PIN_MAX_LEVEL = 4;

const WATER_PIN_FISH_TYPES = {
  blue: {
    itemId: "fish",
    label: "Blue Fish",
    icon: "🐟",
    xp: 50,
    className: "blue"
  },
  salmon: {
    itemId: "salmon",
    label: "Salmon",
    icon: "🐟",
    xp: 200,
    className: "salmon"
  }
};

const PIN_SPACING_METERS = 46;
const MIN_PIN_SEPARATION_METERS = 46;
const MAX_VISIBLE_PINS = 500;

const MIN_FETCH_ZOOM = 15;
const PIN_FETCH_DEBOUNCE_MS = 450;
const ROAD_FETCH_PADDING = 0.0035;
const MAX_PINS_PER_FETCH = 900;

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const TRUSTED_TIME_URL = "https://www.timeapi.io/api/Time/current/zone?timeZone=UTC";

const PIN_STORAGE_KEY = "growgo-pins";
const SERVER_STARTED_AT_KEY = "growgo-server-started-at";
const AVATAR_STORAGE_KEY = "growgo-avatar";
const STATS_STORAGE_KEY = "growgo-stats";
const CRAFTING_STORAGE_KEY = "growgo-crafting";
const MARKET_STORAGE_KEY = "growgo-market";
const MARKET_LONG_PRESS_MS = 550;

const PLAYER_STORAGE_KEY = "growgo-player-state";
const GROWGO_PLAYER_ID_KEY = "growgo-player-public-id";
const GROWGO_PROFILE_CARD_MODE_KEY = "growgo-profile-card-mode";
const DEFAULT_PLAYER_NAME = "rubberlips";
const PROGRESSION_RESET_KEY = "growgo-progression-reset-version";
const PROGRESSION_RESET_VERSION = "rubberlips-reset-1";
const LOCAL_BACKUP_VERSION = 1;

resetPlayerProgressionOnce();

function resetPlayerProgressionOnce() {
  try {
    if (localStorage.getItem(PROGRESSION_RESET_KEY) === PROGRESSION_RESET_VERSION) {
      return;
    }

    [
      PIN_STORAGE_KEY,
      SERVER_STARTED_AT_KEY,
      AVATAR_STORAGE_KEY,
      STATS_STORAGE_KEY,
      CRAFTING_STORAGE_KEY,
      MARKET_STORAGE_KEY,
      PLAYER_STORAGE_KEY,
      GROWGO_PLAYER_ID_KEY,
      GROWGO_PROFILE_CARD_MODE_KEY,
      "growgo-players-met",
      "growgo-friends"
    ].forEach((key) => localStorage.removeItem(key));

    localStorage.setItem(PROGRESSION_RESET_KEY, PROGRESSION_RESET_VERSION);
  } catch (error) {
    console.warn("Could not reset player progression.", error);
  }
}

function createDefaultPlayerState() {
  return {
    name: DEFAULT_PLAYER_NAME,
    publicId: null,
    avatarSrc: null,
    profileCardMode: "photo",
    progress: {
      level: 1,
      xp: 0,
      coins: 0,
      score: 0
    },
    settings: {
      soundEffects: true,
      vibration: true
    }
  };
}

function loadPlayerState() {
  const defaults = createDefaultPlayerState();

  try {
    const saved = JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY) || "null") || {};
    const legacyProfileCardMode = localStorage.getItem(GROWGO_PROFILE_CARD_MODE_KEY);
    const legacyPublicId = localStorage.getItem(GROWGO_PLAYER_ID_KEY);
    const legacyAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);

    return {
      ...defaults,
      ...saved,
      name: String(saved.name || defaults.name),
      publicId: saved.publicId || legacyPublicId || defaults.publicId,
      avatarSrc: saved.avatarSrc || legacyAvatar || defaults.avatarSrc,
      profileCardMode: saved.profileCardMode || legacyProfileCardMode || defaults.profileCardMode,
      progress: {
        ...defaults.progress,
        ...(saved.progress || {})
      },
      settings: {
        ...defaults.settings,
        ...(saved.settings || {})
      }
    };
  } catch (error) {
    console.warn("Could not load player state.", error);
    return defaults;
  }
}

function savePlayerState() {
  try {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(playerState));

    if (playerState.publicId) {
      localStorage.setItem(GROWGO_PLAYER_ID_KEY, playerState.publicId);
    }

    if (playerState.avatarSrc) {
      localStorage.setItem(AVATAR_STORAGE_KEY, playerState.avatarSrc);
    } else {
      localStorage.removeItem(AVATAR_STORAGE_KEY);
    }

    localStorage.setItem(GROWGO_PROFILE_CARD_MODE_KEY, playerState.profileCardMode || "photo");
  } catch (error) {
    console.warn("Could not save player state.", error);
  }
}

function readStoredJson(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch (error) {
    console.warn(`Could not read ${key}.`, error);
    return fallback;
  }
}

function createLocalBackup() {
  const publicId = getOrCreateGrowGoPlayerId();

  return {
    version: LOCAL_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    player: {
      ...playerState,
      publicId
    },
    stats: readStoredJson(STATS_STORAGE_KEY, null),
    crafting: readStoredJson(CRAFTING_STORAGE_KEY, null),
    market: readStoredJson(MARKET_STORAGE_KEY, null),
    pins: readStoredJson(PIN_STORAGE_KEY, []),
    serverStartedAt: getServerStartedAt(),
    social: {
      playersMet: readStoredJson("growgo-players-met", []),
      friends: readStoredJson("growgo-friends", [])
    }
  };
}

async function copyLocalBackup() {
  const backupText = JSON.stringify(createLocalBackup(), null, 2);

  try {
    await navigator.clipboard.writeText(backupText);
    showToast("Backup copied", "Your local save is on the clipboard.");
  } catch (error) {
    console.warn("Could not copy backup.", error);
    showToast("Backup unavailable", "Clipboard access was blocked by this browser.");
  }
}

function downloadLocalBackup() {
  try {
    const backup = createLocalBackup();
    const backupText = JSON.stringify(backup, null, 2);
    const publicId = String(backup.player.publicId || "player").toLowerCase();
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([backupText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `growgo-${publicId}-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Backup downloaded", "Save file created for this device.");
  } catch (error) {
    console.warn("Could not download backup.", error);
    showToast("Backup unavailable", "This browser blocked the download.");
  }
}

function writeStoredJson(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not write ${key}.`, error);
  }
}

function restoreLocalBackup(backup) {
  if (!backup || backup.version !== LOCAL_BACKUP_VERSION || !backup.player) {
    throw new Error("Unsupported backup file.");
  }

  const restoredPlayer = {
    ...createDefaultPlayerState(),
    ...backup.player,
    name: String(backup.player.name || DEFAULT_PLAYER_NAME),
    progress: {
      ...createDefaultPlayerState().progress,
      ...(backup.player.progress || {})
    },
    settings: {
      ...createDefaultPlayerState().settings,
      ...(backup.player.settings || {})
    }
  };

  playerState = restoredPlayer;
  savePlayerState();
  writeStoredJson(STATS_STORAGE_KEY, backup.stats);
  writeStoredJson(CRAFTING_STORAGE_KEY, backup.crafting);
  writeStoredJson(MARKET_STORAGE_KEY, backup.market);
  writeStoredJson(PIN_STORAGE_KEY, Array.isArray(backup.pins) ? backup.pins : []);
  localStorage.setItem(
    SERVER_STARTED_AT_KEY,
    String(Number(backup.serverStartedAt) || getTrustedNow())
  );
  writeStoredJson("growgo-players-met", backup.social?.playersMet || []);
  writeStoredJson("growgo-friends", backup.social?.friends || []);

  window.location.reload();
}

async function handleRestoreBackupFile(file) {
  if (!file) return;

  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (!window.confirm("Replace this device's local progress with this backup?")) return;
    restoreLocalBackup(backup);
  } catch (error) {
    console.warn("Could not restore backup.", error);
    showToast("Restore failed", "That backup file could not be loaded.");
  }
}

let playerState = loadPlayerState();
savePlayerState();

/* ----------------------------- */
/* MARKET DATA */
/* ----------------------------- */

const MARKET_CATEGORY_BASE_PRICES = {
  resources: 20,
  food: 50,
  cards: 100,
  skins: 1000
};

const MARKET_ITEMS = [
  { id: "wheat_seed", name: "Wheat Seed", icon: "🌱", rarity: "Common", category: "resources" },
  { id: "corn_seed", name: "Corn Seed", icon: "🌱", rarity: "Common", category: "resources" },
  { id: "sugar_cane_seed", name: "Sugar Cane Seed", icon: "🌱", rarity: "Common", category: "resources" },
  { id: "wheat", name: "Wheat", icon: "🌾", rarity: "Common", category: "resources" },
  { id: "sugar_cane", name: "Sugar Cane", icon: "🎋", rarity: "Common", category: "resources" },
  { id: "corn", name: "Corn", icon: "🌽", rarity: "Common", category: "resources" },
  { id: "water", name: "Water", icon: "💧", rarity: "Common", category: "resources" },
  { id: "fish", name: "Blue Fish", icon: "🐟", rarity: "Common", category: "resources" },
  { id: "salmon", name: "Salmon", icon: "🐟", rarity: "Rare", category: "resources" },
  { id: "milk", name: "Milk", icon: "🥛", rarity: "Uncommon", category: "resources" },
  { id: "cocoa_beans", name: "Cocoa Beans", icon: "🍫", rarity: "Uncommon", category: "resources" },
  { id: "egg", name: "Egg", icon: "🥚", rarity: "Rare", category: "resources" },
  { id: "tomato", name: "Tomato", icon: "🍅", rarity: "Rare", category: "resources" },

  { id: "flour", name: "Flour", icon: "🌾", rarity: "Common", category: "food" },
  { id: "sugar", name: "Sugar", icon: "🍬", rarity: "Common", category: "food" },
  { id: "bread", name: "Bread", icon: "🍞", rarity: "Common", category: "food" },
  { id: "energy_bar", name: "Energy Bar", icon: "🍫", rarity: "Common", category: "food" },
  { id: "sweet_corn_snack", name: "Sweet Corn Snack", icon: "🌽", rarity: "Common", category: "food" },
  { id: "chocolate_milk", name: "Chocolate Milk", icon: "🥛", rarity: "Uncommon", category: "food" },
  { id: "battered_fish", name: "Battered Fish", icon: "🍤", rarity: "Common", category: "food" },

  { id: "dinosaur_card", name: "Dinosaur Card", icon: "🦖", rarity: "Common", category: "cards" },
  { id: "planet_card", name: "Planet Card", icon: "🪐", rarity: "Common", category: "cards" },
  { id: "land_of_oz_card", name: "Land of Oz Card", icon: "🌈", rarity: "Rare", category: "cards" },

  { id: "paper_scarecrow_skin", name: "Paper Scarecrow Skin", icon: "🎭", rarity: "Rare", category: "skins" },
  { id: "golden_pin_skin", name: "Golden Pin Skin", icon: "📍", rarity: "Legendary", category: "skins" }
];

let marketScreen = null;
let marketItemsView = null;
let marketItemDetailsView = null;
let marketBuyView = null;
let marketListingsView = null;
let marketSellOverlay = null;

let activeMarketCategory = "resources";
let selectedMarketItemId = null;
let selectedMarketPrice = null;
let selectedMarketBuyQuantity = 1;
let marketLongPressTimer = null;

/* ----------------------------- */
/* INVENTORY STATE */
/* ----------------------------- */

let inventoryScreen = null;
let inventoryBackBtn = null;
let inventoryGrid = null;
let inventoryListView = null;
let inventoryDetailsView = null;
let inventoryDetailsCard = null;

let activeInventoryCategory = "resources";
let selectedInventoryItemId = null;
let inventoryLongPressTimer = null;
let inventoryLongPressTriggered = false;

const INVENTORY_LONG_PRESS_MS = 550;

const INVENTORY_SPECIAL_ITEMS = [
  {
    id: "legendary_boost",
    name: "Legendary Boost",
    icon: "✨",
    rarity: "Legendary",
    category: "special",
    sellable: false,
    description: "A rare one-time reward. Special rewards like this cannot be sold."
  },
  {
    id: "wizard_title_token",
    name: "Title Token",
    icon: "🏷️",
    rarity: "Special",
    category: "special",
    sellable: false,
    description: "Unlocks a special player title from an achievement."
  }
];

const INVENTORY_DESCRIPTIONS = {
  wheat_seed: "A seed for owned base pins. Plant it to grow wheat over four weekly stages.",
  corn_seed: "A seed for owned base pins. Plant it to grow corn over four weekly stages.",
  sugar_cane_seed: "A seed for owned base pins. Plant it to grow sugar cane over four weekly stages.",
  wheat: "Basic crop used to make flour and simple foods.",
  sugar_cane: "Can be processed into sugar for snacks and drinks.",
  corn: "A common crop used in capture radius snacks.",
  water: "Useful for cooking, fishing recipes, and basic crafting.",
  fish: "A common blue fish used in lower-level recipes.",
  salmon: "A rare fish caught from water pins and saved for stronger recipes.",
  milk: "Produced by cows and used in drinks, butter, cream, and desserts.",
  cocoa_beans: "Used for chocolate recipes and uncommon crafting.",
  egg: "Produced by chickens and used in rare food recipes.",
  tomato: "A rare crop used in sandwiches, soup, and pasta.",
  flour: "Processed from wheat. Used in breads, desserts, and meals.",
  sugar: "Processed from sugar cane. Used in drinks and desserts.",
  bread: "A basic food item used in stronger recipes.",
  energy_bar: "Gives a small XP boost.",
  sweet_corn_snack: "Gives a small capture radius boost.",
  chocolate_milk: "A stronger XP boost drink.",
  battered_fish: "Activates auto-capture for a short time.",
  dinosaur_card: "A collectible card for your collections.",
  planet_card: "A collectible space-themed card.",
  land_of_oz_card: "A rare collectible card.",
  paper_scarecrow_skin: "A cosmetic skin for scarecrows.",
  golden_pin_skin: "A legendary cosmetic pin skin."
};

const HIGHWAY_TYPES = [
  "residential", "living_street", "unclassified",
  "tertiary", "tertiary_link", "secondary", "secondary_link",
  "primary", "primary_link", "service", "road",
  "track", "path", "footway", "cycleway", "pedestrian"
];

let map;
let pinsLayer;
let playerMarker;
let captureRing;
let playerLatLng = null;

let pinStore = new Map();
let renderedPinMarkers = new Map();
let pinSpatialBuckets = new Map();
let fetchedViewportKeys = new Set();

let trustedTimeOffsetMs = 0;
let trustedTimeReady = false;
let gmtClockTimer = null;
let lastUtcDayKey = null;

let roadFetchTimer = null;
let roadFetchAbortController = null;
let roadFetchInFlight = false;
let roadErrorToastShown = false;

let redrawTimer = null;
let savePinsTimer = null;
let pinLongPressTimer = null;
let pinLongPressTriggered = false;
let activeLongPressPin = null;

let toastStack;
let sideMenu;
let menuOverlay;
let avatarButton;

const BASE_PIN_SEED_OPTIONS = [
  { id: "wheat_seed", harvestItemId: "wheat", label: "Wheat Seed", cropLabel: "Wheat", icon: "🌾" },
  { id: "corn_seed", harvestItemId: "corn", label: "Corn Seed", cropLabel: "Corn", icon: "🌽" },
  { id: "sugar_cane_seed", harvestItemId: "sugar_cane", label: "Sugar Cane Seed", cropLabel: "Sugar Cane", icon: "🎋" }
];

const BASE_PIN_LEVELS = {
  1: { name: "Common", className: "common", upgradeCost: 200 },
  2: { name: "Uncommon", className: "uncommon", upgradeCost: 300 },
  3: { name: "Rare", className: "rare", upgradeCost: 400 },
  4: { name: "Epic", className: "epic", upgradeCost: null }
};

let menuAvatarInput;
let menuAvatarImg;
let menuAvatarPlus;
let topAvatarImage;
let topAvatarFallback;

let profileSwipeCard;
let profilePhotoFace;
let profileQrFace;
let playerQrCode;
let profileSwipeStartX = 0;
let profileSwipeStartY = 0;
let profileSwipeCurrentMode = playerState.profileCardMode || "photo";
let menuBackSwipeStartX = 0;
let menuBackSwipeStartY = 0;
let menuBackSwipeActive = false;
let menuBackSwipePointerId = null;

let menuHome;

let statsScreen;
let statsContent;
let statsBack;

let leadersScreen;
let leadersBackBtn;
let leaderboardList;
let socialScreen;
let socialBackBtn;
let socialAvatarImg;
let socialAvatarFallback;
let socialPublicId;
let settingsScreen;
let settingsPlayerName;
let settingsPlayerId;
let soundEffectsToggle;
let vibrationToggle;
let copyBackupBtn;
let downloadBackupBtn;
let restoreBackupBtn;
let restoreBackupInput;
let changeAvatarBtn;
let clearAvatarBtn;
let advanceCropsBtn;
let readyCropsBtn;
let resetLocalProgressBtn;
let collectionsScreen;
let ownedPinsCount;
let ownedPinsPendingTotal;
let claimOwnedPinRewardsBtn;
let ownedPinsList;
let growGoQrScanner = null;
let growGoQrScannerRunning = false;

let craftingScreen;
let craftingBackBtn;
let recipePanel;
let recipeDetailsPanel;
let recipeDetailsBackBtn;
let recipeBookGrid;
let recipeDetailsCard;
let craftRecipeBtn;

let craftingLevelLabel;
let craftingXpText;
let craftingXpFill;
let craftingNextLevelText;
let craftingXpToGoText;
let craftingLevelBadgeLarge;

let recipeHeroIcon;
let recipeLevel;
let recipeTitle;
let recipeRarity;
let recipeIngredients;
let recipeEffect;
let recipeCraftingXp;
let recipeBoostType;
let recipeBoostAmount;
let recipeDuration;

let selectedRecipe = null;
let recipeBookRenderedForLevel = null;

const pinIconCache = new Map();

document.addEventListener("DOMContentLoaded", async () => {
  loadPinsFromLocal();
  rebuildSpatialBuckets();

  cacheDom();
  initMap();
  initBasicUi();
  initAvatarUpload();
  initStatsUi();
  initLeadersUi();
initSocialUi();
initCraftingUi();
  initMarketUi();
  initInventoryUi();
  initCollectionsUi();
  initSettingsUi();
  renderPlayerOverview();

  await syncTrustedTime();
  startGmtResetClock();

  resetTodayStatsIfNeeded();

  locatePlayer();
  requestRoadPinsForCurrentView(true);
});

/* ----------------------------- */
/* DOM CACHE */
/* ----------------------------- */

function cacheDom() {
  toastStack = document.getElementById("toast-stack");
  sideMenu = document.getElementById("sideMenu");
  menuOverlay = document.getElementById("menuOverlay");
  avatarButton = document.getElementById("avatarButton");
  menuHome = document.getElementById("menuHome");

 menuAvatarInput = document.getElementById("menuAvatarInput");
menuAvatarImg = document.getElementById("menuAvatarImg");
menuAvatarPlus = document.getElementById("menuAvatarPlus");
topAvatarImage = document.getElementById("topAvatarImage");
topAvatarFallback = document.getElementById("topAvatarFallback");

profileSwipeCard = document.getElementById("profileSwipeCard");
profilePhotoFace = document.getElementById("profilePhotoFace");
profileQrFace = document.getElementById("profileQrFace");
playerQrCode = document.getElementById("playerQrCode");

  statsScreen = document.getElementById("statsScreen");
  statsContent = document.getElementById("statsContent");
  statsBack = document.getElementById("statsBack");

  leadersScreen = document.getElementById("leadersScreen");
  leadersBackBtn = document.getElementById("leadersBackBtn");
  leaderboardList = leadersScreen ? leadersScreen.querySelector(".leaderboard-list") : null;
socialScreen = document.getElementById("socialScreen");
socialBackBtn = document.getElementById("socialBackBtn");
socialAvatarImg = document.getElementById("socialAvatarImg");
socialAvatarFallback = document.getElementById("socialAvatarFallback");
socialPublicId = document.getElementById("socialPublicId");
settingsScreen = document.getElementById("settingsScreen");
settingsPlayerName = document.getElementById("settingsPlayerName");
settingsPlayerId = document.getElementById("settingsPlayerId");
soundEffectsToggle = document.getElementById("soundEffectsToggle");
vibrationToggle = document.getElementById("vibrationToggle");
copyBackupBtn = document.getElementById("copyBackupBtn");
downloadBackupBtn = document.getElementById("downloadBackupBtn");
restoreBackupBtn = document.getElementById("restoreBackupBtn");
restoreBackupInput = document.getElementById("restoreBackupInput");
changeAvatarBtn = document.getElementById("changeAvatarBtn");
clearAvatarBtn = document.getElementById("clearAvatarBtn");
advanceCropsBtn = document.getElementById("advanceCropsBtn");
readyCropsBtn = document.getElementById("readyCropsBtn");
resetLocalProgressBtn = document.getElementById("resetLocalProgressBtn");
collectionsScreen = document.getElementById("collectionsScreen");
ownedPinsCount = document.getElementById("ownedPinsCount");
ownedPinsPendingTotal = document.getElementById("ownedPinsPendingTotal");
claimOwnedPinRewardsBtn = document.getElementById("claimOwnedPinRewardsBtn");
ownedPinsList = document.getElementById("ownedPinsList");

  craftingScreen = document.getElementById("craftingScreen");
  craftingBackBtn = document.getElementById("craftingBackBtn");
  recipePanel = document.getElementById("recipePanel");
  recipeDetailsPanel = document.getElementById("recipeDetailsPanel");
  recipeDetailsBackBtn = document.getElementById("recipeDetailsBackBtn");
  recipeBookGrid = document.getElementById("recipeBookGrid");
  recipeDetailsCard = document.getElementById("recipeDetailsCard");
  craftRecipeBtn = document.getElementById("craftRecipeBtn");

  craftingLevelLabel = document.getElementById("craftingLevelLabel");
  craftingXpText = document.getElementById("craftingXpText");
  craftingXpFill = document.getElementById("craftingXpFill");
  craftingNextLevelText = document.getElementById("craftingNextLevelText");
  craftingXpToGoText = document.getElementById("craftingXpToGoText");
  craftingLevelBadgeLarge = document.querySelector(".crafting-level-badge-large");

  recipeHeroIcon = document.getElementById("recipeHeroIcon");
  recipeLevel = document.getElementById("recipeLevel");
  recipeTitle = document.getElementById("recipeTitle");
  recipeRarity = document.getElementById("recipeRarity");
  recipeIngredients = document.getElementById("recipeIngredients");
  recipeEffect = document.getElementById("recipeEffect");
  recipeCraftingXp = document.getElementById("recipeCraftingXp");
  recipeBoostType = document.getElementById("recipeBoostType");
  recipeBoostAmount = document.getElementById("recipeBoostAmount");
  recipeDuration = document.getElementById("recipeDuration");
}

/* ----------------------------- */
/* STATS SYSTEM */
/* ----------------------------- */

function createDefaultStats() {
  return {
    todayDateKey: getLocalDateKey(Date.now()),

    today: {
      score: 0,
      captures: 0,
      goldEarned: 0,
      itemsCrafted: 0,
      resourcesGained: 0,
      questsDone: 0,
      birdsCaptured: 0,
      fishCaught: 0,
      newPois: 0,
      playersMet: 0
    },

    lifetime: {
      score: 0,
      captures: 0,
      goldEarned: 0,
      itemsCrafted: 0,
      resourcesGained: 0,
      questsDone: 0,
      birdsCaptured: 0,
      fishCaught: 0,
      newPois: 0,
      marketsAttended: 0,
      playersMet: 0,
      localNumberOnes: 0,
      regionalNumberOnes: 0,
      globalNumberOnes: 0
    },

    best: {
      score: { value: 0, date: null },
      captures: { value: 0, date: null },
      goldEarned: { value: 0, date: null },
      itemsCrafted: { value: 0, date: null },
      resourcesGained: { value: 0, date: null },
      questsDone: { value: 0, date: null },
      birdsCaptured: { value: 0, date: null },
      fishCaught: { value: 0, date: null },
      newPois: { value: 0, date: null },
      playersMet: { value: 0, date: null },
      bestLocalRank: { rank: null, date: null },
      bestRegionalRank: { rank: null, date: null },
      bestGlobalRank: { rank: null, date: null }
    }
  };
}

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    const defaults = createDefaultStats();

    if (!raw) return defaults;

    const saved = JSON.parse(raw);

    return {
      ...defaults,
      ...saved,
      today: { ...defaults.today, ...(saved.today || {}) },
      lifetime: { ...defaults.lifetime, ...(saved.lifetime || {}) },
      best: { ...defaults.best, ...(saved.best || {}) }
    };
  } catch (error) {
    console.warn("Could not load stats.", error);
    return createDefaultStats();
  }
}

let playerStats = loadStats();

function saveStats() {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(playerStats));
  } catch (error) {
    console.warn("Could not save stats.", error);
  }
}

function getLocalDateKey(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function getDisplayDate(timestamp = Date.now()) {
  return new Date(timestamp).toLocaleDateString();
}

function resetTodayStatsIfNeeded() {
  const currentDateKey = getLocalDateKey(Date.now());

  if (playerStats.todayDateKey === currentDateKey) return;

  playerStats.todayDateKey = currentDateKey;

  Object.keys(playerStats.today).forEach((key) => {
    playerStats.today[key] = 0;
  });

  saveStats();
}

function addStat(statKey, amount = 1) {
  resetTodayStatsIfNeeded();

  if (typeof playerStats.today[statKey] !== "number") {
    playerStats.today[statKey] = 0;
  }

  if (typeof playerStats.lifetime[statKey] !== "number") {
    playerStats.lifetime[statKey] = 0;
  }

  playerStats.today[statKey] += amount;
  playerStats.lifetime[statKey] += amount;

  const best = playerStats.best[statKey];

  if (best && typeof best === "object" && "value" in best) {
    if (playerStats.today[statKey] > best.value) {
      best.value = playerStats.today[statKey];
      best.date = getDisplayDate();
    }
  }

  saveStats();
  renderPlayerOverview();

  if (statsScreen && !statsScreen.classList.contains("hidden")) {
    const activeTab = statsScreen.querySelector(".stats-tabs .tab.active");
    renderStats(activeTab ? activeTab.dataset.tab : "today");
  }
}

/* ----------------------------- */
/* CRAFTING SYSTEM */
/* ----------------------------- */

const INGREDIENT_ICONS = {
  "Wheat": "🌾",
  "Sugar Cane": "🎋",
  "Sugar": "🍬",
  "Corn": "🌽",
  "Flour": "🌾",
  "Water": "💧",
  "Dough": "🥖",
  "Fish": "🐟",
  "Milk": "🥛",
  "Cocoa Beans": "🍫",
  "Bread": "🍞",
  "Egg": "🥚",
  "Tomato": "🍅",
  "Cream": "🥛",
  "Pasta": "🍝",
  "Butter": "🧈",
  "Cocoa": "🍫"
};

const RECIPES = [
  {
    level: 1,
    name: "Flour",
    icon: "🌾",
    rarity: "Common",
    ingredients: ["Wheat x2"],
    effect: "Processed ingredient used in breads, desserts, and meals.",
    boostType: "Ingredient",
    boostAmount: "Crafting",
    duration: "—",
    craftingXp: 25
  },
  {
    level: 2,
    name: "Sugar",
    icon: "🍬",
    rarity: "Common",
    ingredients: ["Sugar Cane x2"],
    effect: "Processed ingredient used in drinks, snacks, and desserts.",
    boostType: "Ingredient",
    boostAmount: "Crafting",
    duration: "—",
    craftingXp: 40
  },
  {
    level: 3,
    name: "Energy Bar",
    icon: "🍫",
    rarity: "Common",
    ingredients: ["Wheat", "Sugar"],
    effect: "A simple snack that gives a small XP boost.",
    boostType: "XP Boost",
    boostAmount: "+50%",
    duration: "5m",
    craftingXp: 75
  },
  {
    level: 4,
    name: "Sweet Corn Snack",
    icon: "🌽",
    rarity: "Common",
    ingredients: ["Corn", "Sugar"],
    effect: "A sweet snack that slightly increases capture radius.",
    boostType: "Radius",
    boostAmount: "+50%",
    duration: "5m",
    craftingXp: 90
  },
  {
    level: 5,
    name: "Dough",
    icon: "🥖",
    rarity: "Common",
    ingredients: ["Flour", "Water"],
    effect: "Processed ingredient used for bread and baked foods.",
    boostType: "Ingredient",
    boostAmount: "Crafting",
    duration: "—",
    craftingXp: 100
  },
  {
    level: 6,
    name: "Bread",
    icon: "🍞",
    rarity: "Common",
    ingredients: ["Dough"],
    effect: "A basic food that gives a small stamina boost.",
    boostType: "Stamina",
    boostAmount: "+50%",
    duration: "5m",
    craftingXp: 125
  },
  {
    level: 7,
    name: "Energy Drink",
    icon: "🥤",
    rarity: "Rare",
    ingredients: ["Sugar x2", "Water"],
    effect: "A refreshing boost that increases XP gain for a limited time.",
    boostType: "XP Boost",
    boostAmount: "+100%",
    duration: "5m",
    craftingXp: 250
  },
  {
    level: 8,
    name: "Prepared Fish",
    icon: "🐟",
    rarity: "Common",
    ingredients: ["Fish", "Water"],
    effect: "A prepared meal used in stronger food recipes.",
    boostType: "Meal",
    boostAmount: "Prepared",
    duration: "—",
    craftingXp: 180
  },
  {
    level: 9,
    name: "Battered Fish",
    icon: "🍤",
    rarity: "Common",
    ingredients: ["Fish", "Flour", "Water"],
    effect: "Activates auto-capture for a short time.",
    boostType: "Auto Capture",
    boostAmount: "Active",
    duration: "3m",
    craftingXp: 300
  },
  {
    level: 10,
    name: "Chocolate Milk",
    icon: "🍫",
    rarity: "Uncommon",
    ingredients: ["Milk x2", "Cocoa Beans"],
    effect: "A rich drink that gives a stronger XP boost.",
    boostType: "XP Boost",
    boostAmount: "+75%",
    duration: "10m",
    craftingXp: 350
  },
  {
    level: 11,
    name: "Battered Trout",
    icon: "🐠",
    rarity: "Uncommon",
    ingredients: ["Fish", "Flour", "Water"],
    effect: "Activates auto-capture for a longer time.",
    boostType: "Auto Capture",
    boostAmount: "Active",
    duration: "10m",
    craftingXp: 450
  },
  {
    level: 21,
    name: "Egg & Tomato Sandwich",
    icon: "🥪",
    rarity: "Rare",
    ingredients: ["Bread", "Egg", "Tomato"],
    effect: "A rare meal that boosts stamina and XP.",
    boostType: "Meal Boost",
    boostAmount: "+100%",
    duration: "15m",
    craftingXp: 700
  },
  {
    level: 22,
    name: "Omelette",
    icon: "🍳",
    rarity: "Rare",
    ingredients: ["Egg", "Milk", "Tomato"],
    effect: "A rare crafted meal that improves stamina.",
    boostType: "Stamina",
    boostAmount: "+100%",
    duration: "15m",
    craftingXp: 750
  },
  {
    level: 23,
    name: "Cream of Tomato Soup",
    icon: "🥣",
    rarity: "Rare",
    ingredients: ["Tomato", "Cream"],
    effect: "A warm soup that improves capture efficiency.",
    boostType: "Capture",
    boostAmount: "+100%",
    duration: "15m",
    craftingXp: 800
  },
  {
    level: 24,
    name: "Spaghetti Marinara",
    icon: "🍝",
    rarity: "Rare",
    ingredients: ["Pasta", "Tomato"],
    effect: "A rare meal that boosts XP gain.",
    boostType: "XP Boost",
    boostAmount: "+100%",
    duration: "15m",
    craftingXp: 850
  },
  {
    level: 25,
    name: "Pancakes",
    icon: "🥞",
    rarity: "Rare",
    ingredients: ["Flour", "Egg", "Milk"],
    effect: "A filling food that extends consumable duration.",
    boostType: "Duration",
    boostAmount: "+100%",
    duration: "15m",
    craftingXp: 900
  },
  {
    level: 26,
    name: "Chocolate Brownies",
    icon: "🟫",
    rarity: "Rare",
    ingredients: ["Flour", "Sugar", "Cocoa"],
    effect: "A rare dessert that gives a strong crafting XP boost.",
    boostType: "Craft XP",
    boostAmount: "+100%",
    duration: "15m",
    craftingXp: 950
  },
  {
    level: 27,
    name: "Chocolate Croissant",
    icon: "🥐",
    rarity: "Rare",
    ingredients: ["Flour", "Butter", "Cocoa"],
    effect: "A rare dessert that improves crafting results.",
    boostType: "Crafting",
    boostAmount: "+100%",
    duration: "15m",
    craftingXp: 1000
  },
  {
    level: 28,
    name: "Chocolate Cake",
    icon: "🍰",
    rarity: "Rare",
    ingredients: ["Flour", "Sugar", "Cocoa", "Egg", "Milk"],
    effect: "A rare dessert that gives a major XP boost.",
    boostType: "XP Boost",
    boostAmount: "+100%",
    duration: "15m",
    craftingXp: 1100
  },
  {
    level: 29,
    name: "Baked Salmon",
    icon: "🍣",
    rarity: "Rare",
    ingredients: ["Fish", "Butter", "Tomato"],
    effect: "A rare meal that increases capture radius.",
    boostType: "Radius",
    boostAmount: "+100%",
    duration: "15m",
    craftingXp: 1200
  }
];

function createDefaultCrafting() {
  return {
    level: 1,
    xp: 0
  };
}

function loadCrafting() {
  try {
    const raw = localStorage.getItem(CRAFTING_STORAGE_KEY);
    const defaults = createDefaultCrafting();

    if (!raw) return defaults;

    return {
      ...defaults,
      ...JSON.parse(raw)
    };
  } catch {
    return createDefaultCrafting();
  }
}

let playerCrafting = loadCrafting();

function saveCrafting() {
  try {
    localStorage.setItem(CRAFTING_STORAGE_KEY, JSON.stringify(playerCrafting));
  } catch (error) {
    console.warn("Could not save crafting.", error);
  }
}

function getLevelXpNeeded(level) {
  return Math.round(100 * Math.pow(1.2, level - 1));
}

function getTotalXpForLevel(level) {
  let total = 0;

  for (let i = 1; i < level; i++) {
    total += getLevelXpNeeded(i);
  }

  return total;
}

function getCraftingXpNeeded(level) {
  return getLevelXpNeeded(level);
}

function getCraftingProgress() {
  const currentLevelStart = getTotalXpForLevel(playerCrafting.level);
  const nextLevelAt = getTotalXpForLevel(playerCrafting.level + 1);
  const currentXpIntoLevel = playerCrafting.xp - currentLevelStart;
  const neededThisLevel = nextLevelAt - currentLevelStart;
  const percent = Math.min(100, Math.max(0, (currentXpIntoLevel / neededThisLevel) * 100));

  return {
    currentXpIntoLevel,
    neededThisLevel,
    percent,
    xpToGo: Math.max(0, neededThisLevel - currentXpIntoLevel)
  };
}

function addCraftingXp(amount) {
  const previousLevel = playerCrafting.level;

  playerCrafting.xp += amount;

  while (playerCrafting.xp >= getTotalXpForLevel(playerCrafting.level + 1)) {
    playerCrafting.level += 1;
    showToast("Crafting level up!", `You reached crafting level ${playerCrafting.level}.`);
  }

  saveCrafting();
  renderCraftingHeader();
  renderPlayerOverview();

  if (playerCrafting.level !== previousLevel) {
    triggerLevelUpFeedback();
    renderRecipeBook(true);
  }

  if (selectedRecipe) {
    openRecipe(selectedRecipe, false);
  }
}

function addPlayerXp(amount) {
  const progress = getPlayerProgressInfo();
  const previousLevel = progress.level;
  const addedXp = Math.max(0, Number(amount || 0));
  let nextXp = progress.totalXp + addedXp;
  let nextLevel = progress.level;

  while (nextXp >= getTotalXpForLevel(nextLevel + 1)) {
    nextLevel += 1;
  }

  playerState.progress = {
    ...createDefaultPlayerState().progress,
    ...(playerState.progress || {}),
    level: nextLevel,
    xp: nextXp
  };

  savePlayerState();
  renderPlayerOverview();

  if (nextLevel !== previousLevel) {
    showToast("Level up!", `You reached player level ${nextLevel}.`);
    triggerLevelUpFeedback();
  }
}

function initCraftingUi() {
  if (craftingBackBtn) {
    craftingBackBtn.addEventListener("click", () => {
      closeRecipeDetails();
      if (craftingScreen) craftingScreen.classList.add("hidden");
      showMenuHome();
    });
  }

  if (recipeDetailsBackBtn) {
    recipeDetailsBackBtn.addEventListener("click", closeRecipeDetails);
  }

  if (craftRecipeBtn) {
    craftRecipeBtn.addEventListener("click", craftSelectedRecipe);
  }

  if (recipeBookGrid) {
    recipeBookGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".recipe-card");
      if (!card) return;

      const recipeName = card.dataset.recipeName;
      const recipe = RECIPES.find((item) => item.name === recipeName);
      if (!recipe) return;

      if (recipe.level > playerCrafting.level) {
        showToast("Recipe locked", `Unlocks at crafting level ${recipe.level}.`);
        return;
      }

      openRecipe(recipe);
    });
  }

  renderCraftingHeader();
  renderRecipeBook(true);
  closeRecipeDetails();
}

function openCrafting() {
  if (!craftingScreen) return;

  resetTodayStatsIfNeeded();
  hideSubmenus();
  hideMenuHome();

  craftingScreen.classList.remove("hidden");

  selectedRecipe = null;
  closeRecipeDetails();
  renderCraftingHeader();
  renderRecipeBook(false);
}

function closeRecipeDetails() {
  selectedRecipe = null;

  if (recipeDetailsPanel) {
    recipeDetailsPanel.classList.add("hidden");
  }

  updateSelectedRecipeCard();
}

function renderCraftingHeader() {
  const progress = getCraftingProgress();

  if (craftingLevelLabel) {
    craftingLevelLabel.textContent = `Crafting Level ${playerCrafting.level}`;
  }

  if (craftingNextLevelText) {
    craftingNextLevelText.textContent = `Next Level ${playerCrafting.level + 1}`;
  }

  if (craftingXpText) {
    craftingXpText.textContent = `${Math.floor(progress.currentXpIntoLevel)} / ${progress.neededThisLevel} XP`;
  }

  if (craftingXpToGoText) {
    craftingXpToGoText.textContent = `${Math.ceil(progress.xpToGo)} XP to go`;
  }

  if (craftingXpFill) {
    craftingXpFill.style.width = `${progress.percent}%`;
  }

  if (craftingLevelBadgeLarge) {
    craftingLevelBadgeLarge.textContent = playerCrafting.level;
  }
}

function renderRecipeBook(force = false) {
  if (!recipeBookGrid) return;

  if (!force && recipeBookRenderedForLevel === playerCrafting.level && recipeBookGrid.children.length) {
    updateSelectedRecipeCard();
    return;
  }

  recipeBookRenderedForLevel = playerCrafting.level;

  const fragment = document.createDocumentFragment();

  RECIPES.forEach((recipe) => {
    const locked = recipe.level > playerCrafting.level;

    const card = document.createElement("div");
    card.className = `recipe-card ${locked ? "locked" : ""}`;
    card.dataset.recipeName = recipe.name;

    card.innerHTML = `
      <div class="recipe-card-level">${recipe.level}</div>
      <div class="recipe-card-icon">${locked ? "🔒" : recipe.icon}</div>
      <div class="recipe-card-name">${locked ? "Unlocks at" : escapeHtml(recipe.name)}</div>
      <div class="recipe-card-rarity">${locked ? `Lv. ${recipe.level}` : escapeHtml(recipe.rarity)}</div>
    `;

    fragment.appendChild(card);
  });

  recipeBookGrid.replaceChildren(fragment);
  updateSelectedRecipeCard();
}

function updateSelectedRecipeCard() {
  if (!recipeBookGrid) return;

  const selectedName = selectedRecipe ? selectedRecipe.name : null;

  recipeBookGrid.querySelectorAll(".recipe-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.recipeName === selectedName);
  });
}

function openRecipe(recipe, updateSelection = true) {
  selectedRecipe = recipe;

  if (recipeDetailsPanel) {
    recipeDetailsPanel.classList.remove("hidden");
  }

  if (recipeHeroIcon) recipeHeroIcon.textContent = recipe.icon;
  if (recipeLevel) recipeLevel.textContent = `Lv. ${recipe.level}`;
  if (recipeTitle) recipeTitle.textContent = recipe.name;
  if (recipeRarity) recipeRarity.textContent = recipe.rarity;
  if (recipeEffect) recipeEffect.textContent = recipe.effect;
  if (recipeCraftingXp) recipeCraftingXp.textContent = String(recipe.craftingXp);
  if (recipeBoostType) recipeBoostType.textContent = recipe.boostType || "Effect";
  if (recipeBoostAmount) recipeBoostAmount.textContent = recipe.boostAmount || "Boost";
  if (recipeDuration) recipeDuration.textContent = recipe.duration || "—";

  if (recipeIngredients) {
    recipeIngredients.innerHTML = recipe.ingredients
      .map((ingredient) => renderIngredientCard(ingredient))
      .join("");
  }

  if (updateSelection) {
    updateSelectedRecipeCard();
  }
}

function renderIngredientCard(ingredientText) {
  const parsed = parseIngredient(ingredientText);
  const icon = INGREDIENT_ICONS[parsed.name] || "🥣";

  return `
    <div class="recipe-ingredient-card">
      <div class="recipe-ingredient-icon">${icon}</div>
      <div class="recipe-ingredient-name">${escapeHtml(parsed.name)}</div>
      <div class="recipe-ingredient-count">${escapeHtml(parsed.count)}</div>
    </div>
  `;
}

function parseIngredient(ingredientText) {
  const text = String(ingredientText).trim();
  const match = text.match(/^(.*?)\s+x(\d+)$/i);

  if (match) {
    return {
      name: match[1].trim(),
      count: `${match[2]} / ${match[2]}`
    };
  }

  return {
    name: text,
    count: "1 / 1"
  };
}

function craftSelectedRecipe() {
  if (!selectedRecipe) {
    showToast("Crafting", "Choose a recipe first.");
    return;
  }

  if (selectedRecipe.level > playerCrafting.level) {
    showToast("Recipe locked", `Unlocks at crafting level ${selectedRecipe.level}.`);
    return;
  }

  addStat("itemsCrafted", 1);
  addCraftingXp(selectedRecipe.craftingXp);

  showToast(
    "Crafted",
    `${selectedRecipe.name} created. +${selectedRecipe.craftingXp} crafting XP.`
  );
}
/* ----------------------------- */
/* MARKET SYSTEM */
/* ----------------------------- */

function createDefaultMarketState() {
  return {
    wallet: 0,
    inventory: {},
    listings: [
      createNpcListing("wheat_seed", 8, 100),
      createNpcListing("corn_seed", 8, 100),
      createNpcListing("sugar_cane_seed", 8, 100),
      createNpcListing("wheat", 20, 50),
      createNpcListing("sugar_cane", 20, 40),
      createNpcListing("corn", 21, 35),
      createNpcListing("water", 19, 80),
      createNpcListing("fish", 22, 18),
      createNpcListing("milk", 52, 12),
      createNpcListing("flour", 50, 20),
      createNpcListing("bread", 53, 10),
      createNpcListing("energy_bar", 55, 8),
      createNpcListing("dinosaur_card", 100, 5),
      createNpcListing("planet_card", 105, 3),
      createNpcListing("paper_scarecrow_skin", 1000, 2)
    ],
    sales: [],
    transfers: [],
    nextListingId: 1000
  };
}

function createNpcListing(itemId, price, quantity) {
  return {
    id: `npc-${itemId}-${price}`,
    itemId,
    price,
    quantity,
    sellerId: "npc",
    sellerName: "GrowGo Market",
    createdAt: Date.now()
  };
}

function mergeDefaultNpcListings(savedListings, defaultListings) {
  const listings = Array.isArray(savedListings) ? [...savedListings] : [];

  defaultListings.forEach((defaultListing) => {
    const alreadyListed = listings.some((listing) => (
      listing.id === defaultListing.id ||
      (listing.sellerId === "npc" && listing.itemId === defaultListing.itemId)
    ));

    if (!alreadyListed) {
      listings.push(defaultListing);
    }
  });

  return listings;
}

function loadMarketState() {
  try {
    const raw = localStorage.getItem(MARKET_STORAGE_KEY);
    const defaults = createDefaultMarketState();

    if (!raw) return defaults;

    const saved = JSON.parse(raw);

    return {
      ...defaults,
      ...saved,
      inventory: {
        ...defaults.inventory,
        ...(saved.inventory || {})
      },
      listings: mergeDefaultNpcListings(saved.listings, defaults.listings),
      sales: Array.isArray(saved.sales) ? saved.sales : [],
      transfers: Array.isArray(saved.transfers) ? saved.transfers : [],
      nextListingId: saved.nextListingId || defaults.nextListingId
    };
  } catch (error) {
    console.warn("Could not load market.", error);
    return createDefaultMarketState();
  }
}

let marketState = loadMarketState();

function saveMarketState() {
  try {
    localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(marketState));
  } catch (error) {
    console.warn("Could not save market.", error);
  }
}

function initMarketUi() {
  marketScreen = document.getElementById("marketScreen");
  marketItemsView = document.getElementById("marketItemsView");
  marketItemDetailsView = document.getElementById("marketItemDetailsView");
  marketBuyView = document.getElementById("marketBuyView");
  marketListingsView = document.getElementById("marketListingsView");
  marketSellOverlay = document.getElementById("marketSellOverlay");
  inventoryScreen = document.getElementById("inventoryScreen");
  inventoryBackBtn = document.getElementById("inventoryBackBtn");
  inventoryGrid = document.getElementById("inventoryGrid");
  inventoryListView = document.getElementById("inventoryListView");
  inventoryDetailsView = document.getElementById("inventoryDetailsView");
  inventoryDetailsCard = document.getElementById("inventoryDetailsCard");

  if (!marketScreen) return;

  marketScreen.addEventListener("click", handleMarketClick);
  marketScreen.addEventListener("pointerdown", handleMarketPointerDown);
  marketScreen.addEventListener("pointerup", clearMarketLongPress);
  marketScreen.addEventListener("pointerleave", clearMarketLongPress);
  marketScreen.addEventListener("pointercancel", clearMarketLongPress);

if (marketSellOverlay) {
  marketSellOverlay.addEventListener("click", (event) => {
    if (event.target === marketSellOverlay) {
      closeMarketSellPopup();
      return;
    }

    handleMarketClick(event);
  });
}

  renderMarket();
}

function openMarket() {
  if (!marketScreen) return;

  hideSubmenus();
  hideMenuHome();

  marketScreen.classList.remove("hidden");
  activeMarketCategory = activeMarketCategory || "resources";

  showMarketItemsView();
  renderMarket();
}

function closeMarket() {
  if (marketScreen) marketScreen.classList.add("hidden");
  closeMarketSellPopup();
  showMenuHome();
}

function handleMarketClick(event) {
  const backButton = event.target.closest("#marketBack, #marketBackBtn, .market-back-btn");
  if (backButton) {
    closeMarket();
    return;
  }

  const detailsBack = event.target.closest("#marketDetailsBackBtn, .market-details-back");
  if (detailsBack) {
    showMarketItemsView();
    return;
  }

  const buyBack = event.target.closest("#marketBuyBackBtn, .market-buy-back");
  if (buyBack) {
    showMarketDetailsView();
    return;
  }

  const listingsBack = event.target.closest("#marketListingsBackBtn, .market-listings-back");
  if (listingsBack) {
    showMarketItemsView();
    return;
  }

  const tab = event.target.closest(".market-tab");
  if (tab && !tab.dataset.marketView) {
    activeMarketCategory = tab.dataset.category || tab.dataset.marketCategory || activeMarketCategory;
    selectedMarketItemId = null;
    showMarketItemsView();
    renderMarket();
    return;
  }

  const buyHomeButton = event.target.closest("#marketBuyBtn, .market-buy-home-btn, [data-market-view='buy']");
  if (buyHomeButton) {
    showMarketItemsView();
    renderMarket();
    return;
  }

  const listingsButton = event.target.closest("#marketListingsBtn, .market-listings-btn, [data-market-view='listings']");
  if (listingsButton) {
    showMarketListingsView();
    return;
  }

  const rowBuyButton = event.target.closest("[data-market-buy-item-id]");
  if (rowBuyButton) {
    const itemId = rowBuyButton.dataset.marketBuyItemId;
    const lowest = getLowestMarketListing(itemId);

    selectedMarketItemId = itemId;
    selectedMarketPrice = lowest ? Number(lowest.price) : null;
    selectedMarketBuyQuantity = 1;

    if (selectedMarketPrice) {
      showMarketBuyView();
    } else {
      openMarketItem(itemId);
    }

    return;
  }

  const itemCard = event.target.closest("[data-market-item-id]");
  if (itemCard) {
    openMarketItem(itemCard.dataset.marketItemId);
    return;
  }

  const priceTier = event.target.closest("[data-market-price]");
  if (priceTier) {
    selectedMarketPrice = Number(priceTier.dataset.marketPrice);
    selectedMarketBuyQuantity = 1;
    showMarketBuyView();
    return;
  }

  const qtyButton = event.target.closest("[data-market-qty]");
  if (qtyButton) {
    changeMarketBuyQuantity(Number(qtyButton.dataset.marketQty));
    return;
  }

  const confirmBuy = event.target.closest("#marketConfirmBuyBtn, .market-confirm-buy");
  if (confirmBuy) {
    confirmMarketPurchase();
    return;
  }

  const cancelListing = event.target.closest("[data-cancel-listing-id]");
  if (cancelListing) {
    cancelMarketListing(cancelListing.dataset.cancelListingId);
    return;
  }

  const closeSell = event.target.closest("#marketSellCloseBtn, .market-sell-close");
  if (closeSell) {
    closeMarketSellPopup();
    return;
  }

  const sellQtyButton = event.target.closest("[data-sell-qty]");
  if (sellQtyButton) {
    changeMarketSellQuantity(Number(sellQtyButton.dataset.sellQty));
    return;
  }

  const sellPriceButton = event.target.closest("[data-sell-price]");
  if (sellPriceButton) {
    changeMarketSellPrice(Number(sellPriceButton.dataset.sellPrice));
    return;
  }

  const listItemButton = event.target.closest("#marketListItemBtn, .market-list-item-btn");
  if (listItemButton) {
    confirmMarketListing();
    return;
  }
}

function handleMarketPointerDown(event) {
  const ownedItem = event.target.closest("[data-market-owned-item-id]");
  if (!ownedItem) return;

  clearMarketLongPress();

  marketLongPressTimer = setTimeout(() => {
    openMarketSellPopup(ownedItem.dataset.marketOwnedItemId);
  }, MARKET_LONG_PRESS_MS);
}

function clearMarketLongPress() {
  if (marketLongPressTimer) {
    clearTimeout(marketLongPressTimer);
    marketLongPressTimer = null;
  }
}

function showMarketItemsView() {
  if (marketItemsView) marketItemsView.classList.remove("hidden");
  if (marketItemDetailsView) marketItemDetailsView.classList.add("hidden");
  if (marketBuyView) marketBuyView.classList.add("hidden");
  if (marketListingsView) marketListingsView.classList.add("hidden");

  renderMarket();
}

function showMarketDetailsView() {
  if (marketItemsView) marketItemsView.classList.add("hidden");
  if (marketItemDetailsView) marketItemDetailsView.classList.remove("hidden");
  if (marketBuyView) marketBuyView.classList.add("hidden");
  if (marketListingsView) marketListingsView.classList.add("hidden");

  renderMarketItemDetails();
}

function showMarketBuyView() {
  if (marketItemsView) marketItemsView.classList.add("hidden");
  if (marketItemDetailsView) marketItemDetailsView.classList.add("hidden");
  if (marketBuyView) marketBuyView.classList.remove("hidden");
  if (marketListingsView) marketListingsView.classList.add("hidden");

  renderMarketBuyView();
}

function showMarketListingsView() {
  if (marketItemsView) marketItemsView.classList.add("hidden");
  if (marketItemDetailsView) marketItemDetailsView.classList.add("hidden");
  if (marketBuyView) marketBuyView.classList.add("hidden");
  if (marketListingsView) marketListingsView.classList.remove("hidden");

  renderMarketListings();
}

function renderMarket() {
  renderMarketWallet();
  renderMarketTabs();
  renderMarketItems();
}

function renderMarketWallet() {
  const walletEls = marketScreen
    ? marketScreen.querySelectorAll("#marketWallet, .market-wallet")
    : [];

  walletEls.forEach((el) => {
    el.textContent = `${formatNumber(marketState.wallet)} coins`;
  });

  const coinCount = document.getElementById("coinCount");
  if (coinCount) {
    coinCount.textContent = formatNumber(marketState.wallet);
  }
}

function renderMarketTabs() {
  if (!marketScreen) return;

  marketScreen.querySelectorAll(".market-tab").forEach((tab) => {
    const tabCategory = tab.dataset.category || tab.dataset.marketCategory;
    tab.classList.toggle("active", tabCategory === activeMarketCategory);
  });
}

function renderMarketItems() {
  if (!marketItemsView) return;

  const items = MARKET_ITEMS.filter((item) => item.category === activeMarketCategory);

  marketItemsView.innerHTML = `
    <div class="market-tabs market-tabs-five">
      <button class="market-tab ${activeMarketCategory === "resources" ? "active" : ""}" data-market-category="resources" type="button">Resources</button>
      <button class="market-tab ${activeMarketCategory === "food" ? "active" : ""}" data-market-category="food" type="button">Food</button>
      <button class="market-tab ${activeMarketCategory === "cards" ? "active" : ""}" data-market-category="cards" type="button">Cards</button>
      <button class="market-tab ${activeMarketCategory === "skins" ? "active" : ""}" data-market-category="skins" type="button">Skins</button>
      <button class="market-tab market-listings-tab" data-market-view="listings" type="button">Listings</button>
    </div>

    <div class="market-panel">
      ${items.map(renderMarketItemCard).join("")}
    </div>
  `;
}

function renderMarketOwnedItems() {
  const ownedEntries = Object.entries(marketState.inventory)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([itemId, qty]) => {
      const item = getMarketItem(itemId);
      if (!item) return "";

      return `
        <button class="market-owned-item" data-market-owned-item-id="${escapeAttribute(item.id)}" type="button">
          <span class="market-owned-icon">${item.icon}</span>
          <span class="market-owned-name">${escapeHtml(item.name)}</span>
          <span class="market-owned-qty">x${formatNumber(qty)}</span>
        </button>
      `;
    })
    .join("");

  return ownedEntries || `<div class="market-empty">No sellable items yet.</div>`;
}

function renderMarketItemCard(item) {
  const value = getMarketValue(item.id);
  const totalAvailable = getMarketAvailableQuantity(item.id);
  const lowest = getLowestMarketListing(item.id);

  return `
    <div class="market-item-card" data-market-item-id="${escapeAttribute(item.id)}">
      <div class="market-item-icon">${item.icon}</div>

      <div class="market-item-info">
        <div class="market-item-name">${escapeHtml(item.name)}</div>
        <div class="market-item-rarity">${escapeHtml(item.rarity)}</div>
      </div>

      <div class="market-item-values">
        <div class="market-item-price">${formatNumber(value)} coins</div>
        <div class="market-item-stock">
          ${totalAvailable > 0
            ? `${formatNumber(totalAvailable)} available · low ${formatNumber(lowest ? lowest.price : value)}`
            : "None listed"}
        </div>
      </div>

      <button
        class="market-row-buy-btn"
        data-market-buy-item-id="${escapeAttribute(item.id)}"
        type="button"
        ${totalAvailable > 0 ? "" : "disabled"}
      >
        Buy
      </button>
    </div>
  `;
}

function openMarketItem(itemId) {
  const item = getMarketItem(itemId);
  if (!item) return;

  selectedMarketItemId = itemId;
  selectedMarketPrice = null;
  selectedMarketBuyQuantity = 1;

  showMarketDetailsView();
}

function renderMarketItemDetails() {
  if (!marketItemDetailsView) return;

  const item = getMarketItem(selectedMarketItemId);
  if (!item) return;

  const priceTiers = getMarketPriceTiers(item.id);
  const value = getMarketValue(item.id);
  const allowed = getAllowedMarketPriceRange(item.id);

  marketItemDetailsView.innerHTML = `
    <div class="market-detail-panel">
      <div class="market-detail-hero">
        <div class="market-detail-icon">${item.icon}</div>
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <div class="market-item-rarity">${escapeHtml(item.rarity)}</div>
          <div class="market-item-price">Market value: ${formatNumber(value)} coins</div>
          <div class="market-item-stock">Sell range: ${formatNumber(allowed.min)}–${formatNumber(allowed.max)} coins</div>
        </div>
      </div>

      <div class="market-price-tier-list">
        ${priceTiers.length
          ? priceTiers.map((tier) => `
            <button class="market-price-tier-row" data-market-price="${tier.price}" type="button">
              <div>
                <strong>${formatNumber(tier.price)} coins</strong>
                <span>${formatNumber(tier.quantity)} available</span>
              </div>
              <div>Buy →</div>
            </button>
          `).join("")
          : `<div class="market-empty">No active listings for this item yet.</div>`}
      </div>
    </div>
  `;
}

function renderMarketBuyView() {
  if (!marketBuyView) return;

  const item = getMarketItem(selectedMarketItemId);
  if (!item || !selectedMarketPrice) return;

  const available = getMarketAvailableQuantityAtPrice(item.id, selectedMarketPrice);
  selectedMarketBuyQuantity = Math.max(1, Math.min(selectedMarketBuyQuantity, available));

  const totalCost = selectedMarketBuyQuantity * selectedMarketPrice;
  const canAfford = marketState.wallet >= totalCost;

  marketBuyView.innerHTML = `
    <div class="market-buy-panel">
      <div class="market-detail-hero">
        <div class="market-detail-icon">${item.icon}</div>
        <div>
          <h3>Buy ${escapeHtml(item.name)}</h3>
          <div>${formatNumber(selectedMarketPrice)} coins each</div>
          <div>${formatNumber(available)} available at this price</div>
        </div>
      </div>

      <div class="market-quantity-picker">
        <button data-market-qty="-1" type="button">−</button>
        <strong>${formatNumber(selectedMarketBuyQuantity)}</strong>
        <button data-market-qty="1" type="button">+</button>
      </div>

      <div class="market-total-line">
        Total: <strong>${formatNumber(totalCost)} coins</strong>
      </div>

      <button class="market-confirm-buy" type="button" ${canAfford ? "" : "disabled"}>
        ${canAfford ? "Confirm Purchase" : "Not Enough Coins"}
      </button>
    </div>
  `;
}

function changeMarketBuyQuantity(change) {
  const available = getMarketAvailableQuantityAtPrice(selectedMarketItemId, selectedMarketPrice);

  selectedMarketBuyQuantity = Math.max(
    1,
    Math.min(available, selectedMarketBuyQuantity + change)
  );

  renderMarketBuyView();
}

function confirmMarketPurchase() {
  const item = getMarketItem(selectedMarketItemId);
  if (!item || !selectedMarketPrice) return;

  const available = getMarketAvailableQuantityAtPrice(item.id, selectedMarketPrice);

  if (available <= 0) {
    showToast("Market", "That listing is no longer available.");
    showMarketDetailsView();
    return;
  }

  const quantityToBuy = Math.min(selectedMarketBuyQuantity, available);
  const totalCost = quantityToBuy * selectedMarketPrice;

  if (marketState.wallet < totalCost) {
    showToast("Market", "Not enough coins.");
    renderMarketBuyView();
    return;
  }

  let remaining = quantityToBuy;

  const matchingListings = marketState.listings
    .filter((listing) =>
      listing.itemId === item.id &&
      listing.price === selectedMarketPrice &&
      listing.quantity > 0
    )
    .sort((a, b) => a.createdAt - b.createdAt);

  matchingListings.forEach((listing) => {
    if (remaining <= 0) return;

    const taken = Math.min(remaining, listing.quantity);

    listing.quantity -= taken;
    remaining -= taken;

    marketState.transfers.push({
      type: "sale",
      listingId: listing.id,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      itemId: item.id,
      quantity: taken,
      price: selectedMarketPrice,
      total: taken * selectedMarketPrice,
      createdAt: Date.now()
    });
  });

  marketState.listings = marketState.listings.filter((listing) => listing.quantity > 0);

  marketState.wallet -= totalCost;
  marketState.inventory[item.id] = (marketState.inventory[item.id] || 0) + quantityToBuy;

  marketState.sales.push({
    itemId: item.id,
    price: selectedMarketPrice,
    quantity: quantityToBuy,
    total: totalCost,
    createdAt: Date.now()
  });

saveMarketState();
renderMarketWallet();
renderPlayerOverview();
renderMarket();
refreshInventoryIfOpen();

showToast("Purchased", `${quantityToBuy} ${item.name} for ${totalCost} coins.`);
showMarketDetailsView();
}

function openMarketSellPopup(itemId) {
  const item = getMarketItem(itemId);
  if (!item || !marketSellOverlay) return;

  const owned = marketState.inventory[itemId] || 0;

  if (owned <= 0) {
    showToast("Market", "You do not own any of that item.");
    return;
  }

  const allowed = getAllowedMarketPriceRange(itemId);
  const quantity = 1;
  const price = getMarketValue(itemId);

  marketSellOverlay.dataset.sellItemId = itemId;
  marketSellOverlay.dataset.sellQuantity = String(quantity);
  marketSellOverlay.dataset.sellPrice = String(Math.min(allowed.max, Math.max(allowed.min, price)));

  marketSellOverlay.classList.remove("hidden");

  renderMarketSellPopup();
}

function renderMarketSellPopup() {
  if (!marketSellOverlay) return;

  const itemId = marketSellOverlay.dataset.sellItemId;
  const item = getMarketItem(itemId);
  if (!item) return;

  const owned = marketState.inventory[itemId] || 0;
  const allowed = getAllowedMarketPriceRange(itemId);
  const quantity = Number(marketSellOverlay.dataset.sellQuantity || 1);
  const price = Number(marketSellOverlay.dataset.sellPrice || allowed.min);

  marketSellOverlay.innerHTML = `
    <div class="market-sell-popup">
      <button class="market-sell-close" type="button">×</button>

      <div class="market-detail-hero">
        <div class="market-detail-icon">${item.icon}</div>
        <div>
          <h3>Sell ${escapeHtml(item.name)}</h3>
          <div>${escapeHtml(item.rarity)}</div>
          <div>Owned: ${formatNumber(owned)}</div>
        </div>
      </div>

      <div class="market-sell-row">
        <span>Quantity</span>
        <div class="market-quantity-picker">
          <button data-sell-qty="-1" type="button">−</button>
          <strong>${formatNumber(quantity)}</strong>
          <button data-sell-qty="1" type="button">+</button>
        </div>
      </div>

      <div class="market-sell-row">
        <span>Price</span>
        <div class="market-quantity-picker">
          <button data-sell-price="-1" type="button">−</button>
          <strong>${formatNumber(price)}</strong>
          <button data-sell-price="1" type="button">+</button>
        </div>
      </div>

      <div class="market-item-stock">
        Allowed price: ${formatNumber(allowed.min)}–${formatNumber(allowed.max)} coins
      </div>

      <button id="marketListItemBtn" class="market-list-item-btn" type="button">
        List Item
            </button>
    </div>
  `;

  bindMarketSellPopupButtons();
}

function changeMarketSellQuantity(change) {
  if (!marketSellOverlay) return;

  const itemId = marketSellOverlay.dataset.sellItemId;
  const owned = marketState.inventory[itemId] || 0;

  const current = Number(marketSellOverlay.dataset.sellQuantity || 1);
  const next = Math.max(1, Math.min(owned, current + change));

  marketSellOverlay.dataset.sellQuantity = String(next);
  renderMarketSellPopup();
}

function bindMarketSellPopupButtons() {
  if (!marketSellOverlay) return;

  const closeBtn = marketSellOverlay.querySelector(".market-sell-close");
  const qtyMinusBtn = marketSellOverlay.querySelector("[data-sell-qty='-1']");
  const qtyPlusBtn = marketSellOverlay.querySelector("[data-sell-qty='1']");
  const priceMinusBtn = marketSellOverlay.querySelector("[data-sell-price='-1']");
  const pricePlusBtn = marketSellOverlay.querySelector("[data-sell-price='1']");
  const listBtn = marketSellOverlay.querySelector("#marketListItemBtn, .market-list-item-btn");

  if (closeBtn) {
    closeBtn.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeMarketSellPopup();
    };
  }

  if (qtyMinusBtn) {
    qtyMinusBtn.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      changeMarketSellQuantity(-1);
    };
  }

  if (qtyPlusBtn) {
    qtyPlusBtn.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      changeMarketSellQuantity(1);
    };
  }

  if (priceMinusBtn) {
    priceMinusBtn.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      changeMarketSellPrice(-1);
    };
  }

  if (pricePlusBtn) {
    pricePlusBtn.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      changeMarketSellPrice(1);
    };
  }

  if (listBtn) {
    listBtn.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      confirmMarketListing();
    };
  }
}

function changeMarketSellPrice(change) {
  if (!marketSellOverlay) return;

  const itemId = marketSellOverlay.dataset.sellItemId;
  const allowed = getAllowedMarketPriceRange(itemId);

  const current = Number(marketSellOverlay.dataset.sellPrice || allowed.min);
  const next = Math.max(allowed.min, Math.min(allowed.max, current + change));

  marketSellOverlay.dataset.sellPrice = String(next);
  renderMarketSellPopup();
}

function confirmMarketListing() {
  if (!marketSellOverlay) return;

  const itemId = marketSellOverlay.dataset.sellItemId;
  const item = getMarketItem(itemId);
  if (!item) return;

  const owned = marketState.inventory[itemId] || 0;
  const quantity = Number(marketSellOverlay.dataset.sellQuantity || 1);
  const price = Number(marketSellOverlay.dataset.sellPrice || 1);
  const allowed = getAllowedMarketPriceRange(itemId);

  if (quantity <= 0 || quantity > owned) {
    showToast("Market", "Invalid quantity.");
    return;
  }

  if (price < allowed.min || price > allowed.max) {
    showToast("Market", `Price must be ${allowed.min}–${allowed.max} coins.`);
    return;
  }

  marketState.inventory[itemId] = owned - quantity;

  marketState.listings.push({
    id: `player-${marketState.nextListingId}`,
    itemId,
    price,
    quantity,
    sellerId: "player",
    sellerName: "You",
    createdAt: Date.now()
  });

  marketState.nextListingId += 1;

  saveMarketState();
  closeMarketSellPopup();
  refreshInventoryIfOpen();

  showToast("Listed", `${quantity} ${item.name} listed for ${price} coins each.`);
  renderMarket();
}

function closeMarketSellPopup() {
  if (!marketSellOverlay) return;

  marketSellOverlay.classList.add("hidden");
  marketSellOverlay.innerHTML = "";
  delete marketSellOverlay.dataset.sellItemId;
  delete marketSellOverlay.dataset.sellQuantity;
  delete marketSellOverlay.dataset.sellPrice;
}

function renderMarketListings() {
  if (!marketListingsView) return;

  const playerListings = marketState.listings
    .filter((listing) => listing.sellerId === "player")
    .sort((a, b) => b.createdAt - a.createdAt);

  marketListingsView.innerHTML = `
    <div class="market-detail-panel">
      <h3>My Listings</h3>

      ${playerListings.length
        ? playerListings.map((listing) => {
          const item = getMarketItem(listing.itemId);

          return `
            <div class="market-price-tier-row">
              <div>
                <strong>${item ? `${item.icon} ${escapeHtml(item.name)}` : escapeHtml(listing.itemId)}</strong>
                <span>${formatNumber(listing.quantity)} listed · ${formatNumber(listing.price)} coins each</span>
              </div>

              <button data-cancel-listing-id="${escapeAttribute(listing.id)}" type="button">
                Cancel
              </button>
            </div>
          `;
        }).join("")
        : `<div class="market-empty">You do not have any active listings.</div>`}
    </div>
  `;
}

/* ----------------------------- */
/* INVENTORY SYSTEM */
/* ----------------------------- */

function initInventoryUi() {
  if (!inventoryScreen) return;

  if (inventoryBackBtn) {
    inventoryBackBtn.addEventListener("click", () => {
      closeInventory();
    });
  }

  inventoryScreen.addEventListener("click", handleInventoryClick);
  inventoryScreen.addEventListener("pointerdown", handleInventoryPointerDown);
  inventoryScreen.addEventListener("pointerup", clearInventoryLongPress);
  inventoryScreen.addEventListener("pointerleave", clearInventoryLongPress);
  inventoryScreen.addEventListener("pointercancel", clearInventoryLongPress);

  ensureInventorySpecialDefaults();
}

function ensureInventorySpecialDefaults() {
  if (!marketState || !marketState.inventory) return;

  if (marketState.inventory.legendary_boost === undefined) {
    marketState.inventory.legendary_boost = 1;
  }

  if (marketState.inventory.wizard_title_token === undefined) {
    marketState.inventory.wizard_title_token = 1;
  }

  saveMarketState();
}

function openInventory() {
  if (!inventoryScreen) return;

  hideSubmenus();
  hideMenuHome();

  inventoryScreen.classList.remove("hidden");

  activeInventoryCategory = activeInventoryCategory || "resources";
  selectedInventoryItemId = null;

  showInventoryListView();
  renderInventory();
}

function closeInventory() {
  if (inventoryScreen) inventoryScreen.classList.add("hidden");
  showMenuHome();
}

function handleInventoryClick(event) {
  const tab = event.target.closest(".inventory-tab");
  if (tab) {
    activeInventoryCategory = tab.dataset.inventoryCategory || "resources";
    selectedInventoryItemId = null;
    showInventoryListView();
    renderInventory();
    return;
  }

  const detailsBack = event.target.closest(".inventory-details-back");
  if (detailsBack) {
    selectedInventoryItemId = null;
    showInventoryListView();
    renderInventory();
    return;
  }

  const sellButton = event.target.closest("[data-inventory-sell-item-id]");
  if (sellButton) {
    const itemId = sellButton.dataset.inventorySellItemId;
    openInventorySellPopup(itemId);
    return;
  }

  const buyButton = event.target.closest("[data-inventory-buy-item-id]");
  if (buyButton) {
    const itemId = buyButton.dataset.inventoryBuyItemId;
    openInventoryBuyPrompt(itemId);
    return;
  }

  const itemCard = event.target.closest("[data-inventory-item-id]");
  if (itemCard) {
    if (inventoryLongPressTriggered) {
      inventoryLongPressTriggered = false;
      return;
    }

    openInventoryDetails(itemCard.dataset.inventoryItemId);
  }
}

function handleInventoryPointerDown(event) {
  const itemCard = event.target.closest("[data-inventory-item-id]");
  if (!itemCard) return;

  clearInventoryLongPress();

  const itemId = itemCard.dataset.inventoryItemId;

  inventoryLongPressTimer = setTimeout(() => {
    inventoryLongPressTriggered = true;
    openInventorySellPopup(itemId);
  }, INVENTORY_LONG_PRESS_MS);
}

function clearInventoryLongPress() {
  if (inventoryLongPressTimer) {
    clearTimeout(inventoryLongPressTimer);
    inventoryLongPressTimer = null;
  }

  setTimeout(() => {
    inventoryLongPressTriggered = false;
  }, 80);
}

function showInventoryListView() {
  if (inventoryListView) inventoryListView.classList.remove("hidden");
  if (inventoryDetailsView) inventoryDetailsView.classList.add("hidden");
}

function showInventoryDetailsView() {
  if (inventoryListView) inventoryListView.classList.add("hidden");
  if (inventoryDetailsView) inventoryDetailsView.classList.remove("hidden");
}

function renderInventory() {
  if (!inventoryGrid) return;

  inventoryScreen.querySelectorAll(".inventory-tab").forEach((tab) => {
    tab.classList.toggle(
      "active",
      tab.dataset.inventoryCategory === activeInventoryCategory
    );
  });

  const items = getInventoryItemsForCategory(activeInventoryCategory);

  if (!items.length) {
    inventoryGrid.innerHTML = `
      <div class="inventory-empty">
        No ${escapeHtml(activeInventoryCategory)} items yet.
      </div>
    `;
    return;
  }

  inventoryGrid.innerHTML = items.map(renderInventoryCard).join("");
}

function getInventoryItemsForCategory(category) {
  const inventory = marketState?.inventory || {};

  let baseItems = [];

  if (category === "special") {
    baseItems = INVENTORY_SPECIAL_ITEMS;
  } else {
    baseItems = MARKET_ITEMS.filter((item) => item.category === category);
  }

  return baseItems
    .map((item) => {
      const fullItem = getInventoryItem(item.id);
      if (!fullItem) return null;

      return {
        ...fullItem,
        quantity: Number(inventory[item.id] || 0)
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.quantity > 0 && b.quantity <= 0) return -1;
      if (a.quantity <= 0 && b.quantity > 0) return 1;
      return a.name.localeCompare(b.name);
    });
}

function getInventoryItem(itemId) {
  const marketItem = getMarketItem(itemId);

  if (marketItem) {
    return {
      ...marketItem,
      sellable: true,
      description: INVENTORY_DESCRIPTIONS[itemId] || "A useful GrowGo item."
    };
  }

  const specialItem = INVENTORY_SPECIAL_ITEMS.find((item) => item.id === itemId);

  if (specialItem) {
    return specialItem;
  }

  return null;
}

function renderInventoryCard(item) {
  const rarityClass = String(item.rarity || "common").toLowerCase();
  const isGhost = Number(item.quantity || 0) <= 0;

  let hintText = "Unsellable";

  if (item.sellable && isGhost) {
    hintText = "Long press to buy";
  } else if (item.sellable) {
    hintText = "Long press to sell";
  }

  return `
    <button
      class="inventory-card ${item.sellable ? "" : "unsellable"} ${isGhost ? "inventory-ghost-card" : ""}"
      data-inventory-item-id="${escapeAttribute(item.id)}"
      type="button"
    >
      <div class="inventory-qty">x${formatNumber(item.quantity)}</div>
      <div class="inventory-icon">${item.icon}</div>
      <div class="inventory-name">${escapeHtml(item.name)}</div>
      <div class="inventory-rarity ${escapeAttribute(rarityClass)}">
        ${escapeHtml(item.rarity)}
      </div>
      <div class="inventory-desc">${escapeHtml(item.description || "")}</div>
      <div class="${item.sellable ? "inventory-sell-hint" : "inventory-locked-hint"}">
        ${hintText}
      </div>
    </button>
  `;
}
function openInventoryDetails(itemId) {
  const item = getInventoryItem(itemId);
  if (!item || !inventoryDetailsCard) return;

  selectedInventoryItemId = itemId;
  showInventoryDetailsView();

  const quantity = marketState.inventory[itemId] || 0;
  const rarityClass = String(item.rarity || "common").toLowerCase();

  inventoryDetailsCard.innerHTML = `
    <div class="inventory-detail-hero">
      <div class="inventory-detail-icon">${item.icon}</div>

      <div class="inventory-detail-info">
        <h3>${escapeHtml(item.name)}</h3>
        <div class="inventory-rarity ${escapeAttribute(rarityClass)}">
          ${escapeHtml(item.rarity)}
        </div>
        <div class="inventory-detail-meta">
          Owned: x${formatNumber(quantity)}
        </div>
      </div>
    </div>

    <div class="inventory-detail-section">
      <span>Description</span>
      <p>${escapeHtml(item.description || "A GrowGo inventory item.")}</p>
    </div>

    <div class="inventory-detail-section">
      <span>Category</span>
      <strong>${escapeHtml(capitalizeInventoryText(item.category))}</strong>
    </div>

    <div class="inventory-detail-section">
      <span>Status</span>
      <strong>${item.sellable ? "Sellable on the Market" : "Unsellable special item"}</strong>
    </div>

    ${item.sellable && quantity > 0
      ? `
        <div class="inventory-actions">
          <button
            class="inventory-primary-btn"
            data-inventory-sell-item-id="${escapeAttribute(item.id)}"
            type="button"
          >
            Sell on Market
          </button>
        </div>
      `
      : item.sellable
        ? `
          <div class="inventory-actions">
            <button
              class="inventory-primary-btn"
              data-inventory-buy-item-id="${escapeAttribute(item.id)}"
              type="button"
            >
              Buy from Market
            </button>
          </div>
        `
        : `
          <div class="inventory-disabled-note">
            Special rewards and legendary boosts cannot be sold.
          </div>
        `}
  `;
}
function openInventorySellPopup(itemId) {
  const item = getInventoryItem(itemId);
  if (!item) return;

  if (!item.sellable) {
    showToast("Inventory", `${item.name} cannot be sold.`);
    return;
  }

  if (!marketState.inventory[itemId] || marketState.inventory[itemId] <= 0) {
    openInventoryBuyPrompt(itemId);
    return;
  }

  if (typeof openMarketSellPopup === "function") {
    openMarketSellPopup(itemId);
    return;
  }

  showToast("Market", "Sell popup is not available yet.");
}
function openInventoryBuyPrompt(itemId) {
  const item = getInventoryItem(itemId);
  if (!item || !item.sellable) return;

  closeInventoryBuyPrompt();

  const available = getMarketAvailableQuantity(itemId);
  const lowest = getLowestMarketListing(itemId);

  const overlay = document.createElement("div");
  overlay.id = "inventoryBuyOverlay";
  overlay.className = "inventory-buy-overlay";

  overlay.innerHTML = `
    <div class="inventory-buy-popup">
      <button class="inventory-buy-close" type="button">×</button>

      <div class="inventory-detail-hero">
        <div class="inventory-detail-icon">${item.icon}</div>

        <div class="inventory-detail-info">
          <h3>${escapeHtml(item.name)}</h3>
          <div class="inventory-rarity ${escapeAttribute(String(item.rarity || "common").toLowerCase())}">
            ${escapeHtml(item.rarity)}
          </div>
          <div class="inventory-detail-meta">
            You currently own x0
          </div>
        </div>
      </div>

      <div class="inventory-buy-message">
        Would you like to buy this item from the market?
      </div>

      <div class="inventory-buy-market-info">
        ${available > 0 && lowest
          ? `${formatNumber(available)} available · lowest price ${formatNumber(lowest.price)} coins`
          : "No active listings right now, but you can still view the market page."}
      </div>

      <div class="inventory-buy-actions">
        <button class="inventory-secondary-btn" data-inventory-buy-cancel type="button">
          Not Now
        </button>

        <button class="inventory-primary-btn" data-inventory-buy-confirm="${escapeAttribute(item.id)}" type="button">
          Buy from Market
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (event) => {
    if (
      event.target === overlay ||
      event.target.closest(".inventory-buy-close") ||
      event.target.closest("[data-inventory-buy-cancel]")
    ) {
      closeInventoryBuyPrompt();
      return;
    }

    const confirmButton = event.target.closest("[data-inventory-buy-confirm]");
    if (confirmButton) {
      openMarketForInventoryBuy(confirmButton.dataset.inventoryBuyConfirm);
    }
  });
}

function closeInventoryBuyPrompt() {
  const overlay = document.getElementById("inventoryBuyOverlay");
  if (overlay) overlay.remove();
}

function openMarketForInventoryBuy(itemId) {
  const item = getMarketItem(itemId);
  if (!item) return;

  closeInventoryBuyPrompt();

  if (inventoryScreen) {
    inventoryScreen.classList.add("hidden");
  }

  openMarket();

  selectedMarketItemId = itemId;
  selectedMarketBuyQuantity = 1;

  const lowest = getLowestMarketListing(itemId);

  if (lowest) {
    selectedMarketPrice = lowest.price;
    showMarketBuyView();
  } else {
    selectedMarketPrice = null;
    showMarketDetailsView();
  }
}
function refreshInventoryIfOpen() {
  if (!inventoryScreen || inventoryScreen.classList.contains("hidden")) return;

  if (inventoryDetailsView && !inventoryDetailsView.classList.contains("hidden") && selectedInventoryItemId) {
    openInventoryDetails(selectedInventoryItemId);
    return;
  }

  renderInventory();
}

function capitalizeInventoryText(value) {
  const text = String(value || "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
function cancelMarketListing(listingId) {
  const listing = marketState.listings.find((entry) => entry.id === listingId);

  if (!listing || listing.sellerId !== "player") {
    showToast("Market", "Listing not found.");
    return;
  }

  marketState.inventory[listing.itemId] =
    (marketState.inventory[listing.itemId] || 0) + listing.quantity;

  marketState.listings = marketState.listings.filter((entry) => entry.id !== listingId);

   saveMarketState();
  refreshInventoryIfOpen();

  const item = getMarketItem(listing.itemId);
  showToast("Listing cancelled", `${listing.quantity} ${item ? item.name : "items"} returned to inventory.`);

  renderMarketListings();
}

function addMarketCoins(amount) {
  if (!marketState) return;

  marketState.wallet = Math.max(0, Number(marketState.wallet || 0) + Number(amount || 0));
  saveMarketState();
  renderMarketWallet();
  renderPlayerOverview();

  if (marketScreen && !marketScreen.classList.contains("hidden")) {
    renderMarket();
  }
}

function getMarketItem(itemId) {
  return MARKET_ITEMS.find((item) => item.id === itemId);
}

function getMarketValue(itemId) {
  const recentSales = marketState.sales
    .filter((sale) => sale.itemId === itemId)
    .slice(-20);

  if (recentSales.length) {
    const totalValue = recentSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalQuantity = recentSales.reduce((sum, sale) => sum + sale.quantity, 0);

    if (totalQuantity > 0) {
      return Math.max(1, Math.round(totalValue / totalQuantity));
    }
  }

  const lowestListing = getLowestMarketListing(itemId);

  if (lowestListing) {
    return Math.max(1, Math.round(lowestListing.price));
  }

  const item = getMarketItem(itemId);
  const base = item ? MARKET_CATEGORY_BASE_PRICES[item.category] : 20;

  return Math.max(1, Math.round(base || 20));
}

function getAllowedMarketPriceRange(itemId) {
  const value = getMarketValue(itemId);

  return {
    min: Math.max(1, Math.round(value * 0.95)),
    max: Math.max(1, Math.round(value * 1.05))
  };
}

function getLowestMarketListing(itemId) {
  const listings = marketState.listings
    .filter((listing) => listing.itemId === itemId && listing.quantity > 0)
    .sort((a, b) => a.price - b.price || a.createdAt - b.createdAt);

  return listings[0] || null;
}

function getMarketPriceTiers(itemId) {
  const tiers = new Map();

  marketState.listings
    .filter((listing) => listing.itemId === itemId && listing.quantity > 0)
    .forEach((listing) => {
      const current = tiers.get(listing.price) || 0;
      tiers.set(listing.price, current + listing.quantity);
    });

  return Array.from(tiers.entries())
    .map(([price, quantity]) => ({ price, quantity }))
    .sort((a, b) => a.price - b.price);
}

function getMarketAvailableQuantity(itemId) {
  return marketState.listings
    .filter((listing) => listing.itemId === itemId)
    .reduce((sum, listing) => sum + listing.quantity, 0);
}

function getMarketAvailableQuantityAtPrice(itemId, price) {
  return marketState.listings
    .filter((listing) => listing.itemId === itemId && listing.price === price)
    .reduce((sum, listing) => sum + listing.quantity, 0);
}
/* ----------------------------- */
/* TRUSTED UTC TIME */
/* ----------------------------- */

async function syncTrustedTime() {
  try {
    const requestStartedAt = Date.now();

    const response = await fetch(TRUSTED_TIME_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Trusted time request failed");
    }

    const data = await response.json();

    const serverIsoTime = data.dateTime.endsWith("Z")
      ? data.dateTime
      : data.dateTime + "Z";

    const serverTimeMs = new Date(serverIsoTime).getTime();

    if (Number.isNaN(serverTimeMs)) {
      throw new Error("Invalid trusted time response");
    }

    const requestFinishedAt = Date.now();
    const estimatedLatency = (requestFinishedAt - requestStartedAt) / 2;

    trustedTimeOffsetMs = serverTimeMs + estimatedLatency - requestFinishedAt;
    trustedTimeReady = true;
    lastUtcDayKey = getUtcDayKey(getTrustedNow());
  } catch (error) {
    console.warn("Trusted time sync failed:", error);
    trustedTimeReady = false;
    lastUtcDayKey = getUtcDayKey(Date.now());
    showToast("Time sync failed", "Using device time for this test build.");
  }
}

function getTrustedNow() {
  if (!trustedTimeReady) return Date.now();
  return Date.now() + trustedTimeOffsetMs;
}

function getUtcDayKey(timestamp) {
  const date = new Date(timestamp);
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
}

function getTimeUntilNextGmtDay() {
  const nowMs = getTrustedNow();
  const now = new Date(nowMs);

  const nextUtcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );

  const diff = Math.max(0, nextUtcMidnight - nowMs);

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
}

function startGmtResetClock() {
  const clockEl = document.getElementById("gmtResetClock");
  if (!clockEl) return;

  function updateClock() {
    const now = getTrustedNow();
    const currentUtcDayKey = getUtcDayKey(now);

    clockEl.textContent = `Reset: ${getTimeUntilNextGmtDay()}`;

    if (lastUtcDayKey && currentUtcDayKey !== lastUtcDayKey) {
      lastUtcDayKey = currentUtcDayKey;
      resetTodayStatsIfNeeded();
      clearPinIconCache();
      scheduleRedrawPins();
    }
  }

  updateClock();

  if (gmtClockTimer) {
    clearInterval(gmtClockTimer);
  }

  gmtClockTimer = setInterval(updateClock, 1000);
}

/* ----------------------------- */
/* MAP SETUP */
/* ----------------------------- */

function initMap() {
  map = L.map("map", {
    zoomControl: false,
    doubleClickZoom: false,
    preferCanvas: true
  }).setView(DEFAULT_CENTER, 17);


  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  pinsLayer = L.layerGroup().addTo(map);

  map.on("moveend zoomend", () => {
    scheduleRedrawPins();
    requestRoadPinsForCurrentView(false);
  });

  map.on("click", closeMenu);
  map.on("dblclick", recenterMapOnPlayer);
}

function recenterMapOnPlayer(event) {
  if (event?.originalEvent) {
    L.DomEvent.preventDefault(event.originalEvent);
  }

  if (!playerLatLng) {
    showToast("Location", "Player location not ready yet.");
    return;
  }

  closeMenu();
  map.setView(playerLatLng, Math.max(map.getZoom(), 18), {
    animate: true
  });
}

/* ----------------------------- */
/* UI */
/* ----------------------------- */

function initBasicUi() {
  if (avatarButton) {
    avatarButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleMenu();
    });
  }

  if (menuOverlay) {
    menuOverlay.addEventListener("click", closeMenu);
  }

  if (sideMenu) {
    sideMenu.addEventListener("click", (event) => {
      const button = event.target.closest(".menu-btn");
      if (!button) return;

      const rawLabel = button.innerText || button.textContent || "";
      const label = rawLabel.trim().toLowerCase();

      if (label.includes("stats")) {
        openStats();
        return;
      }

      if (label.includes("leaders")) {
        openLeaders();
        return;
      }

      if (label.includes("social") || button.id === "socialBtn") {
        openSocial();
        return;
      }

      if (label.includes("crafting")) {
        openCrafting();
        return;
      }

      if (label.includes("market") || button.id === "marketBtn") {
        openMarket();
        return;
      }

      if (label.includes("inventory") || button.id === "inventoryBtn") {
        openInventory();
        return;
      }

      if (label.includes("collections")) {
        openCollections();
        return;
      }

      if (label.includes("settings")) {
        openSettings();
        return;
      }

      showToast("Coming soon", `${rawLabel.trim()} screen is wired for the next build.`);
    });

    setupMenuBackSwipe();
  }
}

function setupMenuBackSwipe() {
  if (!sideMenu) return;

  const SWIPE_BACK_MIN_X = 36;
  const SWIPE_BACK_TRIGGER_X = 48;
  const SWIPE_BACK_MAX_Y = 82;
  const SWIPE_BACK_RATIO = 0.72;

  function shouldIgnoreMenuBackSwipe(target) {
    if (!target || typeof target.closest !== "function") return false;

    return !!target.closest(
      "#profileSwipeCard, input, textarea, select, .market-sell-overlay, .inventory-buy-overlay, .social-party-overlay, .friends-overlay, .players-met-overlay, .add-friend-overlay"
    );
  }

  function handleSwipeStart(startX, startY, target) {
    if (shouldIgnoreMenuBackSwipe(target)) {
      menuBackSwipeStartX = 0;
      menuBackSwipeStartY = 0;
      menuBackSwipeActive = false;
      return;
    }

    menuBackSwipeStartX = startX;
    menuBackSwipeStartY = startY;
    menuBackSwipeActive = true;
  }

  function resetMenuBackSwipe() {
    menuBackSwipeStartX = 0;
    menuBackSwipeStartY = 0;
    menuBackSwipeActive = false;
  }

  function isMenuBackSwipe(diffX, diffY, minX) {
    if (diffX < minX) return false;
    if (Math.abs(diffY) > SWIPE_BACK_MAX_Y) return false;
    return Math.abs(diffX) >= Math.abs(diffY) * SWIPE_BACK_RATIO;
  }

  function handleSwipeMove(currentX, currentY) {
    if (!menuBackSwipeActive) return;

    const diffX = currentX - menuBackSwipeStartX;
    const diffY = currentY - menuBackSwipeStartY;

    if (!isMenuBackSwipe(diffX, diffY, SWIPE_BACK_TRIGGER_X)) return;

    resetMenuBackSwipe();
    navigateMenuBackOnePage();
  }

  function handleSwipeEnd(endX, endY) {
    if (!menuBackSwipeActive) return;

    const diffX = endX - menuBackSwipeStartX;
    const diffY = endY - menuBackSwipeStartY;

    resetMenuBackSwipe();

    if (isMenuBackSwipe(diffX, diffY, SWIPE_BACK_MIN_X)) {
      navigateMenuBackOnePage();
    }
  }

  sideMenu.addEventListener("touchstart", (event) => {
    if (!event.touches || event.touches.length !== 1) return;
    handleSwipeStart(event.touches[0].clientX, event.touches[0].clientY, event.target);
  }, { passive: true });

  sideMenu.addEventListener("touchmove", (event) => {
    if (!event.touches || event.touches.length !== 1) return;
    handleSwipeMove(event.touches[0].clientX, event.touches[0].clientY);
  }, { passive: true });

  sideMenu.addEventListener("touchend", (event) => {
    if (!event.changedTouches || event.changedTouches.length !== 1) return;
    handleSwipeEnd(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
  }, { passive: true });

  sideMenu.addEventListener("touchcancel", () => {
    resetMenuBackSwipe();
  }, { passive: true });

  sideMenu.addEventListener("mousedown", (event) => {
    handleSwipeStart(event.clientX, event.clientY, event.target);
  });

  sideMenu.addEventListener("mousemove", (event) => {
    handleSwipeMove(event.clientX, event.clientY);
  });

  sideMenu.addEventListener("mouseup", (event) => {
    handleSwipeEnd(event.clientX, event.clientY);
  });

  sideMenu.addEventListener("mouseleave", () => {
    resetMenuBackSwipe();
  });

  sideMenu.addEventListener("pointerdown", (event) => {
    if (menuBackSwipePointerId !== null) return;
    menuBackSwipePointerId = event.pointerId;
    handleSwipeStart(event.clientX, event.clientY, event.target);
  });

  sideMenu.addEventListener("pointermove", (event) => {
    if (menuBackSwipePointerId !== event.pointerId) return;
    handleSwipeMove(event.clientX, event.clientY);
  });

  sideMenu.addEventListener("pointerup", (event) => {
    if (menuBackSwipePointerId !== event.pointerId) return;
    menuBackSwipePointerId = null;
    handleSwipeEnd(event.clientX, event.clientY);
  });

  sideMenu.addEventListener("pointercancel", () => {
    menuBackSwipePointerId = null;
    resetMenuBackSwipe();
  });
}

function navigateMenuBackOnePage() {
  if (!sideMenu || !sideMenu.classList.contains("open")) return false;

  if (marketScreen && !marketScreen.classList.contains("hidden")) {
    if (marketBuyView && !marketBuyView.classList.contains("hidden")) {
      showMarketDetailsView();
      return true;
    }

    if (
      (marketItemDetailsView && !marketItemDetailsView.classList.contains("hidden")) ||
      (marketListingsView && !marketListingsView.classList.contains("hidden"))
    ) {
      showMarketItemsView();
      return true;
    }

    closeMarket();
    return true;
  }

  if (inventoryScreen && !inventoryScreen.classList.contains("hidden")) {
    if (inventoryDetailsView && !inventoryDetailsView.classList.contains("hidden")) {
      selectedInventoryItemId = null;
      showInventoryListView();
      renderInventory();
      return true;
    }

    closeInventory();
    return true;
  }

  if (craftingScreen && !craftingScreen.classList.contains("hidden")) {
    if (recipeDetailsPanel && !recipeDetailsPanel.classList.contains("hidden")) {
      closeRecipeDetails();
      return true;
    }

    closeRecipeDetails();
    craftingScreen.classList.add("hidden");
    showMenuHome();
    return true;
  }

  if (statsScreen && !statsScreen.classList.contains("hidden")) {
    statsScreen.classList.add("hidden");
    showMenuHome();
    return true;
  }

  if (leadersScreen && !leadersScreen.classList.contains("hidden")) {
    leadersScreen.classList.add("hidden");
    showMenuHome();
    return true;
  }

  if (socialScreen && !socialScreen.classList.contains("hidden")) {
    socialScreen.classList.add("hidden");
    showMenuHome();
    return true;
  }

  if (settingsScreen && !settingsScreen.classList.contains("hidden")) {
    settingsScreen.classList.add("hidden");
    showMenuHome();
    return true;
  }

  if (collectionsScreen && !collectionsScreen.classList.contains("hidden")) {
    collectionsScreen.classList.add("hidden");
    showMenuHome();
    return true;
  }

  return false;
}

function toggleMenu() {
  if (!sideMenu || !menuOverlay) return;

  const isOpen = sideMenu.classList.toggle("open");

  menuOverlay.classList.toggle("open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
}

function closeMenu() {
  if (sideMenu) sideMenu.classList.remove("open");
  if (menuOverlay) menuOverlay.classList.remove("open");

  document.body.classList.remove("menu-open");
}

function hideMenuHome() {
  if (menuHome) menuHome.classList.add("hidden");
}

function showMenuHome() {
  if (menuHome) menuHome.classList.remove("hidden");
}

function hideSubmenus() {
  if (statsScreen) statsScreen.classList.add("hidden");
  if (leadersScreen) leadersScreen.classList.add("hidden");
  if (socialScreen) socialScreen.classList.add("hidden");
  if (craftingScreen) craftingScreen.classList.add("hidden");
  if (marketScreen) marketScreen.classList.add("hidden");
  if (inventoryScreen) inventoryScreen.classList.add("hidden");
  if (settingsScreen) settingsScreen.classList.add("hidden");
  if (collectionsScreen) collectionsScreen.classList.add("hidden");
}

function openCollections() {
  if (!collectionsScreen) return;

  hideSubmenus();
  hideMenuHome();
  renderCollections();
  collectionsScreen.classList.remove("hidden");
}

function renderCollections() {
  renderOwnedPinsCollection();
}

function renderOwnedPinsCollection() {
  if (!ownedPinsList || !ownedPinsCount) return;

  const activePlayerId = getActivePlayerId();
  const ownedPins = Array.from(pinStore.values())
    .filter((pin) => pin.ownerId === activePlayerId)
    .sort((a, b) => {
      const levelDiff = getBasePinLevel(b) - getBasePinLevel(a);
      if (levelDiff) return levelDiff;
      return Number(b.ownedAt || 0) - Number(a.ownedAt || 0);
    });

  ownedPinsCount.textContent = `${ownedPins.length} owned`;
  const pendingTotal = getOwnedPinsPendingTotal(ownedPins);

  if (ownedPinsPendingTotal) {
    ownedPinsPendingTotal.textContent = `${formatNumber(pendingTotal)} pts`;
  }

  if (claimOwnedPinRewardsBtn) {
    claimOwnedPinRewardsBtn.disabled = pendingTotal <= 0;
  }

  if (!ownedPins.length) {
    ownedPinsList.innerHTML = `
      <div class="owned-pins-empty">
        Long-press a base pin on the map to purchase your first owned pin.
      </div>
    `;
    return;
  }

  ownedPinsList.innerHTML = ownedPins.map(renderOwnedPinCard).join("");
}

function renderOwnedPinCard(pin) {
  const level = getBasePinLevel(pin);
  const levelInfo = getBasePinLevelInfo(level);
  const plantLabel = pin.plant ? getPlantStageLabel(pin.plant) : "No plant";
  const plantTiming = pin.plant ? getPlantTimingLabel(pin.plant) : "Plant a seed to start growing";
  const pending = Number(pin.ownerPendingPoints || 0);
  const replant = pin.replantEnabled ? "On" : "Off";
  const distance = getDistanceToPinLabel(pin);

  return `
    <div class="owned-pin-card" data-owned-pin-id="${escapeAttribute(pin.id)}">
      <div class="owned-pin-topline">
        <div>
          <h4>Base Pin</h4>
          <div class="owned-pin-coords">${Number(pin.lat).toFixed(5)}, ${Number(pin.lng).toFixed(5)}</div>
        </div>
        <span class="owned-pin-level ${escapeAttribute(levelInfo.className)}">
          Lv ${level} ${escapeHtml(levelInfo.name)}
        </span>
      </div>

      <div class="owned-pin-detail-row">
        <span>Plant</span>
        <strong>${escapeHtml(plantLabel)}</strong>
      </div>
      <div class="owned-pin-detail-row">
        <span>Growth</span>
        <strong>${escapeHtml(plantTiming)}</strong>
      </div>
      <div class="owned-pin-detail-row">
        <span>Replant</span>
        <strong>${escapeHtml(replant)}</strong>
      </div>
      <div class="owned-pin-detail-row">
        <span>Pending rewards</span>
        <strong>${formatNumber(pending)} pts</strong>
      </div>
      <div class="owned-pin-detail-row">
        <span>Distance</span>
        <strong>${escapeHtml(distance)}</strong>
      </div>
      <div class="owned-pin-actions">
        <button data-owned-pin-manage="${escapeAttribute(pin.id)}" type="button">Manage</button>
        <button data-owned-pin-go="${escapeAttribute(pin.id)}" type="button">Go to pin</button>
      </div>
    </div>
  `;
}

function initCollectionsUi() {
  if (!collectionsScreen) return;

  collectionsScreen.addEventListener("click", (event) => {
    if (event.target.closest("#claimOwnedPinRewardsBtn")) {
      claimOwnedPinRewards();
      return;
    }

    const manageButton = event.target.closest("[data-owned-pin-manage]");
    if (manageButton) {
      openOwnedPinFromCollections(manageButton.dataset.ownedPinManage);
      return;
    }

    const goButton = event.target.closest("[data-owned-pin-go]");
    if (goButton) {
      goToOwnedPin(goButton.dataset.ownedPinGo);
    }
  });
}

function getDistanceToPinLabel(pin) {
  if (!playerLatLng) return "Location needed";

  const distance = playerLatLng.distanceTo([pin.lat, pin.lng]);
  if (distance >= 1000) return `${(distance / 1000).toFixed(2)} km`;
  return `${Math.round(distance)} m`;
}

function getOwnedPinsForActivePlayer() {
  const activePlayerId = getActivePlayerId();
  return Array.from(pinStore.values()).filter((pin) => pin.ownerId === activePlayerId);
}

function getOwnedPinsPendingTotal(ownedPins = getOwnedPinsForActivePlayer()) {
  return ownedPins.reduce((total, pin) => total + Number(pin.ownerPendingPoints || 0), 0);
}

function claimOwnedPinRewards() {
  const ownedPins = getOwnedPinsForActivePlayer();
  const pendingTotal = getOwnedPinsPendingTotal(ownedPins);

  if (pendingTotal <= 0) {
    showToast("Owned Pins", "No rewards ready to claim.");
    return;
  }

  ownedPins.forEach((pin) => {
    pin.ownerPendingPoints = 0;
  });

  addStat("score", pendingTotal);
  addPlayerXp(pendingTotal);
  scheduleSavePinsToLocal();
  renderCollections();
  showToast("Rewards claimed", `+${formatNumber(pendingTotal)} points and XP.`);
}

function openOwnedPinFromCollections(pinId) {
  const pin = pinStore.get(pinId);
  if (!pin || pin.ownerId !== getActivePlayerId()) return;

  openBasePinPlantPopup(pin);
}

function goToOwnedPin(pinId) {
  const pin = pinStore.get(pinId);
  if (!pin) return;

  closeBasePinPopup();
  closeMenu();
  map.setView([pin.lat, pin.lng], Math.max(map.getZoom(), 18), {
    animate: true
  });
}

function initSettingsUi() {
  if (soundEffectsToggle) {
    soundEffectsToggle.addEventListener("click", () => {
      setPlayerPreference("soundEffects", !playerState.settings.soundEffects);
    });
  }

  if (vibrationToggle) {
    vibrationToggle.addEventListener("click", () => {
      setPlayerPreference("vibration", !playerState.settings.vibration);
    });
  }

  if (copyBackupBtn) {
    copyBackupBtn.addEventListener("click", () => {
      copyLocalBackup();
    });
  }

  if (downloadBackupBtn) {
    downloadBackupBtn.addEventListener("click", () => {
      downloadLocalBackup();
    });
  }

  if (restoreBackupBtn && restoreBackupInput) {
    restoreBackupBtn.addEventListener("click", () => {
      restoreBackupInput.click();
    });

    restoreBackupInput.addEventListener("change", () => {
      handleRestoreBackupFile(restoreBackupInput.files && restoreBackupInput.files[0]);
      restoreBackupInput.value = "";
    });
  }

  if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener("click", () => {
      if (menuAvatarInput) {
        menuAvatarInput.click();
      }
    });
  }

  if (clearAvatarBtn) {
    clearAvatarBtn.addEventListener("click", () => {
      playerState.avatarSrc = null;
      savePlayerState();
      clearAvatar();
      renderSocialScreen();
      updatePlayerMarkerIcon();
      showToast("Avatar cleared", "Profile picture removed from this device.");
    });
  }

  if (advanceCropsBtn) {
    advanceCropsBtn.addEventListener("click", () => {
      advanceOwnedCropTestStage(false);
    });
  }

  if (readyCropsBtn) {
    readyCropsBtn.addEventListener("click", () => {
      advanceOwnedCropTestStage(true);
    });
  }

  if (resetLocalProgressBtn) {
    resetLocalProgressBtn.addEventListener("click", () => {
      if (!window.confirm("Reset local progress on this device?")) return;
      resetLocalProgress();
    });
  }
}

function openSettings() {
  if (!settingsScreen) return;

  hideSubmenus();
  hideMenuHome();
  renderSettings();
  settingsScreen.classList.remove("hidden");
}

function renderSettings() {
  if (settingsPlayerName) {
    settingsPlayerName.textContent = playerState.name || DEFAULT_PLAYER_NAME;
  }

  if (settingsPlayerId) {
    settingsPlayerId.textContent = getOrCreateGrowGoPlayerId();
  }

  renderSettingsToggles();
}

function setPlayerPreference(key, enabled) {
  playerState.settings = {
    ...createDefaultPlayerState().settings,
    ...(playerState.settings || {}),
    [key]: Boolean(enabled)
  };

  savePlayerState();
  renderSettingsToggles();
}

function renderSettingsToggles() {
  renderSettingsToggle(soundEffectsToggle, playerState.settings.soundEffects);
  renderSettingsToggle(vibrationToggle, playerState.settings.vibration);
}

function renderSettingsToggle(button, enabled) {
  if (!button) return;

  button.classList.toggle("off", !enabled);
  button.setAttribute("aria-pressed", enabled ? "true" : "false");

  const stateLabel = button.querySelector("strong");
  if (stateLabel) {
    stateLabel.textContent = enabled ? "On" : "Off";
  }
}

function advanceOwnedCropTestStage(makeReady = false) {
  const plantedPins = getOwnedPinsForActivePlayer().filter((pin) => pin.plant?.plantedAt);

  if (!plantedPins.length) {
    showToast("Farming test", "No planted owned pins to advance.");
    return;
  }

  const now = getTrustedNow();
  const stageMs = PIN_PLANT_STAGE_HOURS * 60 * 60 * 1000;

  plantedPins.forEach((pin) => {
    const currentStage = getPinPlantStage(pin);
    const nextStage = makeReady ? 4 : Math.min(4, currentStage + 1);
    const stageAge = nextStage >= 4 ? stageMs * 3 : stageMs * (nextStage - 1);

    pin.plant.plantedAt = now - stageAge - (60 * 1000);

    if (nextStage >= 4 && pin.plant.harvestedByDay) {
      delete pin.plant.harvestedByDay[getActivePlayerId()];
    }
  });

  scheduleSavePinsToLocal();
  clearPinIconCache();
  scheduleRedrawPins();
  renderCollections();
  showToast(
    "Farming test",
    makeReady
      ? `${plantedPins.length} crop${plantedPins.length === 1 ? "" : "s"} ready to harvest.`
      : `${plantedPins.length} crop${plantedPins.length === 1 ? "" : "s"} advanced.`
  );
}

function triggerMilestoneFeedback(pattern = [35, 45, 55]) {
  if (!playerState.settings?.vibration) return;
  if (!navigator.vibrate) return;

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.warn("Vibration feedback failed.", error);
  }
}

function triggerLevelUpFeedback() {
  triggerMilestoneFeedback([35, 45, 55]);
}

function resetLocalProgress() {
  try {
    [
      PIN_STORAGE_KEY,
      SERVER_STARTED_AT_KEY,
      AVATAR_STORAGE_KEY,
      STATS_STORAGE_KEY,
      CRAFTING_STORAGE_KEY,
      MARKET_STORAGE_KEY,
      PLAYER_STORAGE_KEY,
      GROWGO_PLAYER_ID_KEY,
      GROWGO_PROFILE_CARD_MODE_KEY,
      "growgo-players-met",
      "growgo-friends"
    ].forEach((key) => localStorage.removeItem(key));

    localStorage.setItem(PROGRESSION_RESET_KEY, PROGRESSION_RESET_VERSION);
  } catch (error) {
    console.warn("Could not reset local progress.", error);
  }

  window.location.reload();
}
/* ----------------------------- */
/* STATS UI */
/* ----------------------------- */

function initStatsUi() {
  if (statsBack) {
    statsBack.addEventListener("click", () => {
      if (statsScreen) statsScreen.classList.add("hidden");
      showMenuHome();
    });
  }

  if (statsScreen) {
    statsScreen.addEventListener("click", (event) => {
      const tab = event.target.closest(".stats-tabs .tab");
      if (!tab) return;

      statsScreen.querySelectorAll(".stats-tabs .tab").forEach((button) => {
        button.classList.remove("active");
      });

      tab.classList.add("active");
      renderStats(tab.dataset.tab);
    });
  }
}

function openStats() {
  if (!statsScreen) return;

  resetTodayStatsIfNeeded();
  hideSubmenus();
  hideMenuHome();

  statsScreen.classList.remove("hidden");

  statsScreen.querySelectorAll(".stats-tabs .tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === "today");
  });

  renderStats("today");
}

function renderStats(tabName) {
  if (!statsContent) return;

  resetTodayStatsIfNeeded();

  if (tabName === "today") {
    statsContent.innerHTML = `
      ${renderStatRow("Score", playerStats.today.score)}
      ${renderStatRow("Captures", playerStats.today.captures)}
      ${renderStatRow("Gold Earned", playerStats.today.goldEarned)}
      ${renderStatRow("Items Crafted", playerStats.today.itemsCrafted)}
      ${renderStatRow("Resources Gained", playerStats.today.resourcesGained)}
      ${renderStatRow("Quests Done", playerStats.today.questsDone)}
      ${renderStatRow("Birds Captured", playerStats.today.birdsCaptured)}
      ${renderStatRow("Fish Caught", playerStats.today.fishCaught)}
      ${renderStatRow("New POIs", playerStats.today.newPois)}
      ${renderStatRow("Players Met", playerStats.today.playersMet)}
    `;
    return;
  }

  if (tabName === "lifetime") {
    statsContent.innerHTML = `
      ${renderStatRow("Score", playerStats.lifetime.score)}
      ${renderStatRow("Captures", playerStats.lifetime.captures)}
      ${renderStatRow("Gold Earned", playerStats.lifetime.goldEarned)}
      ${renderStatRow("Items Crafted", playerStats.lifetime.itemsCrafted)}
      ${renderStatRow("Resources Gained", playerStats.lifetime.resourcesGained)}
      ${renderStatRow("Quests Done", playerStats.lifetime.questsDone)}
      ${renderStatRow("Birds Captured", playerStats.lifetime.birdsCaptured)}
      ${renderStatRow("Fish Caught", playerStats.lifetime.fishCaught)}
      ${renderStatRow("New POIs", playerStats.lifetime.newPois)}
      ${renderStatRow("Markets Attended", playerStats.lifetime.marketsAttended)}
      ${renderStatRow("Players Met", playerStats.lifetime.playersMet)}
      ${renderStatRow("#1 Local Finishes", playerStats.lifetime.localNumberOnes)}
      ${renderStatRow("#1 Regional Finishes", playerStats.lifetime.regionalNumberOnes)}
      ${renderStatRow("#1 Global Finishes", playerStats.lifetime.globalNumberOnes)}
    `;
    return;
  }

  if (tabName === "best") {
    statsContent.innerHTML = `
      ${renderBestRow("Best Score Day", playerStats.best.score)}
      ${renderBestRow("Most Captures Day", playerStats.best.captures)}
      ${renderBestRow("Most Gold Earned Day", playerStats.best.goldEarned)}
      ${renderBestRow("Most Items Crafted Day", playerStats.best.itemsCrafted)}
      ${renderBestRow("Most Resources Gained Day", playerStats.best.resourcesGained)}
      ${renderBestRow("Most Quests Done Day", playerStats.best.questsDone)}
      ${renderBestRow("Most Birds Captured Day", playerStats.best.birdsCaptured)}
      ${renderBestRow("Most Fish Caught Day", playerStats.best.fishCaught)}
      ${renderBestRow("Most New POIs Day", playerStats.best.newPois)}
      ${renderBestRow("Most Players Met Day", playerStats.best.playersMet)}
      ${renderRankRow("Best Local Rank", playerStats.best.bestLocalRank)}
      ${renderRankRow("Best Regional Rank", playerStats.best.bestRegionalRank)}
      ${renderRankRow("Best Global Rank", playerStats.best.bestGlobalRank)}
    `;
  }
}

function getStatIcon(label) {
  const icons = {
    "Score": "⭐",
    "Captures": "📍",
    "Gold Earned": "🪙",
    "Items Crafted": "🍴",
    "Resources Gained": "🌿",
    "Quests Done": "📜",
    "Birds Captured": "🐦",
    "Fish Caught": "🐟",
    "New POIs": "🗺️",
    "Players Met": "🤝",
    "Markets Attended": "🏪",
    "#1 Local Finishes": "🏆",
    "#1 Regional Finishes": "🏆",
    "#1 Global Finishes": "🏆"
  };

  return icons[label] || "✨";
}

function renderStatRow(label, value) {
  return `
    <div class="stat-card">
      <div class="stat-icon">${getStatIcon(label)}</div>
      <div class="stat-label">${escapeHtml(label)}</div>
      <div class="stat-value">${formatNumber(value)}</div>
    </div>
  `;
}

function renderBestRow(label, data) {
  const value = data?.value || 0;
  const date = data?.date || "—";

  return `
    <div class="stat-card">
      <div class="stat-icon">🏅</div>
      <div class="stat-label">${escapeHtml(label)}</div>
      <div class="stat-value">${formatNumber(value)}</div>
      <div class="stat-date">${escapeHtml(date)}</div>
    </div>
  `;
}

function renderRankRow(label, data) {
  const rank = data?.rank ? `#${data.rank}` : "—";
  const date = data?.date || "—";

  return `
    <div class="stat-card">
      <div class="stat-icon">👑</div>
      <div class="stat-label">${escapeHtml(label)}</div>
      <div class="stat-value">${escapeHtml(rank)}</div>
      <div class="stat-date">${escapeHtml(date)}</div>
    </div>
  `;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.ceil(Number(ms || 0) / (1000 * 60)));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - (days * 60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function getPlayerProgressInfo() {
  const savedProgress = {
    ...createDefaultPlayerState().progress,
    ...(playerState.progress || {})
  };
  let level = Math.max(1, Number(savedProgress.level || 1));
  let totalXp = Math.max(0, Number(savedProgress.xp || 0));

  while (totalXp >= getTotalXpForLevel(level + 1)) {
    level += 1;
  }

  const currentLevelStart = getTotalXpForLevel(level);
  const nextLevelAt = getTotalXpForLevel(level + 1);
  const currentXpIntoLevel = Math.max(0, totalXp - currentLevelStart);
  const neededThisLevel = Math.max(1, nextLevelAt - currentLevelStart);
  const percent = Math.min(100, Math.max(0, (currentXpIntoLevel / neededThisLevel) * 100));

  return {
    level,
    totalXp,
    currentXpIntoLevel,
    neededThisLevel,
    percent,
    xpToGo: Math.max(0, neededThisLevel - currentXpIntoLevel)
  };
}

function renderPlayerOverview() {
  const progress = getPlayerProgressInfo();
  const currentXp = Math.floor(progress.currentXpIntoLevel);
  const neededXp = Math.max(1, progress.neededThisLevel || 1);
  const percent = Math.max(0, Math.min(100, progress.percent || 0));
  const playerName = playerState.name || DEFAULT_PLAYER_NAME;
  const coins = Number(marketState?.wallet || 0);
  const score = Number(playerStats?.lifetime?.score || 0);

  playerState.name = playerName;
  playerState.progress = {
    ...createDefaultPlayerState().progress,
    ...(playerState.progress || {}),
    level: progress.level,
    xp: progress.totalXp,
    coins,
    score
  };
  savePlayerState();

  document.querySelectorAll(".menu-player-name").forEach((el) => {
    el.textContent = playerName;
  });

  document.querySelectorAll(".menu-level-number").forEach((el) => {
    el.textContent = progress.level;
  });

  document.querySelectorAll(".menu-xp-fill").forEach((el) => {
    el.style.width = `${percent}%`;
  });

  document.querySelectorAll(".menu-xp-text").forEach((el) => {
    el.innerHTML = `
      <span>${Math.round(percent)}%</span>
      <span>${formatNumber(currentXp)} / ${formatNumber(neededXp)} XP</span>
    `;
  });

  document.querySelectorAll(".social-profile-card strong").forEach((el) => {
    el.textContent = playerName;
  });

  renderMarketWallet();
}

/* ----------------------------- */
/* LEADERS UI */
/* ----------------------------- */

const MOCK_LEADERBOARD = [];

for (let i = 1; i <= 120; i++) {
  MOCK_LEADERBOARD.push({
    rank: i,
    name: `Player${i}`,
    score: Math.floor(Math.random() * 50000) + 1000
  });
}

MOCK_LEADERBOARD[0] = {
  rank: 1,
  name: "Godspeed1074",
  score: 128450
};

MOCK_LEADERBOARD[117] = {
  rank: 118,
  name: DEFAULT_PLAYER_NAME,
  score: 0,
  me: true
};

function initLeadersUi() {
  if (leadersBackBtn) {
    leadersBackBtn.addEventListener("click", () => {
      if (leadersScreen) leadersScreen.classList.add("hidden");
      showMenuHome();
    });
  }

  if (!leadersScreen) return;

  leadersScreen.addEventListener("click", (event) => {
    const button = event.target.closest(".seg-btn");
    if (!button) return;

    const parent = button.parentElement;

    if (parent) {
      parent.querySelectorAll(".seg-btn").forEach((btn) => {
        btn.classList.remove("active");
      });
    }

    button.classList.add("active");
    renderLeaderboard(button.dataset.board || "points");
  });
}

function openLeaders() {
  if (!leadersScreen) return;

  hideSubmenus();
  hideMenuHome();

  leadersScreen.classList.remove("hidden");
  renderLeaderboard("daily");
}

function renderLeaderboard(type) {
  if (!leaderboardList) return;

  const top100 = MOCK_LEADERBOARD.slice(0, 100);
  const currentPlayer = {
    ...(MOCK_LEADERBOARD.find((p) => p.me) || {}),
    rank: 118,
    name: playerState.name || DEFAULT_PLAYER_NAME,
    score: playerStats?.lifetime?.score || 0,
    me: true
  };

  let html = top100.map((player) => {
    const cardClass = [
      "leader-card",
      player.rank === 1 ? "champion" : "",
      player.me ? "my-rank" : ""
    ].filter(Boolean).join(" ");

    return `
      <div class="${cardClass}">
        <div class="leader-rank">#${player.rank}</div>

        <div class="leader-avatar">
          ${player.rank <= 3 ? "👑" : "🙂"}
        </div>

        <div class="leader-info">
          <strong>${escapeHtml(player.name)}</strong>
          <span>${escapeHtml(String(type || "daily").toUpperCase())} LEADERBOARD</span>
        </div>

        <div class="leader-score">
          ${player.score.toLocaleString()}
        </div>
      </div>
    `;
  }).join("");

  if (currentPlayer && currentPlayer.rank > 100) {
    html += `
      <div style="height:14px"></div>

      <div class="leader-card my-rank">
        <div class="leader-rank">#${currentPlayer.rank}</div>

        <div class="leader-avatar">⭐</div>

        <div class="leader-info">
          <strong>${escapeHtml(currentPlayer.name)}</strong>
          <span>YOUR RANK</span>
        </div>

        <div class="leader-score">
          ${currentPlayer.score.toLocaleString()}
        </div>
      </div>
    `;
  }

  leaderboardList.innerHTML = html;
}
/* ----------------------------- */
/* SOCIAL UI */
/* ----------------------------- */

function initSocialUi() {
  if (socialBackBtn) {
    socialBackBtn.addEventListener("click", () => {
      if (socialScreen) socialScreen.classList.add("hidden");
      showMenuHome();
    });
  }

  if (!socialScreen) return;

  socialScreen.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-social-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.socialAction;

    if (action === "meet") {
      openSocialMeetMock();
      return;
    }

    if (action === "friends") {
  openFriendsPopup();
  return;
}

    if (action === "party") {
      openSocialPartyPopup();
      return;
    }
if (action === "players-met") {
  openPlayersMetPopup();
  return;
}

    if (action === "guild") {
      showToast("Guild", "Guilds are coming soon.");
      return;
    }

    if (action === "create-market") {
      showToast("Create Market", "Market event hosting is coming soon.");
      return;
    }

    if (action === "nearby-markets") {
      showToast("Nearby Markets", "Nearby real-world markets are coming soon.");
      return;
    }

    if (action === "verify-attendance") {
      showToast("Verify Attendance", "Market attendance check-in is coming soon.");
      return;
    }
  });
}
function openSocialMeetMock() {
  openMeetScannerPopup();
}
function openMeetScannerPopup() {
  closeMeetScannerPopup();

  const popup = document.createElement("div");
  popup.id = "meet-scanner-popup";
  popup.className = "meet-scanner-popup";

  popup.innerHTML = `
    <h2 class="meet-scanner-title">Meet Player</h2>

    <p class="meet-scanner-text">
      Point your camera at another player's GrowGo QR code. It will scan automatically.
    </p>

    <div id="growgo-qr-reader" class="growgo-qr-reader"></div>

    <div class="meet-scanner-actions single">
  <button type="button" class="meet-scanner-close" onclick="closeMeetScannerPopup()">Close</button>
</div>
  `;

  const target = socialScreen || document.body;
  target.appendChild(popup);

  setTimeout(() => {
    startGrowGoQrScanner();
  }, 250);
}

async function startGrowGoQrScanner() {
  const readerEl = document.getElementById("growgo-qr-reader");

  if (!readerEl) {
    showToast("Meet", "QR scanner box was not found.");
    return;
  }

  if (typeof Html5Qrcode === "undefined") {
    readerEl.innerHTML = `
      <div class="meet-scanner-error">
        QR scanner library did not load. Check the html5-qrcode script in index.html.
      </div>
    `;
    showToast("Meet", "QR scanner library did not load.");
    return;
  }

  if (growGoQrScannerRunning) return;

  try {
    readerEl.innerHTML = "";

    growGoQrScanner = new Html5Qrcode("growgo-qr-reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    });

    const qrConfig = {
      fps: 15,
      qrbox: function(viewfinderWidth, viewfinderHeight) {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const boxSize = Math.floor(minEdge * 0.78);

        return {
          width: boxSize,
          height: boxSize
        };
      },
      aspectRatio: 1.0,
      disableFlip: false
    };

    await growGoQrScanner.start(
      { facingMode: "environment" },
      qrConfig,
      (decodedText) => {
        handleGrowGoQrScan(decodedText);
      },
      () => {
        // Ignore scan misses.
      }
    );

    growGoQrScannerRunning = true;
  } catch (error) {
    console.warn("Could not start GrowGo QR scanner.", error);

    readerEl.innerHTML = `
      <div class="meet-scanner-error">
        Camera could not start.<br>
        Allow camera permission, then close and reopen Meet.
      </div>
    `;

    showToast("Meet", "Camera could not start.");
  }
}
let lastBadQrToastAt = 0;

async function handleGrowGoQrScan(decodedText) {
  const scannedText = String(decodedText || "").trim();
  const scannedId = scannedText.toUpperCase();

  console.log("GrowGo QR detected:", scannedText);

  if (!/^GG[A-Z0-9]{6}$/.test(scannedId)) {
    const now = Date.now();

    if (now - lastBadQrToastAt > 2500) {
      lastBadQrToastAt = now;
      showToast("QR detected", `Not a GrowGo player code: ${scannedText.slice(0, 20)}`);
    }

    return;
  }

  if (growGoQrScannerRunning === "saving") {
    return;
  }

  growGoQrScannerRunning = "saving";

  saveMetPlayer(scannedId);

  showToast("Meet", `Player met: ${scannedId}`);

  try {
    if (growGoQrScanner) {
      await growGoQrScanner.stop();
      await growGoQrScanner.clear();
    }
  } catch (error) {
    console.warn("Could not stop QR scanner after scan.", error);
  }

  growGoQrScanner = null;
  growGoQrScannerRunning = false;

  closeMeetScannerPopup();

  if (typeof openPlayersMetPopup === "function") {
    setTimeout(() => {
      openPlayersMetPopup();
    }, 250);
  }
}

function mockScanGrowGoPlayer() {
  const fakePlayerId = `GG${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  saveMetPlayer(fakePlayerId);
  closeMeetScannerPopup();

  showToast("Meet", `Mock scanned player ${fakePlayerId}.`);
}
function saveMetPlayer(playerId) {
  try {
    const playersMet = getPlayersMet();

    if (!playersMet.some((player) => player.id === playerId)) {
      playersMet.push({
        id: playerId,
        name: `Player ${playerId}`,
        metAt: Date.now()
      });

      savePlayersMet(playersMet);
      addStat("playersMet", 1);
    }
  } catch (error) {
    console.warn("Could not save met player.", error);
  }
}

async function closeMeetScannerPopup() {
  try {
    if (growGoQrScanner && growGoQrScannerRunning) {
      await growGoQrScanner.stop();
      await growGoQrScanner.clear();
    }
  } catch (error) {
    console.warn("Could not stop QR scanner.", error);
  }

  growGoQrScanner = null;
  growGoQrScannerRunning = false;

  const popup = document.getElementById("meet-scanner-popup");
  if (popup) popup.remove();
}
function getPlayersMet() {
  try {
    const raw = localStorage.getItem("growgo-players-met");
    const players = raw ? JSON.parse(raw) : [];

    return Array.isArray(players) ? players : [];
  } catch (error) {
    console.warn("Could not load players met.", error);
    return [];
  }
}

function savePlayersMet(players) {
  try {
    localStorage.setItem("growgo-players-met", JSON.stringify(players));
  } catch (error) {
    console.warn("Could not save players met.", error);
  }
}
function getGrowGoFriends() {
  try {
    const raw = localStorage.getItem("growgo-friends");
    const friends = raw ? JSON.parse(raw) : [];

    return Array.isArray(friends) ? friends : [];
  } catch (error) {
    console.warn("Could not load friends.", error);
    return [];
  }
}

function saveGrowGoFriends(friends) {
  try {
    localStorage.setItem("growgo-friends", JSON.stringify(friends));
  } catch (error) {
    console.warn("Could not save friends.", error);
  }
}

function addGrowGoFriend(player) {
  if (!player || !player.id) return;

  const friends = getGrowGoFriends();

  if (friends.some((friend) => friend.id === player.id)) {
    showToast("Friends", `${player.name || player.id} is already in your friend list.`);
    return;
  }

  friends.push({
    id: player.id,
    name: player.name || player.id,
    addedAt: Date.now()
  });

  saveGrowGoFriends(friends);

  showToast("Friend Added", `${player.name || player.id} added to your friends.`);
}

function openPlayersMetPopup() {
  closePlayersMetPopup();

  const playersMet = getPlayersMet();

  const overlay = document.createElement("div");
  overlay.id = "playersMetOverlay";
  overlay.className = "social-party-overlay";

  overlay.innerHTML = `
    <div class="social-party-popup">
      <button class="social-party-close" type="button">×</button>

      <div class="social-party-icon">🤝</div>

      <h3>Players Met</h3>

      <div class="social-party-text">
        Players you have scanned with Meet will appear here.
      </div>

      <div class="social-party-rules">
        ${
          playersMet.length
            ? playersMet.map((player) => `
                <button
                  class="social-party-rule"
                  data-met-player-id="${escapeAttribute(player.id)}"
                  type="button"
                >
                  ${escapeHtml(player.name || player.id)}
                  <br>
                  <small>${escapeHtml(player.id)}</small>
                </button>
              `).join("")
            : `
              <div class="social-party-rule">
                No players met yet. Tap Meet to mock scan someone.
              </div>
            `
        }
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (event) => {
    if (
      event.target === overlay ||
      event.target.closest(".social-party-close")
    ) {
      closePlayersMetPopup();
      return;
    }

    const playerButton = event.target.closest("[data-met-player-id]");
    if (!playerButton) return;

    openAddFriendPrompt(playerButton.dataset.metPlayerId);
  });
}
function openFriendsPopup() {
  closeFriendsPopup();

  const friends = getGrowGoFriends();

  const overlay = document.createElement("div");
  overlay.id = "friendsOverlay";
  overlay.className = "social-party-overlay";

  overlay.innerHTML = `
    <div class="social-party-popup">
      <button class="social-party-close" type="button">×</button>

      <div class="social-party-icon">👥</div>

      <h3>Friends</h3>

      <div class="social-party-text">
        Your GrowGo friends will appear here.
      </div>

      <div class="social-party-rules">
        ${
          friends.length
            ? friends.map((friend) => `
                <div class="social-party-rule">
                  ${escapeHtml(friend.name || friend.id)}
                  <br>
                  <small>${escapeHtml(friend.id)}</small>
                </div>
              `).join("")
            : `
              <div class="social-party-rule">
                No friends yet. Tap Meet to scan a player, then add them from Players Met.
              </div>
            `
        }
      </div>

      <div class="social-party-actions">
        <button class="social-party-primary" data-open-players-met type="button">
          Players Met
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (event) => {
    if (
      event.target === overlay ||
      event.target.closest(".social-party-close")
    ) {
      closeFriendsPopup();
      return;
    }

    if (event.target.closest("[data-open-players-met]")) {
      closeFriendsPopup();
      openPlayersMetPopup();
    }
  });
}

function closeFriendsPopup() {
  const overlay = document.getElementById("friendsOverlay");
  if (overlay) overlay.remove();
}

function closePlayersMetPopup() {
  const overlay = document.getElementById("playersMetOverlay");
  if (overlay) overlay.remove();
}

function openAddFriendPrompt(playerId) {
  closeAddFriendPrompt();

  const playersMet = getPlayersMet();
  const player = playersMet.find((entry) => entry.id === playerId);

  const overlay = document.createElement("div");
  overlay.id = "addFriendOverlay";
  overlay.className = "social-party-overlay";

  overlay.innerHTML = `
    <div class="social-party-popup">
      <button class="social-party-close" type="button">×</button>

      <div class="social-party-icon">👥</div>

      <h3>Add Friend?</h3>

      <div class="social-party-text">
        Would you like to add ${escapeHtml(player?.name || playerId)} as a friend?
      </div>

      <div class="social-party-actions">
        <button class="social-party-secondary" data-add-friend-action="cancel" type="button">
          Not Now
        </button>

        <button class="social-party-primary" data-add-friend-action="add" type="button">
          Add Friend
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (event) => {
    if (
      event.target === overlay ||
      event.target.closest(".social-party-close") ||
      event.target.closest("[data-add-friend-action='cancel']")
    ) {
      closeAddFriendPrompt();
      return;
    }

    const addButton = event.target.closest("[data-add-friend-action='add']");
    if (!addButton) return;

    addGrowGoFriend(player || {
  id: playerId,
  name: playerId
});

showToast(
  "Friend Request Mock",
  "Later, this will send an accept / deny request to the other player."
);

closeAddFriendPrompt();
closePlayersMetPopup();
  });
}

function closeAddFriendPrompt() {
  const overlay = document.getElementById("addFriendOverlay");
  if (overlay) overlay.remove();
}
function openSocial() {
  if (!socialScreen) return;

  hideSubmenus();
  hideMenuHome();

  socialScreen.classList.remove("hidden");
  renderSocialScreen();
}

function renderSocialScreen() {
  const savedAvatar = getSavedAvatar();

  if (socialAvatarImg && socialAvatarFallback) {
    if (savedAvatar) {
      socialAvatarImg.src = savedAvatar;
      socialAvatarImg.classList.remove("hidden");
      socialAvatarFallback.classList.add("hidden");
    } else {
      socialAvatarImg.src = "";
      socialAvatarImg.classList.add("hidden");
      socialAvatarFallback.classList.remove("hidden");
      socialAvatarFallback.textContent = "+";
    }
  }

  if (socialPublicId) {
    socialPublicId.textContent = getOrCreateGrowGoPlayerId();
  }
}
function openSocialPartyPopup() {
  closeSocialPartyPopup();

  const overlay = document.createElement("div");
  overlay.id = "socialPartyOverlay";
  overlay.className = "social-party-overlay";

  overlay.innerHTML = `
    <div class="social-party-popup">
      <button class="social-party-close" type="button">×</button>

      <div class="social-party-icon">🎉</div>

      <h3>Party</h3>

      <div class="social-party-text">
        Party up with nearby players and share capture bonuses while staying close together.
      </div>

      <div class="social-party-rules">
        <div class="social-party-rule">
          Requires at least 2 players.
        </div>

        <div class="social-party-rule">
          Party members must stay within 100 meters of the creator.
        </div>

        <div class="social-party-rule">
          Creating a party uses 1 party token and lasts 4 hours.
        </div>
      </div>

      <div class="social-party-actions">
        <button class="social-party-primary" data-party-action="create" type="button">
          Create Party
        </button>

        <button class="social-party-secondary" data-party-action="join" type="button">
          Join Party
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (event) => {
    if (
      event.target === overlay ||
      event.target.closest(".social-party-close")
    ) {
      closeSocialPartyPopup();
      return;
    }

    const partyAction = event.target.closest("[data-party-action]");
    if (!partyAction) return;

    if (partyAction.dataset.partyAction === "create") {
      showToast("Party", "Create Party flow is coming soon.");
      closeSocialPartyPopup();
      return;
    }

    if (partyAction.dataset.partyAction === "join") {
      showToast("Party", "Join Party flow is coming soon.");
      closeSocialPartyPopup();
    }
  });
}

function closeSocialPartyPopup() {
  const overlay = document.getElementById("socialPartyOverlay");
  if (overlay) overlay.remove();
}

/* ----------------------------- */
/* AVATAR UPLOAD */
/* ----------------------------- */

function initAvatarUpload() {
  const savedAvatar = getSavedAvatar();

  if (savedAvatar) {
    applyAvatar(savedAvatar);
  } else {
    clearAvatar();
  }

  setupProfileSwipeCard();
  renderPlayerQrCode();

  if (!menuAvatarInput) return;

  menuAvatarInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Avatar", "Please choose an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target?.result;
      if (!src) return;

      playerState.avatarSrc = src;
      savePlayerState();

      applyAvatar(src);
      updatePlayerMarkerIcon();
      showToast("Avatar updated", "Profile picture saved.");
    };

    reader.readAsDataURL(file);
  });
}

function setupProfileSwipeCard() {
  if (!profileSwipeCard) return;

  let profileSwipeMoved = false;

  setProfileCardMode(profileSwipeCurrentMode);

  function handleProfileSwipeStart(startX, startY) {
    profileSwipeStartX = startX;
    profileSwipeStartY = startY;
    profileSwipeMoved = false;
  }

  function handleProfileSwipeEnd(endX, endY) {
    const diffX = endX - profileSwipeStartX;
    const diffY = endY - profileSwipeStartY;

    if (Math.abs(diffX) < 35) return;
    if (Math.abs(diffX) < Math.abs(diffY)) return;

    profileSwipeMoved = true;

    if (diffX > 0) {
      setProfileCardMode("qr");
    } else {
      setProfileCardMode("photo");
    }
  }

  profileSwipeCard.addEventListener("touchstart", (event) => {
    if (!event.touches || event.touches.length === 0) return;

    handleProfileSwipeStart(
      event.touches[0].clientX,
      event.touches[0].clientY
    );
  }, { passive: true });

  profileSwipeCard.addEventListener("touchend", (event) => {
    if (!event.changedTouches || event.changedTouches.length === 0) return;

    handleProfileSwipeEnd(
      event.changedTouches[0].clientX,
      event.changedTouches[0].clientY
    );
  }, { passive: true });

  profileSwipeCard.addEventListener("mousedown", (event) => {
    handleProfileSwipeStart(event.clientX, event.clientY);
  });

  profileSwipeCard.addEventListener("mouseup", (event) => {
    handleProfileSwipeEnd(event.clientX, event.clientY);
  });

  profileSwipeCard.addEventListener("click", (event) => {
    if (profileSwipeMoved) {
      event.preventDefault();
      event.stopPropagation();

      setTimeout(() => {
        profileSwipeMoved = false;
      }, 80);

      return;
    }

    if (profileSwipeCurrentMode === "qr") return;

    const savedAvatar = getSavedAvatar();

    if (savedAvatar) {
      showToast("Profile picture", "Change profile picture in Settings.");
      return;
    }

    if (menuAvatarInput) {
      menuAvatarInput.click();
    }
  });
}

function setProfileCardMode(mode) {
  profileSwipeCurrentMode = mode === "qr" ? "qr" : "photo";
  playerState.profileCardMode = profileSwipeCurrentMode;
  savePlayerState();

  if (!profilePhotoFace || !profileQrFace) return;

if (profileSwipeCard) {
  profileSwipeCard.classList.toggle("qr-mode", profileSwipeCurrentMode === "qr");
}

if (profileSwipeCurrentMode === "qr") {
  profilePhotoFace.classList.remove("active");
  profileQrFace.classList.add("active");
  renderPlayerQrCode();
} else {
  profileQrFace.classList.remove("active");
  profilePhotoFace.classList.add("active");
}
}

function getOrCreateGrowGoPlayerId() {
  try {
    let playerId = playerState.publicId || localStorage.getItem(GROWGO_PLAYER_ID_KEY);

    if (playerId) {
      if (playerState.publicId !== playerId) {
        playerState.publicId = playerId;
        savePlayerState();
      }

      return playerId;
    }

    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";

    for (let i = 0; i < 6; i++) {
      randomPart += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    playerId = `GG${randomPart}`;
    playerState.publicId = playerId;
    savePlayerState();

    return playerId;
  } catch (error) {
    console.warn("Could not create player ID.", error);
    return "GGPLAYER";
  }
}

function renderPlayerQrCode() {
  if (!playerQrCode) return;

  playerQrCode.innerHTML = "";

  const playerId = getOrCreateGrowGoPlayerId();

  if (typeof QRCode === "undefined") {
    playerQrCode.textContent = "";
    console.warn("QRCode library is not loaded.");
    return;
  }

new QRCode(playerQrCode, {
  text: playerId,
  width: 120,
  height: 120,
  colorDark: "#000000",
  colorLight: "#ffffff",
  correctLevel: QRCode.CorrectLevel.H
});
}

function applyAvatar(src) {
  if (menuAvatarImg) {
    menuAvatarImg.src = src;
    menuAvatarImg.classList.remove("hidden");
  }

  if (menuAvatarPlus) {
    menuAvatarPlus.classList.add("hidden");
  }

  if (topAvatarImage) {
    topAvatarImage.src = src;
    topAvatarImage.classList.remove("hidden");
  }

  if (topAvatarFallback) {
    topAvatarFallback.classList.add("hidden");
  }
}

function clearAvatar() {
  if (menuAvatarImg) {
    menuAvatarImg.src = "";
    menuAvatarImg.classList.add("hidden");
  }

  if (menuAvatarPlus) {
    menuAvatarPlus.classList.remove("hidden");
  }

  if (topAvatarImage) {
    topAvatarImage.src = "";
    topAvatarImage.classList.add("hidden");
  }

  if (topAvatarFallback) {
    topAvatarFallback.classList.remove("hidden");
    topAvatarFallback.textContent = "+";
  }
}

function getSavedAvatar() {
  try {
    return playerState.avatarSrc || localStorage.getItem(AVATAR_STORAGE_KEY);
  } catch {
    return playerState.avatarSrc || null;
  }
}

/* ----------------------------- */
/* PLAYER LOCATION */
/* ----------------------------- */

function locatePlayer() {
  if (!navigator.geolocation) {
    setPlayerLocation(DEFAULT_CENTER[0], DEFAULT_CENTER[1], false);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      setPlayerLocation(position.coords.latitude, position.coords.longitude, true);
    },
    () => {
      setPlayerLocation(DEFAULT_CENTER[0], DEFAULT_CENTER[1], false);
      showToast("Location", "Using default map area.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 10000
    }
  );

  navigator.geolocation.watchPosition(
    (position) => {
      setPlayerLocation(position.coords.latitude, position.coords.longitude, false);
    },
    () => {},
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000
    }
  );
}

function setPlayerLocation(lat, lng, shouldCenter) {
  playerLatLng = L.latLng(lat, lng);

  if (!playerMarker) {
    playerMarker = L.marker(playerLatLng, {
      icon: buildPlayerIcon(),
      zIndexOffset: 3000
    }).addTo(map);
  } else {
    playerMarker.setLatLng(playerLatLng);
  }

  if (!captureRing) {
    captureRing = L.circle(playerLatLng, {
      radius: CAPTURE_RADIUS_METERS,
      color: "rgba(255,255,255,0.95)",
      weight: 2,
      fillColor: "rgba(255,255,255,0.12)",
      fillOpacity: 0.12,
      interactive: false
    }).addTo(map);
  } else {
    captureRing.setLatLng(playerLatLng);
  }

  if (shouldCenter) {
    map.setView(playerLatLng, 18);
  }

  requestRoadPinsForCurrentView(true);
  scheduleRedrawPins();
}

function buildPlayerIcon() {
  const avatarSrc = getSavedAvatar();

  const html = avatarSrc
    ? `
      <div style="width:54px;height:54px;border-radius:50%;overflow:hidden;border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,0.35);background:white;">
        <img src="${escapeAttribute(avatarSrc)}" alt="Player" style="width:100%;height:100%;object-fit:cover;display:block;">
      </div>
    `
    : `
      <div style="width:24px;height:24px;border-radius:50%;background:#2d7cff;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);"></div>
    `;

  return L.divIcon({
    className: "player-marker-icon",
    html,
    iconSize: [54, 54],
    iconAnchor: [27, 27]
  });
}

function updatePlayerMarkerIcon() {
  if (!playerMarker) return;
  playerMarker.setIcon(buildPlayerIcon());
}

/* ----------------------------- */
/* ROAD PIN LOADING */
/* ----------------------------- */

function requestRoadPinsForCurrentView(force = false) {
  if (!map) return;

  if (map.getZoom() < MIN_FETCH_ZOOM) {
    scheduleRedrawPins();
    return;
  }

  if (roadFetchTimer) clearTimeout(roadFetchTimer);

  roadFetchTimer = setTimeout(() => {
    fetchRoadPinsForViewport(force).catch((error) => {
      if (error?.name === "AbortError") {
        scheduleRedrawPins();
        return;
      }

      console.warn("Road pin fetch failed:", error);
      scheduleRedrawPins();

      if (!roadErrorToastShown && pinStore.size === 0) {
        roadErrorToastShown = true;
        showToast("Pins loading", "Road pins are taking a moment. Move or zoom the map to try again.");
      }
    });
  }, force ? 0 : PIN_FETCH_DEBOUNCE_MS);
}

async function fetchRoadPinsForViewport(force = false) {
  const bounds = map.getBounds().pad(0.12);
  const paddedBounds = {
    south: bounds.getSouth() - ROAD_FETCH_PADDING,
    west: bounds.getWest() - ROAD_FETCH_PADDING,
    north: bounds.getNorth() + ROAD_FETCH_PADDING,
    east: bounds.getEast() + ROAD_FETCH_PADDING
  };

  const viewportKey = [
    paddedBounds.south.toFixed(3),
    paddedBounds.west.toFixed(3),
    paddedBounds.north.toFixed(3),
    paddedBounds.east.toFixed(3)
  ].join("|");

  if (!force && fetchedViewportKeys.has(viewportKey)) {
    scheduleRedrawPins();
    return;
  }

  if (roadFetchInFlight && roadFetchAbortController) {
    roadFetchAbortController.abort();
  }

  roadFetchInFlight = true;
  roadFetchAbortController = new AbortController();

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      body: buildOverpassQuery(paddedBounds),
      signal: roadFetchAbortController.signal
    });

    if (!response.ok) throw new Error(`Overpass failed: ${response.status}`);

    const data = await response.json();
    const features = extractMapFeaturesFromOverpass(data);
    const converted = syncPinsNearWater(features.waterFeatures, bounds);
    const newPins = buildPinsFromWays(features.roadWays, bounds, features.waterFeatures);

    let added = converted;

    newPins.forEach((pin) => {
      if (!pinStore.has(pin.id)) {
        pinStore.set(pin.id, pin);
        addPinToSpatialBuckets(pin);
        added = true;
      }
    });

    if (added) scheduleSavePinsToLocal();

    fetchedViewportKeys.add(viewportKey);
    scheduleRedrawPins();
  } finally {
    roadFetchInFlight = false;
    roadFetchAbortController = null;
  }
}

function buildOverpassQuery(boundsObj) {
  const highwayRegex = HIGHWAY_TYPES.join("|");

  return `
[out:json][timeout:25];
(
  way["highway"~"^(${highwayRegex})$"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["natural"="water"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["natural"="coastline"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["water"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["waterway"~"^(river|stream|canal)$"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["landuse"~"^(reservoir|basin)$"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
);
(._;>;);
out body;
`;
}

function extractMapFeaturesFromOverpass(data) {
  const elements = Array.isArray(data?.elements) ? data.elements : [];
  const nodesById = new Map();

  elements.forEach((el) => {
    if (el.type === "node" && typeof el.lat === "number" && typeof el.lon === "number") {
      nodesById.set(el.id, [el.lat, el.lon]);
    }
  });

  const roadWays = [];
  const waterFeatures = [];

  elements.forEach((el) => {
    if (el.type !== "way" || !Array.isArray(el.nodes)) return;

    const coords = el.nodes.map((nodeId) => nodesById.get(nodeId)).filter(Boolean);
    const tags = el.tags || {};

    if (coords.length < 2) return;

    if (tags.highway) {
      roadWays.push({ id: el.id, coords });
      return;
    }

    if (isWaterFeature(tags)) {
      waterFeatures.push({
        id: el.id,
        coords,
        closed: coords.length >= 4 && coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1]
      });
    }
  });

  return { roadWays, waterFeatures };
}

function isWaterFeature(tags) {
  return (
    tags.natural === "water" ||
    tags.natural === "coastline" ||
    Boolean(tags.water) ||
    ["river", "stream", "canal"].includes(tags.waterway) ||
    ["reservoir", "basin"].includes(tags.landuse)
  );
}

function buildPinsFromWays(ways, visibleBounds, waterFeatures = []) {
  const generated = [];
  const localSeen = [];

  for (const way of ways) {
    const coords = way.coords;
    if (!coords || coords.length < 2) continue;

    for (let i = 0; i < coords.length - 1; i++) {
      const start = L.latLng(coords[i][0], coords[i][1]);
      const end = L.latLng(coords[i + 1][0], coords[i + 1][1]);
      const segmentLength = start.distanceTo(end);

      if (segmentLength < PIN_SPACING_METERS * 0.75) {
        maybeAddRoadPin(interpolateLatLng(start, end, 0.5), visibleBounds, localSeen, generated, waterFeatures);
        continue;
      }

      const steps = Math.floor(segmentLength / PIN_SPACING_METERS);

      for (let step = 0; step <= steps; step++) {
        const t = Math.min(1, (step * PIN_SPACING_METERS) / segmentLength);
        maybeAddRoadPin(interpolateLatLng(start, end, t), visibleBounds, localSeen, generated, waterFeatures);

        if (generated.length >= MAX_PINS_PER_FETCH) return generated;
      }
    }
  }

  return generated;
}

function maybeAddRoadPin(point, visibleBounds, localSeen, generated, waterFeatures = []) {
  if (!visibleBounds.contains(point)) return;

  const candidate = L.latLng(point.lat, point.lng);
  const key = `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;

  if (pinStore.has(key)) return;
  if (isTooCloseToExistingPinFast(candidate)) return;
  if (isTooCloseToLocalPins(candidate, localSeen)) return;

  localSeen.push(candidate);

  const isWaterPin = isPointNearWaterFeatures(candidate, waterFeatures);
  const pin = {
    id: key,
    type: isWaterPin ? "water" : "base",
    lat: point.lat,
    lng: point.lng,
    basePoints: BASE_PIN_VALUE,
    capturedAt: null
  };

  maybeAssignWaterPinFish(pin);
  generated.push(pin);
}

function syncPinsNearWater(waterFeatures, visibleBounds) {
  if (!Array.isArray(waterFeatures) || !waterFeatures.length) return false;

  let changed = false;

  pinStore.forEach((pin) => {
    if (!pin || (pin.type !== "base" && pin.type !== "water")) return;
    if (pin.ownerId || pin.plant) return;
    if (!visibleBounds.contains([pin.lat, pin.lng])) return;

    const nearWater = isPointNearWaterFeatures(L.latLng(pin.lat, pin.lng), waterFeatures);

    if (nearWater && pin.type !== "water") {
      pin.type = "water";
      maybeAssignWaterPinFish(pin);
      changed = true;
      return;
    }

    if (!nearWater && pin.type === "water") {
      pin.type = "base";
      delete pin.fish;
      changed = true;
    }
  });

  if (changed) {
    clearPinIconCache();
  }

  return changed;
}

function isPointNearWaterFeatures(point, waterFeatures) {
  return waterFeatures.some((feature) => {
    if (!Array.isArray(feature.coords) || feature.coords.length < 2) return false;

    if (feature.closed && isPointInsideLatLngPolygon(point, feature.coords)) {
      return true;
    }

    return getDistanceToLatLngPath(point, feature.coords) <= WATER_PIN_DISTANCE_METERS;
  });
}

function getDistanceToLatLngPath(point, coords) {
  let closest = Infinity;

  for (let i = 0; i < coords.length - 1; i++) {
    const start = L.latLng(coords[i][0], coords[i][1]);
    const end = L.latLng(coords[i + 1][0], coords[i + 1][1]);
    const distance = getDistanceToSegmentMeters(point, start, end);

    if (distance < closest) closest = distance;
    if (closest <= WATER_PIN_DISTANCE_METERS) return closest;
  }

  return closest;
}

function getDistanceToSegmentMeters(point, start, end) {
  const centerLat = (point.lat + start.lat + end.lat) / 3;
  const metersPerLat = 111320;
  const metersPerLng = Math.cos(centerLat * Math.PI / 180) * 111320;
  const px = point.lng * metersPerLng;
  const py = point.lat * metersPerLat;
  const ax = start.lng * metersPerLng;
  const ay = start.lat * metersPerLat;
  const bx = end.lng * metersPerLng;
  const by = end.lat * metersPerLat;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = (dx * dx) + (dy * dy);

  if (!lengthSquared) {
    return point.distanceTo(start);
  }

  const t = Math.max(0, Math.min(1, (((px - ax) * dx) + ((py - ay) * dy)) / lengthSquared));
  const closestX = ax + (t * dx);
  const closestY = ay + (t * dy);

  return Math.hypot(px - closestX, py - closestY);
}

function isPointInsideLatLngPolygon(point, coords) {
  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const yi = coords[i][0];
    const xi = coords[i][1];
    const yj = coords[j][0];
    const xj = coords[j][1];
    const intersects = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi);

    if (intersects) inside = !inside;
  }

  return inside;
}

function maybeAssignWaterPinFish(pin) {
  if (!pin || pin.type !== "water" || pin.fish) return;

  const roll = Math.random();
  let fishType = null;

  if (roll < WATER_PIN_SALMON_CHANCE) {
    fishType = "salmon";
  } else if (roll < WATER_PIN_SALMON_CHANCE + WATER_PIN_BLUE_FISH_CHANCE) {
    fishType = "blue";
  }

  if (!fishType) return;

  pin.fish = {
    type: fishType,
    spawnedAt: getTrustedNow()
  };
}

function getActiveWaterPinFish(pin, mutateExpired = true) {
  if (!pin || pin.type !== "water" || !pin.fish) return null;

  const fish = WATER_PIN_FISH_TYPES[pin.fish.type];
  const spawnedAt = Number(pin.fish.spawnedAt || 0);

  if (!fish || !spawnedAt || getTrustedNow() - spawnedAt >= WATER_PIN_FISH_LIFETIME_MS) {
    if (mutateExpired) {
      delete pin.fish;
      scheduleSavePinsToLocal();
    }

    return null;
  }

  return {
    ...fish,
    type: pin.fish.type,
    spawnedAt
  };
}

/* ----------------------------- */
/* SPATIAL BUCKETS */
/* ----------------------------- */

function rebuildSpatialBuckets() {
  pinSpatialBuckets.clear();
  pinStore.forEach(addPinToSpatialBuckets);
}

function addPinToSpatialBuckets(pin) {
  const key = getBucketKey(pin.lat, pin.lng);

  if (!pinSpatialBuckets.has(key)) {
    pinSpatialBuckets.set(key, []);
  }

  pinSpatialBuckets.get(key).push(pin);
}

function getBucketKey(lat, lng) {
  return `${Math.floor(lat * 1000)}:${Math.floor(lng * 1000)}`;
}

function getNearbyBucketKeys(lat, lng) {
  const baseLat = Math.floor(lat * 1000);
  const baseLng = Math.floor(lng * 1000);
  const keys = [];

  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
      keys.push(`${baseLat + y}:${baseLng + x}`);
    }
  }

  return keys;
}

function isTooCloseToExistingPinFast(candidate) {
  const keys = getNearbyBucketKeys(candidate.lat, candidate.lng);

  for (const key of keys) {
    const bucket = pinSpatialBuckets.get(key);
    if (!bucket) continue;

    for (const pin of bucket) {
      if (candidate.distanceTo([pin.lat, pin.lng]) < MIN_PIN_SEPARATION_METERS) {
        return true;
      }
    }
  }

  return false;
}

function isTooCloseToLocalPins(candidate, localSeen) {
  for (const existing of localSeen) {
    if (candidate.distanceTo(existing) < MIN_PIN_SEPARATION_METERS) return true;
  }

  return false;
}

function interpolateLatLng(start, end, t) {
  return L.latLng(
    start.lat + (end.lat - start.lat) * t,
    start.lng + (end.lng - start.lng) * t
  );
}

/* ----------------------------- */
/* PIN RENDERING */
/* ----------------------------- */

function scheduleRedrawPins() {
  if (redrawTimer) cancelAnimationFrame(redrawTimer);
  redrawTimer = requestAnimationFrame(redrawVisiblePins);
}

function redrawVisiblePins() {
  if (!pinsLayer || !map) return;

  const bounds = map.getBounds().pad(0.08);
  const cameraCenter = map.getCenter();
  const visiblePins = [];

  pinStore.forEach((pin) => {
    if (!bounds.contains([pin.lat, pin.lng])) return;

    visiblePins.push({
      pin,
      distance: cameraCenter.distanceTo([pin.lat, pin.lng])
    });
  });

  visiblePins.sort((a, b) => a.distance - b.distance);

  const selectedPins = visiblePins.slice(0, MAX_VISIBLE_PINS).map((entry) => entry.pin);
  const selectedIds = new Set(selectedPins.map((pin) => pin.id));

  renderedPinMarkers.forEach((marker, pinId) => {
    if (!selectedIds.has(pinId)) {
      pinsLayer.removeLayer(marker);
      renderedPinMarkers.delete(pinId);
    }
  });

  selectedPins.forEach((pin) => {
    const iconState = getPinIconState(pin);
    const zIndex = iconState.glowing ? 1500 : 1000;
    const existingMarker = renderedPinMarkers.get(pin.id);

    if (existingMarker) {
      if (existingMarker._growgoIconState !== iconState.key) {
        existingMarker.setIcon(buildPinIcon(pin, iconState));
        existingMarker._growgoIconState = iconState.key;
      }

      if (existingMarker._growgoZIndex !== zIndex) {
        existingMarker.setZIndexOffset(zIndex);
        existingMarker._growgoZIndex = zIndex;
      }

      return;
    }

    const marker = L.marker([pin.lat, pin.lng], {
      icon: buildPinIcon(pin, iconState),
      zIndexOffset: zIndex
    });

    marker._growgoIconState = iconState.key;
    marker._growgoZIndex = zIndex;

    marker.on("click", () => {
      if (pinLongPressTriggered) {
        pinLongPressTriggered = false;
        return;
      }

      capturePin(pin);
    });
    marker.on("add", () => bindPinLongPress(marker, pin));
    marker.on("dblclick", (event) => {
      if (event?.originalEvent) {
        L.DomEvent.stopPropagation(event.originalEvent);
      }
    });

    pinsLayer.addLayer(marker);
    renderedPinMarkers.set(pin.id, marker);
  });
}

function getPinIconState(pin) {
  const points = getPinPoints(pin);
  const capturedToday = wasCapturedToday(pin);
  const glowing = shouldPinGlow(pin, capturedToday);
  const ownerId = pin.ownerId || "";
  const plantStage = getPinPlantStage(pin);
  const plantSeedId = pin.plant?.seedId || "";
  const plantHarvestedKey = pin.plant?.harvestedByDay?.[getActivePlayerId()] || "";
  const type = pin.type || "base";
  const activeFish = getActiveWaterPinFish(pin);
  const fishType = activeFish?.type || "";

  return {
    type,
    fishType,
    points,
    capturedToday,
    glowing,
    owned: Boolean(ownerId),
    ownedByActivePlayer: ownerId === getActivePlayerId(),
    plantStage,
    plantSeedId,
    key: `${type}|${fishType}|${points}|${capturedToday ? 1 : 0}|${glowing ? 1 : 0}|${ownerId}|${plantStage}|${plantSeedId}|${plantHarvestedKey}`
  };
}

function buildPinIcon(pin, state = null) {
  const iconState = state || getPinIconState(pin);
  const cacheKey = iconState.key;

  if (pinIconCache.has(cacheKey)) {
    return pinIconCache.get(cacheKey);
  }

  const glowClass = iconState.glowing ? "pin-ready-glow" : "";
  const capturedClass = iconState.capturedToday ? "pin-captured-today" : "";
  const ownedClass = iconState.owned ? "pin-owned" : "";
  const typeClass = iconState.type === "water" ? "water-pin-marker" : "";
  const pinImage = iconState.type === "water" ? "pin-water-blue.png" : "pin-base-purple.png";
  const showPointNumber = iconState.type !== "water" && !iconState.capturedToday;
  const fish = getActiveWaterPinFish(pin);
  const fishClass = fish ? "water-pin-has-fish" : "";
  const fishBadge = fish
    ? `
      <div
        class="water-pin-fish water-pin-fish-${escapeAttribute(fish.className)}"
        aria-label="${escapeAttribute(fish.label)}"
      >
        ${escapeHtml(fish.icon)}
      </div>
    `
    : "";
  const pinAlt = iconState.type === "water" ? "Water Pin" : "Base Pin";
  const plantVisual = getPinPlantVisual(pin);
  const plantBadge = iconState.plantStage > 0
    ? `
      <div
        class="base-pin-plant-stage ${escapeAttribute(plantVisual.className)}"
        aria-label="${escapeAttribute(plantVisual.label)}"
      >
        ${escapeHtml(plantVisual.icon)}
      </div>
    `
    : "";

  const html = `
    <div class="base-pin-marker ${typeClass} ${fishClass} ${glowClass} ${capturedClass} ${ownedClass}">
      <img src="${pinImage}" alt="${pinAlt}">
      ${showPointNumber ? `<div class="base-pin-number">${iconState.points}</div>` : ""}
      ${fishBadge}
      ${plantBadge}
    </div>
  `;

  const icon = L.divIcon({
    className: "base-pin-icon",
    html,
    iconSize: [64, 84],
    iconAnchor: [32, 84]
  });

  pinIconCache.set(cacheKey, icon);
  return icon;
}

function clearPinIconCache() {
  pinIconCache.clear();

  renderedPinMarkers.forEach((marker) => {
    marker._growgoIconState = null;
  });
}

function shouldPinGlow(pin, capturedToday = null) {
  if (!playerLatLng) return false;

  const alreadyCaptured = capturedToday === null ? wasCapturedToday(pin) : capturedToday;

  if (alreadyCaptured) return false;

  const isInCaptureRing =
    playerLatLng.distanceTo([pin.lat, pin.lng]) <= CAPTURE_RADIUS_METERS;

  return isInCaptureRing;
}

function startPinLongPress(pin) {
  clearPinLongPress();
  activeLongPressPin = pin;

  pinLongPressTimer = setTimeout(() => {
    pinLongPressTriggered = true;
    openBasePinLongPressPopup(activeLongPressPin);

    setTimeout(() => {
      pinLongPressTriggered = false;
    }, 800);
  }, PIN_LONG_PRESS_MS);
}

function clearPinLongPress() {
  if (pinLongPressTimer) {
    clearTimeout(pinLongPressTimer);
    pinLongPressTimer = null;
  }

  activeLongPressPin = null;
}

function bindPinLongPress(marker, pin) {
  const element = marker.getElement();
  if (!element || element._growgoLongPressBound) return;

  element._growgoLongPressBound = true;
  element.style.touchAction = "manipulation";
  element.style.webkitUserSelect = "none";
  element.style.userSelect = "none";

  element.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    startPinLongPress(pin);
  }, { passive: false });

  ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"].forEach((eventName) => {
    element.addEventListener(eventName, clearPinLongPress);
  });

  element.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
}

function openBasePinLongPressPopup(pin) {
  clearPinLongPress();
  if (!pin) return;

  if (pin.type === "water") {
    showToast("Water pin", "Water pins cannot be purchased yet.");
    return;
  }

  if (!pin.ownerId) {
    openBasePinPurchasePopup(pin);
    return;
  }

  if (pin.ownerId === getActivePlayerId()) {
    openBasePinPlantPopup(pin);
    return;
  }

  showToast("Owned pin", "This base pin already belongs to another player.");
}

function openBasePinPurchasePopup(pin) {
  closeBasePinPopup();

  const overlay = document.createElement("div");
  overlay.id = "basePinOverlay";
  overlay.className = "base-pin-overlay";
  overlay.innerHTML = `
    <div class="base-pin-popup">
      <button class="base-pin-popup-close" type="button">×</button>
      <h3>Purchase Base Pin</h3>
      <div class="base-pin-popup-copy">
        Own this base pin for ${formatNumber(BASE_PIN_PURCHASE_COST)} coins.
      </div>
      <div class="base-pin-popup-meta">
        Wallet: ${formatNumber(marketState.wallet)} coins
      </div>
      <div class="base-pin-popup-actions">
        <button class="base-pin-secondary-btn" data-base-pin-cancel type="button">Not Now</button>
        <button class="base-pin-primary-btn" data-base-pin-purchase="${escapeAttribute(pin.id)}" type="button">
          Purchase
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener("click", handleBasePinPopupClick);
}

function openBasePinPlantPopup(pin) {
  closeBasePinPopup();

  const seedOptions = getAvailableBasePinSeeds();
  const planted = pin.plant ? getPlantStageLabel(pin.plant) : "No seed planted";
  const plantTiming = pin.plant ? getPlantTimingLabel(pin.plant) : "Plant a seed to start growing";
  const level = getBasePinLevel(pin);
  const levelInfo = getBasePinLevelInfo(level);
  const upgrade = getBasePinUpgradeInfo(pin);

  const overlay = document.createElement("div");
  overlay.id = "basePinOverlay";
  overlay.className = "base-pin-overlay";
  overlay.innerHTML = `
    <div class="base-pin-popup">
      <button class="base-pin-popup-close" type="button">×</button>
      <h3>Owned Base Pin</h3>
      <div class="base-pin-level ${escapeAttribute(levelInfo.className)}">
        Level ${level} · ${escapeHtml(levelInfo.name)}
      </div>
      <div class="base-pin-popup-copy">
        Current plant: ${escapeHtml(planted)}
      </div>
      <div class="base-pin-popup-meta">
        Growth: ${escapeHtml(plantTiming)}
      </div>
      <div class="base-pin-popup-meta">
        Replant: ${pin.replantEnabled ? "On" : "Off"}
      </div>
      <label class="base-pin-select-label" for="basePinSeedSelect">Seed</label>
      <select id="basePinSeedSelect" class="base-pin-select" ${seedOptions.length ? "" : "disabled"}>
        ${seedOptions.length
          ? seedOptions.map((seed) => `
            <option value="${escapeAttribute(seed.id)}">
              ${escapeHtml(seed.label)} x${formatNumber(seed.quantity)}
            </option>
          `).join("")
          : `<option>No seeds available</option>`}
      </select>
      <button class="base-pin-toggle ${pin.replantEnabled ? "active" : ""}" data-base-pin-replant="${escapeAttribute(pin.id)}" type="button">
        Replant ${pin.replantEnabled ? "On" : "Off"}
      </button>
      ${upgrade ? `
        <button class="base-pin-upgrade-btn" data-base-pin-upgrade="${escapeAttribute(pin.id)}" type="button">
          Upgrade to Level ${upgrade.nextLevel} (${escapeHtml(upgrade.nextInfo.name)}) · ${formatNumber(upgrade.cost)}g
        </button>
      ` : `
        <div class="base-pin-max-level">Epic level reached</div>
      `}
      <div class="base-pin-popup-actions">
        <button class="base-pin-secondary-btn" data-base-pin-cancel type="button">Not Now</button>
        <button class="base-pin-primary-btn" data-base-pin-plant="${escapeAttribute(pin.id)}" type="button" ${seedOptions.length ? "" : "disabled"}>
          Plant Seed
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener("click", handleBasePinPopupClick);
}

function handleBasePinPopupClick(event) {
  if (
    event.target.id === "basePinOverlay" ||
    event.target.closest(".base-pin-popup-close") ||
    event.target.closest("[data-base-pin-cancel]")
  ) {
    closeBasePinPopup();
    return;
  }

  const purchaseButton = event.target.closest("[data-base-pin-purchase]");
  if (purchaseButton) {
    purchaseBasePin(purchaseButton.dataset.basePinPurchase);
    return;
  }

  const plantButton = event.target.closest("[data-base-pin-plant]");
  if (plantButton) {
    const select = document.getElementById("basePinSeedSelect");
    plantBasePinSeed(plantButton.dataset.basePinPlant, select?.value);
    return;
  }

  const replantButton = event.target.closest("[data-base-pin-replant]");
  if (replantButton) {
    toggleBasePinReplant(replantButton.dataset.basePinReplant);
    return;
  }

  const upgradeButton = event.target.closest("[data-base-pin-upgrade]");
  if (upgradeButton) {
    upgradeBasePin(upgradeButton.dataset.basePinUpgrade);
  }
}

function closeBasePinPopup() {
  const overlay = document.getElementById("basePinOverlay");
  if (overlay) overlay.remove();
}

function purchaseBasePin(pinId) {
  const pin = pinStore.get(pinId);
  if (!pin) return;

  if (pin.ownerId) {
    showToast("Base pin", "This pin has already been purchased.");
    closeBasePinPopup();
    return;
  }

  if (marketState.wallet < BASE_PIN_PURCHASE_COST) {
    showToast("Not enough coins", `${formatNumber(BASE_PIN_PURCHASE_COST)} coins needed.`);
    return;
  }

  marketState.wallet -= BASE_PIN_PURCHASE_COST;
  saveMarketState();
  renderMarketWallet();
  renderPlayerOverview();

  pin.type = "base";
  pin.ownerId = getActivePlayerId();
  pin.ownerName = playerState.name || DEFAULT_PLAYER_NAME;
  pin.ownedAt = getTrustedNow();
  pin.level = 1;
  pin.replantEnabled = false;

  scheduleSavePinsToLocal();
  clearPinIconCache();
  scheduleRedrawPins();
  closeBasePinPopup();
  showToast("Base pin owned", "This pin is now yours.");
}

function getAvailableBasePinSeeds() {
  return BASE_PIN_SEED_OPTIONS
    .map((seed) => ({
      ...seed,
      quantity: Number(marketState.inventory[seed.id] || 0)
    }))
    .filter((seed) => seed.quantity > 0);
}

function getBasePinSeedOption(seedId) {
  return BASE_PIN_SEED_OPTIONS.find((seed) => (
    seed.id === seedId ||
    seed.harvestItemId === seedId
  ));
}

function getBasePinLevel(pin) {
  const level = Number(pin?.level || 1);
  return Math.max(1, Math.min(BASE_PIN_MAX_LEVEL, level));
}

function getBasePinLevelInfo(level) {
  return BASE_PIN_LEVELS[getBasePinLevel({ level })] || BASE_PIN_LEVELS[1];
}

function getBasePinUpgradeInfo(pin) {
  const level = getBasePinLevel(pin);
  if (level >= BASE_PIN_MAX_LEVEL) return null;

  const currentInfo = getBasePinLevelInfo(level);
  const nextLevel = level + 1;

  return {
    nextLevel,
    nextInfo: getBasePinLevelInfo(nextLevel),
    cost: currentInfo.upgradeCost
  };
}

function toggleBasePinReplant(pinId) {
  const pin = pinStore.get(pinId);
  if (!pin || pin.ownerId !== getActivePlayerId()) return;

  pin.replantEnabled = !pin.replantEnabled;
  scheduleSavePinsToLocal();
  openBasePinPlantPopup(pin);
}

function upgradeBasePin(pinId) {
  const pin = pinStore.get(pinId);
  if (!pin || pin.ownerId !== getActivePlayerId()) return;

  const upgrade = getBasePinUpgradeInfo(pin);
  if (!upgrade) return;

  if (marketState.wallet < upgrade.cost) {
    showToast("Not enough gold", `${formatNumber(upgrade.cost)}g needed.`);
    return;
  }

  marketState.wallet -= upgrade.cost;
  saveMarketState();
  renderMarketWallet();
  renderPlayerOverview();

  pin.level = upgrade.nextLevel;
  scheduleSavePinsToLocal();
  clearPinIconCache();
  scheduleRedrawPins();
  openBasePinPlantPopup(pin);
  showToast("Pin upgraded", `Base pin is now ${upgrade.nextInfo.name}.`);
}

function plantBasePinSeed(pinId, seedId) {
  const pin = pinStore.get(pinId);
  const seed = getBasePinSeedOption(seedId);
  if (!pin || !seed || pin.ownerId !== getActivePlayerId()) return;

  const owned = Number(marketState.inventory[seed.id] || 0);
  if (owned <= 0) {
    showToast("Seeds", "You do not have that seed available.");
    return;
  }

  marketState.inventory[seed.id] = owned - 1;
  saveMarketState();
  refreshInventoryIfOpen();

  pin.plant = {
    seedId: seed.id,
    plantedAt: getTrustedNow(),
    harvestedByDay: {}
  };

  scheduleSavePinsToLocal();
  clearPinIconCache();
  scheduleRedrawPins();
  closeBasePinPopup();
  showToast("Seed planted", `${seed.label} is growing on this base pin.`);
}

function getActivePlayerId() {
  return getOrCreateGrowGoPlayerId();
}

/* ----------------------------- */
/* CAPTURE */
/* ----------------------------- */

function capturePin(pin) {
  if (!playerLatLng) {
    showToast("Capture", "Player location not ready yet.");
    return;
  }

  const trustedNow = getTrustedNow();
  const distance = playerLatLng.distanceTo([pin.lat, pin.lng]);

  if (distance > CAPTURE_RADIUS_METERS) {
    showToast("Too far away", `${Math.round(distance)}m away.`);
    return;
  }

  if (wasCapturedToday(pin)) {
    showToast("Already captured", "This pin has already been captured today.");
    return;
  }

  const points = getPinPoints(pin);
  pin.capturedAt = trustedNow;

  addStat("captures", 1);
  addStat("score", points);
  addStat("goldEarned", 1);
  addPlayerXp(points);
  addMarketCoins(1);
  awardBasePinOwnerCaptureReward(pin);
  harvestReadyBasePinPlant(pin);
  const waterDrop = awardWaterPinResourceDrop(pin);
  const fishDrop = awardWaterPinFishCapture(pin);

  scheduleSavePinsToLocal();
  clearPinIconCache();

  const resourceText = [
    waterDrop ? "+1 water" : "",
    fishDrop ? `+1 ${fishDrop.label}, +${fishDrop.xp} fish XP` : ""
  ].filter(Boolean).join(", ");
  const resourceSuffix = resourceText ? `, ${resourceText}` : "";
  showToast(`Captured ${getPinTypeLabel(pin)}`, `+${points} points, +${points} XP, +1 gold${resourceSuffix}`);
  scheduleRedrawPins();
}

function getPinTypeLabel(pin) {
  if (pin?.type === "water") return "water pin";
  return "base pin";
}

function awardWaterPinResourceDrop(pin) {
  if (pin?.type !== "water") return false;
  if (Math.random() >= WATER_PIN_RESOURCE_DROP_CHANCE) return false;

  marketState.inventory.water = Number(marketState.inventory.water || 0) + 1;
  addStat("resourcesGained", 1);
  saveMarketState();
  refreshInventoryIfOpen();

  return true;
}

function awardWaterPinFishCapture(pin) {
  const fish = getActiveWaterPinFish(pin);
  if (!fish) return null;

  marketState.inventory[fish.itemId] = Number(marketState.inventory[fish.itemId] || 0) + 1;
  delete pin.fish;

  addStat("fishCaught", 1);
  addStat("resourcesGained", 1);
  addPlayerXp(fish.xp);
  saveMarketState();
  refreshInventoryIfOpen();

  return fish;
}

function awardBasePinOwnerCaptureReward(pin) {
  if (!pin.ownerId || pin.ownerId === getActivePlayerId()) return;

  pin.ownerPendingPoints = Number(pin.ownerPendingPoints || 0) + PIN_OWNER_CAPTURE_REWARD;
}

function harvestReadyBasePinPlant(pin) {
  if (!pin?.plant || getPinPlantStage(pin) < 4) return;

  const playerId = getActivePlayerId();
  const todayKey = getUtcDayKey(getTrustedNow());
  const harvestedByDay = pin.plant.harvestedByDay || {};

  if (harvestedByDay[playerId] === todayKey) return;

  const seed = getBasePinSeedOption(pin.plant.seedId);
  if (!seed) return;

  const harvestItemId = seed.harvestItemId || seed.id;
  const harvestLabel = seed.cropLabel || seed.label;
  const canAutoReplant =
    pin.replantEnabled &&
    pin.ownerId === playerId &&
    Number(marketState.inventory[seed.id] || 0) > 0;

  marketState.inventory[harvestItemId] = Number(marketState.inventory[harvestItemId] || 0) + 1;
  addStat("resourcesGained", 1);

  if (canAutoReplant) {
    marketState.inventory[seed.id] = Math.max(0, Number(marketState.inventory[seed.id] || 0) - 1);
    pin.plant = {
      seedId: seed.id,
      plantedAt: getTrustedNow(),
      harvestedByDay: {}
    };
  } else {
    pin.plant.harvestedByDay = {
      ...harvestedByDay,
      [playerId]: todayKey
    };
  }

  saveMarketState();
  refreshInventoryIfOpen();
  showToast("Harvested", canAutoReplant ? `+1 ${harvestLabel}, replanted.` : `+1 ${harvestLabel}`);
}

function getPinPoints(pin) {
  if (pin?.type === "water") {
    return WATER_PIN_VALUE;
  }

  const now = getTrustedNow();
  const growthStartedAt = Number(pin.capturedAt || getServerStartedAt());
  const hoursSinceGrowthStarted = Math.max(0, (now - growthStartedAt) / (1000 * 60 * 60));
  const growthSteps = Math.floor(hoursSinceGrowthStarted / POINTS_GROWTH_HOURS);

  return (pin.basePoints || BASE_PIN_VALUE) + growthSteps;
}

function getServerStartedAt() {
  try {
    const savedStartedAt = Number(localStorage.getItem(SERVER_STARTED_AT_KEY));

    if (Number.isFinite(savedStartedAt) && savedStartedAt > 0) {
      return savedStartedAt;
    }

    const startedAt = getTrustedNow();
    localStorage.setItem(SERVER_STARTED_AT_KEY, String(startedAt));
    return startedAt;
  } catch (error) {
    console.warn("Could not read server start time.", error);
    return Date.now();
  }
}

function getPinPlantStage(pin) {
  if (!pin?.plant?.plantedAt) return 0;

  const hoursSincePlanting = Math.max(
    0,
    (getTrustedNow() - Number(pin.plant.plantedAt)) / (1000 * 60 * 60)
  );

  if (hoursSincePlanting >= PIN_PLANT_STAGE_HOURS * 3) return 4;
  if (hoursSincePlanting >= PIN_PLANT_STAGE_HOURS * 2) return 3;
  if (hoursSincePlanting >= PIN_PLANT_STAGE_HOURS) return 2;
  return 1;
}

function getPlantStageIcon(stage) {
  if (stage >= 4) return "🌽";
  if (stage === 3) return "🌿";
  if (stage === 2) return "🌱";
  return "·";
}

function getPinPlantVisual(pin) {
  const stage = getPinPlantStage(pin);
  const seed = getBasePinSeedOption(pin?.plant?.seedId);
  const cropLabel = seed ? (seed.cropLabel || seed.label) : "Plant";
  const readyIcon = seed?.icon || getPlantStageIcon(stage);
  const stageNames = {
    1: "planted",
    2: "sprouting",
    3: "almost ready",
    4: "ready to harvest"
  };

  if (stage >= 4) {
    return {
      icon: readyIcon,
      className: "plant-stage-4",
      label: `${cropLabel} ready to harvest`
    };
  }

  if (stage === 3) {
    return {
      icon: "🌿",
      className: "plant-stage-3",
      label: `${cropLabel} almost ready`
    };
  }

  if (stage === 2) {
    return {
      icon: "🌱",
      className: "plant-stage-2",
      label: `${cropLabel} sprouting`
    };
  }

  return {
    icon: "●",
    className: "plant-stage-1",
    label: `${cropLabel} ${stageNames[stage] || "planted"}`
  };
}

function getPlantStageLabel(plant) {
  if (!plant) return "No seed planted";

  const seed = getBasePinSeedOption(plant.seedId);
  const label = seed ? (seed.cropLabel || seed.label) : "Plant";
  const stage = getPinPlantStage({ plant });

  if (stage >= 4) return `${label}, ready to harvest`;
  if (stage === 3) return `${label}, almost ready`;
  if (stage === 2) return `${label}, sprouting`;
  return `${label}, planted`;
}

function getPlantTimingLabel(plant) {
  if (!plant?.plantedAt) return "Plant a seed to start growing";

  const stage = getPinPlantStage({ plant });
  const now = getTrustedNow();
  const plantedAt = Number(plant.plantedAt);
  const stageMs = PIN_PLANT_STAGE_HOURS * 60 * 60 * 1000;

  if (stage >= 4) {
    const playerId = getActivePlayerId();
    const harvestedByDay = plant.harvestedByDay || {};

    if (harvestedByDay[playerId] === getUtcDayKey(now)) {
      return "Harvested today";
    }

    return "Ready now";
  }

  const nextStageAt = plantedAt + (stage * stageMs);
  const harvestAt = plantedAt + (stageMs * 3);
  const nextLabel = stage === 3 ? "Ready" : "Next stage";

  if (stage === 3) {
    return `${nextLabel} in ${formatDuration(harvestAt - now)}`;
  }

  return `${nextLabel} in ${formatDuration(nextStageAt - now)}`;
}

function wasCapturedToday(pin) {
  if (!pin.capturedAt) return false;

  const now = getTrustedNow();

  return getUtcDayKey(pin.capturedAt) === getUtcDayKey(now);
}

/* ----------------------------- */
/* LOCAL STORAGE */
/* ----------------------------- */

function scheduleSavePinsToLocal() {
  if (savePinsTimer) clearTimeout(savePinsTimer);

  savePinsTimer = setTimeout(() => {
    savePinsToLocal();
  }, 250);
}

function savePinsToLocal() {
  try {
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(Array.from(pinStore.values())));
  } catch (error) {
    console.warn("Could not save pins.", error);
  }
}

function loadPinsFromLocal() {
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY);
    if (!raw) return;

    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return;

    data.forEach((pin) => {
      if (
        pin &&
        typeof pin.id === "string" &&
        typeof pin.lat === "number" &&
        typeof pin.lng === "number"
      ) {
        pinStore.set(pin.id, {
          id: pin.id,
          type: pin.type || "base",
          lat: pin.lat,
          lng: pin.lng,
          basePoints: typeof pin.basePoints === "number" ? pin.basePoints : BASE_PIN_VALUE,
          capturedAt: pin.capturedAt || null,
          ownerId: pin.ownerId || null,
          ownerName: pin.ownerName || null,
          ownedAt: pin.ownedAt || null,
          level: getBasePinLevel(pin),
          replantEnabled: Boolean(pin.replantEnabled),
          ownerPendingPoints: Number(pin.ownerPendingPoints || 0),
          plant: pin.plant || null,
          fish: pin.fish || null
        });
      }
    });
  } catch (error) {
    console.warn("Could not load saved pins.", error);
  }
}

/* ----------------------------- */
/* TOASTS + HELPERS */
/* ----------------------------- */

function showToast(title, body) {
  if (!toastStack) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <div class="toast-title">${escapeHtml(title)}</div>
    <div class="toast-body">${escapeHtml(body)}</div>
  `;

  toastStack.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "opacity 180ms ease, transform 180ms ease";

    setTimeout(() => {
      toast.remove();
    }, 220);
  }, 3000);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
