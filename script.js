/* ============================= */
/* GrowGo script.js */
/* Map + Stats + Leaders + Crafting */
/* Performance-pass replacement */
/* ============================= */

const DEFAULT_CENTER = [-38.4537, 145.2381];

/* Production-safe default: keep false for normal GrowGo behavior. Set true only for local custom renderer testing; gameplay must remain unchanged when false. */
const ENABLE_CUSTOM_25D_MAP = false;
const ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS = false;
const ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA = false;
const ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA = false;

const BASE_PIN_VALUE = 5;
const WATER_PIN_VALUE = 10;
const POI_PIN_VALUE = 100;
const POI_COIN_REWARD = 100;
const WATER_PIN_RESOURCE_DROP_CHANCE = 0.25;
const WATER_PIN_BLUE_FISH_CHANCE = 1 / 250;
const WATER_PIN_SALMON_CHANCE = 1 / 1000;
const WATER_PIN_FISH_LIFETIME_MS = 4 * 60 * 60 * 1000;
const POINTS_GROWTH_HOURS = 168;
const CAPTURE_RADIUS_METERS = 100;
const POI_CAPTURE_RADIUS_METERS = 304.8;
const WATER_PIN_DISTANCE_METERS = 50;
const POI_SCAN_RADIUS_METERS = 5000;
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
const MAX_POIS_PER_SCAN = 250;

const POI_CAPTURE_STAT_BY_CATEGORY = {
  Church: "poiChurchCaptures",
  Churches: "poiChurchCaptures",
  Hospital: "poiHospitalCaptures",
  Hospitals: "poiHospitalCaptures",
  Historic: "poiHistoricCaptures",
  Park: "poiParkCaptures",
  Parks: "poiParkCaptures",
  Landmark: "poiLandmarkCaptures",
  Landmarks: "poiLandmarkCaptures",
  "Local POI": "poiLocalCaptures"
};

const MOCK_POIS = [
  {
    id: "poi:mock:local-church",
    name: "Local Church",
    category: "Places",
    subcategory: "Churches",
    rarity: "normal",
    icon: "church",
    lat: -38.45295,
    lng: 145.23835,
    description: "A quiet local church added for POI testing."
  },
  {
    id: "poi:mock:community-park",
    name: "Community Park",
    category: "Places",
    subcategory: "Parks",
    rarity: "normal",
    icon: "park",
    lat: -38.45435,
    lng: 145.23755,
    description: "A small green park for testing POI collections."
  },
  {
    id: "poi:mock:waterfall",
    name: "Waterfall",
    category: "Places",
    subcategory: "Waterfalls",
    rarity: "normal",
    icon: "waterfall",
    lat: -38.45345,
    lng: 145.23925,
    description: "A waterfall-style test POI."
  },
  {
    id: "poi:mock:dinosaur-fossil-site",
    name: "Dinosaur Fossil Site",
    category: "Dinosaur Sites",
    subcategory: "Fossil Digs",
    rarity: "special",
    icon: "dinosaur",
    lat: -38.45485,
    lng: 145.2389,
    description: "A rare fossil dig location for testing special POIs."
  },
  {
    id: "poi:mock:famous-film-location",
    name: "Famous Film Location",
    category: "Film Locations",
    subcategory: "Iconic Scenes",
    rarity: "special",
    icon: "film",
    lat: -38.45245,
    lng: 145.23775,
    description: "A special film-location POI used for testing."
  }
];

const POI_COLLECTION_CATEGORIES = [
  "Places",
  "Film Locations",
  "Dinosaur Sites",
  "Music Landmarks",
  "Historical People",
  "Tourist Attractions"
];

const MIN_FETCH_ZOOM = 15;
const PIN_FETCH_DEBOUNCE_MS = 450;
const ROAD_FETCH_PADDING = 0.0035;
const MAX_PINS_PER_FETCH = 900;

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const TRUSTED_TIME_URL = "https://www.timeapi.io/api/Time/current/zone?timeZone=UTC";

const PIN_STORAGE_KEY = "growgo-pins";
const CAPTURED_POIS_STORAGE_KEY = "growgo-captured-pois";
const SERVER_STARTED_AT_KEY = "growgo-server-started-at";
const AVATAR_STORAGE_KEY = "growgo-avatar";
const STATS_STORAGE_KEY = "growgo-stats";
const ACHIEVEMENTS_STORAGE_KEY = "growgo-achievements";
const CRAFTING_STORAGE_KEY = "growgo-crafting";
const MARKET_STORAGE_KEY = "growgo-market";
const MARKET_LONG_PRESS_MS = 550;
const CARD_COLLECTION_STORAGE_KEY = "growgo-card-collection";
const PLAYER_TITLES_STORAGE_KEY = "growgo-player-titles";
const PLAYER_ARTIFACTS_STORAGE_KEY = "growgo-player-artifacts";
const CARD_LONG_PRESS_MS = 550;

const PLAYER_STORAGE_KEY = "growgo-player-state";
const GROWGO_PLAYER_ID_KEY = "growgo-player-public-id";
const GROWGO_PROFILE_CARD_MODE_KEY = "growgo-profile-card-mode";
const DEFAULT_PLAYER_NAME = "rubberlips";
const PROGRESSION_RESET_KEY = "growgo-progression-reset-version";
const PROGRESSION_RESET_VERSION = "rubberlips-reset-1";
const LOCAL_BACKUP_VERSION = 1;

const CARD_SETS = [
  {
    setId: "dinosaur-discoveries",
    setName: "Dinosaur Discoveries",
    themeIcon: "🦖",
    themeClass: "dinosaur",
    coverImage: "assets/cards/dinosaur-card-back-clean.png?v=1",
    totalCards: 24,
    completedTitle: "Fossil Hunter",
    completionAchievementId: "achievement-dinosaur-discoveries-complete",
    artifactRewardId: "ancient-dig-kit",
    cards: [
      "Tyrannosaurus",
      "Raptor",
      "Triceratops",
      "Stegosaurus",
      "Brachiosaurus",
      "Ankylosaurus",
      "Spinosaurus",
      "Pteranodon",
      "Allosaurus",
      "Parasaurolophus",
      "Diplodocus",
      "Iguanodon",
      "Carnotaurus",
      "Pachycephalosaurus",
      "Mosasaurus",
      "Megalodon",
      "Archaeopteryx",
      "Compsognathus",
      "Dimetrodon",
      "Therizinosaurus",
      "Gallimimus",
      "Argentinosaurus",
      "Dilophosaurus",
      "Brontosaurus"
    ].map((cardName, index) => ({
      cardId: `dino-${String(index + 1).padStart(3, "0")}`,
      setId: "dinosaur-discoveries",
      cardNumber: index + 1,
      cardName,
      rarity: index === 0 ? "legendary" : index < 4 ? "rare" : index < 10 ? "uncommon" : "common",
      image: index === 0 ? "assets/cards/t-rex-card-clean.png?v=1" : null,
      ghostImage: null,
      variationType: "normal",
      isAnimatedVariation: false,
      matchingPoiId: null
    }))
  }
];

const DINOSAUR_CARD_ART_PROFILES = {
  Tyrannosaurus: { badge: "Apex", habitat: "Volcanic Plains", frameClass: "theropod", silhouetteClass: "theropod" },
  Raptor: { badge: "Swift", habitat: "Red Ridge", frameClass: "theropod", silhouetteClass: "raptor" },
  Triceratops: { badge: "Shield", habitat: "Fern Basin", frameClass: "horned", silhouetteClass: "horned" },
  Stegosaurus: { badge: "Plated", habitat: "Sunset Valley", frameClass: "plated", silhouetteClass: "plated" },
  Brachiosaurus: { badge: "Titan", habitat: "Cloud Canopy", frameClass: "longneck", silhouetteClass: "longneck" },
  Ankylosaurus: { badge: "Armored", habitat: "Stone Brush", frameClass: "armored", silhouetteClass: "armored" },
  Spinosaurus: { badge: "River King", habitat: "Delta Marsh", frameClass: "spined", silhouetteClass: "spined" },
  Pteranodon: { badge: "Skies", habitat: "Cliff Winds", frameClass: "sky", silhouetteClass: "winged" },
  Allosaurus: { badge: "Hunter", habitat: "Mesa Run", frameClass: "theropod", silhouetteClass: "theropod" },
  Parasaurolophus: { badge: "Crest", habitat: "Mist Grove", frameClass: "crest", silhouetteClass: "crest" },
  Diplodocus: { badge: "Colossus", habitat: "River Plains", frameClass: "longneck", silhouetteClass: "longneck" },
  Iguanodon: { badge: "Grazer", habitat: "Amber Field", frameClass: "herbivore", silhouetteClass: "herbivore" },
  Carnotaurus: { badge: "Dash", habitat: "Crimson Dust", frameClass: "theropod", silhouetteClass: "raptor" },
  Pachycephalosaurus: { badge: "Dome", habitat: "Thunder Steppe", frameClass: "dome", silhouetteClass: "dome" },
  Mosasaurus: { badge: "Deep", habitat: "Ancient Sea", frameClass: "ocean", silhouetteClass: "marine" },
  Megalodon: { badge: "Legend", habitat: "Open Ocean", frameClass: "ocean", silhouetteClass: "shark" },
  Archaeopteryx: { badge: "Feather", habitat: "Sky Forest", frameClass: "sky", silhouetteClass: "feathered" },
  Compsognathus: { badge: "Tiny", habitat: "Leaf Floor", frameClass: "swift", silhouetteClass: "swift" },
  Dimetrodon: { badge: "Sail", habitat: "Steam Flats", frameClass: "spined", silhouetteClass: "spined" },
  Therizinosaurus: { badge: "Claw", habitat: "Moon Jungle", frameClass: "mystic", silhouetteClass: "clawed" },
  Gallimimus: { badge: "Runner", habitat: "Golden Plain", frameClass: "swift", silhouetteClass: "swift" },
  Argentinosaurus: { badge: "World Giant", habitat: "Endless Prairie", frameClass: "longneck", silhouetteClass: "longneck" },
  Dilophosaurus: { badge: "Twin Crest", habitat: "Storm Basin", frameClass: "crest", silhouetteClass: "crest" },
  Brontosaurus: { badge: "Classic", habitat: "Blue Meadow", frameClass: "longneck", silhouetteClass: "longneck" }
};

const CARD_ARTIFACTS = {
  "ancient-dig-kit": {
    artifactId: "ancient-dig-kit",
    name: "Ancient Dig Kit",
    icon: "⛏️",
    description: "Reveals a nearby hidden fossil-themed POI or bonus dig reward."
  }
};

resetPlayerProgressionOnce();

function resetPlayerProgressionOnce() {
  try {
    if (localStorage.getItem(PROGRESSION_RESET_KEY) === PROGRESSION_RESET_VERSION) {
      return;
    }

    [
      PIN_STORAGE_KEY,
      CAPTURED_POIS_STORAGE_KEY,
      SERVER_STARTED_AT_KEY,
      AVATAR_STORAGE_KEY,
      STATS_STORAGE_KEY,
      ACHIEVEMENTS_STORAGE_KEY,
      CRAFTING_STORAGE_KEY,
      MARKET_STORAGE_KEY,
      CARD_COLLECTION_STORAGE_KEY,
      PLAYER_TITLES_STORAGE_KEY,
      PLAYER_ARTIFACTS_STORAGE_KEY,
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
    cards: readStoredJson(CARD_COLLECTION_STORAGE_KEY, null),
    titles: readStoredJson(PLAYER_TITLES_STORAGE_KEY, []),
    artifacts: readStoredJson(PLAYER_ARTIFACTS_STORAGE_KEY, []),
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
  writeStoredJson(CARD_COLLECTION_STORAGE_KEY, backup.cards);
  writeStoredJson(PLAYER_TITLES_STORAGE_KEY, backup.titles || []);
  writeStoredJson(PLAYER_ARTIFACTS_STORAGE_KEY, backup.artifacts || []);
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
let capturedPOIs = new Map();
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
let leaderboardSummary;
let achievementsScreen;
let achievementsList;
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
let scanPoiBtn;
let advanceCropsBtn;
let readyCropsBtn;
let resetLocalProgressBtn;
let collectionsScreen;
let ownedPinsCount;
let ownedPinsPendingTotal;
let claimOwnedPinRewardsBtn;
let ownedPinsList;
let poiPinsCount;
let poiPinsList;
let poiDetailsPanel;
let poiDetailsCard;
let cardCollectionsCount;
let cardSetsView;
let cardSetDetailView;
let cardSetBackBtn;
let cardSetDetailHeader;
let cardSetGrid;
let activeCardSetId = null;
let playerCardCollection = createDefaultCardCollection();
let cardLongPressTimer = null;
let cardLongPressTriggered = false;
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
  loadPOIs();
  playerCardCollection = loadPlayerCardCollection();
  rebuildSpatialBuckets();

  cacheDom();
  initMap();
  renderPOIs();
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
  leaderboardSummary = document.getElementById("leaderboardSummary");
achievementsScreen = document.getElementById("achievementsScreen");
achievementsList = document.getElementById("achievementsList");
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
scanPoiBtn = document.getElementById("scanPoiBtn");
advanceCropsBtn = document.getElementById("advanceCropsBtn");
readyCropsBtn = document.getElementById("readyCropsBtn");
resetLocalProgressBtn = document.getElementById("resetLocalProgressBtn");
collectionsScreen = document.getElementById("collectionsScreen");
ownedPinsCount = document.getElementById("ownedPinsCount");
ownedPinsPendingTotal = document.getElementById("ownedPinsPendingTotal");
claimOwnedPinRewardsBtn = document.getElementById("claimOwnedPinRewardsBtn");
ownedPinsList = document.getElementById("ownedPinsList");
poiPinsCount = document.getElementById("poiPinsCount");
poiPinsList = document.getElementById("poiPinsList");
poiDetailsPanel = document.getElementById("poiDetailsPanel");
poiDetailsCard = document.getElementById("poiDetailsCard");
cardCollectionsCount = document.getElementById("cardCollectionsCount");
cardSetsView = document.getElementById("cardSetsView");
cardSetDetailView = document.getElementById("cardSetDetailView");
cardSetBackBtn = document.getElementById("cardSetBackBtn");
cardSetDetailHeader = document.getElementById("cardSetDetailHeader");
cardSetGrid = document.getElementById("cardSetGrid");

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
      poiCaptures: 0,
      poiChurchCaptures: 0,
      poiHospitalCaptures: 0,
      poiHistoricCaptures: 0,
      poiParkCaptures: 0,
      poiLandmarkCaptures: 0,
      poiLocalCaptures: 0,
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
      poiCaptures: 0,
      poiChurchCaptures: 0,
      poiHospitalCaptures: 0,
      poiHistoricCaptures: 0,
      poiParkCaptures: 0,
      poiLandmarkCaptures: 0,
      poiLocalCaptures: 0,
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
      poiCaptures: { value: 0, date: null },
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

const POI_ACHIEVEMENTS = [
  {
    id: "poi-discover-1",
    title: "First Find",
    description: "Discover your first point of interest.",
    statKey: "newPois",
    target: 1
  },
  {
    id: "poi-discover-10",
    title: "Local Scout",
    description: "Discover 10 points of interest.",
    statKey: "newPois",
    target: 10
  },
  {
    id: "poi-discover-50",
    title: "Area Mapper",
    description: "Discover 50 points of interest.",
    statKey: "newPois",
    target: 50
  },
  {
    id: "poi-capture-1",
    title: "First Check-In",
    description: "Capture your first point of interest.",
    statKey: "poiCaptures",
    target: 1
  },
  {
    id: "poi-capture-10",
    title: "POI Runner",
    description: "Capture 10 points of interest.",
    statKey: "poiCaptures",
    target: 10
  },
  {
    id: "poi-capture-50",
    title: "Landmark Legend",
    description: "Capture 50 points of interest.",
    statKey: "poiCaptures",
    target: 50
  },
  {
    id: "poi-church-1",
    title: "Steeple Spotter",
    description: "Capture a church POI.",
    statKey: "poiChurchCaptures",
    target: 1
  },
  {
    id: "poi-hospital-1",
    title: "Care Finder",
    description: "Capture a hospital POI.",
    statKey: "poiHospitalCaptures",
    target: 1
  },
  {
    id: "poi-historic-1",
    title: "History Hunter",
    description: "Capture a historic POI.",
    statKey: "poiHistoricCaptures",
    target: 1
  },
  {
    id: "poi-park-1",
    title: "Green Trail",
    description: "Capture a park POI.",
    statKey: "poiParkCaptures",
    target: 1
  },
  {
    id: "poi-landmark-1",
    title: "Landmark Found",
    description: "Capture a landmark POI.",
    statKey: "poiLandmarkCaptures",
    target: 1
  },
  {
    id: "poi-local-1",
    title: "Local Knowledge",
    description: "Capture a local POI.",
    statKey: "poiLocalCaptures",
    target: 1
  }
];

let unlockedAchievements = loadUnlockedAchievements();
let playerTitles = loadPlayerTitles();
let playerArtifacts = loadPlayerArtifacts();

function loadUnlockedAchievements() {
  try {
    const saved = JSON.parse(localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY) || "[]");
    return new Set(Array.isArray(saved) ? saved : []);
  } catch (error) {
    console.warn("Could not load achievements.", error);
    return new Set();
  }
}

function saveUnlockedAchievements() {
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(Array.from(unlockedAchievements)));
  } catch (error) {
    console.warn("Could not save achievements.", error);
  }
}

function loadPlayerTitles() {
  return new Set(readStoredJson(PLAYER_TITLES_STORAGE_KEY, []));
}

function savePlayerTitles() {
  writeStoredJson(PLAYER_TITLES_STORAGE_KEY, Array.from(playerTitles));
}

function loadPlayerArtifacts() {
  return new Set(readStoredJson(PLAYER_ARTIFACTS_STORAGE_KEY, []));
}

function savePlayerArtifacts() {
  writeStoredJson(PLAYER_ARTIFACTS_STORAGE_KEY, Array.from(playerArtifacts));
}

function getAchievementProgress(achievement) {
  if (achievement.cardSetId) {
    const set = getCardSet(achievement.cardSetId);
    return set ? getCardSetProgress(set).ownedCount : 0;
  }

  return Number(playerStats.lifetime[achievement.statKey] || 0);
}

function checkPoiAchievements() {
  let unlockedAny = false;

  POI_ACHIEVEMENTS.forEach((achievement) => {
    if (unlockedAchievements.has(achievement.id)) return;
    if (getAchievementProgress(achievement) < achievement.target) return;

    unlockedAchievements.add(achievement.id);
    unlockedAny = true;
    showToast("Achievement unlocked", achievement.title);
  });

  if (unlockedAny) {
    saveUnlockedAchievements();
    renderAchievements();
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

  const regularItems = baseItems
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

  if (category !== "cards") {
    return regularItems;
  }

  return [
    ...getDuplicateCardInventoryItems(),
    ...regularItems
  ];
}

function getInventoryItem(itemId) {
  if (itemId && String(itemId).startsWith("duplicate-card-")) {
    return getDuplicateCardInventoryItem(itemId);
  }

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

function getDuplicateCardInventoryItems() {
  return Object.entries(playerCardCollection?.duplicateCards || {})
    .map(([cardId, quantity]) => {
      if (Number(quantity) <= 0) return null;
      return getDuplicateCardInventoryItem(`duplicate-card-${cardId}`);
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.quantity !== b.quantity) return b.quantity - a.quantity;
      return a.name.localeCompare(b.name);
    });
}

function getDuplicateCardInventoryItem(itemId) {
  const cardId = String(itemId || "").replace("duplicate-card-", "");
  const card = getCardById(cardId);
  const set = card ? getCardSet(card.setId) : null;
  if (!card || !set) return null;

  const variationLabel = card.isAnimatedVariation ? "Animated variation" : "Normal";
  const quantity = Number(playerCardCollection?.duplicateCards?.[card.cardId] || 0);

  return {
    id: `duplicate-card-${card.cardId}`,
    type: "card",
    cardId: card.cardId,
    name: card.cardName,
    icon: set.themeIcon || "🃏",
    rarity: card.isAnimatedVariation ? "Variation" : capitalizeInventoryText(card.rarity),
    category: "cards",
    setName: set.setName,
    variationType: card.variationType || "normal",
    quantity,
    sellable: true,
    description: `${set.setName} duplicate card · ${variationLabel}.`
  };
}

function renderInventoryCard(item) {
  const rarityClass = String(item.rarity || "common").toLowerCase();
  const isGhost = Number(item.quantity || 0) <= 0;
  const cardDuplicateClass = item.type === "card" ? " inventory-card-duplicate" : "";

  let hintText = "Unsellable";

  if (item.sellable && isGhost) {
    hintText = "Long press to buy";
  } else if (item.sellable) {
    hintText = "Long press to sell";
  }

  return `
    <button
      class="inventory-card${cardDuplicateClass} ${item.sellable ? "" : "unsellable"} ${isGhost ? "inventory-ghost-card" : ""}"
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

  const quantity = item.type === "card"
    ? Number(playerCardCollection.duplicateCards[item.cardId] || 0)
    : marketState.inventory[itemId] || 0;
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

  if (item.type === "card") {
    openDuplicateCardSellPrompt(item);
    return;
  }

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

function openDuplicateCardSellPrompt(item) {
  if (!item || item.type !== "card") return;
  if (Number(item.quantity || 0) <= 0) {
    showToast("Inventory", "No duplicate copies available.");
    return;
  }

  closeDuplicateCardSellPrompt();

  const overlay = document.createElement("div");
  overlay.id = "duplicateCardSellOverlay";
  overlay.className = "duplicate-card-sell-overlay";
  overlay.innerHTML = `
    <div class="duplicate-card-sell-popup">
      <button class="duplicate-card-sell-close" data-duplicate-card-sell-close type="button">×</button>
      <h3>Sell duplicate card?</h3>
      <div class="duplicate-card-sell-card">
        <div class="duplicate-card-sell-icon">${escapeHtml(item.icon)}</div>
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.setName || "Card Collection")}</span>
          <em>${escapeHtml(item.rarity)} · x${formatNumber(item.quantity)}</em>
        </div>
      </div>
      <p>Would you like to list this card on the Market?</p>
      <div class="duplicate-card-sell-actions">
        <button data-duplicate-card-sell-close type="button">Cancel</button>
        <button data-duplicate-card-sell-confirm="${escapeAttribute(item.cardId)}" type="button">Sell on Market</button>
      </div>
    </div>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-duplicate-card-sell-close]")) {
      closeDuplicateCardSellPrompt();
      return;
    }

    const sellButton = event.target.closest("[data-duplicate-card-sell-confirm]");
    if (sellButton) {
      listDuplicateCardOnMarket(sellButton.dataset.duplicateCardSellConfirm);
    }
  });

  document.body.appendChild(overlay);
}

function closeDuplicateCardSellPrompt() {
  const overlay = document.getElementById("duplicateCardSellOverlay");
  if (overlay) overlay.remove();
}

