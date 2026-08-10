const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_FIRST_HARMLESS_VISUAL_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_FIRST_HARMLESS_VISUAL_RESULT_001";
const VISUAL_CLASS_NAME = "atlas-dev-first-visual";
const VISUAL_DOT_CLASS_NAME = "atlas-dev-first-visual-dot";
const VISUAL_LABEL_CLASS_NAME = "atlas-dev-first-visual-label";
const VISUAL_LABEL = "Atlas DEV";

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  if (seen.has(value)) {
    return value;
  }

  seen.add(value);

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested, seen);
    }
  }

  return Object.freeze(value);
}

function canonicalSafetyFlags() {
  return deepFreeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function sanitizeCoordinate(value) {
  return Number.isFinite(value) ? Number(value) : null;
}

function createState() {
  return {
    attachedMapIdentityId: null,
    visible: false,
    visualLatitude: null,
    visualLongitude: null,
    atlasOwnedLayerCount: 0,
    atlasOwnedCanvasCount: 0,
    atlasOwnedListenerCount: 0,
    lastOperation: null,
    lastReasonCode: null,
    marker: null
  };
}

function toStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    visualPresent: state.visible === true,
    visualType: "leaflet_div_marker",
    visualClassName: VISUAL_CLASS_NAME,
    visualLabel: VISUAL_LABEL,
    attachedMapIdentityId: state.attachedMapIdentityId,
    visualLatitude: state.visualLatitude,
    visualLongitude: state.visualLongitude,
    atlasOwnedLayerCount: state.atlasOwnedLayerCount,
    atlasOwnedCanvasCount: state.atlasOwnedCanvasCount,
    atlasOwnedListenerCount: state.atlasOwnedListenerCount,
    lastOperation: state.lastOperation,
    lastReasonCode: state.lastReasonCode,
    safetyFlags: canonicalSafetyFlags()
  });
}

function toResult(state, outcome, reasonCode) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    outcome,
    reasonCode,
    status: toStatus(state)
  });
}

export function createDeveloperOnlyAtlasFirstHarmlessVisualController({
  getGrowGoMap = () => null,
  attachmentStatusProvider = () => null,
  leafletProvider = () => globalThis?.L ?? null
} = {}) {
  const state = createState();

  function getAtlasFirstHarmlessVisualStatus() {
    return toStatus(state);
  }

  function showAtlasFirstHarmlessVisual() {
    const attachmentStatus = attachmentStatusProvider?.() ?? null;
    const liveMap = getGrowGoMap?.() ?? null;
    const leaflet = leafletProvider?.() ?? null;

    state.lastOperation = "show";

    if (!attachmentStatus || attachmentStatus.attached !== true) {
      state.lastReasonCode = "ATLAS_NOT_ATTACHED";
      return toResult(state, "blocked", "ATLAS_NOT_ATTACHED");
    }

    if (attachmentStatus.exactLiveMapBound !== true) {
      state.lastReasonCode = "LIVE_MAP_IDENTITY_UNBOUND";
      return toResult(state, "blocked", "LIVE_MAP_IDENTITY_UNBOUND");
    }

    if (!liveMap || typeof liveMap.getCenter !== "function") {
      state.lastReasonCode = "LIVE_MAP_UNAVAILABLE";
      return toResult(state, "blocked", "LIVE_MAP_UNAVAILABLE");
    }

    if (
      !leaflet ||
      typeof leaflet.divIcon !== "function" ||
      typeof leaflet.marker !== "function"
    ) {
      state.lastReasonCode = "LEAFLET_VISUAL_PRIMITIVE_UNAVAILABLE";
      return toResult(state, "blocked", "LEAFLET_VISUAL_PRIMITIVE_UNAVAILABLE");
    }

    if (state.visible === true && state.marker) {
      state.lastReasonCode = "VISUAL_ALREADY_PRESENT";
      return toResult(state, "noop", "VISUAL_ALREADY_PRESENT");
    }

    const center = liveMap.getCenter();
    const latitude = sanitizeCoordinate(center?.lat);
    const longitude = sanitizeCoordinate(center?.lng);

    if (latitude == null || longitude == null) {
      state.lastReasonCode = "LIVE_MAP_CENTER_UNAVAILABLE";
      return toResult(state, "blocked", "LIVE_MAP_CENTER_UNAVAILABLE");
    }

    const icon = leaflet.divIcon({
      className: VISUAL_CLASS_NAME,
      html: `
        <div class="${VISUAL_DOT_CLASS_NAME}" style="width:16px;height:16px;border-radius:50%;background:#ff00ff;border:3px solid #ffffff;box-shadow:0 0 0 2px rgba(255,0,255,0.35);"></div>
        <span class="${VISUAL_LABEL_CLASS_NAME}" style="display:inline-block;margin-left:8px;padding:2px 6px;border-radius:999px;background:rgba(7,20,33,0.92);color:#f4f8ff;font:600 12px/1.2 sans-serif;white-space:nowrap;">${VISUAL_LABEL}</span>
      `,
      iconSize: [92, 24],
      iconAnchor: [8, 8]
    });
    const marker = leaflet.marker([latitude, longitude], {
      icon,
      keyboard: false,
      interactive: false
    });

    if (typeof marker?.addTo !== "function") {
      state.lastReasonCode = "LEAFLET_MARKER_ADD_UNAVAILABLE";
      return toResult(state, "blocked", "LEAFLET_MARKER_ADD_UNAVAILABLE");
    }

    marker.addTo(liveMap);

    state.marker = marker;
    state.visible = true;
    state.attachedMapIdentityId = attachmentStatus.attachedMapIdentityId ?? null;
    state.visualLatitude = latitude;
    state.visualLongitude = longitude;
    state.atlasOwnedLayerCount = 1;
    state.lastReasonCode = "VISUAL_RENDERED";

    return toResult(state, "rendered", "VISUAL_RENDERED");
  }

  function clearAtlasFirstHarmlessVisual() {
    state.lastOperation = "clear";

    if (!state.marker) {
      state.visible = false;
      state.attachedMapIdentityId = null;
      state.visualLatitude = null;
      state.visualLongitude = null;
      state.atlasOwnedLayerCount = 0;
      state.lastReasonCode = "VISUAL_ALREADY_CLEARED";
      return toResult(state, "noop", "VISUAL_ALREADY_CLEARED");
    }

    if (typeof state.marker.remove === "function") {
      state.marker.remove();
    } else if (
      typeof state.marker.removeFrom === "function" &&
      typeof getGrowGoMap === "function"
    ) {
      const liveMap = getGrowGoMap();
      if (liveMap) {
        state.marker.removeFrom(liveMap);
      }
    }

    state.marker = null;
    state.visible = false;
    state.attachedMapIdentityId = null;
    state.visualLatitude = null;
    state.visualLongitude = null;
    state.atlasOwnedLayerCount = 0;
    state.lastReasonCode = "VISUAL_CLEARED";

    return toResult(state, "cleared", "VISUAL_CLEARED");
  }

  return deepFreeze({
    showAtlasFirstHarmlessVisual,
    clearAtlasFirstHarmlessVisual,
    getAtlasFirstHarmlessVisualStatus
  });
}