function listDuplicateCardOnMarket(cardId) {
  const quantity = Number(playerCardCollection?.duplicateCards?.[cardId] || 0);
  const card = getCardById(cardId);

  if (!card || quantity <= 0) {
    showToast("Cards", "No duplicate copy available.");
    closeDuplicateCardSellPrompt();
    return;
  }

  playerCardCollection.duplicateCards[cardId] = quantity - 1;

  if (playerCardCollection.duplicateCards[cardId] <= 0) {
    delete playerCardCollection.duplicateCards[cardId];
  }

  savePlayerCardCollection();
  closeDuplicateCardSellPrompt();
  refreshInventoryIfOpen();
  showToast("Listed", `${card.cardName} duplicate queued for the Market.`);
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

/* CUSTOM 2.5D MAP EXPERIMENT START */
let custom25DMapLayer = null;
let custom25DRoadFeatures = [];
let custom25DZoneFeatures = [];
let custom25DBuildingFeatures = [];

function syncCustom25DMapPresentation() {
  if (!map) return;

  const container = map.getContainer();
  const tilePane = map.getPane("tilePane");
  const overlayPane = map.getPane("overlayPane");

  if (ENABLE_CUSTOM_25D_MAP) {
    container.classList.add("custom-25d-map-enabled");
    /* Phase 7 checkpoint: Stable daytime 2.5D renderer. Current road/building/shop/zone balance is approved as the safe baseline. Future visual phases must preserve OSM visibility, pin dominance, and ENABLE_CUSTOM_25D_MAP safety. */
    /* Phase 6.7: Contrast hierarchy tune. Slight readability boost only. Must preserve OSM visibility and safe renderer behavior. */
    if (tilePane) {
      tilePane.style.filter = "grayscale(0.75) saturate(0.4) brightness(1.06) contrast(0.86)";
      tilePane.style.opacity = "0.45";
    }
    if (overlayPane) {
      overlayPane.style.opacity = "0.92";
    }
    return;
  }

  container.classList.remove("custom-25d-map-enabled");
  if (tilePane) {
    tilePane.style.filter = "";
    tilePane.style.opacity = "";
  }
  if (overlayPane) {
    overlayPane.style.opacity = "";
  }
}

function initCustom25DMapExperiment() {
  syncCustom25DMapPresentation();
  if (!ENABLE_CUSTOM_25D_MAP || !map || custom25DMapLayer) return;

  /* Custom 2.5D canvas must stay below pins, player marker, capture radius, and UI. */
  map.createPane("custom25DMapPane");
  const pane = map.getPane("custom25DMapPane");
  pane.style.zIndex = "350";
  pane.style.pointerEvents = "none";

  const canvas = L.DomUtil.create("canvas", "custom-25d-map-canvas", pane);
  canvas.style.position = "absolute";
  canvas.style.pointerEvents = "none";

  const redraw = () => drawCustom25DMapCanvas(canvas);
  custom25DMapLayer = { canvas, redraw };

  map.on("moveend zoomend", redraw);
  redraw();
}

function drawCustom25DMapCanvas(canvas) {
  if (!ENABLE_CUSTOM_25D_MAP || !map || !canvas) return;

  const size = map.getSize();
  const bounds = map.getBounds();
  const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
  L.DomUtil.setPosition(canvas, topLeft);

  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(size.x * scale));
  canvas.height = Math.max(1, Math.round(size.y * scale));
  canvas.style.width = `${size.x}px`;
  canvas.style.height = `${size.y}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, size.x, size.y);

  drawCustom25DBackground(ctx, size, bounds);
  drawCustom25DZones(ctx, bounds, topLeft);
  drawCustom25DBuildings(ctx, bounds, topLeft);
  drawCustom25DRoads(ctx, bounds, topLeft);
  drawCustom25DTrees(ctx, size, bounds);
  drawCustom25DLandmarkFoundation(ctx, bounds, topLeft);
}

function setCustom25DMapRoadFeatures(roadWays) {
  custom25DRoadFeatures = Array.isArray(roadWays) ? roadWays : [];

  if (ENABLE_CUSTOM_25D_MAP && custom25DMapLayer?.redraw) {
    custom25DMapLayer.redraw();
  }
}

function setCustom25DMapZoneFeatures(zoneFeatures) {
  custom25DZoneFeatures = Array.isArray(zoneFeatures) ? zoneFeatures : [];

  if (ENABLE_CUSTOM_25D_MAP && custom25DMapLayer?.redraw) {
    custom25DMapLayer.redraw();
  }
}

function setCustom25DMapBuildingFeatures(buildingFeatures) {
  custom25DBuildingFeatures = Array.isArray(buildingFeatures) ? buildingFeatures : [];

  if (ENABLE_CUSTOM_25D_MAP && custom25DMapLayer?.redraw) {
    custom25DMapLayer.redraw();
  }
}

function custom25DSeedFromBounds(bounds) {
  const center = bounds.getCenter();
  return Math.abs(Math.sin(center.lat * 12.9898 + center.lng * 78.233) * 43758.5453);
}

function custom25DRandom(seed, index) {
  return Math.abs(Math.sin(seed + index * 127.1) * 10000) % 1;
}

function custom25DPoint(size, seed, index) {
  return {
    x: custom25DRandom(seed, index) * size.x,
    y: custom25DRandom(seed, index + 41) * size.y
  };
}

function drawCustom25DBackground(ctx, size) {
  const bg = ctx.createLinearGradient(0, 0, size.x, size.y);
  bg.addColorStop(0, "rgba(241, 246, 226, 0.25)");
  bg.addColorStop(0.48, "rgba(229, 238, 213, 0.35)");
  bg.addColorStop(1, "rgba(214, 227, 194, 0.25)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size.x, size.y);
}

function shouldDrawZoneDetailsAtZoom(zoom, detailLevel = "medium") {
  if (detailLevel === "low") return zoom >= 15;
  if (detailLevel === "high") return zoom >= 18;
  return zoom >= 16.5;
}

function getZoneStyleForFeature(featureType, zoom) {
  const styles = {
    park: {
      fill: "rgba(125, 198, 108, 0.40)",
      edge: "rgba(76, 144, 68, 0.32)",
      inner: "rgba(196, 233, 173, 0.11)"
    },
    grass: {
      fill: "rgba(154, 203, 130, 0.22)",
      edge: "rgba(108, 156, 89, 0.12)",
      inner: "rgba(201, 228, 178, 0.04)"
    },
    water: {
      fill: "rgba(92, 181, 221, 0.37)",
      edge: "rgba(56, 132, 192, 0.34)",
      inner: "rgba(204, 239, 251, 0.11)"
    },
    beach: {
      fill: "rgba(239, 221, 165, 0.34)",
      edge: "rgba(195, 171, 111, 0.22)",
      inner: "rgba(251, 239, 206, 0.11)"
    },
    wetland: {
      fill: "rgba(121, 176, 152, 0.24)",
      edge: "rgba(82, 133, 112, 0.18)",
      inner: "rgba(174, 214, 193, 0.06)"
    },
    sports: {
      fill: "rgba(122, 196, 114, 0.22)",
      edge: "rgba(78, 142, 80, 0.14)",
      inner: "rgba(207, 236, 192, 0.06)"
    }
  };

  const base = styles[featureType] || styles.grass;
  return {
    ...base,
    lineWidth: zoom >= 18 ? 2.2 : zoom >= 16.5 ? 1.6 : 1.1
  };
}

function projectCustom25DZonePoints(coords, topLeft) {
  if (!Array.isArray(coords) || !coords.length) return [];

  return coords.map(([lat, lng]) => {
    const point = map.latLngToLayerPoint([lat, lng]);
    return {
      x: point.x - topLeft.x,
      y: point.y - topLeft.y
    };
  });
}

function drawCustom25DZone(ctx, points, style, closed = true) {
  if (!Array.isArray(points) || points.length < 2) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  if (closed) ctx.closePath();

  if (closed) {
    ctx.fillStyle = style.fill;
    ctx.fill();
    ctx.strokeStyle = style.edge;
    ctx.lineWidth = style.lineWidth;
    ctx.stroke();
  } else {
    ctx.strokeStyle = style.fill;
    ctx.lineWidth = Math.max(4, style.lineWidth * 3.2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }
  ctx.restore();
}

function drawWaterTexture(ctx, points, zoom, closed) {
  if (!shouldDrawZoneDetailsAtZoom(zoom, "medium") || !Array.isArray(points) || points.length < 2) return;

  const bounds = getProjectedBounds(points);
  const spacing = zoom >= 18 ? 22 : 30;

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
  ctx.lineWidth = 1.12;
  if (closed) {
    clipToProjectedPolygon(ctx, points);
  }

  for (let y = bounds.minY + 10; y < bounds.maxY; y += spacing) {
    ctx.beginPath();
    for (let x = bounds.minX - 12; x <= bounds.maxX + 12; x += 22) {
      const waveY = y + Math.sin((x + y) * 0.032) * 2.1;
      if (x === bounds.minX - 12) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawBeachDetails(ctx, points, zoom) {
  if (!shouldDrawZoneDetailsAtZoom(zoom, "high") || !Array.isArray(points) || points.length < 3) return;

  const bounds = getProjectedBounds(points);
  ctx.save();
  clipToProjectedPolygon(ctx, points);
  ctx.fillStyle = "rgba(255, 246, 214, 0.24)";

  for (let i = 0; i < 10; i += 1) {
    const x = bounds.minX + ((i * 41) % Math.max(40, bounds.maxX - bounds.minX + 1));
    const y = bounds.minY + ((i * 27) % Math.max(40, bounds.maxY - bounds.minY + 1));
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}

function drawGrassTexture(ctx, points, zoom, style) {
  if (!shouldDrawZoneDetailsAtZoom(zoom, "medium") || !Array.isArray(points) || points.length < 3) return;

  const bounds = getProjectedBounds(points);
  ctx.save();
  clipToProjectedPolygon(ctx, points);
  ctx.fillStyle = style.inner;

  const spacing = zoom >= 18 ? 22 : 32;
  for (let y = bounds.minY + 10; y < bounds.maxY; y += spacing) {
    ctx.fillRect(bounds.minX, y, Math.max(20, bounds.maxX - bounds.minX), zoom >= 18 ? 1.6 : 1);
  }
  ctx.restore();
}

function drawParkDetails(ctx, points, zoom) {
  if (!shouldDrawZoneDetailsAtZoom(zoom, "medium") || !Array.isArray(points) || points.length < 3) return;

  const bounds = getProjectedBounds(points);
  ctx.save();
  clipToProjectedPolygon(ctx, points);

  if (shouldDrawZoneDetailsAtZoom(zoom, "high")) {
    ctx.strokeStyle = "rgba(248, 240, 204, 0.24)";
    ctx.lineWidth = 1;
    for (let y = bounds.minY + 18; y < bounds.maxY; y += 54) {
      ctx.beginPath();
      ctx.moveTo(bounds.minX, y);
      ctx.quadraticCurveTo((bounds.minX + bounds.maxX) * 0.5, y + 6, bounds.maxX, y - 3);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSportsFieldDetails(ctx, points, zoom) {
  if (!shouldDrawZoneDetailsAtZoom(zoom, "high") || !Array.isArray(points) || points.length < 3) return;

  const bounds = getProjectedBounds(points);
  ctx.save();
  clipToProjectedPolygon(ctx, points);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(bounds.minX + 8, bounds.minY + 8, Math.max(0, bounds.maxX - bounds.minX - 16), Math.max(0, bounds.maxY - bounds.minY - 16));
  ctx.restore();
}

function drawWetlandDetails(ctx, points, zoom) {
  if (!shouldDrawZoneDetailsAtZoom(zoom, "high") || !Array.isArray(points) || points.length < 3) return;

  const bounds = getProjectedBounds(points);
  ctx.save();
  clipToProjectedPolygon(ctx, points);
  ctx.strokeStyle = "rgba(89, 134, 104, 0.28)";
  ctx.lineWidth = 1;

  for (let x = bounds.minX + 10; x < bounds.maxX; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, bounds.maxY);
    ctx.lineTo(x - 2, bounds.maxY - 9);
    ctx.lineTo(x + 1, bounds.maxY - 17);
    ctx.stroke();
  }
  ctx.restore();
}

function getProjectedBounds(points) {
  return points.reduce((acc, point) => ({
    minX: Math.min(acc.minX, point.x),
    minY: Math.min(acc.minY, point.y),
    maxX: Math.max(acc.maxX, point.x),
    maxY: Math.max(acc.maxY, point.y)
  }), {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY
  });
}

function clipToProjectedPolygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.clip();
}

function drawCustom25DZones(ctx, bounds, topLeft) {
  if (!Array.isArray(custom25DZoneFeatures) || !custom25DZoneFeatures.length) return;

  const zoom = map.getZoom();
  const zonePriority = {
    grass: 1,
    sports: 2,
    park: 3,
    wetland: 4,
    beach: 5,
    water: 6
  };

  custom25DZoneFeatures
    .filter((feature) => Array.isArray(feature?.coords) && feature.coords.length >= 2)
    .filter((feature) => feature.coords.some(([lat, lng]) => bounds.contains([lat, lng])))
    .sort((a, b) => (zonePriority[a.zoneType] || 0) - (zonePriority[b.zoneType] || 0))
    .forEach((feature) => {
      const points = projectCustom25DZonePoints(feature.coords, topLeft);
      if (points.length < 2) return;

      const style = getZoneStyleForFeature(feature.zoneType, zoom);
      drawCustom25DZone(ctx, points, style, feature.closed !== false);

      if (feature.zoneType === "water") {
        drawWaterTexture(ctx, points, zoom, feature.closed !== false);
      } else if (feature.zoneType === "beach") {
        drawBeachDetails(ctx, points, zoom);
      } else if (feature.zoneType === "park") {
        drawParkDetails(ctx, points, zoom);
      } else if (feature.zoneType === "grass") {
        drawGrassTexture(ctx, points, zoom, style);
      } else if (feature.zoneType === "sports") {
        drawSportsFieldDetails(ctx, points, zoom);
      } else if (feature.zoneType === "wetland") {
        drawWetlandDetails(ctx, points, zoom);
      }
    });
}

function shouldDrawBuildingAtZoom(zoom) {
  return zoom >= 16.2;
}

/* CUSTOM 2.5D MAP EXPERIMENT START */
const SHOP_25D_RECIPES = {
  bakery: {
    key: "bakery",
    palette: {
      roof: { top: "rgba(183, 108, 92, 0.86)", side: "rgba(149, 84, 71, 0.9)" },
      wall: { front: "rgba(238, 224, 196, 0.86)", side: "rgba(212, 194, 166, 0.9)" },
      awning: "rgba(197, 101, 82, 0.92)",
      sign: "rgba(131, 72, 52, 0.94)",
      window: "rgba(88, 64, 51, 0.34)"
    },
    awning: "striped",
    icon: "bread",
    outside: "crate",
    sizeBias: 0.98
  },
  cafe: {
    key: "cafe",
    palette: {
      roof: { top: "rgba(145, 122, 101, 0.84)", side: "rgba(113, 95, 79, 0.88)" },
      wall: { front: "rgba(229, 214, 194, 0.84)", side: "rgba(198, 183, 163, 0.88)" },
      awning: "rgba(120, 153, 124, 0.9)",
      sign: "rgba(93, 74, 58, 0.9)",
      window: "rgba(63, 73, 80, 0.38)"
    },
    awning: "flat",
    icon: "cup",
    outside: "table",
    sizeBias: 0.96
  },
  surfShop: {
    key: "surfShop",
    palette: {
      roof: { top: "rgba(109, 152, 188, 0.86)", side: "rgba(82, 122, 156, 0.9)" },
      wall: { front: "rgba(225, 237, 233, 0.84)", side: "rgba(196, 209, 205, 0.88)" },
      awning: "rgba(72, 170, 176, 0.92)",
      sign: "rgba(58, 108, 140, 0.94)",
      window: "rgba(67, 107, 125, 0.32)"
    },
    awning: "curved",
    icon: "surfboard",
    outside: "rack",
    sizeBias: 1.02
  },
  fishAndChips: {
    key: "fishAndChips",
    palette: {
      roof: { top: "rgba(116, 150, 182, 0.86)", side: "rgba(84, 118, 146, 0.9)" },
      wall: { front: "rgba(232, 239, 241, 0.86)", side: "rgba(201, 212, 216, 0.9)" },
      awning: "rgba(77, 128, 170, 0.92)",
      sign: "rgba(53, 90, 132, 0.95)",
      window: "rgba(52, 87, 122, 0.28)"
    },
    awning: "striped",
    icon: "fish",
    outside: "crate",
    sizeBias: 1
  },
  pharmacy: {
    key: "pharmacy",
    palette: {
      roof: { top: "rgba(173, 186, 180, 0.84)", side: "rgba(137, 149, 143, 0.88)" },
      wall: { front: "rgba(242, 245, 238, 0.88)", side: "rgba(217, 221, 214, 0.9)" },
      awning: "rgba(101, 176, 111, 0.9)",
      sign: "rgba(69, 139, 83, 0.95)",
      window: "rgba(93, 127, 107, 0.2)"
    },
    awning: "flat",
    icon: "cross",
    outside: "none",
    sizeBias: 0.94
  },
  realEstate: {
    key: "realEstate",
    palette: {
      roof: { top: "rgba(150, 151, 165, 0.84)", side: "rgba(114, 116, 130, 0.88)" },
      wall: { front: "rgba(231, 229, 224, 0.84)", side: "rgba(203, 201, 196, 0.88)" },
      awning: "rgba(122, 139, 164, 0.88)",
      sign: "rgba(84, 99, 124, 0.92)",
      window: "rgba(79, 96, 115, 0.26)"
    },
    awning: "flat",
    icon: "house",
    outside: "signboard",
    sizeBias: 0.98
  },
  bottleShop: {
    key: "bottleShop",
    palette: {
      roof: { top: "rgba(104, 96, 118, 0.86)", side: "rgba(76, 70, 92, 0.9)" },
      wall: { front: "rgba(197, 191, 205, 0.8)", side: "rgba(170, 164, 178, 0.86)" },
      awning: "rgba(102, 89, 133, 0.92)",
      sign: "rgba(73, 63, 100, 0.95)",
      window: "rgba(57, 52, 72, 0.34)"
    },
    awning: "flat",
    icon: "bottle",
    outside: "crate",
    sizeBias: 0.98
  },
  newsagent: {
    key: "newsagent",
    palette: {
      roof: { top: "rgba(166, 149, 121, 0.84)", side: "rgba(129, 115, 92, 0.88)" },
      wall: { front: "rgba(234, 224, 210, 0.84)", side: "rgba(207, 194, 178, 0.88)" },
      awning: "rgba(214, 121, 78, 0.92)",
      sign: "rgba(174, 92, 56, 0.96)",
      window: "rgba(76, 88, 98, 0.26)"
    },
    awning: "striped",
    icon: "paper",
    outside: "stand",
    sizeBias: 0.95
  },
  hardware: {
    key: "hardware",
    palette: {
      roof: { top: "rgba(151, 131, 109, 0.86)", side: "rgba(118, 102, 84, 0.9)" },
      wall: { front: "rgba(223, 214, 201, 0.84)", side: "rgba(195, 185, 171, 0.88)" },
      awning: "rgba(216, 134, 73, 0.92)",
      sign: "rgba(149, 91, 49, 0.96)",
      window: "rgba(88, 94, 92, 0.24)"
    },
    awning: "shed",
    icon: "hammer",
    outside: "crate",
    sizeBias: 1
  },
  supermarket: {
    key: "supermarket",
    palette: {
      roof: { top: "rgba(124, 137, 156, 0.84)", side: "rgba(95, 108, 126, 0.88)" },
      wall: { front: "rgba(227, 232, 229, 0.84)", side: "rgba(198, 204, 200, 0.88)" },
      awning: "rgba(106, 152, 118, 0.9)",
      sign: "rgba(72, 116, 86, 0.94)",
      window: "rgba(78, 111, 99, 0.22)"
    },
    awning: "wide",
    icon: "basket",
    outside: "cart",
    sizeBias: 1.08
  }
};

function hashFeatureSeed(input) {
  const text = String(input || "");
  let hash = 2166136261;

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) || 1;
}
/* CUSTOM 2.5D MAP EXPERIMENT END */

function getBuildingVariantFromSeed(seed) {
  const roofPalette = [
    { top: "rgba(185, 130, 118, 0.84)", side: "rgba(154, 104, 95, 0.88)" },
    { top: "rgba(184, 151, 122, 0.84)", side: "rgba(148, 120, 95, 0.88)" },
    { top: "rgba(145, 160, 173, 0.82)", side: "rgba(112, 127, 139, 0.86)" },
    { top: "rgba(165, 165, 170, 0.8)", side: "rgba(131, 131, 138, 0.84)" }
  ];
  const wallPalette = [
    { front: "rgba(231, 221, 204, 0.82)", side: "rgba(202, 189, 172, 0.86)" },
    { front: "rgba(224, 214, 198, 0.82)", side: "rgba(193, 181, 164, 0.86)" },
    { front: "rgba(214, 209, 216, 0.78)", side: "rgba(185, 178, 187, 0.82)" },
    { front: "rgba(207, 214, 207, 0.8)", side: "rgba(177, 184, 177, 0.84)" }
  ];

  const roofIndex = seed % roofPalette.length;
  const wallIndex = Math.floor(seed / 7) % wallPalette.length;

  return {
    roof: roofPalette[roofIndex],
    wall: wallPalette[wallIndex],
    height: 3.9 + ((seed % 4) * 0.72),
    roofLift: 1.2 + (seed % 2) * 0.6,
    shadowAlpha: 0.052 + ((seed % 4) * 0.015),
    skew: ((seed % 5) - 2) * 0.12,
    inset: 0.875 + ((seed % 3) * 0.02),
    depthX: 1.7 + ((Math.floor(seed / 3) % 4) * 0.34),
    depthY: 3.1 + ((Math.floor(seed / 11) % 4) * 0.44),
    roofScale: 1.014 + ((seed % 3) * 0.004),
    roofInsetScale: 0.9 + ((seed % 2) * 0.025),
    roofHighlightAlpha: 0.07 + ((seed % 3) * 0.018),
    wallHighlightAlpha: 0.045 + ((seed % 2) * 0.012),
    sideShadeAlpha: 0.07 + ((seed % 3) * 0.012),
    shadowOffsetX: 1.8 + ((seed % 3) * 0.28),
    shadowOffsetY: 2.15 + ((seed % 4) * 0.22),
    shadowBlur: 5.2 + ((seed % 4) * 0.8)
  };
}

function getBuildingStyleForFeature(feature, zoom) {
  const seed = hashFeatureSeed([
    feature?.id,
    feature?.center?.lat?.toFixed?.(6),
    feature?.center?.lng?.toFixed?.(6),
    feature?.buildingType,
    feature?.zoneType
  ].filter(Boolean).join(":"));
  const variant = getBuildingVariantFromSeed(seed);
  const detail = zoom >= 18;

  /* CUSTOM 2.5D MAP EXPERIMENT START */
  /* Phase 6.8: Building shape softening. Keep Phase 6.7 readability, but reduce harsh boxy building/shop shapes. */
  /* CUSTOM 2.5D MAP EXPERIMENT END */
  return {
    ...variant,
    seed,
    detail,
    roofLineWidth: detail ? 1.34 : 0.94,
    bodyLineWidth: detail ? 1.08 : 0.82,
    cornerRadius: detail ? 3.6 : 2.8
  };
}

/* CUSTOM 2.5D MAP EXPERIMENT START */
function shouldDrawShopDetailsAtZoom(zoom) {
  return zoom >= 18.2;
}

function shouldDrawShopAtZoom(zoom) {
  return zoom >= 16.8;
}

function hasExactShopHint(feature) {
  return Boolean(getShopTagHint(feature));
}

function isCommercialFeature(feature) {
  if (!feature) return false;

  const buildingType = String(feature.buildingType || "").toLowerCase();
  const shopTag = String(feature.shopTag || "").toLowerCase();
  const amenity = String(feature.amenity || "").toLowerCase();
  const office = String(feature.office || "").toLowerCase();

  return Boolean(
    shopTag ||
    ["commercial", "retail", "supermarket", "kiosk", "shop"].includes(buildingType) ||
    ["cafe", "pharmacy", "fast_food", "restaurant", "bar", "pub"].includes(amenity) ||
    ["estate_agent", "real_estate_agent"].includes(office)
  );
}

function getShopTagHint(feature) {
  const shopTag = String(feature?.shopTag || "").toLowerCase();
  const amenity = String(feature?.amenity || "").toLowerCase();
  const cuisine = String(feature?.cuisine || "").toLowerCase();
  const office = String(feature?.office || "").toLowerCase();
  const buildingType = String(feature?.buildingType || "").toLowerCase();

  if (shopTag === "bakery") return "bakery";
  if (shopTag === "supermarket" || buildingType === "supermarket") return "supermarket";
  if (shopTag === "newsagent") return "newsagent";
  if (shopTag === "pharmacy" || amenity === "pharmacy") return "pharmacy";
  if (shopTag === "doityourself" || shopTag === "hardware") return "hardware";
  if (shopTag === "alcohol" || shopTag === "beverages" || shopTag === "wine") return "bottleShop";
  if (shopTag === "estate_agent" || office === "estate_agent" || office === "real_estate_agent") return "realEstate";
  if (shopTag === "sports" || shopTag === "surf") return "surfShop";
  if (shopTag === "seafood") return "fishAndChips";
  if (amenity === "cafe") return "cafe";
  if (amenity === "fast_food" || amenity === "restaurant") {
    if (cuisine.includes("fish") || cuisine.includes("seafood")) return "fishAndChips";
    return "cafe";
  }

  return null;
}

function getShopVariantFromSeed(seed, shopKey) {
  const stripeFlip = seed % 2 === 0;
  const awningDepth = 0.9 + ((seed % 4) * 0.18);
  const signHeight = 0.75 + ((seed % 3) * 0.18);
  const windowCols = 1 + (seed % 3);
  const doorwayOffset = ((seed % 5) - 2) * 0.06;

  return {
    key: shopKey,
    stripeFlip,
    awningDepth,
    signHeight,
    windowCols,
    doorwayOffset,
    detailVariant: Math.floor(seed / 13) % 3
  };
}

function getShopRecipeForFeature(feature) {
  const zoom = map?.getZoom?.() || 0;
  if (!shouldDrawShopAtZoom(zoom)) return null;
  if (!isCommercialFeature(feature)) return null;

  const seed = hashFeatureSeed([
    feature?.id,
    feature?.center?.lat?.toFixed?.(6),
    feature?.center?.lng?.toFixed?.(6),
    feature?.buildingType,
    feature?.shopTag,
    feature?.amenity,
    feature?.office
  ].filter(Boolean).join(":"));

  const hintedKey = getShopTagHint(feature);
  if (hintedKey && SHOP_25D_RECIPES[hintedKey]) {
    return {
      recipe: SHOP_25D_RECIPES[hintedKey],
      variant: getShopVariantFromSeed(seed, hintedKey),
      seed
    };
  }

  const buildingType = String(feature?.buildingType || "").toLowerCase();
  const baseChance = feature?.buildingArea > 900
    ? 0.42
    : feature?.buildingArea > 550
      ? 0.28
      : 0.16;
  const zoomBoost = zoom >= 18.4 ? 0.12 : zoom >= 17.6 ? 0.04 : 0;
  const roadBoost = ["retail", "commercial", "supermarket"].includes(buildingType) ? 0.12 : 0;
  const coastBoost = feature?.nearCoast ? 0.06 : 0;
  const conversionChance = Math.min(0.58, baseChance + zoomBoost + roadBoost + coastBoost);
  const chanceRoll = (seed % 1000) / 1000;
  if (chanceRoll > conversionChance) return null;

  const defaults = feature?.nearCoast
    ? ["surfShop", "fishAndChips", "cafe", "newsagent"]
    : ["cafe", "bakery", "newsagent", "realEstate"];
  const largerDefaults = feature?.buildingArea > 700
    ? ["supermarket", "hardware", "supermarket", "hardware"]
    : defaults;
  const pool = largerDefaults.filter((key) => SHOP_25D_RECIPES[key]);
  if (!pool.length) return null;

  const selectedKey = pool[seed % pool.length];
  return {
    recipe: SHOP_25D_RECIPES[selectedKey],
    variant: getShopVariantFromSeed(seed, selectedKey),
    seed
  };
}
/* CUSTOM 2.5D MAP EXPERIMENT END */

function projectCustom25DBuildingPoints(coords, topLeft) {
  if (!Array.isArray(coords) || coords.length < 3) return [];

  return coords.map(([lat, lng]) => {
    const point = map.latLngToLayerPoint([lat, lng]);
    return {
      x: point.x - topLeft.x,
      y: point.y - topLeft.y
    };
  });
}

function getBuildingCentroid(points) {
  const total = points.reduce((acc, point) => ({
    x: acc.x + point.x,
    y: acc.y + point.y
  }), { x: 0, y: 0 });

  return {
    x: total.x / points.length,
    y: total.y / points.length
  };
}

function offsetBuildingPoints(points, centroid, shiftX, shiftY, scale = 1) {
  return points.map((point) => ({
    x: centroid.x + (point.x - centroid.x) * scale + shiftX,
    y: centroid.y + (point.y - centroid.y) * scale + shiftY
  }));
}

function drawPolygonPath(ctx, points) {
  if (!Array.isArray(points) || points.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
}

/* CUSTOM 2.5D MAP EXPERIMENT START */
function getSoftBuildingCornerRadius(points, softness = 0.16, maxRadius = 5.5) {
  const bounds = getProjectedBounds(points);
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  return Math.min(maxRadius, Math.max(1.1, Math.min(width, height) * softness));
}

function drawRoundedPolygonPath(ctx, points, radius = 2.2) {
  if (!Array.isArray(points) || points.length < 3) return;

  const total = points.length;
  ctx.beginPath();

  for (let i = 0; i < total; i += 1) {
    const prev = points[(i - 1 + total) % total];
    const current = points[i];
    const next = points[(i + 1) % total];
    const inDx = current.x - prev.x;
    const inDy = current.y - prev.y;
    const outDx = next.x - current.x;
    const outDy = next.y - current.y;
    const inLen = Math.max(0.001, Math.hypot(inDx, inDy));
    const outLen = Math.max(0.001, Math.hypot(outDx, outDy));
    const cornerRadius = Math.min(radius, inLen * 0.33, outLen * 0.33);
    const startX = current.x - (inDx / inLen) * cornerRadius;
    const startY = current.y - (inDy / inLen) * cornerRadius;
    const endX = current.x + (outDx / outLen) * cornerRadius;
    const endY = current.y + (outDy / outLen) * cornerRadius;

    if (i === 0) ctx.moveTo(startX, startY);
    else ctx.lineTo(startX, startY);
    ctx.quadraticCurveTo(current.x, current.y, endX, endY);
  }

  ctx.closePath();
}
/* CUSTOM 2.5D MAP EXPERIMENT END */

function getSimplifiedBuildingShape(points, style) {
  const bounds = getProjectedBounds(points);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const area = width * height;
  const useToyRect = points.length !== 4 || area < 420 || width > height * 2.6 || height > width * 2.6;

  if (!useToyRect) {
    return offsetBuildingPoints(points, getBuildingCentroid(points), 0, 0, style.inset);
  }

  const insetX = Math.max(2, width * (1 - style.inset) * 0.5);
  const insetY = Math.max(2, height * (1 - style.inset) * 0.5);
  return [
    { x: bounds.minX + insetX, y: bounds.minY + insetY },
    { x: bounds.maxX - insetX, y: bounds.minY + insetY },
    { x: bounds.maxX - insetX, y: bounds.maxY - insetY },
    { x: bounds.minX + insetX, y: bounds.maxY - insetY }
  ];
}

function getBuildingGeometry(points, style, scale = 1) {
  const basePoints = getSimplifiedBuildingShape(points, style).map((point) => ({ ...point }));
  const centroid = getBuildingCentroid(basePoints);
  const scaledBasePoints = scale === 1
    ? basePoints
    : offsetBuildingPoints(basePoints, centroid, 0, 0, scale);
  const roofPoints = offsetBuildingPoints(
    scaledBasePoints,
    centroid,
    (style.depthX ?? (style.skew + 1.8)),
    -(style.depthY ?? style.height),
    style.roofScale || 1.02
  );
  const shadowPoints = offsetBuildingPoints(
    scaledBasePoints,
    centroid,
    style.shadowOffsetX ?? (2.2 + style.skew),
    style.shadowOffsetY ?? (2.4 + style.height * 0.24),
    1.018
  );
  const bounds = getProjectedBounds(scaledBasePoints);
  const frontEdge = getDominantBuildingEdge(scaledBasePoints, "y");
  const sideEdge = getDominantBuildingEdge(scaledBasePoints, "x", frontEdge);

  return {
    centroid,
    bounds,
    basePoints: scaledBasePoints,
    roofPoints,
    shadowPoints,
    frontEdge,
    sideEdge
  };
}

/* CUSTOM 2.5D MAP EXPERIMENT START */
// Phase 8 checkpoint: true 2.5D building depth pass.
// Building/shop depth only. Roads, pins, player marker, capture radius,
// gameplay, UI, and normal flag-off GrowGo behavior must remain unchanged.
// Phase 8.1 checkpoint: building softness + depth balance micro-pass.
// Softens Phase 8 building/shop depth without changing roads, pins,
// player marker, capture radius, gameplay, UI, density, or flag-off behavior.
function getEdgeKey(startIndex, endIndex) {
  return `${startIndex}:${endIndex}`;
}

function getDominantBuildingEdge(points, axis = "y", excludedEdge = null) {
  if (!Array.isArray(points) || points.length < 2) {
    return { startIndex: 0, endIndex: 0 };
  }

  const excludedKey = excludedEdge ? getEdgeKey(excludedEdge.startIndex, excludedEdge.endIndex) : "";
  let bestEdge = { startIndex: 0, endIndex: 1 };
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < points.length; i += 1) {
    const nextIndex = (i + 1) % points.length;
    const edgeKey = getEdgeKey(i, nextIndex);
    if (edgeKey === excludedKey) continue;
    const score = (points[i][axis] + points[nextIndex][axis]) * 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestEdge = { startIndex: i, endIndex: nextIndex };
    }
  }

  return bestEdge;
}

function getBuildingDepth(style, zoom, emphasis = 1) {
  const zoomFactor = zoom >= 18.4 ? 1.08 : zoom >= 17.4 ? 1.02 : 0.96;
  return {
    x: (style.depthX || 1.9) * emphasis * zoomFactor,
    y: (style.depthY || style.height || 3.8) * emphasis * zoomFactor
  };
}

function getBuildingTone(color, alpha = 0.12) {
  return color.replace(/rgba\(([^)]+),\s*([0-9.]+)\)/, (_m, rgb, existingAlpha) => {
    const mixedAlpha = Math.min(0.95, Number(existingAlpha) + alpha);
    return `rgba(${rgb}, ${mixedAlpha.toFixed(2)})`;
  });
}

function drawBuildingShadow(ctx, shadowPoints, style, zoom, cornerRadius) {
  ctx.shadowColor = `rgba(68, 57, 46, ${Math.max(0.05, style.shadowAlpha).toFixed(2)})`;
  ctx.shadowBlur = zoom >= 18 ? (style.shadowBlur || 7.8) : Math.max(4.8, (style.shadowBlur || 7.8) - 1.4);
  ctx.shadowOffsetY = style.shadowOffsetY || 2.2;
  ctx.shadowOffsetX = style.shadowOffsetX || 1.8;
  ctx.fillStyle = `rgba(68, 57, 46, ${(style.shadowAlpha * 0.82).toFixed(2)})`;
  drawRoundedPolygonPath(ctx, shadowPoints, cornerRadius);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawBuildingVerticalFace(ctx, facePoints, fill, stroke, lineWidth, cornerRadius, innerAlpha = 0.06) {
  ctx.fillStyle = fill;
  drawRoundedPolygonPath(ctx, facePoints, cornerRadius);
  ctx.fill();

  ctx.fillStyle = `rgba(255,255,255,${innerAlpha.toFixed(2)})`;
  drawRoundedPolygonPath(ctx, offsetBuildingPoints(facePoints, getBuildingCentroid(facePoints), 0, 0, 0.95), Math.max(1.1, cornerRadius * 0.84));
  ctx.fill();

  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  drawRoundedPolygonPath(ctx, facePoints, cornerRadius);
  ctx.stroke();
}

function drawBuildingRoof(ctx, roofPoints, style, roofCornerRadius) {
  ctx.fillStyle = style.roof.top;
  drawRoundedPolygonPath(ctx, roofPoints, roofCornerRadius);
  ctx.fill();

  const roofHighlightPoints = offsetBuildingPoints(
    roofPoints,
    getBuildingCentroid(roofPoints),
    0,
    0,
    style.roofInsetScale || 0.92
  );
  ctx.fillStyle = `rgba(255,255,255,${(style.roofHighlightAlpha || 0.08).toFixed(2)})`;
  drawRoundedPolygonPath(ctx, roofHighlightPoints, Math.max(1.1, roofCornerRadius * 0.78));
  ctx.fill();

  ctx.strokeStyle = style.roof.side;
  ctx.lineWidth = style.roofLineWidth;
  drawRoundedPolygonPath(ctx, roofPoints, roofCornerRadius);
  ctx.stroke();
}
/* CUSTOM 2.5D MAP EXPERIMENT END */

function drawGeneric25DBuilding(ctx, points, style, zoom, geometry = null) {
  if (!Array.isArray(points) || points.length < 3) return;

  const buildingGeometry = geometry || getBuildingGeometry(points, style);
  const {
    basePoints,
    roofPoints,
    shadowPoints,
    frontEdge,
    sideEdge
  } = buildingGeometry;
  const baseCornerRadius = getSoftBuildingCornerRadius(basePoints, 0.15, style.cornerRadius || 4);
  const roofCornerRadius = getSoftBuildingCornerRadius(roofPoints, 0.13, Math.max(1.6, (style.cornerRadius || 4) - 0.4));
  const faceRadius = Math.max(1.35, baseCornerRadius * 0.58);
  const frontFace = [
    basePoints[frontEdge.startIndex],
    basePoints[frontEdge.endIndex],
    roofPoints[frontEdge.endIndex],
    roofPoints[frontEdge.startIndex]
  ];
  const sideFace = [
    basePoints[sideEdge.startIndex],
    basePoints[sideEdge.endIndex],
    roofPoints[sideEdge.endIndex],
    roofPoints[sideEdge.startIndex]
  ];

  ctx.save();
  drawBuildingShadow(ctx, shadowPoints, style, zoom, baseCornerRadius);

  drawBuildingVerticalFace(
    ctx,
    sideFace,
    getBuildingTone(style.wall.side, Math.max(0.03, (style.sideShadeAlpha || 0.08) - 0.025)),
    "rgba(102, 92, 84, 0.08)",
    style.bodyLineWidth,
    Math.max(1.25, faceRadius * 0.98),
    0.018
  );

  drawBuildingVerticalFace(
    ctx,
    frontFace,
    style.wall.front,
    "rgba(122, 110, 100, 0.08)",
    style.bodyLineWidth,
    Math.max(1.3, faceRadius * 1.02),
    Math.max(0.022, (style.wallHighlightAlpha || 0.05) - 0.012)
  );

  drawBuildingRoof(ctx, roofPoints, style, roofCornerRadius);

  if (zoom >= 18) {
    const roofRidge = getDominantBuildingEdge(roofPoints, "y", frontEdge);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.62;
    ctx.beginPath();
    ctx.moveTo(roofPoints[roofRidge.startIndex].x, roofPoints[roofRidge.startIndex].y);
    ctx.lineTo(roofPoints[roofRidge.endIndex].x, roofPoints[roofRidge.endIndex].y);
    ctx.stroke();
  }

  ctx.restore();
}

/* CUSTOM 2.5D MAP EXPERIMENT START */
function drawShopIcon25D(ctx, x, y, width, height, iconKey, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(0.8, width * 0.08);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (iconKey === "bread") {
    ctx.beginPath();
    ctx.roundRect(x - width * 0.3, y - height * 0.16, width * 0.6, height * 0.32, height * 0.16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - width * 0.16, y - height * 0.14);
    ctx.lineTo(x - width * 0.08, y + height * 0.12);
    ctx.moveTo(x, y - height * 0.15);
    ctx.lineTo(x + width * 0.06, y + height * 0.12);
    ctx.moveTo(x + width * 0.14, y - height * 0.12);
    ctx.lineTo(x + width * 0.18, y + height * 0.12);
    ctx.stroke();
  } else if (iconKey === "cup") {
    ctx.beginPath();
    ctx.moveTo(x - width * 0.22, y - height * 0.1);
    ctx.lineTo(x + width * 0.16, y - height * 0.1);
    ctx.lineTo(x + width * 0.1, y + height * 0.18);
    ctx.lineTo(x - width * 0.16, y + height * 0.18);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + width * 0.2, y + height * 0.02, width * 0.08, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
  } else if (iconKey === "surfboard") {
    ctx.beginPath();
    ctx.ellipse(x, y, width * 0.12, height * 0.26, 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - height * 0.2);
    ctx.lineTo(x, y + height * 0.22);
    ctx.stroke();
  } else if (iconKey === "fish") {
    ctx.beginPath();
    ctx.ellipse(x, y, width * 0.17, height * 0.12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.17, y);
    ctx.lineTo(x + width * 0.28, y - height * 0.1);
    ctx.lineTo(x + width * 0.28, y + height * 0.1);
    ctx.closePath();
    ctx.stroke();
  } else if (iconKey === "cross") {
    ctx.fillRect(x - width * 0.05, y - height * 0.22, width * 0.1, height * 0.44);
    ctx.fillRect(x - width * 0.22, y - height * 0.05, width * 0.44, height * 0.1);
  } else if (iconKey === "house") {
    ctx.beginPath();
    ctx.moveTo(x - width * 0.22, y + height * 0.12);
    ctx.lineTo(x - width * 0.22, y - height * 0.02);
    ctx.lineTo(x, y - height * 0.22);
    ctx.lineTo(x + width * 0.22, y - height * 0.02);
    ctx.lineTo(x + width * 0.22, y + height * 0.12);
    ctx.closePath();
    ctx.stroke();
  } else if (iconKey === "bottle") {
    ctx.beginPath();
    ctx.roundRect(x - width * 0.08, y - height * 0.2, width * 0.16, height * 0.4, width * 0.06);
    ctx.stroke();
    ctx.fillRect(x - width * 0.03, y - height * 0.26, width * 0.06, height * 0.06);
  } else if (iconKey === "paper") {
    ctx.beginPath();
    ctx.rect(x - width * 0.18, y - height * 0.18, width * 0.32, height * 0.34);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - width * 0.12, y - height * 0.06);
    ctx.lineTo(x + width * 0.08, y - height * 0.06);
    ctx.moveTo(x - width * 0.12, y + 0.01);
    ctx.lineTo(x + width * 0.08, y + 0.01);
    ctx.stroke();
  } else if (iconKey === "hammer") {
    ctx.beginPath();
    ctx.moveTo(x - width * 0.18, y + height * 0.14);
    ctx.lineTo(x + width * 0.08, y - height * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - width * 0.04, y - height * 0.14);
    ctx.lineTo(x + width * 0.16, y - height * 0.14);
    ctx.lineTo(x + width * 0.12, y - height * 0.02);
    ctx.lineTo(x - width * 0.08, y - height * 0.02);
    ctx.closePath();
    ctx.fill();
  } else if (iconKey === "basket") {
    ctx.beginPath();
    ctx.moveTo(x - width * 0.18, y - height * 0.02);
    ctx.lineTo(x - width * 0.12, y + height * 0.18);
    ctx.lineTo(x + width * 0.12, y + height * 0.18);
    ctx.lineTo(x + width * 0.18, y - height * 0.02);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - height * 0.04, width * 0.12, Math.PI, 0);
    ctx.stroke();
  }

  ctx.restore();
}

function drawShopOutsideDetail(ctx, x, y, size, detailKey, color) {
  if (!detailKey || detailKey === "none") return;

  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(76, 66, 58, 0.34)";
  ctx.lineWidth = 0.8;

  if (detailKey === "table") {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - size * 0.02, y, size * 0.04, size * 0.14);
  } else if (detailKey === "signboard") {
    ctx.fillRect(x - size * 0.04, y - size * 0.1, size * 0.08, size * 0.22);
    ctx.fillRect(x - size * 0.12, y - size * 0.18, size * 0.24, size * 0.1);
  } else if (detailKey === "stand") {
    ctx.fillRect(x - size * 0.14, y - size * 0.1, size * 0.28, size * 0.16);
  } else if (detailKey === "cart") {
    ctx.beginPath();
    ctx.rect(x - size * 0.14, y - size * 0.1, size * 0.22, size * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - size * 0.08, y + size * 0.05, size * 0.03, 0, Math.PI * 2);
    ctx.arc(x + size * 0.04, y + size * 0.05, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
  } else if (detailKey === "rack") {
    ctx.strokeRect(x - size * 0.05, y - size * 0.18, size * 0.1, size * 0.3);
  } else if (detailKey === "crate") {
    ctx.fillRect(x - size * 0.08, y - size * 0.08, size * 0.16, size * 0.1);
  }

  ctx.restore();
}

function drawShop25D(ctx, points, style, zoom, recipeBundle) {
  if (!recipeBundle?.recipe) {
    drawGeneric25DBuilding(ctx, points, style, zoom);
    return;
  }

  const { recipe, variant } = recipeBundle;
  const compactScale = Math.min(0.94, recipe.sizeBias || 0.96);
  const softenedStyle = {
    ...style,
    height: Math.max(3.1, style.height * 0.86),
    skew: style.skew * 0.72,
    depthX: getBuildingDepth(style, zoom, 1.12).x,
    depthY: getBuildingDepth(style, zoom, 1.12).y,
    roofScale: Math.max(style.roofScale || 1.02, 1.022),
    roofInsetScale: Math.min(0.95, (style.roofInsetScale || 0.92) + 0.015),
    roofHighlightAlpha: Math.max(style.roofHighlightAlpha || 0.08, 0.086),
    shadowAlpha: Math.max(style.shadowAlpha || 0.06, 0.068),
    shadowOffsetX: Math.max(style.shadowOffsetX || 1.8, 2.05),
    shadowOffsetY: Math.max(style.shadowOffsetY || 2.2, 2.35),
    shadowBlur: Math.max(style.shadowBlur || 6.4, 6.9),
    cornerRadius: (style.cornerRadius || 3.2) + 0.55
  };
  const geometry = getBuildingGeometry(points, {
    ...softenedStyle
  }, compactScale);
  const {
    basePoints,
    bounds
  } = geometry;
  const centroid = getBuildingCentroid(basePoints);
  const frontTop = Math.min(basePoints[0].y, basePoints[1].y, basePoints[2].y, basePoints[3].y);
  const frontBottom = Math.max(basePoints[0].y, basePoints[1].y, basePoints[2].y, basePoints[3].y);
  const width = Math.max(12, bounds.maxX - bounds.minX);
  const height = Math.max(12, frontBottom - frontTop);

  ctx.save();
  drawGeneric25DBuilding(ctx, points, {
    ...softenedStyle,
    roof: recipe.palette.roof,
    wall: recipe.palette.wall,
    shadowAlpha: Math.max(style.shadowAlpha, 0.06)
  }, zoom, geometry);

  const signHeight = Math.max(2.55, height * 0.088 * variant.signHeight);
  const signY = frontTop + height * 0.10;
  const signWidth = width * 0.49;
  const signX = centroid.x - signWidth * 0.5;

  ctx.fillStyle = "rgba(62, 53, 45, 0.10)";
  ctx.beginPath();
  ctx.roundRect(signX + 0.5, signY + 0.8, signWidth, signHeight, signHeight * 0.56);
  ctx.fill();

  ctx.fillStyle = recipe.palette.sign;
  ctx.beginPath();
  ctx.roundRect(signX, signY, signWidth, signHeight, signHeight * 0.56);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.beginPath();
  ctx.roundRect(signX + signWidth * 0.08, signY + signHeight * 0.12, signWidth * 0.78, signHeight * 0.28, signHeight * 0.32);
  ctx.fill();

  const awningY = signY + signHeight + height * 0.04;
  const awningHeight = Math.max(3.05, height * 0.128 * variant.awningDepth);
  const awningInset = width * 0.12;
  const awningWidth = width - awningInset * 2;
  const awningX = bounds.minX + awningInset;

  ctx.fillStyle = "rgba(61, 52, 44, 0.06)";
  ctx.beginPath();
  ctx.moveTo(awningX + 0.5, awningY + 0.8);
  ctx.lineTo(awningX + awningWidth - 0.5, awningY + 0.8);
  ctx.lineTo(awningX + awningWidth * 0.94, awningY + awningHeight + 0.9);
  ctx.lineTo(awningX + awningWidth * 0.06, awningY + awningHeight + 0.9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = recipe.palette.awning;

  if (recipe.awning === "curved") {
    ctx.beginPath();
    ctx.moveTo(awningX, awningY);
    ctx.quadraticCurveTo(centroid.x, awningY + awningHeight, awningX + awningWidth, awningY);
    ctx.lineTo(awningX + awningWidth, awningY + awningHeight * 0.45);
    ctx.quadraticCurveTo(centroid.x, awningY + awningHeight * 1.25, awningX, awningY + awningHeight * 0.45);
    ctx.closePath();
    ctx.fill();
  } else {
    const topLift = recipe.awning === "shed" ? -awningHeight * 0.18 : 0;
    ctx.beginPath();
    ctx.moveTo(awningX, awningY + topLift);
    ctx.lineTo(awningX + awningWidth, awningY + topLift);
    ctx.lineTo(awningX + awningWidth * 0.95, awningY + awningHeight);
    ctx.lineTo(awningX + awningWidth * 0.05, awningY + awningHeight);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(awningX + awningWidth * 0.08, awningY + awningHeight * 0.16, awningWidth * 0.74, Math.max(0.85, awningHeight * 0.15));

  if (recipe.awning === "striped" && shouldDrawShopDetailsAtZoom(zoom)) {
    const stripeCount = 3 + (variant.detailVariant % 2);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    for (let i = 0; i < stripeCount; i += 1) {
      const stripeWidth = awningWidth / stripeCount;
      const stripeIndex = variant.stripeFlip ? i : stripeCount - i - 1;
      ctx.fillRect(awningX + stripeIndex * stripeWidth + stripeWidth * 0.18, awningY + awningHeight * 0.12, stripeWidth * 0.24, awningHeight * 0.62);
    }
  }

  const windowTop = awningY + awningHeight + height * 0.04;
  const windowBottom = frontBottom - height * 0.10;
  const windowHeight = Math.max(4, windowBottom - windowTop);
  const windowWidth = Math.max(4.5, (width * 0.62) / variant.windowCols);
  const windowGap = width * 0.035;
  const totalWindowWidth = variant.windowCols * windowWidth + Math.max(0, variant.windowCols - 1) * windowGap;
  const windowX = centroid.x - totalWindowWidth * 0.5;
  const doorWidth = Math.max(3.6, width * 0.14);
  const doorHeight = Math.max(5.8, height * 0.22);
  const doorX = centroid.x + width * variant.doorwayOffset - doorWidth * 0.5;
  const doorY = frontBottom - doorHeight - height * 0.035;

  ctx.fillStyle = recipe.palette.window;
  for (let i = 0; i < variant.windowCols; i += 1) {
    const x = windowX + i * (windowWidth + windowGap);
    if (x + windowWidth > doorX - 2 && x < doorX + doorWidth + 2) continue;
    ctx.beginPath();
    ctx.roundRect(x, windowTop, windowWidth, windowHeight, Math.min(4.5, windowWidth * 0.24));
    ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.045)";
      ctx.beginPath();
      ctx.roundRect(x + windowWidth * 0.08, windowTop + windowHeight * 0.1, windowWidth * 0.32, windowHeight * 0.22, Math.min(2.4, windowWidth * 0.12));
      ctx.fill();
    ctx.fillStyle = recipe.palette.window;
  }

  ctx.fillStyle = "rgba(62, 58, 57, 0.43)";
  ctx.beginPath();
  ctx.roundRect(doorX, doorY, doorWidth, doorHeight, Math.min(4.5, doorWidth * 0.24));
  ctx.fill();

  if (shouldDrawShopDetailsAtZoom(zoom)) {
    drawShopIcon25D(
      ctx,
      centroid.x,
      signY + signHeight * 0.54,
      signWidth * 0.72,
      signHeight * 1.55,
      recipe.icon,
      "rgba(255, 252, 240, 0.84)"
    );

    drawShopOutsideDetail(
      ctx,
      bounds.minX + width * 0.16,
      frontBottom - height * 0.01,
      Math.min(width, height) * 0.7,
      recipe.outside,
      "rgba(119, 112, 92, 0.48)"
    );
  }

  ctx.restore();
}
/* CUSTOM 2.5D MAP EXPERIMENT END */

function drawCustom25DBuildings(ctx, bounds, topLeft) {
  if (!shouldDrawBuildingAtZoom(map.getZoom())) return;
  if (!Array.isArray(custom25DBuildingFeatures) || !custom25DBuildingFeatures.length) return;

  const zoom = map.getZoom();
  const maxBuildings = zoom >= 18 ? 120 : zoom >= 17 ? 80 : 45;
  let drawn = 0;

  custom25DBuildingFeatures.forEach((feature) => {
    if (drawn >= maxBuildings) return;
    if (!Array.isArray(feature?.coords) || feature.coords.length < 3) return;
    if (!feature.coords.some(([lat, lng]) => bounds.contains([lat, lng]))) return;

    const points = projectCustom25DBuildingPoints(feature.coords, topLeft);
    if (points.length < 3) return;

    const style = getBuildingStyleForFeature(feature, zoom);
    const shopRecipe = getShopRecipeForFeature(feature);
    if (shopRecipe) {
      drawShop25D(ctx, points, style, zoom, shopRecipe);
    } else {
      drawGeneric25DBuilding(ctx, points, style, zoom);
    }
    drawn += 1;
  });
}

function getRoadStyleForFeature(highwayType, zoom) {
  const normalized = String(highwayType || "residential").toLowerCase();
  const zoomBoost = Math.max(0, zoom - 15) * 0.55;
  /* Phase 6.9: Road charm pass. Make roads feel slightly more polished and integrated without overpowering OSM or pins. */
  /* Phase 6.9.1: Road balance micro-pass. Preserve road charm while keeping roads calm under pins. */
  const styles = {
    primary: {
      width: 12.1 + zoomBoost,
      fill: "rgba(232, 188, 118, 0.95)",
      edge: "rgba(189, 140, 88, 0.30)",
      highlight: "rgba(255, 244, 216, 0.34)",
      warmCore: "rgba(246, 213, 152, 0.20)",
      shadow: "rgba(118, 93, 61, 0.08)"
    },
    secondary: {
      width: 8.9 + zoomBoost * 0.8,
      fill: "rgba(239, 223, 184, 0.94)",
      edge: "rgba(175, 149, 110, 0.20)",
      highlight: "rgba(255, 249, 232, 0.24)",
      warmCore: "rgba(245, 226, 186, 0.14)",
      shadow: "rgba(109, 95, 66, 0.06)"
    },
    residential: {
      width: 6.45 + zoomBoost * 0.62,
      fill: "rgba(246, 243, 234, 0.92)",
      edge: "rgba(186, 181, 170, 0.13)",
      highlight: "rgba(255, 255, 255, 0.12)",
      warmCore: "rgba(255, 250, 240, 0.08)",
      shadow: "rgba(112, 109, 103, 0.04)"
    },
    service: {
      width: 4.2 + zoomBoost * 0.44,
      fill: "rgba(235, 231, 222, 0.82)",
      edge: "rgba(176, 171, 160, 0.07)",
      highlight: "rgba(255, 255, 255, 0.06)",
      warmCore: "rgba(252, 248, 236, 0.05)",
      shadow: "rgba(101, 98, 92, 0.028)"
    },
    path: {
      width: 2.2 + zoomBoost * 0.18,
      fill: "rgba(196, 184, 150, 0.72)",
      edge: "rgba(151, 137, 103, 0.05)",
      highlight: "rgba(245, 233, 199, 0.04)",
      warmCore: "rgba(245, 233, 199, 0.02)",
      shadow: "rgba(96, 83, 60, 0.02)"
    }
  };

  if (normalized === "primary" || normalized === "primary_link") return styles.primary;
  if (normalized === "secondary" || normalized === "secondary_link" || normalized === "tertiary" || normalized === "tertiary_link") return styles.secondary;
  if (normalized === "service" || normalized === "road") return styles.service;
  if (["track", "path", "footway", "cycleway", "pedestrian"].includes(normalized)) return styles.path;
  return styles.residential;
}

function drawRoadShadow(ctx, points, style) {
  ctx.save();
  ctx.strokeStyle = style.shadow;
  ctx.lineWidth = style.width + 1.85;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = style.shadow;
  ctx.shadowBlur = Math.max(1.4, style.width * 0.24);
  ctx.shadowOffsetY = Math.max(0.26, style.width * 0.038);
  drawCustom25DRoadPath(ctx, points, style.dash || null);
  ctx.restore();
}

function drawCustom25DRoad(ctx, points, style) {
  drawRoadShadow(ctx, points, style);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = style.edge;
  ctx.lineWidth = style.width + 0.3;
  drawCustom25DRoadPath(ctx, points, style.dash || null);

  ctx.strokeStyle = style.fill;
  ctx.lineWidth = style.width;
  drawCustom25DRoadPath(ctx, points, style.dash || null);

  if (style.warmCore) {
    ctx.strokeStyle = style.warmCore;
    ctx.lineWidth = Math.max(0.68, style.width * 0.31);
    drawCustom25DRoadPath(ctx, points, null);
  }

  ctx.strokeStyle = style.highlight;
  ctx.lineWidth = Math.max(0.62, style.width * 0.12);
  drawCustom25DRoadPath(ctx, points, null);
  ctx.restore();
}

function drawCustom25DRoadPath(ctx, points, dashPattern) {
  if (!Array.isArray(points) || points.length < 2) return;

  ctx.setLineDash(dashPattern || []);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
}

function projectCustom25DRoadPoints(coords, topLeft) {
  if (!Array.isArray(coords) || coords.length < 2) return [];

  return coords.map(([lat, lng]) => {
    const point = map.latLngToLayerPoint([lat, lng]);
    return {
      x: point.x - topLeft.x,
      y: point.y - topLeft.y
    };
  });
}

function drawCustom25DRoads(ctx, bounds, topLeft) {
  if (!Array.isArray(custom25DRoadFeatures) || !custom25DRoadFeatures.length) return;

  const zoom = map.getZoom();

  custom25DRoadFeatures.forEach((road) => {
    if (!Array.isArray(road?.coords) || road.coords.length < 2) return;

    const intersectsBounds = road.coords.some(([lat, lng]) => bounds.contains([lat, lng]));
    if (!intersectsBounds) return;

    const points = projectCustom25DRoadPoints(road.coords, topLeft);
    if (points.length < 2) return;

    const style = getRoadStyleForFeature(road.highway, zoom);
    drawCustom25DRoad(ctx, points, style);
  });
}

function drawTreeCluster(ctx, x, y, scale = 1) {
  const blobs = [
    { x: -5, y: 2, r: 4.2 },
    { x: 0, y: -2, r: 5.3 },
    { x: 5, y: 2, r: 4.4 }
  ];

  blobs.forEach((blob, index) => {
    ctx.fillStyle = index === 1 ? "rgba(50, 133, 63, 0.58)" : "rgba(64, 149, 77, 0.52)";
    ctx.beginPath();
    ctx.arc(x + blob.x * scale, y + blob.y * scale, blob.r * scale, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "rgba(228, 247, 206, 0.14)";
  ctx.beginPath();
  ctx.arc(x - 1.4 * scale, y - 3.2 * scale, 1.8 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawCustom25DTrees(ctx, size, bounds) {
  if (!Array.isArray(custom25DZoneFeatures) || !custom25DZoneFeatures.length) return;

  const zoom = map.getZoom();
  if (!shouldDrawZoneDetailsAtZoom(zoom, "medium")) return;

  custom25DZoneFeatures
    .filter((feature) => feature.zoneType === "park")
    .filter((feature) => Array.isArray(feature.coords) && feature.coords.length >= 3)
    .filter((feature) => feature.coords.some(([lat, lng]) => bounds.contains([lat, lng])))
    .forEach((feature) => {
      const seed = hashFeatureSeed(feature.id);
      const points = projectCustom25DZonePoints(feature.coords, map.latLngToLayerPoint(bounds.getNorthWest()));
      if (points.length < 3) return;

      const clippedBounds = getProjectedBounds(points);
      ctx.save();
      clipToProjectedPolygon(ctx, points);

      const clusterCount = zoom >= 18 ? 5 : 3;
      for (let i = 0; i < clusterCount; i += 1) {
        const rx = (Math.abs(Math.sin(seed + i * 17.3)) % 1);
        const ry = (Math.abs(Math.sin(seed + i * 29.7)) % 1);
        const x = clippedBounds.minX + rx * Math.max(12, clippedBounds.maxX - clippedBounds.minX);
        const y = clippedBounds.minY + ry * Math.max(12, clippedBounds.maxY - clippedBounds.minY);
        const scale = zoom >= 18 ? 0.9 + ((i % 3) * 0.08) : 0.72 + ((i % 2) * 0.05);
        drawTreeCluster(ctx, x, y, scale);
      }

      ctx.restore();
    });
}

/* CUSTOM 2.5D MAP EXPERIMENT START */
// Phase 9 checkpoint: landmark foundation only.
// Prepares safe future special POI rendering helpers without adding live
// landmark data, gameplay, rewards, collection logic, or flag-off behavior changes.
const CUSTOM_25D_LANDMARK_VISUAL_RECIPES = {
  generic: {
    ring: "rgba(201, 160, 74, 0.92)",
    ringShadow: "rgba(108, 82, 38, 0.18)",
    innerTop: "rgba(252, 247, 231, 0.94)",
    innerBottom: "rgba(232, 221, 188, 0.9)",
    glyph: "rgba(134, 98, 38, 0.88)",
    glow: "rgba(255, 232, 170, 0.12)"
  },
  dinosaur: {
    ring: "rgba(206, 166, 82, 0.92)",
    ringShadow: "rgba(108, 82, 38, 0.18)",
    innerTop: "rgba(250, 245, 227, 0.94)",
    innerBottom: "rgba(229, 220, 187, 0.9)",
    glyph: "rgba(120, 88, 44, 0.88)",
    glow: "rgba(241, 220, 152, 0.12)"
  },
  film: {
    ring: "rgba(201, 160, 74, 0.92)",
    ringShadow: "rgba(108, 82, 38, 0.18)",
    innerTop: "rgba(251, 246, 231, 0.94)",
    innerBottom: "rgba(232, 221, 190, 0.9)",
    glyph: "rgba(110, 82, 48, 0.88)",
    glow: "rgba(243, 223, 168, 0.1)"
  },
  music: {
    ring: "rgba(205, 164, 78, 0.92)",
    ringShadow: "rgba(108, 82, 38, 0.18)",
    innerTop: "rgba(252, 246, 232, 0.94)",
    innerBottom: "rgba(231, 220, 189, 0.9)",
    glyph: "rgba(124, 86, 49, 0.88)",
    glow: "rgba(245, 223, 164, 0.1)"
  },
  waterfall: {
    ring: "rgba(194, 156, 74, 0.92)",
    ringShadow: "rgba(100, 78, 42, 0.18)",
    innerTop: "rgba(249, 245, 231, 0.94)",
    innerBottom: "rgba(226, 218, 191, 0.9)",
    glyph: "rgba(90, 108, 133, 0.88)",
    glow: "rgba(188, 225, 250, 0.1)"
  },
  beach: {
    ring: "rgba(198, 157, 76, 0.92)",
    ringShadow: "rgba(104, 80, 40, 0.18)",
    innerTop: "rgba(252, 246, 231, 0.94)",
    innerBottom: "rgba(235, 224, 192, 0.9)",
    glyph: "rgba(162, 122, 66, 0.88)",
    glow: "rgba(244, 223, 161, 0.1)"
  },
  historic: {
    ring: "rgba(204, 163, 82, 0.92)",
    ringShadow: "rgba(109, 84, 41, 0.18)",
    innerTop: "rgba(252, 247, 232, 0.94)",
    innerBottom: "rgba(233, 223, 191, 0.9)",
    glyph: "rgba(127, 95, 56, 0.88)",
    glow: "rgba(243, 222, 164, 0.1)"
  }
};

// PHASE 10 CHECKPOINT: dormant landmark data foundation only; no real POIs loaded.
const CUSTOM_25D_LANDMARK_CATEGORY_DEFINITIONS = {
  dinosaurSites: {
    id: "dinosaurSites",
    label: "Dinosaur Sites",
    rendererCategory: "dinosaur",
    collectionKey: "dinosaurSites",
    rewardType: "landmarkCollection",
    enabledByDefault: false
  },
  filmLocations: {
    id: "filmLocations",
    label: "Film Locations",
    rendererCategory: "film",
    collectionKey: "filmLocations",
    rewardType: "landmarkCollection",
    enabledByDefault: false
  },
  musicLandmarks: {
    id: "musicLandmarks",
    label: "Music Landmarks",
    rendererCategory: "music",
    collectionKey: "musicLandmarks",
    rewardType: "landmarkCollection",
    enabledByDefault: false
  },
  waterfalls: {
    id: "waterfalls",
    label: "Waterfalls",
    rendererCategory: "waterfall",
    collectionKey: "waterfalls",
    rewardType: "landmarkCollection",
    enabledByDefault: false
  },
  beaches: {
    id: "beaches",
    label: "Beaches",
    rendererCategory: "beach",
    collectionKey: "beaches",
    rewardType: "landmarkCollection",
    enabledByDefault: false
  },
  historicPlaces: {
    id: "historicPlaces",
    label: "Historic Places",
    rendererCategory: "historic",
    collectionKey: "historicPlaces",
    rewardType: "landmarkCollection",
    enabledByDefault: false
  }
};

// PHASE 12 CHECKPOINT: dormant landmark category shell only; metadata-only; no rendering, gameplay, rewards, or collections enabled.
const CUSTOM_25D_LANDMARK_CATEGORY_SHELLS = {
  dinosaurSitesAU: {
    id: "dinosaurSitesAU",
    label: "AU Dinosaur Sites",
    description: "Future Australian dinosaur and fossil landmark group.",
    enabled: false,
    gameplayEnabled: false,
    collectionEnabled: false,
    rewardEnabled: false
  },
  filmLocationsAU: {
    id: "filmLocationsAU",
    label: "AU Film Locations",
    description: "Future Australian film-location landmark group.",
    enabled: false,
    gameplayEnabled: false,
    collectionEnabled: false,
    rewardEnabled: false
  },
  musicLandmarks: {
    id: "musicLandmarks",
    label: "Music Landmarks",
    description: "Future music-related landmark group.",
    enabled: false,
    gameplayEnabled: false,
    collectionEnabled: false,
    rewardEnabled: false
  },
  waterfalls: {
    id: "waterfalls",
    label: "Waterfalls",
    description: "Future waterfall landmark group.",
    enabled: false,
    gameplayEnabled: false,
    collectionEnabled: false,
    rewardEnabled: false
  },
  beaches: {
    id: "beaches",
    label: "Beaches",
    description: "Future beach landmark group.",
    enabled: false,
    gameplayEnabled: false,
    collectionEnabled: false,
    rewardEnabled: false
  },
  specialLandmarks: {
    id: "specialLandmarks",
    label: "Special Landmarks",
    description: "Future rare or premium landmark group.",
    enabled: false,
    gameplayEnabled: false,
    collectionEnabled: false,
    rewardEnabled: false
  }
};

// PHASE 14 CHECKPOINT: dormant landmark icon shell only; metadata-only; no rendering, Leaflet icons, or marker layers enabled.
const CUSTOM_25D_LANDMARK_ICON_SHELLS = {
  dinosaurSitesAU: {
    id: "dinosaurSitesAU",
    categoryId: "dinosaurSitesAU",
    label: "AU Dinosaur Site Icon",
    ringStyle: "gold-soft",
    innerStyle: "paper-cream",
    badgeStyle: "fossil-amber",
    enabled: false
  },
  filmLocationsAU: {
    id: "filmLocationsAU",
    categoryId: "filmLocationsAU",
    label: "AU Film Location Icon",
    ringStyle: "gold-soft",
    innerStyle: "paper-cream",
    badgeStyle: "reel-bronze",
    enabled: false
  },
  musicLandmarks: {
    id: "musicLandmarks",
    categoryId: "musicLandmarks",
    label: "Music Landmark Icon",
    ringStyle: "gold-soft",
    innerStyle: "paper-cream",
    badgeStyle: "note-amber",
    enabled: false
  },
  waterfalls: {
    id: "waterfalls",
    categoryId: "waterfalls",
    label: "Waterfall Icon",
    ringStyle: "gold-soft",
    innerStyle: "paper-mist",
    badgeStyle: "water-blue",
    enabled: false
  },
  beaches: {
    id: "beaches",
    categoryId: "beaches",
    label: "Beach Icon",
    ringStyle: "gold-soft",
    innerStyle: "paper-sand",
    badgeStyle: "shore-warm",
    enabled: false
  },
  specialLandmarks: {
    id: "specialLandmarks",
    categoryId: "specialLandmarks",
    label: "Special Landmark Icon",
    ringStyle: "gold-premium",
    innerStyle: "paper-ivory",
    badgeStyle: "star-bright",
    enabled: false
  }
};

const CUSTOM_25D_LANDMARK_SAMPLE_DATA = [
  {
    id: "sample-landmark-alpha",
    name: "Sample Landmark Alpha",
    categoryId: "historicPlaces",
    lat: DEFAULT_CENTER[0] + 0.0018,
    lng: DEFAULT_CENTER[1] + 0.0016
  },
  {
    id: "sample-landmark-beta",
    name: "Sample Landmark Beta",
    categoryId: "musicLandmarks",
    lat: DEFAULT_CENTER[0] - 0.0012,
    lng: DEFAULT_CENTER[1] + 0.0014
  },
  {
    id: "sample-landmark-gamma",
    name: "Sample Landmark Gamma",
    categoryId: "dinosaurSites",
    lat: DEFAULT_CENTER[0] + 0.001,
    lng: DEFAULT_CENTER[1] - 0.0017
  }
];

// PHASE 11 CHECKPOINT: first dormant AU dinosaur site seed data; disabled by default; no gameplay, rewards, or collections.
const CUSTOM_25D_DINOSAUR_SITES_AU_SEED = [
  {
    id: "dino-au-lark-quarry",
    categoryId: "dinosaurSites",
    label: "Dinosaur Stampede National Monument",
    shortLabel: "Dinosaur Stampede",
    region: "Queensland",
    country: "Australia",
    lat: -23.0161,
    lng: 142.4114,
    coordinatePrecision: "approximate",
    rendererType: "dinosaur",
    collectionKey: "dinosaurSitesAu",
    gameplayEnabled: false,
    collectionEnabled: false,
    rewardEnabled: false,
    notes: "Dormant seed data only. Not capturable yet."
  },
  {
    id: "dino-au-age-of-dinosaurs",
    categoryId: "dinosaurSites",
    label: "Australian Age of Dinosaurs Museum",
    shortLabel: "Age of Dinosaurs",
    region: "Queensland",
    country: "Australia",
    lat: -22.324,
    lng: 143.038,
    coordinatePrecision: "approximate",
    rendererType: "dinosaur",
    collectionKey: "dinosaurSitesAu",
    gameplayEnabled: false,
    collectionEnabled: false,
    rewardEnabled: false,
    notes: "Dormant seed data only. Not capturable yet."
  },
  {
    id: "dino-au-dinosaur-dreaming",
    categoryId: "dinosaurSites",
    label: "Dinosaur Dreaming",
    shortLabel: "Dinosaur Dreaming",
    region: "Victoria",
    country: "Australia",
    lat: -38.631,
    lng: 145.729,
    coordinatePrecision: "approximate",
    rendererType: "dinosaur",
    collectionKey: "dinosaurSitesAu",
    gameplayEnabled: false,
    collectionEnabled: false,
    rewardEnabled: false,
    notes: "Dormant seed data only. Not capturable yet."
  },
  {
    id: "dino-au-dinosaur-cove",
    categoryId: "dinosaurSites",
    label: "Dinosaur Cove",
    shortLabel: "Dinosaur Cove",
    region: "Victoria",
    country: "Australia",
    lat: -38.665,
    lng: 143.105,
    coordinatePrecision: "approximate",
    rendererType: "dinosaur",
    collectionKey: "dinosaurSitesAu",
    gameplayEnabled: false,
    collectionEnabled: false,
    rewardEnabled: false,
    notes: "Dormant seed data only. Not capturable yet."
  },
  {
    id: "dino-au-gantheaume-point",
    categoryId: "dinosaurSites",
    label: "Gantheaume Point Dinosaur Footprints",
    shortLabel: "Gantheaume Point",
    region: "Western Australia",
    country: "Australia",
    lat: -17.975,
    lng: 122.19,
    coordinatePrecision: "approximate",
    rendererType: "dinosaur",
    collectionKey: "dinosaurSitesAu",
    gameplayEnabled: false,
    collectionEnabled: false,
    rewardEnabled: false,
    notes: "Dormant seed data only. Not capturable yet."
  }
];

function getLandmarkVisualRecipe(category = "generic") {
  return CUSTOM_25D_LANDMARK_VISUAL_RECIPES[category] || CUSTOM_25D_LANDMARK_VISUAL_RECIPES.generic;
}

function getLandmarkCategoryDefinition(categoryId) {
  return CUSTOM_25D_LANDMARK_CATEGORY_DEFINITIONS[categoryId] || null;
}

function getAllCustom25DLandmarkCategoryShells() {
  return Object.values(CUSTOM_25D_LANDMARK_CATEGORY_SHELLS).map((category) => ({
    ...category
  }));
}

function getEnabledCustom25DLandmarkCategoryShells() {
  return getAllCustom25DLandmarkCategoryShells().filter((category) => category.enabled);
}

function getCustom25DLandmarkCategoryShellById(categoryId) {
  return CUSTOM_25D_LANDMARK_CATEGORY_SHELLS[categoryId] || null;
}

function getAllCustom25DLandmarkIconShells() {
  return Object.values(CUSTOM_25D_LANDMARK_ICON_SHELLS).map((icon) => ({
    ...icon
  }));
}

function getEnabledCustom25DLandmarkIconShells() {
  return getAllCustom25DLandmarkIconShells().filter((icon) => icon.enabled);
}

function getCustom25DLandmarkIconShellByCategoryId(categoryId) {
  return CUSTOM_25D_LANDMARK_ICON_SHELLS[categoryId] || null;
}

function getCustom25DLandmarkSampleData(categoryFilter = null) {
  if (!ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA) return [];

  const samples = CUSTOM_25D_LANDMARK_SAMPLE_DATA.map((entry) => {
    const category = getLandmarkCategoryDefinition(entry.categoryId);
    return {
      ...entry,
      rendererCategory: category?.rendererCategory || "generic",
      source: "sample"
    };
  });

  if (!categoryFilter) return samples;
  return samples.filter((entry) => entry.categoryId === categoryFilter || entry.rendererCategory === categoryFilter);
}

function getCustom25DDinosaurSitesAuSeed(categoryFilter = null) {
  if (!ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA) return [];

  const entries = CUSTOM_25D_DINOSAUR_SITES_AU_SEED.map((entry) => ({
    ...entry,
    rendererCategory: entry.rendererType || "dinosaur",
    source: "realSeed"
  }));

  if (!categoryFilter) return entries;
  return entries.filter((entry) => entry.categoryId === categoryFilter || entry.rendererCategory === categoryFilter);
}

function getActiveCustom25DLandmarkData(options = {}) {
  const {
    categoryFilter = null
  } = options;

  if (!ENABLE_CUSTOM_25D_MAP) return [];
  return [
    ...getCustom25DLandmarkSampleData(categoryFilter),
    ...getCustom25DDinosaurSitesAuSeed(categoryFilter)
  ];
}

// PHASE 13 CHECKPOINT: dormant landmark render gate only; rendering stays blocked until explicit map/data conditions are met.
function shouldRenderCustom25DLandmarks(options = {}) {
  const {
    categoryFilter = null
  } = options;

  if (!ENABLE_CUSTOM_25D_MAP) return false;

  const hasLandmarkDataFlagEnabled = (
    ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS ||
    ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA ||
    ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA
  );

  if (!hasLandmarkDataFlagEnabled) return false;

  return getActiveCustom25DLandmarkData({ categoryFilter }).length > 0;
}

function getRenderableCustom25DLandmarks(options = {}) {
  if (!shouldRenderCustom25DLandmarks(options)) return [];
  return getActiveCustom25DLandmarkData(options);
}

// PHASE 15 CHECKPOINT: dormant landmark test layer shell only; no Leaflet layer, markers, or map wiring enabled by default.
const CUSTOM_25D_LANDMARK_TEST_LAYER_STATE = {
  initialized: false,
  enabled: false,
  layer: null,
  markerCount: 0,
  lastUpdatedAt: null
};

function getCustom25DLandmarkTestLayerState() {
  return {
    ...CUSTOM_25D_LANDMARK_TEST_LAYER_STATE
  };
}

function resetCustom25DLandmarkTestLayerState() {
  CUSTOM_25D_LANDMARK_TEST_LAYER_STATE.initialized = false;
  CUSTOM_25D_LANDMARK_TEST_LAYER_STATE.enabled = false;
  CUSTOM_25D_LANDMARK_TEST_LAYER_STATE.layer = null;
  CUSTOM_25D_LANDMARK_TEST_LAYER_STATE.markerCount = 0;
  CUSTOM_25D_LANDMARK_TEST_LAYER_STATE.lastUpdatedAt = null;
  return getCustom25DLandmarkTestLayerState();
}

function canInitializeCustom25DLandmarkTestLayer(options = {}) {
  if (!ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS) return false;
  if (!shouldRenderCustom25DLandmarks(options)) return false;
  return getRenderableCustom25DLandmarks(options).length > 0;
}

// PHASE 16 CHECKPOINT: dormant landmark debug toggle shell only; no UI, rendering, markers, or map layers enabled by default.
const CUSTOM_25D_LANDMARK_DEBUG_STATE = {
  enabled: false,
  showBounds: false,
  showLabels: false,
  showCoordinates: false,
  showCategoryIds: false,
  lastToggledAt: null
};

function getCustom25DLandmarkDebugState() {
  return {
    ...CUSTOM_25D_LANDMARK_DEBUG_STATE
  };
}

function resetCustom25DLandmarkDebugState() {
  CUSTOM_25D_LANDMARK_DEBUG_STATE.enabled = false;
  CUSTOM_25D_LANDMARK_DEBUG_STATE.showBounds = false;
  CUSTOM_25D_LANDMARK_DEBUG_STATE.showLabels = false;
  CUSTOM_25D_LANDMARK_DEBUG_STATE.showCoordinates = false;
  CUSTOM_25D_LANDMARK_DEBUG_STATE.showCategoryIds = false;
  CUSTOM_25D_LANDMARK_DEBUG_STATE.lastToggledAt = null;
  return getCustom25DLandmarkDebugState();
}

function setCustom25DLandmarkDebugState(nextState = {}) {
  const allowedKeys = new Set([
    "enabled",
    "showBounds",
    "showLabels",
    "showCoordinates",
    "showCategoryIds"
  ]);

  Object.entries(nextState).forEach(([key, value]) => {
    if (!allowedKeys.has(key)) return;
    CUSTOM_25D_LANDMARK_DEBUG_STATE[key] = Boolean(value);
  });

  const hasAnyDebugToggleEnabled = (
    CUSTOM_25D_LANDMARK_DEBUG_STATE.enabled ||
    CUSTOM_25D_LANDMARK_DEBUG_STATE.showBounds ||
    CUSTOM_25D_LANDMARK_DEBUG_STATE.showLabels ||
    CUSTOM_25D_LANDMARK_DEBUG_STATE.showCoordinates ||
    CUSTOM_25D_LANDMARK_DEBUG_STATE.showCategoryIds
  );

  CUSTOM_25D_LANDMARK_DEBUG_STATE.lastToggledAt = hasAnyDebugToggleEnabled
    ? Date.now()
    : null;

  return getCustom25DLandmarkDebugState();
}

function isCustom25DLandmarkDebugEnabled() {
  return CUSTOM_25D_LANDMARK_DEBUG_STATE.enabled;
}

// PHASE 17 CHECKPOINT: dormant landmark manual test hook only; no automatic calls, rendering, markers, layers, or UI enabled by default.
const CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE = {
  armed: false,
  lastRunAt: null,
  lastResult: null,
  lastReason: null
};

function getCustom25DLandmarkManualTestHookState() {
  return {
    ...CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE
  };
}

function resetCustom25DLandmarkManualTestHookState() {
  CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.armed = false;
  CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.lastRunAt = null;
  CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.lastResult = null;
  CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.lastReason = null;
  return getCustom25DLandmarkManualTestHookState();
}

function isCustom25DLandmarkManualTestHookArmed() {
  return CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.armed;
}

function armCustom25DLandmarkManualTestHook(options = {}) {
  const allowArm = options?.allowArm !== false;
  if (!allowArm) {
    return {
      ok: false,
      armed: false,
      reason: "Manual landmark hook arming is not allowed."
    };
  }

  CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.armed = true;
  CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.lastReason = "Manual landmark hook armed.";

  return {
    ok: true,
    armed: true,
    reason: "Manual landmark hook armed."
  };
}

function disarmCustom25DLandmarkManualTestHook(options = {}) {
  const keepHistory = options?.keepHistory === true;
  CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.armed = false;
  CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.lastReason = "Manual landmark hook disarmed.";

  if (!keepHistory) {
    CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.lastResult = null;
    CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.lastRunAt = null;
  }

  return {
    ok: true,
    armed: false,
    reason: "Manual landmark hook disarmed."
  };
}

function canRunCustom25DLandmarkManualTestHook(options = {}) {
  if (!CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.armed) return false;
  if (!shouldRenderCustom25DLandmarks(options)) return false;
  if (!canInitializeCustom25DLandmarkTestLayer(options)) return false;
  return getRenderableCustom25DLandmarks(options).length > 0;
}

function normalizeCustom25DLandmarkManualTestHookResult(result = {}, options = {}) {
  const safeResult = result && typeof result === "object" ? result : {};
  const safeReason = typeof safeResult.reason === "string" && safeResult.reason.trim()
    ? safeResult.reason.trim()
    : "Manual landmark test result is unavailable.";
  const timestamp = typeof options?.timestamp === "string" && options.timestamp
    ? options.timestamp
    : new Date().toISOString();

  return {
    ok: safeResult.ok === true,
    executed: safeResult.executed === true,
    reason: safeReason,
    result: Object.prototype.hasOwnProperty.call(safeResult, "result") ? safeResult.result : null,
    timestamp,
    source: "custom-25d-landmark-manual-test-hook"
  };
}

function executeCustom25DLandmarkManualTestHook(options = {}) {
  const renderableLandmarks = getRenderableCustom25DLandmarks(options);
  const canInitializeLayer = canInitializeCustom25DLandmarkTestLayer(options);
  const canRun = canRunCustom25DLandmarkManualTestHook(options);

  let reason = "Manual landmark hook is not armed.";
  if (CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.armed && !shouldRenderCustom25DLandmarks(options)) {
    reason = "Landmark rendering conditions are not met.";
  } else if (CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.armed && shouldRenderCustom25DLandmarks(options) && !canInitializeLayer) {
    reason = "Landmark test layer cannot initialize.";
  } else if (CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.armed && canInitializeLayer && renderableLandmarks.length === 0) {
    reason = "No renderable landmarks are available.";
  } else if (canRun) {
    reason = "manual-test-execute-shell";
  }

  const rawResult = {
    ok: canRun,
    executed: canRun,
    reason,
    result: null,
    renderableCount: renderableLandmarks.length,
    canInitializeLayer,
    debugEnabled: isCustom25DLandmarkDebugEnabled()
  };

  const result = {
    ...rawResult,
    ...normalizeCustom25DLandmarkManualTestHookResult(rawResult)
  };

  CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.lastRunAt = Date.now();
  CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.lastResult = result;
  CUSTOM_25D_LANDMARK_MANUAL_TEST_HOOK_STATE.lastReason = result.reason;

  return result;
}

function runCustom25DLandmarkManualTestHook(options = {}) {
  return executeCustom25DLandmarkManualTestHook(options);
}

function inspectCustom25DLandmarkManualTestHookState(options = {}) {
  const safeState = getCustom25DLandmarkManualTestHookState() || {};
  const timestamp = typeof options?.timestamp === "string" && options.timestamp
    ? options.timestamp
    : new Date().toISOString();

  return {
    ok: true,
    source: "custom-25d-landmark-manual-test-hook",
    armed: isCustom25DLandmarkManualTestHookArmed() === true,
    canRun: canRunCustom25DLandmarkManualTestHook(options) === true,
    lastRunAt: safeState.lastRunAt ?? null,
    lastResult: safeState.lastResult ?? null,
    lastReason: safeState.lastReason ?? null,
    flags: {
      custom25DMap: ENABLE_CUSTOM_25D_MAP === true,
      landmarkTestMarkers: ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS === true,
      landmarkSampleData: ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA === true,
      dinosaurSitesAuData: ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA === true
    },
    timestamp
  };
}

function getCustom25DLandmarkManualTestHookSafetySummary(options = {}) {
  const snapshot = inspectCustom25DLandmarkManualTestHookState(options) || {};
  const flags = snapshot.flags || {};
  const timestamp = typeof options?.timestamp === "string" && options.timestamp
    ? options.timestamp
    : new Date().toISOString();

  return {
    ok: true,
    source: "custom-25d-landmark-manual-test-hook",
    dormantByDefault: (
      flags.custom25DMap !== true &&
      flags.landmarkTestMarkers !== true &&
      flags.landmarkSampleData !== true &&
      flags.dinosaurSitesAuData !== true
    ),
    safeToInspect: true,
    armed: snapshot.armed === true,
    canRun: snapshot.canRun === true,
    flags: {
      custom25DMap: flags.custom25DMap === true,
      landmarkTestMarkers: flags.landmarkTestMarkers === true,
      landmarkSampleData: flags.landmarkSampleData === true,
      dinosaurSitesAuData: flags.dinosaurSitesAuData === true
    },
    createsMarkers: false,
    createsLayers: false,
    createsDomElements: false,
    rendersByDefault: false,
    connectsToLeaflet: false,
    connectsToMapStartup: false,
    changesGameplay: false,
    changesOsmBehavior: false,
    timestamp
  };
}

function getCustom25DLandmarkManualTestHookConsoleGuide(options = {}) {
  const summary = getCustom25DLandmarkManualTestHookSafetySummary(options) || {};
  const timestamp = typeof options?.timestamp === "string" && options.timestamp
    ? options.timestamp
    : new Date().toISOString();

  return {
    ok: true,
    source: "custom-25d-landmark-manual-test-hook",
    dormantByDefault: summary.dormantByDefault === true,
    safeToInspect: summary.safeToInspect === true,
    recommendedOrder: [
      "getCustom25DLandmarkManualTestHookSafetySummary()",
      "inspectCustom25DLandmarkManualTestHookState()",
      "isCustom25DLandmarkManualTestHookArmed()",
      "armCustom25DLandmarkManualTestHook()",
      "canRunCustom25DLandmarkManualTestHook()",
      "executeCustom25DLandmarkManualTestHook()",
      "runCustom25DLandmarkManualTestHook()",
      "disarmCustom25DLandmarkManualTestHook()",
      "resetCustom25DLandmarkManualTestHookState()"
    ],
    helpers: {
      safetySummary: "getCustom25DLandmarkManualTestHookSafetySummary()",
      inspectState: "inspectCustom25DLandmarkManualTestHookState()",
      readState: "getCustom25DLandmarkManualTestHookState()",
      resetState: "resetCustom25DLandmarkManualTestHookState()",
      isArmed: "isCustom25DLandmarkManualTestHookArmed()",
      arm: "armCustom25DLandmarkManualTestHook()",
      disarm: "disarmCustom25DLandmarkManualTestHook()",
      canRun: "canRunCustom25DLandmarkManualTestHook()",
      execute: "executeCustom25DLandmarkManualTestHook()",
      run: "runCustom25DLandmarkManualTestHook()",
      normalizeResult: "normalizeCustom25DLandmarkManualTestHookResult()"
    },
    warning: "Dormant manual helpers only. These do not render or enable landmark markers by default.",
    timestamp
  };
}

function getCustom25DLandmarkManualTestCleanupCheck() {
  return {
    ok: true,
    phase: 24,
    name: "landmark-manual-test-cleanup-check",
    dormant: true,
    flags: {
      custom25DMap: ENABLE_CUSTOM_25D_MAP === true,
      landmarkTestMarkers: ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS === true,
      landmarkSampleData: ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA === true,
      dinosaurSitesAuData: ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA === true
    },
    helperChecks: {
      inspectState: typeof inspectCustom25DLandmarkManualTestHookState === "function",
      safetySummary: typeof getCustom25DLandmarkManualTestHookSafetySummary === "function",
      consoleGuide: typeof getCustom25DLandmarkManualTestHookConsoleGuide === "function",
      isArmed: typeof isCustom25DLandmarkManualTestHookArmed === "function",
      canRun: typeof canRunCustom25DLandmarkManualTestHook === "function",
      execute: typeof executeCustom25DLandmarkManualTestHook === "function",
      run: typeof runCustom25DLandmarkManualTestHook === "function"
    },
    safetyNotes: [
      "Does not render markers.",
      "Does not create layers.",
      "Does not create DOM elements.",
      "Does not enable flags.",
      "Does not call gameplay or capture systems."
    ]
  };
}

function getCustom25DLandmarkManualTestValidationSummary() {
  return {
    ok: true,
    phase: 25,
    name: "landmark-manual-test-validation-summary",
    dormant: true,
    validation: {
      custom25DMap: ENABLE_CUSTOM_25D_MAP === false,
      landmarkTestMarkers: ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS === false,
      landmarkSampleData: ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA === false,
      dinosaurSitesAuData: ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA === false
    },
    helpers: {
      safetySummary: typeof getCustom25DLandmarkManualTestHookSafetySummary === "function",
      consoleGuide: typeof getCustom25DLandmarkManualTestHookConsoleGuide === "function",
      cleanupCheck: typeof getCustom25DLandmarkManualTestCleanupCheck === "function",
      inspectState: typeof inspectCustom25DLandmarkManualTestHookState === "function",
      isArmed: typeof isCustom25DLandmarkManualTestHookArmed === "function",
      canRun: typeof canRunCustom25DLandmarkManualTestHook === "function"
    },
    previousPhase: {
      cleanupCheckExists: typeof getCustom25DLandmarkManualTestCleanupCheck === "function"
    },
    safetyNotes: [
      "Inspection-only helper.",
      "Does not render markers or layers.",
      "Does not create DOM elements.",
      "Does not enable flags.",
      "Does not mutate manual test state."
    ]
  };
}

function getCustom25DLandmarkManualTestReadinessReport() {
  return {
    ok: true,
    phase: 26,
    name: "landmark-manual-test-readiness-report",
    dormant: true,
    flagsReady: {
      custom25DMap: ENABLE_CUSTOM_25D_MAP === false,
      landmarkTestMarkers: ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS === false,
      landmarkSampleData: ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA === false,
      dinosaurSitesAuData: ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA === false
    },
    helpersReady: {
      safetySummary: typeof getCustom25DLandmarkManualTestHookSafetySummary === "function",
      consoleGuide: typeof getCustom25DLandmarkManualTestHookConsoleGuide === "function",
      cleanupCheck: typeof getCustom25DLandmarkManualTestCleanupCheck === "function",
      validationSummary: typeof getCustom25DLandmarkManualTestValidationSummary === "function",
      inspectState: typeof inspectCustom25DLandmarkManualTestHookState === "function",
      canRun: typeof canRunCustom25DLandmarkManualTestHook === "function"
    },
    previousPhase: {
      validationSummaryExists: typeof getCustom25DLandmarkManualTestValidationSummary === "function"
    },
    readyForManualInspection: true,
    notReadyForVisibleRendering: true,
    safetyNotes: [
      "Inspection-only helper.",
      "Does not render markers or layers.",
      "Does not create DOM elements.",
      "Does not enable flags.",
      "Does not mutate manual test state."
    ]
  };
}

function getCustom25DLandmarkManualTestFinalAudit() {
  return {
    ok: true,
    phase: 27,
    name: "landmark-manual-test-final-audit",
    dormant: true,
    flags: {
      custom25DMap: ENABLE_CUSTOM_25D_MAP === false,
      landmarkTestMarkers: ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS === false,
      landmarkSampleData: ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA === false,
      dinosaurSitesAuData: ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA === false
    },
    helpers: {
      safetySummary: typeof getCustom25DLandmarkManualTestHookSafetySummary === "function",
      consoleGuide: typeof getCustom25DLandmarkManualTestHookConsoleGuide === "function",
      cleanupCheck: typeof getCustom25DLandmarkManualTestCleanupCheck === "function",
      validationSummary: typeof getCustom25DLandmarkManualTestValidationSummary === "function",
      readinessReport: typeof getCustom25DLandmarkManualTestReadinessReport === "function",
      inspectState: typeof inspectCustom25DLandmarkManualTestHookState === "function"
    },
    previousPhase: {
      readinessReportExists: typeof getCustom25DLandmarkManualTestReadinessReport === "function"
    },
    auditStatus: "inspection-only",
    visibleOutputCreated: false,
    stateMutated: false,
    flagsChanged: false,
    safeToMerge: true,
    safetyNotes: [
      "Inspection-only helper.",
      "Does not render markers or layers.",
      "Does not create DOM elements.",
      "Does not enable flags.",
      "Does not mutate manual test state."
    ]
  };
}

function getCustom25DLandmarkManualTestHandoffSummary() {
  return {
    ok: true,
    phase: 28,
    name: "landmark-manual-test-handoff-summary",
    dormant: true,
    branchPurpose: "Document dormant manual landmark test helpers for the next safe phase.",
    completedInspectionHelpers: [
      "getCustom25DLandmarkManualTestHookSafetySummary",
      "getCustom25DLandmarkManualTestHookConsoleGuide",
      "getCustom25DLandmarkManualTestCleanupCheck",
      "getCustom25DLandmarkManualTestValidationSummary",
      "getCustom25DLandmarkManualTestReadinessReport",
      "getCustom25DLandmarkManualTestFinalAudit"
    ],
    flags: {
      custom25DMap: ENABLE_CUSTOM_25D_MAP === false,
      landmarkTestMarkers: ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS === false,
      landmarkSampleData: ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA === false,
      dinosaurSitesAuData: ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA === false
    },
    previousPhase: {
      finalAuditExists: typeof getCustom25DLandmarkManualTestFinalAudit === "function"
    },
    handoffStatus: "ready-for-next-dormant-phase",
    visibleOutputCreated: false,
    stateMutated: false,
    safetyNotes: [
      "Inspection-only helper.",
      "Does not render markers or layers.",
      "Does not create DOM elements.",
      "Does not enable flags.",
      "Does not mutate manual test state."
    ]
  };
}

function getCustom25DLandmarkManualTestArchiveIndex() {
  return {
    ok: true,
    phase: 29,
    name: "landmark-manual-test-archive-index",
    dormant: true,
    archivePurpose: "Index dormant manual landmark test helpers for future inspection phases.",
    indexedHelpers: [
      "getCustom25DLandmarkManualTestHookSafetySummary",
      "getCustom25DLandmarkManualTestHookConsoleGuide",
      "getCustom25DLandmarkManualTestCleanupCheck",
      "getCustom25DLandmarkManualTestValidationSummary",
      "getCustom25DLandmarkManualTestReadinessReport",
      "getCustom25DLandmarkManualTestFinalAudit",
      "getCustom25DLandmarkManualTestHandoffSummary"
    ],
    flags: {
      custom25DMap: ENABLE_CUSTOM_25D_MAP === false,
      landmarkTestMarkers: ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS === false,
      landmarkSampleData: ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA === false,
      dinosaurSitesAuData: ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA === false
    },
    previousPhase: {
      handoffSummaryExists: typeof getCustom25DLandmarkManualTestHandoffSummary === "function"
    },
    archiveStatus: "inspection-only-index",
    visibleOutputCreated: false,
    stateMutated: false,
    safetyNotes: [
      "Inspection-only helper.",
      "Does not render markers or layers.",
      "Does not create DOM elements.",
      "Does not enable flags.",
      "Does not mutate manual test state."
    ]
  };
}

function getCustom25DLandmarkManualTestCloseoutMarker() {
  return {
    ok: true,
    phase: 30,
    name: "landmark-manual-test-closeout-marker",
    dormant: true,
    closeoutPurpose: "Mark the dormant landmark manual test foundation as ready for next planning.",
    completedRange: "phases-11-through-30-dormant-landmark-manual-test-foundation",
    flags: {
      custom25DMap: ENABLE_CUSTOM_25D_MAP === false,
      landmarkTestMarkers: ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS === false,
      landmarkSampleData: ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA === false,
      dinosaurSitesAuData: ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA === false
    },
    previousPhase: {
      archiveIndexExists: typeof getCustom25DLandmarkManualTestArchiveIndex === "function"
    },
    closeoutStatus: "inspection-only-closeout-marker",
    visibleOutputCreated: false,
    stateMutated: false,
    flagsChanged: false,
    readyForNextPlanningStep: true,
    safetyNotes: [
      "Inspection-only helper.",
      "Does not render markers or layers.",
      "Does not create DOM elements.",
      "Does not enable flags.",
      "Does not mutate manual test state."
    ]
  };
}

function getCustom25DLandmarkNextPhasePlan() {
  return {
    ok: true,
    phase: 31,
    name: "custom-25d-landmark-next-phase-plan",
    dormant: true,
    purpose: "Planning marker for the next dormant custom 2.5D landmark phase.",
    previousFoundation: {
      closeoutMarkerExists: typeof getCustom25DLandmarkManualTestCloseoutMarker === "function"
    },
    recommendedNextSteps: [
      "review dormant helper chain",
      "decide whether next work should stay inspection-only",
      "avoid visible rendering until explicitly approved",
      "keep all safety flags false by default"
    ],
    flags: {
      custom25DMap: ENABLE_CUSTOM_25D_MAP === false,
      landmarkTestMarkers: ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS === false,
      landmarkSampleData: ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA === false,
      dinosaurSitesAuData: ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA === false
    },
    visibleOutputCreated: false,
    stateMutated: false,
    flagsChanged: false,
    readyForVisibleRendering: false,
    safetyNotes: [
      "Planning-only helper.",
      "Does not render markers or layers.",
      "Does not create DOM elements.",
      "Does not enable flags.",
      "Does not mutate manual test state."
    ]
  };
}

function getCustom25DLandmarkVisibleTestReadinessPlan() {
  return {
    ok: true,
    phase: 32,
    name: "custom-25d-landmark-visible-test-readiness-plan",
    dormant: true,
    purpose: "Readiness plan for a future manual-only visible landmark test without enabling it yet.",
    previousPhase: {
      nextPhasePlanExists: typeof getCustom25DLandmarkNextPhasePlan === "function"
    },
    visibleTestingAllowedNow: false,
    readyForVisibleRendering: false,
    requiresExplicitFutureApproval: true,
    recommendedBeforeVisibleTest: [
      "keep all feature flags false by default",
      "define a manual-only activation path",
      "require console-only invocation",
      "require existing OSM to remain visible underneath",
      "require no gameplay, reward, capture, or backend changes",
      "require test markers to remain disabled until explicitly armed"
    ],
    flags: {
      custom25DMap: ENABLE_CUSTOM_25D_MAP === false,
      landmarkTestMarkers: ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS === false,
      landmarkSampleData: ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA === false,
      dinosaurSitesAuData: ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA === false
    },
    visibleOutputCreated: false,
    stateMutated: false,
    flagsChanged: false,
    safetyNotes: [
      "Planning-only helper.",
      "Does not render markers or layers.",
      "Does not create DOM elements.",
      "Does not enable flags.",
      "Does not mutate manual test state."
    ]
  };
}

function getCustom25DLandmarkVisibleTestPathPlan() {
  return {
    ok: true,
    phase: 33,
    name: "custom-25d-landmark-visible-test-path-plan",
    dormant: true,
    planningOnly: true,
    visibleTestingAllowedNow: false,
    purpose: "Describe the future manual-only path for visible landmark testing without enabling it now.",
    dependsOn: [
      "getCustom25DLandmarkNextPhasePlan",
      "getCustom25DLandmarkVisibleTestReadinessPlan"
    ],
    blockedUntil: [
      "explicit future approval",
      "manual-only activation path is defined",
      "all safety flags remain false by default"
    ],
    requiredBeforeVisibleTesting: [
      "manual-only invocation path documented",
      "OSM remains visible underneath",
      "no gameplay, reward, capture, or backend changes",
      "test markers stay disabled until explicitly armed"
    ],
    manualOnlyFuturePath: [
      "review dormant planning helpers",
      "approve a console-only test path",
      "enable only the minimum temporary flags during a future manual test",
      "restore all flags to false after testing"
    ],
    safetyRules: [
      "do not render anything by default",
      "do not create markers or layers by default",
      "do not mutate gameplay or backend state"
    ],
    forbiddenNow: [
      "visible rendering",
      "marker creation",
      "layer creation",
      "DOM or UI creation",
      "flag activation"
    ],
    expectedCurrentBehavior: "No visible landmark test behavior is active.",
    nextSuggestedPhase: "manual-visible-test-approval-check",
    flags: {
      custom25DMap: ENABLE_CUSTOM_25D_MAP === false,
      landmarkTestMarkers: ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS === false,
      landmarkSampleData: ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA === false,
      dinosaurSitesAuData: ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA === false
    }
  };
}

function getCustom25DLandmarkTestMarkers(bounds) {
  if (!ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS || !bounds) return [];

  const center = bounds.getCenter();
  return [
    {
      id: "landmark-test-generic",
      lat: center.lat + 0.00018,
      lng: center.lng + 0.00012,
      category: "generic"
    }
  ];
}

function drawLandmarkPreviewGlyph(ctx, x, y, size, category, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(0.75, size * 0.08);

  if (category === "dinosaur") {
    ctx.beginPath();
    ctx.arc(x - size * 0.02, y + size * 0.02, size * 0.16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.04, y + size * 0.12);
    ctx.lineTo(x + size * 0.18, y - size * 0.08);
    ctx.stroke();
  } else if (category === "film") {
    ctx.beginPath();
    ctx.rect(x - size * 0.18, y - size * 0.12, size * 0.36, size * 0.24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.1, y - size * 0.12);
    ctx.lineTo(x - size * 0.1, y + size * 0.12);
    ctx.moveTo(x, y - size * 0.12);
    ctx.lineTo(x, y + size * 0.12);
    ctx.stroke();
  } else if (category === "music") {
    ctx.beginPath();
    ctx.moveTo(x - size * 0.02, y - size * 0.18);
    ctx.lineTo(x - size * 0.02, y + size * 0.08);
    ctx.lineTo(x + size * 0.16, y + size * 0.02);
    ctx.lineTo(x + size * 0.16, y - size * 0.16);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - size * 0.06, y + size * 0.14, size * 0.07, 0, Math.PI * 2);
    ctx.arc(x + size * 0.12, y + size * 0.08, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
  } else if (category === "waterfall") {
    ctx.beginPath();
    ctx.moveTo(x - size * 0.14, y - size * 0.14);
    ctx.quadraticCurveTo(x - size * 0.04, y - size * 0.02, x - size * 0.08, y + size * 0.18);
    ctx.moveTo(x + size * 0.05, y - size * 0.14);
    ctx.quadraticCurveTo(x + size * 0.15, y - size * 0.02, x + size * 0.1, y + size * 0.18);
    ctx.stroke();
  } else if (category === "beach") {
    ctx.beginPath();
    ctx.arc(x - size * 0.02, y + size * 0.02, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.02, y + size * 0.02);
    ctx.lineTo(x + size * 0.12, y - size * 0.16);
    ctx.stroke();
  } else if (category === "historic") {
    ctx.beginPath();
    ctx.moveTo(x - size * 0.16, y + size * 0.12);
    ctx.lineTo(x + size * 0.16, y + size * 0.12);
    ctx.moveTo(x - size * 0.12, y + size * 0.12);
    ctx.lineTo(x - size * 0.12, y - size * 0.08);
    ctx.moveTo(x, y + size * 0.12);
    ctx.lineTo(x, y - size * 0.08);
    ctx.moveTo(x + size * 0.12, y + size * 0.12);
    ctx.lineTo(x + size * 0.12, y - size * 0.08);
    ctx.moveTo(x - size * 0.18, y - size * 0.08);
    ctx.lineTo(x, y - size * 0.18);
    ctx.lineTo(x + size * 0.18, y - size * 0.08);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.18);
    ctx.lineTo(x, y - size * 0.03);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSpecialPoiFoundation(ctx, point, recipe, category = "generic") {
  const outerRadius = 13;
  const innerRadius = 9.2;
  const glowRadius = 16.5;
  const gradient = ctx.createRadialGradient(point.x, point.y - 1.5, 2, point.x, point.y, innerRadius);
  gradient.addColorStop(0, recipe.innerTop);
  gradient.addColorStop(1, recipe.innerBottom);

  ctx.save();
  ctx.shadowColor = recipe.ringShadow;
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 1.5;

  ctx.fillStyle = recipe.glow;
  ctx.beginPath();
  ctx.arc(point.x, point.y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = recipe.ring;
  ctx.beginPath();
  ctx.arc(point.x, point.y, outerRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.beginPath();
  ctx.arc(point.x, point.y, outerRadius - 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(point.x, point.y, innerRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.32)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(point.x, point.y - 0.6, innerRadius - 1.25, Math.PI * 1.08, Math.PI * 1.9);
  ctx.stroke();

  drawLandmarkPreviewGlyph(ctx, point.x, point.y, innerRadius * 1.5, category, recipe.glyph);
  ctx.restore();
}

function renderCustomLandmarkLayer(ctx, bounds) {
  const activeLandmarks = getActiveCustom25DLandmarkData();
  const testMarkers = getCustom25DLandmarkTestMarkers(bounds);
  const allMarkers = [...activeLandmarks, ...testMarkers];
  if (!allMarkers.length) return;

  allMarkers.forEach((marker) => {
    const point = map.latLngToLayerPoint([marker.lat, marker.lng]);
    if (!bounds.contains([marker.lat, marker.lng])) return;
    const rendererCategory = marker.rendererCategory || marker.category || "generic";
    drawSpecialPoiFoundation(ctx, point, getLandmarkVisualRecipe(rendererCategory), rendererCategory);
  });
}

function drawCustom25DLandmarkFoundation(ctx, bounds) {
  if (!ENABLE_CUSTOM_25D_MAP) return;
  if (!ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS && !ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA) return;
  renderCustomLandmarkLayer(ctx, bounds);
}
/* CUSTOM 2.5D MAP EXPERIMENT END */
/* CUSTOM 2.5D MAP EXPERIMENT END */

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

  initCustom25DMapExperiment();

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
    menuOverlay.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    });
    menuOverlay.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    });
  }

  if (sideMenu) {
    document.addEventListener("pointerdown", handleOutsideMenuPointerDown, true);

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

      if (label.includes("achievements")) {
        openAchievements();
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

function handleOutsideMenuPointerDown(event) {
  if (!sideMenu || !sideMenu.classList.contains("open")) return;
  if (sideMenu.contains(event.target)) return;

  event.preventDefault();
  event.stopPropagation();
  closeMenu();
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

  if (achievementsScreen && !achievementsScreen.classList.contains("hidden")) {
    achievementsScreen.classList.add("hidden");
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
  if (achievementsScreen) achievementsScreen.classList.add("hidden");
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

function openAchievements() {
  if (!achievementsScreen) return;

  hideSubmenus();
  hideMenuHome();
  renderAchievements();
  achievementsScreen.classList.remove("hidden");
}

function renderAchievements() {
  if (!achievementsList) return;

  const achievements = getAllAchievementDefinitions();
  const unlockedCount = achievements.filter((achievement) => unlockedAchievements.has(achievement.id)).length;

  achievementsList.innerHTML = `
    <div class="achievements-summary">
      <span>Unlocked</span>
      <strong>${formatNumber(unlockedCount)} / ${formatNumber(achievements.length)}</strong>
    </div>
    ${achievements.map(renderAchievementCard).join("")}
  `;
}

function getAllAchievementDefinitions() {
  const cardAchievements = CARD_SETS.map((set) => ({
    id: set.completionAchievementId,
    title: `${set.setName} Complete`,
    description: `Complete every card in ${set.setName}.`,
    cardSetId: set.setId,
    target: set.totalCards || set.cards.length
  }));

  return [
    ...POI_ACHIEVEMENTS,
    ...cardAchievements
  ];
}

function renderAchievementCard(achievement) {
  const progress = getAchievementProgress(achievement);
  const progressValue = Math.min(progress, achievement.target);
  const progressPercent = Math.min(100, Math.round((progressValue / achievement.target) * 100));
  const unlocked = unlockedAchievements.has(achievement.id);

  return `
    <div class="achievement-card ${unlocked ? "unlocked" : "locked"}">
      <div class="achievement-medal">${unlocked ? "★" : "•"}</div>
      <div class="achievement-info">
        <div class="achievement-topline">
          <h3>${escapeHtml(achievement.title)}</h3>
          <span>${unlocked ? "Unlocked" : "Locked"}</span>
        </div>
        <p>${escapeHtml(achievement.description)}</p>
        <div class="achievement-progress-track">
          <div class="achievement-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
        <div class="achievement-progress-text">
          ${formatNumber(progressValue)} / ${formatNumber(achievement.target)}
        </div>
      </div>
    </div>
  `;
}

function loadPOIs() {
  capturedPOIs = loadCapturedPOIs();

  pinStore.forEach((pin, id) => {
    if (pin.type === "poi") {
      pinStore.set(id, normalizePOI(pin));
    }
  });

  MOCK_POIS.forEach((poi) => {
    if (!pinStore.has(poi.id)) {
      addPOIToMap(poi);
    }
  });
}

function addPOIToMap(poi) {
  const normalized = normalizePOI({
    ...poi,
    type: "poi",
    discoveredBy: poi.discoveredBy || getActivePlayerId(),
    discoveredAt: poi.discoveredAt || getTrustedNow()
  });

  pinStore.set(normalized.id, normalized);
}

function normalizePOI(poi) {
  const captured = capturedPOIs.get(poi.id) || null;
  const category = poi.category || getPoiCollectionCategory(poi.poiCategory || poi.subcategory || "Places");
  const subcategory = poi.subcategory || poi.poiCategory || "Local POI";
  const name = poi.name || poi.poiName || subcategory;

  return {
    ...poi,
    id: poi.id,
    type: "poi",
    name,
    category,
    subcategory,
    rarity: poi.rarity === "special" ? "special" : "normal",
    icon: poi.icon || getPoiIconKey(subcategory),
    lat: poi.lat,
    lng: poi.lng,
    description: poi.description || `${subcategory} discovered in the world.`,
    captured: Boolean(captured || poi.captured),
    capturedAt: captured?.capturedAt || poi.capturedAt || null,
    poiName: name,
    poiCategory: subcategory
  };
}

function getPoiCollectionCategory(subcategory) {
  if (subcategory === "Church" || subcategory === "Churches") return "Places";
  if (subcategory === "Park" || subcategory === "Parks") return "Places";
  if (subcategory === "Beach" || subcategory === "Beaches") return "Places";
  if (subcategory === "Waterfall" || subcategory === "Waterfalls") return "Places";
  if (subcategory === "Landmark" || subcategory === "Landmarks") return "Places";
  if (subcategory === "Historic") return "Tourist Attractions";
  if (subcategory === "Hospital") return "Places";
  return "Tourist Attractions";
}

function getPoiIconKey(subcategory) {
  const key = String(subcategory || "").toLowerCase();
  if (key.includes("church")) return "church";
  if (key.includes("park")) return "park";
  if (key.includes("beach")) return "beach";
  if (key.includes("waterfall")) return "waterfall";
  if (key.includes("dinosaur") || key.includes("fossil")) return "dinosaur";
  if (key.includes("film")) return "film";
  if (key.includes("music")) return "music";
  if (key.includes("landmark")) return "landmark";
  return "landmark";
}

function renderPOIs() {
  clearPinIconCache();
  scheduleRedrawPins();
  renderPOICollections();
}

function renderPOICollections() {
  renderPoiPinsCollection();
}

function renderCollections() {
  renderOwnedPinsCollection();
  renderPOICollections();
  renderCardCollections();
}

function createDefaultCardCollection() {
  const now = getTrustedNow();

  return {
    ownedCards: {
      "dino-002": {
        cardId: "dino-002",
        ownedAt: now,
        source: "starter"
      },
      "dino-004": {
        cardId: "dino-004",
        ownedAt: now,
        source: "starter"
      }
    },
    completedSets: {},
    duplicateCards: {},
    packHistory: []
  };
}

function loadPlayerCardCollection() {
  try {
    const saved = JSON.parse(localStorage.getItem(CARD_COLLECTION_STORAGE_KEY) || "null");
    const defaults = createDefaultCardCollection();

    if (!saved || typeof saved !== "object") {
      savePlayerCardCollection(defaults);
      return defaults;
    }

    return {
      ...defaults,
      ...saved,
      ownedCards: {
        ...defaults.ownedCards,
        ...(saved.ownedCards || {})
      },
      completedSets: saved.completedSets || {},
      duplicateCards: saved.duplicateCards || {},
      packHistory: saved.packHistory || []
    };
  } catch (error) {
    console.warn("Could not load card collection.", error);
    return createDefaultCardCollection();
  }
}

function savePlayerCardCollection(collectionData = playerCardCollection) {
  try {
    localStorage.setItem(CARD_COLLECTION_STORAGE_KEY, JSON.stringify(collectionData));
  } catch (error) {
    console.warn("Could not save card collection.", error);
  }
}

function getAllCards() {
  return CARD_SETS.flatMap((set) => set.cards);
}

function getCardSet(setId) {
  return CARD_SETS.find((set) => set.setId === setId) || null;
}

function getCardById(cardId) {
  return getAllCards().find((card) => card.cardId === cardId) || null;
}

function getCardForPOI(poiId) {
  return getAllCards().find((card) => card.matchingPoiId === poiId) || null;
}

function isDinosaurPOI(pin) {
  const text = [
    pin?.category,
    pin?.subcategory,
    pin?.poiCategory,
    pin?.name,
    pin?.poiName,
    pin?.icon
  ].filter(Boolean).join(" ").toLowerCase();

  return text.includes("dinosaur") || text.includes("fossil");
}

function getMissingCardsInSet(setId) {
  const set = getCardSet(setId);
  if (!set) return [];

  return set.cards.filter((card) => !isCardOwned(card.cardId));
}

function pickCardRewardForPOI(pin) {
  if (isDinosaurPOI(pin)) {
    const missingCards = getMissingCardsInSet("dinosaur-discoveries");
    if (missingCards.length > 0) {
      return {
        card: missingCards[Math.floor(Math.random() * missingCards.length)],
        mode: "set-missing"
      };
    }

    const set = getCardSet("dinosaur-discoveries");
    return {
      card: set?.cards[Math.floor(Math.random() * set.cards.length)] || null,
      mode: "set-duplicate"
    };
  }

  const exactCard = getCardForPOI(pin?.id);
  return exactCard ? { card: exactCard, mode: "exact" } : null;
}

function renderPoiCardRewardLine(pin) {
  const reward = pickCardRewardForPOI(pin);
  const card = reward?.card || null;

  if (isDinosaurPOI(pin)) {
    const missingCount = getMissingCardsInSet("dinosaur-discoveries").length;

    return `
      <div class="poi-card-reward-line ${missingCount > 0 ? "new" : "owned"}">
        <span>Card Reward</span>
        <strong>Dinosaur Discoveries</strong>
        <em>${missingCount > 0 ? "Awards one missing dinosaur card" : "Set complete · duplicate card reward"}</em>
      </div>
    `;
  }

  if (!card) return "";

  const set = getCardSet(card.setId);
  const owned = isCardOwned(card.cardId);

  return `
    <div class="poi-card-reward-line ${owned ? "owned" : "new"}">
      <span>Card Reward</span>
      <strong>${escapeHtml(card.cardName)}</strong>
      <em>${escapeHtml(set?.setName || "Card Collection")} · ${owned ? "Already collected" : "Guaranteed on capture"}</em>
    </div>
  `;
}

function isCardOwned(cardId) {
  return Boolean(playerCardCollection?.ownedCards?.[cardId]);
}

function getCardSetProgress(set) {
  const ownedCount = set.cards.filter((card) => isCardOwned(card.cardId)).length;

  return {
    ownedCount,
    totalCards: set.totalCards || set.cards.length,
    complete: ownedCount >= (set.totalCards || set.cards.length)
  };
}

function renderCardCollections() {
  if (!cardSetsView || !cardCollectionsCount) return;

  const totals = CARD_SETS.reduce((summary, set) => {
    const progress = getCardSetProgress(set);
    summary.owned += progress.ownedCount;
    summary.total += progress.totalCards;
    return summary;
  }, { owned: 0, total: 0 });

  cardCollectionsCount.textContent = `${formatNumber(totals.owned)} / ${formatNumber(totals.total)}`;

  if (activeCardSetId) {
    openCardSet(activeCardSetId, false);
    return;
  }

  showCardSetsView();
  cardSetsView.innerHTML = CARD_SETS.map(renderCardSetBack).join("");
}

function renderCardSetBack(set) {
  const progress = getCardSetProgress(set);
  const completion = playerCardCollection.completedSets?.[set.setId] || null;
  const completeClass = completion ? "complete" : "";
  const rewardLabel = completion?.titleAwarded || set.completedTitle || "Complete";
  const coverArt = set.coverImage
    ? `<img class="card-set-back-cover-image" src="${escapeAttribute(set.coverImage)}" alt="${escapeAttribute(set.setName)} cover art" loading="lazy" />`
    : `<span>${escapeHtml(set.themeIcon || "★")}</span>`;

  return `
    <button class="card-set-back ${escapeAttribute(set.themeClass || "")} ${completeClass}" data-card-set-id="${escapeAttribute(set.setId)}" type="button">
      <div class="card-set-back-art">
        ${coverArt}
      </div>
      <div class="card-set-back-name">${escapeHtml(set.setName)}</div>
      <div class="card-set-back-progress">${formatNumber(progress.ownedCount)} / ${formatNumber(progress.totalCards)}</div>
      ${completion ? `<div class="card-set-complete-badge">${escapeHtml(rewardLabel)}</div>` : ""}
    </button>
  `;
}

function showCardSetsView() {
  activeCardSetId = null;
  if (cardSetsView) cardSetsView.classList.remove("hidden");
  if (cardSetDetailView) cardSetDetailView.classList.add("hidden");
}

function openCardSet(setId, updateActive = true) {
  const set = getCardSet(setId);
  if (!set || !cardSetDetailView || !cardSetGrid || !cardSetDetailHeader) return;

  if (updateActive) {
    activeCardSetId = setId;
  }

  const progress = getCardSetProgress(set);
  if (cardSetsView) cardSetsView.classList.add("hidden");
  cardSetDetailView.classList.remove("hidden");
  cardSetDetailHeader.innerHTML = `
    <div class="card-set-detail-title">
      <span>${escapeHtml(set.themeIcon || "★")}</span>
      <div>
        <h4>${escapeHtml(set.setName)}</h4>
        <p>${formatNumber(progress.ownedCount)} / ${formatNumber(progress.totalCards)} cards collected</p>
      </div>
    </div>
    ${renderCardSetRewardSummary(set)}
  `;
  cardSetGrid.innerHTML = set.cards.map((card) => renderCardSlot(card, set)).join("");
}

function renderCardSetRewardSummary(set) {
  const completion = playerCardCollection.completedSets?.[set.setId] || null;
  const artifact = set.artifactRewardId ? CARD_ARTIFACTS[set.artifactRewardId] : null;

  if (!completion) {
    return `
      <div class="card-set-reward-summary">
        <span>Completion Reward</span>
        <strong>Title: ${escapeHtml(set.completedTitle || "Collector")}</strong>
        ${artifact ? `<em>Artifact: ${escapeHtml(artifact.name)}</em>` : ""}
      </div>
    `;
  }

  return `
    <div class="card-set-reward-summary complete">
      <span>Completed</span>
      <strong>Title: ${escapeHtml(completion.titleAwarded || set.completedTitle || "Collector")}</strong>
      ${completion.artifactAwarded && artifact ? `<em>Artifact: ${escapeHtml(artifact.name)}</em>` : ""}
    </div>
  `;
}

function renderCardSlot(card, set) {
  const owned = isCardOwned(card.cardId);
  const ownedClass = owned ? "owned" : "unowned";
  const art = getCardArtMarkup(card, owned);

  return `
    <button
      class="collection-card-slot ${ownedClass} rarity-${escapeAttribute(card.rarity)}"
      data-card-id="${escapeAttribute(card.cardId)}"
      type="button"
      aria-label="${escapeAttribute(card.cardName)} ${owned ? "owned" : "unowned"}"
    >
      <div class="collection-card-art">
        ${art}
      </div>
      <div class="collection-card-label">
        <span>${formatNumber(card.cardNumber)}</span>
        <strong>${escapeHtml(card.cardName)}</strong>
      </div>
      ${owned ? `<div class="collection-card-owned-pill">Owned</div>` : `<div class="collection-card-ghost-pill">Missing</div>`}
    </button>
  `;
}

function getCardArtMarkup(card, owned) {
  const set = getCardSet(card.setId);
  const icon = set?.themeIcon || "★";
  const initial = String(card.cardName || "?").charAt(0).toUpperCase();
  const cardImage = owned ? (card.image || null) : (card.ghostImage || card.image || null);

  if (cardImage) {
    return `
      <div class="collection-card-art-inner image-card-art">
        <img class="collection-card-image" src="${escapeAttribute(cardImage)}" alt="${escapeAttribute(card.cardName)} card art" loading="lazy" />
      </div>
    `;
  }

  if (card.setId === "dinosaur-discoveries") {
    return getDinosaurCardArtMarkup(card, owned);
  }

  return `
    <div class="collection-card-art-inner">
      <div class="collection-card-icon">${escapeHtml(owned ? icon : initial)}</div>
    </div>
  `;
}

function getDinosaurCardArtMarkup(card, owned) {
  const profile = DINOSAUR_CARD_ART_PROFILES[card.cardName] || {
    badge: "Fossil",
    habitat: "Discovery Zone",
    frameClass: "theropod",
    silhouetteClass: "theropod"
  };

  const ownedStateClass = owned ? "owned" : "ghost";

  return `
    <div class="collection-card-art-inner dinosaur-card-art ${escapeAttribute(profile.frameClass)} ${ownedStateClass}">
      <div class="dinosaur-card-foil"></div>
      <div class="dinosaur-card-sky"></div>
      <div class="dinosaur-card-sun"></div>
      <div class="dinosaur-card-silhouette ${escapeAttribute(profile.silhouetteClass)}"></div>
      <div class="dinosaur-card-ground"></div>
      <div class="dinosaur-card-topline">
        <span>#${formatNumber(card.cardNumber)}</span>
        <strong>${escapeHtml(profile.badge)}</strong>
      </div>
      <div class="dinosaur-card-bottomline">
        <strong>${escapeHtml(card.cardName)}</strong>
        <span>${escapeHtml(profile.habitat)}</span>
      </div>
    </div>
  `;
}

function openCardPreview(cardId) {
  const card = getCardById(cardId);
  const set = card ? getCardSet(card.setId) : null;
  if (!card || !set || !isCardOwned(card.cardId)) return;

  closeCardPreview();

  const overlay = document.createElement("div");
  overlay.id = "cardPreviewOverlay";
  overlay.className = "card-preview-overlay";
  overlay.innerHTML = `
    <div class="card-preview-card rarity-${escapeAttribute(card.rarity)}">
      <div class="card-preview-art">
        ${getCardArtMarkup(card, true)}
      </div>
      <h3>${escapeHtml(card.cardName)}</h3>
      <p>Card #${formatNumber(card.cardNumber)} / ${formatNumber(set.totalCards)}</p>
      <p>${escapeHtml(set.setName)}</p>
    </div>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeCardPreview();
    }
  });

  document.body.appendChild(overlay);
}

function closeCardPreview() {
  const overlay = document.getElementById("cardPreviewOverlay");
  if (overlay) overlay.remove();
}

function handleUnownedCardLongPress(cardId) {
  const card = getCardById(cardId);
  const set = card ? getCardSet(card.setId) : null;
  if (!card || !set || isCardOwned(card.cardId)) return;

  openCardMarketPrompt(card, set);
}

function openCardMarketPrompt(card, set) {
  closeCardMarketPrompt();

  const overlay = document.createElement("div");
  overlay.id = "cardMarketPromptOverlay";
  overlay.className = "card-market-prompt-overlay";
  overlay.innerHTML = `
    <div class="card-market-prompt">
      <button class="card-market-close" data-card-market-close type="button">×</button>
      <h3>You don’t own this card.</h3>
      <p>Would you like to search for it on the Market?</p>
      <div class="card-market-missing">
        <strong>#${formatNumber(card.cardNumber)} ${escapeHtml(card.cardName)}</strong>
        <span>${escapeHtml(set.setName)}</span>
      </div>
      <div class="card-market-actions">
        <button data-card-market-close type="button">Cancel</button>
        <button data-card-market-open="${escapeAttribute(card.cardId)}" type="button">Open Market</button>
      </div>
    </div>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-card-market-close]")) {
      closeCardMarketPrompt();
      return;
    }

    const marketButton = event.target.closest("[data-card-market-open]");
    if (marketButton) {
      closeCardMarketPrompt();
      openMarket();
      activeMarketCategory = "cards";
      renderMarket();
      showToast("Market", "Card trading search will be wired in the server phase.");
    }
  });

  document.body.appendChild(overlay);
}

function closeCardMarketPrompt() {
  const overlay = document.getElementById("cardMarketPromptOverlay");
  if (overlay) overlay.remove();
}

function clearCardLongPress() {
  if (cardLongPressTimer) {
    clearTimeout(cardLongPressTimer);
    cardLongPressTimer = null;
  }

  setTimeout(() => {
    cardLongPressTriggered = false;
  }, 80);
}

function awardCard(cardId, source = "test") {
  const card = getCardById(cardId);
  const set = card ? getCardSet(card.setId) : null;
  if (!card || !set) return null;

  if (isCardOwned(cardId)) {
    handleDuplicateCard(cardId);
    showToast("Duplicate Card Found!", `${card.cardName} added to Inventory.`);
    return { status: "duplicate", card };
  }

  playerCardCollection.ownedCards[cardId] = {
    cardId,
    ownedAt: getTrustedNow(),
    source
  };

  checkCardSetCompletion(card.setId);
  savePlayerCardCollection();
  renderCardCollections();
  refreshInventoryIfOpen();
  showToast("New Card Found!", `${card.cardName} added to ${set.setName}.`);
  return { status: "new", card };
}

function handleDuplicateCard(cardId) {
  const card = getCardById(cardId);
  if (!card) return;

  playerCardCollection.duplicateCards[cardId] = Number(playerCardCollection.duplicateCards[cardId] || 0) + 1;
  savePlayerCardCollection();
  refreshInventoryIfOpen();
}

function awardCardPack(packSize = 1, source = "test-pack") {
  const allCards = getAllCards();
  const size = Math.max(1, Number(packSize || 1));
  const results = [];

  for (let i = 0; i < size; i += 1) {
    const card = allCards[Math.floor(Math.random() * allCards.length)];
    if (!card) continue;
    results.push(awardCard(card.cardId, source));
  }

  playerCardCollection.packHistory.push({
    source,
    packSize: size,
    openedAt: getTrustedNow(),
    results: results.filter(Boolean).map((result) => ({
      cardId: result.card.cardId,
      status: result.status
    }))
  });

  savePlayerCardCollection();
  showToast("Card Pack Opened", `${formatNumber(results.length)} card${results.length === 1 ? "" : "s"} revealed.`);
  return results;
}

function checkCardSetCompletion(setId) {
  const set = getCardSet(setId);
  if (!set) return false;
  if (playerCardCollection.completedSets?.[setId]) return false;

  const progress = getCardSetProgress(set);
  if (!progress.complete) return false;

  awardCardSetCompletionRewards(set);
  return true;
}

function awardCardSetCompletionRewards(set) {
  const completedAt = getTrustedNow();
  const titleAwarded = set.completedTitle || `${set.setName} Collector`;
  const artifact = set.artifactRewardId ? CARD_ARTIFACTS[set.artifactRewardId] : null;

  playerCardCollection.completedSets[set.setId] = {
    completedAt,
    titleAwarded,
    achievementAwarded: true,
    artifactAwarded: artifact?.artifactId || null
  };

  playerTitles.add(titleAwarded);

  if (artifact) {
    playerArtifacts.add(artifact.artifactId);
  }

  if (set.completionAchievementId) {
    unlockedAchievements.add(set.completionAchievementId);
  }

  savePlayerTitles();
  savePlayerArtifacts();
  saveUnlockedAchievements();
  savePlayerCardCollection();
  renderAchievements();
  showCardSetCompletionPopup(set, titleAwarded, artifact);
  showToast("Collection Complete!", `${set.setName} complete. Title earned: ${titleAwarded}.`);
  showRewardBurst("Complete!", "level-up");
}

function showCardSetCompletionPopup(set, titleAwarded, artifact = null) {
  closeCardSetCompletionPopup();

  const overlay = document.createElement("div");
  overlay.id = "cardCompletionOverlay";
  overlay.className = "card-completion-overlay";
  overlay.innerHTML = `
    <div class="card-completion-popup">
      <button class="card-completion-close" data-card-completion-close type="button">×</button>
      <div class="card-completion-medal">${escapeHtml(set.themeIcon || "★")}</div>
      <h3>Collection Complete!</h3>
      <h4>${escapeHtml(set.setName)}</h4>
      <div class="card-completion-reward">
        <span>Title Earned</span>
        <strong>${escapeHtml(titleAwarded)}</strong>
      </div>
      <div class="card-completion-reward">
        <span>Achievement Unlocked</span>
        <strong>${escapeHtml(set.setName)} Complete</strong>
      </div>
      ${artifact ? `
        <div class="card-completion-reward artifact">
          <span>Artifact Earned</span>
          <strong>${escapeHtml(artifact.icon)} ${escapeHtml(artifact.name)}</strong>
          <em>${escapeHtml(artifact.description)}</em>
        </div>
      ` : ""}
    </div>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-card-completion-close]")) {
      closeCardSetCompletionPopup();
    }
  });

  document.body.appendChild(overlay);
}

function closeCardSetCompletionPopup() {
  const overlay = document.getElementById("cardCompletionOverlay");
  if (overlay) overlay.remove();
}

function awardFullCardSet(setId = "dinosaur-discoveries", source = "test-complete") {
  const set = getCardSet(setId);
  if (!set) return [];
  return set.cards.map((card) => awardCard(card.cardId, source));
}

window.awardCard = awardCard;
globalThis.awardCard = awardCard;
window.awardCardPack = awardCardPack;
globalThis.awardCardPack = awardCardPack;
window.awardFullCardSet = awardFullCardSet;
globalThis.awardFullCardSet = awardFullCardSet;

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

function renderPoiPinsCollection() {
  if (!poiPinsList || !poiPinsCount) return;
  closePoiDetails();

  const poiPins = Array.from(pinStore.values())
    .filter((pin) => pin.type === "poi")
    .sort((a, b) => {
      const distanceA = getDistanceToPinValue(a);
      const distanceB = getDistanceToPinValue(b);
      if (distanceA !== distanceB) return distanceA - distanceB;
      return String(a.poiName || "").localeCompare(String(b.poiName || ""));
    });

  const capturedCount = poiPins.filter((pin) => pin.captured).length;
  poiPinsCount.textContent = `${formatNumber(capturedCount)} / ${formatNumber(poiPins.length)} collected`;

  if (!poiPins.length) {
    poiPinsList.innerHTML = `
      <div class="owned-pins-empty">
        Scan nearby POIs in Settings to add churches, hospitals, parks, landmarks and local places.
      </div>
    `;
    return;
  }

  poiPinsList.innerHTML = groupPOIsByCategory(poiPins).map(renderPoiCategoryGroup).join("");
}

function groupPOIsByCategory(poiPins) {
  const groups = new Map(POI_COLLECTION_CATEGORIES.map((category) => [category, []]));

  poiPins.forEach((pin) => {
    const category = pin.category || "Tourist Attractions";
    if (!groups.has(category)) {
      groups.set(category, []);
    }

    groups.get(category).push(pin);
  });

  return Array.from(groups.entries())
    .filter(([, pins]) => pins.length > 0)
    .map(([category, pins]) => ({
      category,
      pins: pins.slice(0, 40)
    }));
}

function renderPoiCategoryGroup(group) {
  const capturedCount = group.pins.filter((pin) => pin.captured).length;
  const subcategorySummary = getPoiSubcategorySummary(group.pins);
  const subcategoryRows = getPoiSubcategoryGroups(group.pins).map(renderPoiSubcategoryRow).join("");

  return `
    <section class="poi-category-group">
      <div class="poi-category-header">
        <div>
          <h4>${escapeHtml(group.category)}</h4>
          <span>${escapeHtml(subcategorySummary)}</span>
        </div>
        <strong>${formatNumber(capturedCount)} / ${formatNumber(group.pins.length)}</strong>
      </div>
      <div class="poi-subcategory-list">
        ${subcategoryRows}
      </div>
      <div class="poi-category-list">
        ${group.pins.map(renderPoiPinCard).join("")}
      </div>
    </section>
  `;
}

function getPoiSubcategorySummary(pins) {
  const subcategories = Array.from(new Set(pins.map((pin) => pin.subcategory || pin.poiCategory || "POI")));
  return subcategories.slice(0, 3).join(" · ");
}

function getPoiSubcategoryGroups(pins) {
  const groups = new Map();

  pins.forEach((pin) => {
    const subcategory = pin.subcategory || pin.poiCategory || "POI";
    if (!groups.has(subcategory)) {
      groups.set(subcategory, []);
    }

    groups.get(subcategory).push(pin);
  });

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([subcategory, subcategoryPins]) => ({
      subcategory,
      pins: subcategoryPins
    }));
}

function renderPoiSubcategoryRow(group) {
  const capturedCount = group.pins.filter((pin) => pin.captured).length;
  const total = group.pins.length;
  const percent = total > 0 ? Math.round((capturedCount / total) * 100) : 0;

  return `
    <div class="poi-subcategory-row">
      <span>${escapeHtml(group.subcategory)}</span>
      <div class="poi-subcategory-progress">
        <div style="width: ${percent}%;"></div>
      </div>
      <strong>${formatNumber(capturedCount)} / ${formatNumber(total)}</strong>
    </div>
  `;
}

function renderPoiPinCard(pin) {
  const distance = getDistanceToPinLabel(pin);
  const captureStatus = pin.captured ? "Collected" : "Ready";
  const category = pin.category || "Places";
  const subcategory = pin.subcategory || pin.poiCategory || "POI";
  const name = pin.name || pin.poiName || subcategory;
  const discoveredDate = pin.discoveredAt ? getDisplayDate(pin.discoveredAt) : "Unknown";

  return `
    <div class="poi-pin-card" data-poi-pin-id="${escapeAttribute(pin.id)}" role="button" tabindex="0">
      <div class="poi-pin-badge ${escapeAttribute(pin.rarity || "normal")}">${escapeHtml(getPoiIconText(pin.icon))}</div>
      <div class="poi-pin-info">
        <div class="poi-pin-topline">
          <h4>${escapeHtml(name)}</h4>
          <span class="${pin.captured ? "captured" : "ready"}">${escapeHtml(captureStatus)}</span>
        </div>
        <div class="poi-pin-meta">
          ${escapeHtml(category)} · ${escapeHtml(subcategory)} · ${escapeHtml(distance)} · Found ${escapeHtml(discoveredDate)}
        </div>
        <button data-poi-pin-go="${escapeAttribute(pin.id)}" type="button">Go to POI</button>
      </div>
    </div>
  `;
}

function initCollectionsUi() {
  if (!collectionsScreen) return;

  collectionsScreen.addEventListener("click", (event) => {
    if (event.target.closest("#openTestCardPackBtn")) {
      awardCardPack(3, "test-pack");
      return;
    }

    const setBackButton = event.target.closest("#cardSetBackBtn");
    if (setBackButton) {
      showCardSetsView();
      renderCardCollections();
      return;
    }

    const cardSetButton = event.target.closest("[data-card-set-id]");
    if (cardSetButton) {
      openCardSet(cardSetButton.dataset.cardSetId);
      return;
    }

    const cardSlot = event.target.closest("[data-card-id]");
    if (cardSlot) {
      if (cardLongPressTriggered) {
        cardLongPressTriggered = false;
        return;
      }

      const cardId = cardSlot.dataset.cardId;
      if (isCardOwned(cardId)) {
        openCardPreview(cardId);
      } else {
        showToast("Missing card", "Long-press missing cards to search the Market.");
      }
      return;
    }

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
      return;
    }

    const poiGoButton = event.target.closest("[data-poi-pin-go]");
    if (poiGoButton) {
      goToPoiPin(poiGoButton.dataset.poiPinGo);
      return;
    }

    const poiCard = event.target.closest("[data-poi-pin-id]");
    if (poiCard) {
      openPoiDetails(poiCard.dataset.poiPinId);
      return;
    }

    if (event.target.closest("[data-poi-details-close]")) {
      closePoiDetails();
    }
  });

  collectionsScreen.addEventListener("pointerdown", (event) => {
    const cardSlot = event.target.closest("[data-card-id]");
    if (!cardSlot) return;

    clearCardLongPress();
    const cardId = cardSlot.dataset.cardId;

    cardLongPressTimer = setTimeout(() => {
      cardLongPressTriggered = true;
      handleUnownedCardLongPress(cardId);
    }, CARD_LONG_PRESS_MS);
  });

  ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"].forEach((eventName) => {
    collectionsScreen.addEventListener(eventName, clearCardLongPress);
  });

  collectionsScreen.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const cardSlot = event.target.closest("[data-card-id]");
    if (cardSlot) {
      event.preventDefault();
      const cardId = cardSlot.dataset.cardId;
      if (isCardOwned(cardId)) {
        openCardPreview(cardId);
      } else {
        handleUnownedCardLongPress(cardId);
      }
      return;
    }

    const poiCard = event.target.closest("[data-poi-pin-id]");
    if (!poiCard) return;

    event.preventDefault();
    openPoiDetails(poiCard.dataset.poiPinId);
  });
}

function getDistanceToPinValue(pin) {
  if (!playerLatLng) return Number.POSITIVE_INFINITY;
  return playerLatLng.distanceTo([pin.lat, pin.lng]);
}

function getDistanceToPinLabel(pin) {
  if (!playerLatLng) return "Location needed";

  const distance = getDistanceToPinValue(pin);
  if (distance >= 1000) return `${(distance / 1000).toFixed(2)} km`;
  return `${Math.round(distance)} m`;
}

function openPoiDetails(pinId) {
  const pin = pinStore.get(pinId);
  if (!pin || pin.type !== "poi" || !poiDetailsPanel || !poiDetailsCard) return;

  const category = pin.category || "Places";
  const subcategory = pin.subcategory || pin.poiCategory || "POI";
  const rarity = pin.rarity === "special" ? "Special" : "Normal";
  const capturedAt = pin.capturedAt ? getDisplayDate(pin.capturedAt) : "Not collected";
  const distance = getDistanceToPinLabel(pin);
  const status = pin.captured ? "Collected" : "Ready to collect";

  poiDetailsCard.innerHTML = `
    <button class="poi-details-close" data-poi-details-close type="button">×</button>
    <div class="poi-details-hero">
      <div class="poi-details-badge ${escapeAttribute(pin.rarity || "normal")}">
        ${escapeHtml(getPoiIconText(pin.icon))}
      </div>
      <div>
        <h3>${escapeHtml(pin.name || pin.poiName || subcategory)}</h3>
        <div class="poi-details-rarity ${escapeAttribute(pin.rarity || "normal")}">
          ${escapeHtml(rarity)} POI
        </div>
      </div>
    </div>

    <div class="poi-details-row">
      <span>Category</span>
      <strong>${escapeHtml(category)}</strong>
    </div>
    <div class="poi-details-row">
      <span>Subcategory</span>
      <strong>${escapeHtml(subcategory)}</strong>
    </div>
    <div class="poi-details-row">
      <span>Status</span>
      <strong>${escapeHtml(status)}</strong>
    </div>
    <div class="poi-details-row">
      <span>Captured</span>
      <strong>${escapeHtml(capturedAt)}</strong>
    </div>
    <div class="poi-details-row">
      <span>Distance</span>
      <strong>${escapeHtml(distance)}</strong>
    </div>
    <div class="poi-details-description">
      ${escapeHtml(pin.description || "A real-world point of interest.")}
    </div>
    <div class="poi-details-reward">
      ${formatNumber(POI_PIN_VALUE)} points · ${formatNumber(POI_PIN_VALUE)} XP · ${formatNumber(POI_COIN_REWARD)} coins
    </div>
    ${renderPoiCardRewardLine(pin)}
    <div class="poi-details-actions">
      <button data-poi-details-close type="button">Close</button>
      <button data-poi-pin-go="${escapeAttribute(pin.id)}" type="button">Go to POI</button>
    </div>
  `;

  poiDetailsPanel.classList.remove("hidden");
  poiDetailsPanel.scrollIntoView({ block: "nearest" });
}

function closePoiDetails() {
  if (poiDetailsPanel) {
    poiDetailsPanel.classList.add("hidden");
  }
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

function goToPoiPin(pinId) {
  const pin = pinStore.get(pinId);
  if (!pin || pin.type !== "poi") return;

  closePoiDetails();
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

  if (scanPoiBtn) {
    scanPoiBtn.addEventListener("click", () => {
      scanNearbyPois();
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

async function scanNearbyPois() {
  if (!playerLatLng) {
    showToast("POI scan", "Player location not ready yet.");
    return;
  }

  if (scanPoiBtn) {
    scanPoiBtn.disabled = true;
    scanPoiBtn.textContent = "Scanning POIs...";
  }

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: new URLSearchParams({
        data: buildPoiOverpassQuery(playerLatLng.lat, playerLatLng.lng)
      })
    });

    if (!response.ok) {
      throw new Error(`POI scan failed: ${response.status}`);
    }

    const data = await response.json();
    const pois = extractPoisFromOverpass(data);
    let added = 0;

    pois.slice(0, MAX_POIS_PER_SCAN).forEach((poi) => {
      if (pinStore.has(poi.id)) return;
      addPOIToMap(poi);
      added += 1;
    });

    if (added > 0) {
      addStat("newPois", added);
      checkPoiAchievements();
      scheduleSavePinsToLocal();
      clearPinIconCache();
      scheduleRedrawPins();
    }

    showToast(
      "POI scan complete",
      added > 0
        ? `${added} new POI${added === 1 ? "" : "s"} added locally.`
        : "No new POIs found nearby."
    );
  } catch (error) {
    console.warn("POI scan failed:", error);
    showToast("POI scan failed", "OpenStreetMap did not respond. Try again soon.");
  } finally {
    if (scanPoiBtn) {
      scanPoiBtn.disabled = false;
      scanPoiBtn.textContent = "Scan nearby POIs";
    }
  }
}

function buildPoiOverpassQuery(lat, lng) {
  return `
[out:json][timeout:35];
(
  nwr["amenity"="place_of_worship"](around:${POI_SCAN_RADIUS_METERS},${lat},${lng});
  nwr["amenity"="hospital"](around:${POI_SCAN_RADIUS_METERS},${lat},${lng});
  nwr["historic"](around:${POI_SCAN_RADIUS_METERS},${lat},${lng});
  nwr["tourism"~"^(attraction|museum|gallery|viewpoint|artwork|information)$"](around:${POI_SCAN_RADIUS_METERS},${lat},${lng});
  nwr["leisure"~"^(park|garden|nature_reserve)$"](around:${POI_SCAN_RADIUS_METERS},${lat},${lng});
  nwr["boundary"="national_park"](around:${POI_SCAN_RADIUS_METERS},${lat},${lng});
  nwr["man_made"~"^(lighthouse|tower|water_tower|obelisk)$"](around:${POI_SCAN_RADIUS_METERS},${lat},${lng});
);
out tags center ${MAX_POIS_PER_SCAN};
`;
}

function extractPoisFromOverpass(data) {
  const elements = Array.isArray(data?.elements) ? data.elements : [];
  const seen = new Set();
  const pois = [];

  elements.forEach((el) => {
    const tags = el.tags || {};
    const category = getPoiCategory(tags);
    const lat = typeof el.lat === "number" ? el.lat : el.center?.lat;
    const lng = typeof el.lon === "number" ? el.lon : el.center?.lon;

    if (!category || typeof lat !== "number" || typeof lng !== "number") return;

    const id = `poi:osm:${el.type}:${el.id}`;
    if (seen.has(id)) return;

    seen.add(id);
    pois.push({
      id,
      type: "poi",
      name: getPoiName(tags, category),
      category: getPoiCollectionCategory(category),
      subcategory: category,
      rarity: "normal",
      icon: getPoiIconKey(category),
      lat,
      lng,
      description: `${category} from OpenStreetMap.`,
      captured: false,
      capturedAt: null,
      poiCategory: category,
      poiName: getPoiName(tags, category),
      osmType: el.type,
      osmId: el.id,
      discoveredBy: getActivePlayerId(),
      discoveredAt: getTrustedNow()
    });
  });

  return pois;
}

function getPoiCategory(tags) {
  if (tags.amenity === "hospital") return "Hospital";
  if (tags.amenity === "place_of_worship") return "Church";
  if (tags.historic) return "Historic";
  if (tags.leisure === "park" || tags.leisure === "garden" || tags.leisure === "nature_reserve" || tags.boundary === "national_park") {
    return "Park";
  }
  if (tags.man_made === "lighthouse" || tags.man_made === "tower" || tags.man_made === "water_tower" || tags.man_made === "obelisk") {
    return "Landmark";
  }
  if (tags.tourism) return "Local POI";
  return "";
}

function getPoiName(tags, category) {
  return tags.name || tags["name:en"] || category || "Point of Interest";
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
  showRewardBurst("Level Up!", "level-up");
}

function resetLocalProgress() {
  try {
    [
      PIN_STORAGE_KEY,
      CAPTURED_POIS_STORAGE_KEY,
      SERVER_STARTED_AT_KEY,
      AVATAR_STORAGE_KEY,
      STATS_STORAGE_KEY,
      ACHIEVEMENTS_STORAGE_KEY,
      CRAFTING_STORAGE_KEY,
      MARKET_STORAGE_KEY,
      CARD_COLLECTION_STORAGE_KEY,
      PLAYER_TITLES_STORAGE_KEY,
      PLAYER_ARTIFACTS_STORAGE_KEY,
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
      ${renderStatRow("POI Captures", playerStats.today.poiCaptures)}
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
      ${renderStatRow("POI Captures", playerStats.lifetime.poiCaptures)}
      ${renderStatRow("Church POIs", playerStats.lifetime.poiChurchCaptures)}
      ${renderStatRow("Hospital POIs", playerStats.lifetime.poiHospitalCaptures)}
      ${renderStatRow("Historic POIs", playerStats.lifetime.poiHistoricCaptures)}
      ${renderStatRow("Park POIs", playerStats.lifetime.poiParkCaptures)}
      ${renderStatRow("Landmark POIs", playerStats.lifetime.poiLandmarkCaptures)}
      ${renderStatRow("Local POIs", playerStats.lifetime.poiLocalCaptures)}
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
      ${renderBestRow("Most POI Captures Day", playerStats.best.poiCaptures)}
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
    "POI Captures": "📌",
    "Church POIs": "⛪",
    "Hospital POIs": "🏥",
    "Historic POIs": "🏛️",
    "Park POIs": "🌳",
    "Landmark POIs": "🗿",
    "Local POIs": "🧭",
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
    renderLeaderboard();
  });
}

function openLeaders() {
  if (!leadersScreen) return;

  hideSubmenus();
  hideMenuHome();

  leadersScreen.classList.remove("hidden");
  renderLeaderboard();
}

function getLeaderBoardState() {
  const getActiveValue = (filterName, fallback) => {
    const group = leadersScreen?.querySelector(`[data-leader-filter="${filterName}"]`);
    return group?.querySelector(".seg-btn.active")?.dataset.board || fallback;
  };

  return {
    metric: getActiveValue("metric", "points"),
    scope: getActiveValue("scope", "local"),
    period: getActiveValue("period", "daily")
  };
}

function getLeaderBoardTitle(state) {
  return [state.period, state.scope, state.metric]
    .map((part) => part.replaceAll("-", " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getLeaderMetricLabel(metric) {
  if (metric === "achievements") return "Unlocked";
  if (metric === "records") return "Record";
  return "Score";
}

function getLeaderMetricValue(player, metric) {
  if (metric === "achievements") {
    return Math.max(0, Math.round((player.score || 0) / 15000));
  }

  if (metric === "records") {
    return `${Math.max(1, Math.round((player.score || 0) / 12000))}x`;
  }

  return Number(player.score || 0).toLocaleString();
}

function getLeaderSubtitle(state) {
  if (state.metric === "achievements") {
    return "Most achievements unlocked for this board.";
  }

  if (state.metric === "records") {
    return "Best streaks and standout records for this board.";
  }

  return "Top player points for this board.";
}

function renderLeaderboard() {
  if (!leaderboardList) return;

  const state = getLeaderBoardState();
  renderLeaderboardSummary(state);

  if (state.metric === "achievements") {
    renderAchievementLeaderboard(state);
    return;
  }

  if (state.metric === "records") {
    renderRecordsLeaderboard(state);
    return;
  }

  renderPointsLeaderboard(state);
}

function renderLeaderboardSummary(state) {
  if (!leaderboardSummary) return;

  leaderboardSummary.innerHTML = `
    <div>
      <span>Active Board</span>
      <strong>${escapeHtml(getLeaderBoardTitle(state))}</strong>
    </div>
    <p>${escapeHtml(getLeaderSubtitle(state))}</p>
  `;
}

function getCurrentLeaderPlayer() {
  return {
    ...(MOCK_LEADERBOARD.find((p) => p.me) || {}),
    rank: 118,
    name: playerState.name || DEFAULT_PLAYER_NAME,
    score: playerStats?.lifetime?.score || 0,
    me: true
  };
}

function renderPointsLeaderboard(state) {
  const top100 = MOCK_LEADERBOARD.slice(0, 100);
  const currentPlayer = getCurrentLeaderPlayer();

  let html = renderYourRankCard(currentPlayer, state);
  html += top100.map((player) => {
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
          <span>${escapeHtml(getLeaderBoardTitle(state).toUpperCase())}</span>
        </div>

        <div class="leader-score">
          <span>${escapeHtml(getLeaderMetricLabel(state.metric))}</span>
          <strong>${escapeHtml(getLeaderMetricValue(player, state.metric))}</strong>
        </div>
      </div>
    `;
  }).join("");

  leaderboardList.innerHTML = html;
}

function renderYourRankCard(player, state) {
  return `
    <div class="leader-card my-rank leader-your-rank">
      <div class="leader-rank">#${player.rank}</div>

      <div class="leader-avatar">⭐</div>

      <div class="leader-info">
        <strong>${escapeHtml(player.name)}</strong>
        <span>Your Rank</span>
      </div>

      <div class="leader-score">
        <span>${escapeHtml(getLeaderMetricLabel(state.metric))}</span>
        <strong>${escapeHtml(getLeaderMetricValue(player, state.metric))}</strong>
      </div>
    </div>
  `;
}

function renderAchievementLeaderboard(state) {
  const currentPlayer = getCurrentLeaderPlayer();
  const achievementPlayers = MOCK_LEADERBOARD.slice(0, 10).map((player) => ({
    ...player,
    score: getLeaderMetricValue(player, "achievements")
  }));

  leaderboardList.innerHTML = `
    ${renderYourRankCard(currentPlayer, state)}
    ${achievementPlayers.map((player) => renderPlaceholderLeaderRow(player, state, "🏅")).join("")}
  `;
}

function renderRecordsLeaderboard(state) {
  const currentPlayer = getCurrentLeaderPlayer();
  const recordPlayers = MOCK_LEADERBOARD.slice(0, 10).map((player) => ({
    ...player,
    score: getLeaderMetricValue(player, "records")
  }));

  leaderboardList.innerHTML = `
    ${renderYourRankCard(currentPlayer, state)}
    ${recordPlayers.map((player) => renderPlaceholderLeaderRow(player, state, "⚡")).join("")}
  `;
}

function renderPlaceholderLeaderRow(player, state, icon) {
  return `
    <div class="leader-card ${player.rank === 1 ? "champion" : ""}">
      <div class="leader-rank">#${player.rank}</div>
      <div class="leader-avatar">${icon}</div>
      <div class="leader-info">
        <strong>${escapeHtml(player.name)}</strong>
        <span>${escapeHtml(getLeaderBoardTitle(state).toUpperCase())}</span>
      </div>
      <div class="leader-score">
        <span>${escapeHtml(getLeaderMetricLabel(state.metric))}</span>
        <strong>${escapeHtml(String(player.score))}</strong>
      </div>
    </div>
  `;
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
    /* CUSTOM 2.5D MAP EXPERIMENT START */
    setCustom25DMapZoneFeatures([]);
    setCustom25DMapBuildingFeatures([]);
    /* CUSTOM 2.5D MAP EXPERIMENT END */
    setCustom25DMapRoadFeatures([]);
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
    /* CUSTOM 2.5D MAP EXPERIMENT START */
    setCustom25DMapZoneFeatures(features.zoneFeatures);
    setCustom25DMapBuildingFeatures(features.buildingFeatures);
    /* CUSTOM 2.5D MAP EXPERIMENT END */
    setCustom25DMapRoadFeatures(features.roadWays);
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
  way["natural"="beach"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["natural"="sand"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["natural"="wetland"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["natural"="grassland"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["water"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["waterway"~"^(river|stream|canal)$"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["landuse"~"^(reservoir|basin)$"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["landuse"~"^(grass|meadow|village_green|recreation_ground)$"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["leisure"~"^(park|garden|pitch|sports_centre|nature_reserve|common)$"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
  way["building"](${boundsObj.south},${boundsObj.west},${boundsObj.north},${boundsObj.east});
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
  /* CUSTOM 2.5D MAP EXPERIMENT START */
  const zoneFeatures = [];
  const buildingFeatures = [];
  /* CUSTOM 2.5D MAP EXPERIMENT END */

  elements.forEach((el) => {
    if (el.type !== "way" || !Array.isArray(el.nodes)) return;

    const coords = el.nodes.map((nodeId) => nodesById.get(nodeId)).filter(Boolean);
    const tags = el.tags || {};

    if (coords.length < 2) return;

    if (tags.highway) {
      roadWays.push({
        id: el.id,
        coords,
        highway: tags.highway
      });
      return;
    }

    if (isWaterFeature(tags)) {
      waterFeatures.push({
        id: el.id,
        coords,
        closed: coords.length >= 4 && coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1]
      });
    }

    /* CUSTOM 2.5D MAP EXPERIMENT START */
    if (isCustom25DBuildingFeature(tags, coords)) {
      const center = getFeatureCenter(coords);
      buildingFeatures.push({
        id: `building:${el.id}`,
        coords,
        center,
        buildingType: tags.building || "yes",
        shopTag: tags.shop || "",
        amenity: tags.amenity || "",
        office: tags.office || "",
        cuisine: tags.cuisine || "",
        tourism: tags.tourism || "",
        leisure: tags.leisure || "",
        landuse: tags.landuse || "",
        buildingArea: estimateFeatureArea(coords)
      });
    }

    const zoneType = getCustom25DZoneType(tags);
    if (zoneType) {
      zoneFeatures.push({
        id: `zone:${el.id}`,
        zoneType,
        coords,
        closed: coords.length >= 4 && coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1]
      });
    }
    /* CUSTOM 2.5D MAP EXPERIMENT END */
  });

  markCustom25DBuildingContext(buildingFeatures, zoneFeatures, waterFeatures);

  return { roadWays, waterFeatures, zoneFeatures, buildingFeatures };
}

/* CUSTOM 2.5D MAP EXPERIMENT START */
function isCustom25DBuildingFeature(tags, coords) {
  return Boolean(tags?.building) && Array.isArray(coords) && coords.length >= 4;
}

function getFeatureCenter(coords) {
  const total = coords.reduce((acc, [lat, lng]) => ({
    lat: acc.lat + lat,
    lng: acc.lng + lng
  }), { lat: 0, lng: 0 });

  return {
    lat: total.lat / coords.length,
    lng: total.lng / coords.length
  };
}

function estimateFeatureArea(coords) {
  if (!Array.isArray(coords) || coords.length < 3) return 0;

  const averageLat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length;
  const metersPerDegLat = 111320;
  const metersPerDegLng = Math.cos((averageLat * Math.PI) / 180) * 111320;
  let area = 0;

  for (let i = 0; i < coords.length; i += 1) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[(i + 1) % coords.length];
    const x1 = lng1 * metersPerDegLng;
    const y1 = lat1 * metersPerDegLat;
    const x2 = lng2 * metersPerDegLng;
    const y2 = lat2 * metersPerDegLat;
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) * 0.5;
}

function getApproxDistanceMeters(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;

  const latScale = 111320;
  const lngScale = Math.cos((((a.lat + b.lat) * 0.5) * Math.PI) / 180) * 111320;
  const dx = (a.lng - b.lng) * lngScale;
  const dy = (a.lat - b.lat) * latScale;
  return Math.hypot(dx, dy);
}

function markCustom25DBuildingContext(buildingFeatures, zoneFeatures, waterFeatures) {
  if (!Array.isArray(buildingFeatures) || !buildingFeatures.length) return;

  const coastalCenters = [
    ...((Array.isArray(zoneFeatures) ? zoneFeatures : [])
      .filter((feature) => feature?.zoneType === "water" || feature?.zoneType === "beach")
      .map((feature) => getFeatureCenter(feature.coords))),
    ...((Array.isArray(waterFeatures) ? waterFeatures : [])
      .filter((feature) => Array.isArray(feature?.coords) && feature.coords.length >= 2)
      .map((feature) => getFeatureCenter(feature.coords)))
  ];

  buildingFeatures.forEach((feature) => {
    feature.nearCoast = coastalCenters.some((center) => getApproxDistanceMeters(feature.center, center) <= 180);
  });
}

function getCustom25DZoneType(tags) {
  if (!tags) return null;

  if (
    tags.natural === "water" ||
    tags.natural === "coastline" ||
    Boolean(tags.water) ||
    ["river", "stream", "canal"].includes(tags.waterway) ||
    ["reservoir", "basin"].includes(tags.landuse)
  ) {
    return "water";
  }

  if (tags.natural === "beach" || tags.natural === "sand") return "beach";
  if (tags.natural === "wetland") return "wetland";
  if (tags.leisure === "pitch" || tags.leisure === "sports_centre") return "sports";
  if (["park", "garden", "nature_reserve", "common"].includes(tags.leisure)) return "park";
  if (
    tags.natural === "grassland" ||
    ["grass", "meadow", "village_green", "recreation_ground"].includes(tags.landuse)
  ) {
    return "grass";
  }

  return null;
}
/* CUSTOM 2.5D MAP EXPERIMENT END */

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
  if (pin?.type === "poi") return;

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
    const zIndex = iconState.type === "poi" ? 1300 : iconState.glowing ? 1500 : 1000;
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
  const type = pin.type || "base";
  const points = getPinPoints(pin);
  const capturedToday = type === "poi" ? Boolean(pin.captured) : wasCapturedToday(pin);
  const glowing = shouldPinGlow(pin, capturedToday);
  const ownerId = pin.ownerId || "";
  const plantStage = getPinPlantStage(pin);
  const plantSeedId = pin.plant?.seedId || "";
  const plantHarvestedKey = pin.plant?.harvestedByDay?.[getActivePlayerId()] || "";
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
    key: `${type}|${pin.category || ""}|${pin.subcategory || ""}|${pin.rarity || ""}|${pin.icon || ""}|${pin.poiCategory || ""}|${pin.poiName || ""}|${fishType}|${points}|${capturedToday ? 1 : 0}|${glowing ? 1 : 0}|${ownerId}|${plantStage}|${plantSeedId}|${plantHarvestedKey}`
  };
}

function buildPinIcon(pin, state = null) {
  const iconState = state || getPinIconState(pin);
  const cacheKey = iconState.key;

  if (pinIconCache.has(cacheKey)) {
    return pinIconCache.get(cacheKey);
  }

  if (iconState.type === "poi") {
    return buildPoiIcon(pin, cacheKey);
  }

  const glowClass = iconState.glowing ? "pin-ready-glow" : "";
  const capturedClass = iconState.capturedToday ? "pin-captured-today" : "";
  const ownedClass = iconState.owned ? "pin-owned" : "";
  const typeClass = iconState.type === "water" ? "water-pin-marker" : "";
  const valueClass = iconState.type === "water" ? "" : getBasePinValueClass(iconState.points);
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
    <div class="base-pin-marker ${typeClass} ${valueClass} ${fishClass} ${glowClass} ${capturedClass} ${ownedClass}">
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

function getBasePinValueClass(points) {
  const value = Number(points || 0);

  if (value >= 50) return "base-pin-value-50";
  if (value >= 40) return "base-pin-value-40";
  if (value >= 30) return "base-pin-value-30";
  if (value >= 20) return "base-pin-value-20";
  if (value >= 10) return "base-pin-value-10";
  return "base-pin-value-5";
}

function buildPoiIcon(pin, cacheKey) {
  const category = pin.subcategory || pin.poiCategory || "POI";
  const capturedClass = pin.captured ? "poi-captured" : "";
  const rarityClass = pin.rarity === "special" ? "special" : "normal";
  const artClass = `poi-art-${escapeAttribute(pin.icon || getPoiIconKey(category))}`;
  const html = `
    <div class="poi-pin-marker ${rarityClass} ${capturedClass}" aria-label="${escapeAttribute(pin.name || pin.poiName || category)}">
      <span class="poi-art ${artClass}">${escapeHtml(getPoiIconText(pin.icon || category))}</span>
    </div>
  `;

  const icon = L.divIcon({
    className: "poi-pin-icon",
    html,
    iconSize: [38, 50],
    iconAnchor: [19, 50]
  });

  pinIconCache.set(cacheKey, icon);
  return icon;
}

function getPoiIconLabel(category) {
  return getPoiIconText(category);
}

function getPoiIconText(icon) {
  const key = String(icon || "").toLowerCase();
  if (key.includes("church")) return "⛪";
  if (key.includes("park")) return "🌳";
  if (key.includes("beach")) return "◒";
  if (key.includes("waterfall")) return "▥";
  if (key.includes("dinosaur") || key.includes("fossil")) return "◆";
  if (key.includes("film")) return "▶";
  if (key.includes("music")) return "♪";
  if (key.includes("hospital")) return "+";
  return "★";
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

  const captureRadius = pin?.type === "poi" ? POI_CAPTURE_RADIUS_METERS : CAPTURE_RADIUS_METERS;
  const isInCaptureRing =
    playerLatLng.distanceTo([pin.lat, pin.lng]) <= captureRadius;

  return isInCaptureRing;
}

function startPinLongPress(pin) {
  clearPinLongPress();
  activeLongPressPin = pin;

  pinLongPressTimer = setTimeout(() => {
    pinLongPressTriggered = true;
    openPinLongPressPopup(activeLongPressPin);

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

function openPinLongPressPopup(pin) {
  clearPinLongPress();
  if (!pin) return;

  if (pin.type === "poi") {
    openPoiInfoPopup(pin);
    return;
  }

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

function openPoiInfoPopup(pin) {
  closeBasePinPopup();

  const distance = getDistanceToPinLabel(pin);
  const status = pin.captured ? "Collected" : "Ready to capture";
  const category = pin.category || "Places";
  const subcategory = pin.subcategory || pin.poiCategory || "POI";
  const name = pin.name || pin.poiName || subcategory;
  const rarityLabel = pin.rarity === "special" ? "Special POI" : "Normal POI";

  const overlay = document.createElement("div");
  overlay.id = "basePinOverlay";
  overlay.className = "base-pin-overlay";
  overlay.innerHTML = `
    <div class="base-pin-popup poi-info-popup">
      <button class="base-pin-popup-close" type="button">×</button>
      <h3>${escapeHtml(name)}</h3>
      <div class="poi-info-category">${escapeHtml(rarityLabel)} · ${escapeHtml(category)} · ${escapeHtml(subcategory)}</div>
      <div class="base-pin-popup-copy">
        ${escapeHtml(pin.description || "A real-world point of interest.")}
      </div>
      <div class="base-pin-popup-meta">
        Reward: ${formatNumber(POI_PIN_VALUE)} points, ${formatNumber(POI_PIN_VALUE)} XP, ${formatNumber(POI_COIN_REWARD)} coins
      </div>
      ${renderPoiCardRewardLine(pin)}
      <div class="base-pin-popup-meta">
        Distance: ${escapeHtml(distance)}
      </div>
      <div class="base-pin-popup-meta">
        Status: ${escapeHtml(status)}
      </div>
      <div class="base-pin-popup-actions">
        <button class="base-pin-secondary-btn" data-base-pin-cancel type="button">Close</button>
        <button class="base-pin-primary-btn" data-poi-pin-go="${escapeAttribute(pin.id)}" type="button">
          Go to POI
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener("click", handleBasePinPopupClick);
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
    return;
  }

  const poiGoButton = event.target.closest("[data-poi-pin-go]");
  if (poiGoButton) {
    goToPoiPin(poiGoButton.dataset.poiPinGo);
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
  if (pin?.type === "poi") {
    capturePOI(pin);
    return;
  }

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
  recordPoiCaptureStats(pin);
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
  if (resourceText) {
    showToast("Resource found", resourceText);
  }
  showPinCaptureFloat(pin, points, 1, { showXp: false });
  scheduleRedrawPins();
}

function capturePOI(pin) {
  if (!playerLatLng) {
    showToast("POI", "Player location not ready yet.");
    return;
  }

  const trustedNow = getTrustedNow();
  const distance = playerLatLng.distanceTo([pin.lat, pin.lng]);

  if (distance > POI_CAPTURE_RADIUS_METERS) {
    showToast("Too far away", `${Math.round(distance)}m away.`);
    return;
  }

  if (capturedPOIs.has(pin.id) || pin.captured) {
    showToast("POI collected", "This point of interest is already in your collection.");
    return;
  }

  pin.captured = true;
  pin.capturedAt = trustedNow;

  saveCapturedPOI(pin);
  addStat("captures", 1);
  recordPoiCaptureStats(pin);
  addStat("score", POI_PIN_VALUE);
  addStat("goldEarned", POI_COIN_REWARD);
  addPlayerXp(POI_PIN_VALUE);
  addMarketCoins(POI_COIN_REWARD);
  const cardReward = awardCardForPOI(pin);

  scheduleSavePinsToLocal();
  renderPOIs();
  const cardRewardText = cardReward?.card
    ? ` ${cardReward.status === "duplicate" ? "Duplicate card" : "New card"}: ${cardReward.card.cardName}.`
    : "";
  showToast("POI captured", `+${POI_PIN_VALUE} points, +${POI_PIN_VALUE} XP, +${POI_COIN_REWARD} coins.${cardRewardText}`);
  showPinCaptureFloat(pin, POI_PIN_VALUE, POI_COIN_REWARD);
  showRewardBurst(`+${POI_PIN_VALUE} XP`);
}

function awardCardForPOI(pin) {
  const reward = pickCardRewardForPOI(pin);
  const card = reward?.card || null;
  if (!card) return null;

  return awardCard(card.cardId, "poi");
}

function getPinTypeLabel(pin) {
  if (pin?.type === "poi") {
    return pin.poiCategory ? `${pin.poiCategory.toLowerCase()} POI` : "POI";
  }

  if (pin?.type === "water") return "water pin";
  return "base pin";
}

function recordPoiCaptureStats(pin) {
  if (pin?.type !== "poi") return;

  addStat("poiCaptures", 1);

  const categoryStat = POI_CAPTURE_STAT_BY_CATEGORY[pin.subcategory || pin.poiCategory || ""];
  if (categoryStat) {
    addStat(categoryStat, 1);
  }

  checkPoiAchievements();
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
  if (pin?.type === "poi") {
    return POI_PIN_VALUE;
  }

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

function loadCapturedPOIs() {
  try {
    const raw = localStorage.getItem(CAPTURED_POIS_STORAGE_KEY);
    if (!raw) return new Map();

    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return new Map();

    return new Map(data
      .filter((poi) => poi && typeof poi.id === "string")
      .map((poi) => [poi.id, poi]));
  } catch (error) {
    console.warn("Could not load captured POIs.", error);
    return new Map();
  }
}

function saveCapturedPOI(pin) {
  const capturedPOI = {
    id: pin.id,
    name: pin.name || pin.poiName || "POI",
    category: pin.category || "Places",
    subcategory: pin.subcategory || pin.poiCategory || "POI",
    rarity: pin.rarity === "special" ? "special" : "normal",
    icon: pin.icon || getPoiIconKey(pin.subcategory || pin.poiCategory),
    lat: pin.lat,
    lng: pin.lng,
    description: pin.description || "",
    captured: true,
    capturedAt: pin.capturedAt || getTrustedNow()
  };

  capturedPOIs.set(pin.id, capturedPOI);

  try {
    localStorage.setItem(CAPTURED_POIS_STORAGE_KEY, JSON.stringify(Array.from(capturedPOIs.values())));
  } catch (error) {
    console.warn("Could not save captured POI.", error);
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
          fish: pin.fish || null,
          name: pin.name || pin.poiName || null,
          category: pin.category || null,
          subcategory: pin.subcategory || pin.poiCategory || null,
          rarity: pin.rarity || null,
          icon: pin.icon || null,
          description: pin.description || null,
          captured: Boolean(pin.captured),
          poiCategory: pin.poiCategory || null,
          poiName: pin.poiName || null,
          osmType: pin.osmType || null,
          osmId: pin.osmId || null,
          discoveredBy: pin.discoveredBy || null,
          discoveredAt: pin.discoveredAt || null
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
  const lowerTitle = String(title || "").toLowerCase();
  const rewardClass = lowerTitle.includes("captured") || lowerTitle.includes("reward") || lowerTitle.includes("collected")
    ? " reward"
    : "";
  const levelClass = lowerTitle.includes("level up") ? " level-up" : "";
  toast.className = `toast${rewardClass}${levelClass}`;
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

function showRewardBurst(text, type = "reward") {
  const burst = document.createElement("div");
  burst.className = `growgo-reward-burst ${type === "level-up" ? "level-up" : ""}`;
  burst.textContent = text;

  document.body.appendChild(burst);

  setTimeout(() => {
    burst.remove();
  }, 1100);
}

function showPinCaptureFloat(pin, points, coins = 1, options = {}) {
  if (!map || !pin || typeof pin.lat !== "number" || typeof pin.lng !== "number") return;

  const mapRect = map.getContainer().getBoundingClientRect();
  const point = map.latLngToContainerPoint([pin.lat, pin.lng]);
  const float = document.createElement("div");
  const coinText = `+${formatNumber(coins)}`;
  const showXp = options.showXp !== false;

  float.className = `pin-capture-float ${showXp ? "" : "compact"}`.trim();
  float.style.left = `${mapRect.left + point.x}px`;
  float.style.top = `${mapRect.top + point.y}px`;
  float.innerHTML = `
    <div class="pin-capture-text">+${formatNumber(points)} pts</div>
    ${showXp ? `<div class="pin-capture-xp">+${formatNumber(points)} XP</div>` : ""}
    <div class="pin-capture-coin" aria-label="${escapeAttribute(coinText)} coin reward">
      <span>${escapeHtml(coinText)}</span>
    </div>
  `;

  document.body.appendChild(float);

  setTimeout(() => {
    float.remove();
  }, 1300);
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
