const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_VISUAL_PRIMITIVE_LAYER_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_VISUAL_PRIMITIVE_LAYER_RESULT_001";
const ROOT_CLASS_NAME = "atlas-dev-primitive";
const POINT_DOT_CLASS_NAME = "atlas-dev-primitive-point-dot";
const SPRITE_IMAGE_CLASS_NAME = "atlas-dev-primitive-sprite-image";

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

function sanitizeString(value) {
  return value == null ? null : String(value);
}

function sanitizeNumber(value) {
  return Number.isFinite(value) ? Number(value) : null;
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const normalized = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (value == null) {
      normalized[key] = null;
      continue;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      normalized[key] = value;
    }
  }

  return Object.keys(normalized).length > 0 ? deepFreeze(normalized) : null;
}

function createState() {
  return {
    primitives: new Map(),
    lastOperation: null,
    lastReasonCode: null
  };
}

function pointHtml(label) {
  return `
    <div class="${ROOT_CLASS_NAME}" data-atlas-primitive-type="point_anchor">
      <div class="${POINT_DOT_CLASS_NAME}" style="width:16px;height:16px;border-radius:50%;background:#ff00ff;border:3px solid #ffffff;box-shadow:0 0 0 2px rgba(255,0,255,0.35);"></div>
      <span style="display:inline-block;margin-left:8px;padding:2px 6px;border-radius:999px;background:rgba(7,20,33,0.92);color:#f4f8ff;font:600 12px/1.2 sans-serif;white-space:nowrap;">${label}</span>
    </div>
  `;
}

function spriteHtml(label, spriteSvg = null, metadata = null) {
  const sprite = encodeURIComponent(spriteSvg ?? `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <rect x="1" y="1" width="18" height="18" rx="4" fill="#38bdf8" stroke="#ffffff" stroke-width="2"/>
      <path d="M10 4 L14 10 L10 16 L6 10 Z" fill="#f0f9ff"/>
    </svg>
  `);
  const dataAttributes = metadata
    ? Object.entries(metadata)
        .map(([key, value]) => {
          const normalizedKey = String(key)
            .replace(/[^A-Za-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .toLowerCase();
          const normalizedValue = String(value).replace(/"/g, "&quot;");
          return ` data-${normalizedKey}="${normalizedValue}"`;
        })
        .join("")
    : "";
  return `
    <div class="${ROOT_CLASS_NAME}" data-atlas-primitive-type="sprite_image"${dataAttributes}>
      <img class="${SPRITE_IMAGE_CLASS_NAME}" alt="${label}" src="data:image/svg+xml;utf8,${sprite}" width="20" height="20" />
      <span style="display:inline-block;margin-left:8px;padding:2px 6px;border-radius:999px;background:rgba(7,20,33,0.92);color:#f4f8ff;font:600 12px/1.2 sans-serif;white-space:nowrap;">${label}</span>
    </div>
  `;
}

function buildIcon(leaflet, primitiveType, label, options = {}) {
  const html =
    primitiveType === "sprite_image"
      ? spriteHtml(label, options.spriteSvg, options.metadata)
      : pointHtml(label);
  return leaflet.divIcon({
    className: `${ROOT_CLASS_NAME}-wrapper`,
    html,
    iconSize: primitiveType === "sprite_image" ? [96, 28] : [104, 24],
    iconAnchor: [10, 10]
  });
}

function buildStatus(state) {
  const primitiveEntries = [...state.primitives.values()].map((entry) =>
    deepFreeze({
      primitiveId: entry.primitiveId,
      primitiveType: entry.primitiveType,
      latitude: entry.latitude,
      longitude: entry.longitude,
      label: entry.label,
      metadata: entry.metadata
    })
  );

  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    primitiveLayerReady: true,
    atlasPrimitiveCount: primitiveEntries.length,
    atlasPrimitiveIds: deepFreeze(primitiveEntries.map((entry) => entry.primitiveId)),
    atlasPrimitiveTypes: deepFreeze(
      primitiveEntries.map((entry) => entry.primitiveType)
    ),
    atlasPrimitiveEntries: deepFreeze(primitiveEntries),
    atlasOwnedCanvasCount: 0,
    atlasOwnedListenerCount: 0,
    atlasOwnedObjectCount: primitiveEntries.length,
    lastOperation: state.lastOperation,
    lastReasonCode: state.lastReasonCode,
    safetyFlags: canonicalSafetyFlags()
  });
}

function buildResult(state, outcome, reasonCode, extra = {}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    outcome,
    reasonCode,
    status: buildStatus(state),
    ...extra
  });
}

function resolveLabel(primitiveType, primitiveId, label) {
  if (label && String(label).trim()) {
    return String(label);
  }
  if (primitiveType === "sprite_image") {
    return `Atlas Sprite ${primitiveId}`;
  }
  return `Atlas Point ${primitiveId}`;
}

export function createDeveloperOnlyAtlasVisualPrimitiveLayer({
  getGrowGoMap = () => null,
  attachmentStatusProvider = () => null,
  leafletProvider = () => globalThis?.L ?? null
} = {}) {
  const state = createState();

  function getAtlasVisualPrimitiveLayerStatus() {
    return buildStatus(state);
  }

  function ensureAttachedLiveMap() {
    const attachmentStatus = attachmentStatusProvider?.() ?? null;
    const liveMap = getGrowGoMap?.() ?? null;
    const leaflet = leafletProvider?.() ?? null;

    if (!attachmentStatus || attachmentStatus.attached !== true) {
      return { error: "ATLAS_NOT_ATTACHED" };
    }
    if (attachmentStatus.exactLiveMapBound !== true) {
      return { error: "LIVE_MAP_IDENTITY_UNBOUND" };
    }
    if (!liveMap) {
      return { error: "LIVE_MAP_UNAVAILABLE" };
    }
    if (
      !leaflet ||
      typeof leaflet.divIcon !== "function" ||
      typeof leaflet.marker !== "function"
    ) {
      return { error: "LEAFLET_VISUAL_PRIMITIVE_UNAVAILABLE" };
    }

    return { attachmentStatus, liveMap, leaflet };
  }

  function upsertAtlasVisualPrimitive({
    primitiveId,
    primitiveType = "point_anchor",
    latitude,
    longitude,
    label,
    spriteSvg = null,
    metadata = null
  } = {}) {
    state.lastOperation = "upsert";
    const primitiveIdValue = sanitizeString(primitiveId);
    const primitiveTypeValue = sanitizeString(primitiveType);
    const latitudeValue = sanitizeNumber(latitude);
    const longitudeValue = sanitizeNumber(longitude);

    if (!primitiveIdValue) {
      state.lastReasonCode = "PRIMITIVE_ID_REQUIRED";
      return buildResult(state, "blocked", "PRIMITIVE_ID_REQUIRED");
    }
    if (!["point_anchor", "sprite_image"].includes(primitiveTypeValue)) {
      state.lastReasonCode = "PRIMITIVE_TYPE_UNSUPPORTED";
      return buildResult(state, "blocked", "PRIMITIVE_TYPE_UNSUPPORTED");
    }
    if (latitudeValue == null || longitudeValue == null) {
      state.lastReasonCode = "PRIMITIVE_COORDINATE_INVALID";
      return buildResult(state, "blocked", "PRIMITIVE_COORDINATE_INVALID");
    }

    const resolved = ensureAttachedLiveMap();
    if (resolved.error) {
      state.lastReasonCode = resolved.error;
      return buildResult(state, "blocked", resolved.error);
    }

    const { liveMap, leaflet } = resolved;
    const labelValue = resolveLabel(primitiveTypeValue, primitiveIdValue, label);
    const metadataValue = sanitizeMetadata(metadata);
    const existing = state.primitives.get(primitiveIdValue) ?? null;

    if (existing) {
      existing.marker.setLatLng([latitudeValue, longitudeValue]);
      existing.marker.setIcon(
        buildIcon(leaflet, primitiveTypeValue, labelValue, {
          spriteSvg,
          metadata: metadataValue
        })
      );
      existing.primitiveType = primitiveTypeValue;
      existing.latitude = latitudeValue;
      existing.longitude = longitudeValue;
      existing.label = labelValue;
      existing.metadata = metadataValue;
      state.lastReasonCode = "PRIMITIVE_UPDATED";
      return buildResult(state, "updated", "PRIMITIVE_UPDATED");
    }

    const marker = leaflet.marker([latitudeValue, longitudeValue], {
      icon: buildIcon(leaflet, primitiveTypeValue, labelValue, {
        spriteSvg,
        metadata: metadataValue
      }),
      keyboard: false,
      interactive: false
    });
    marker.addTo(liveMap);

    state.primitives.set(primitiveIdValue, {
      primitiveId: primitiveIdValue,
      primitiveType: primitiveTypeValue,
      latitude: latitudeValue,
      longitude: longitudeValue,
      label: labelValue,
      metadata: metadataValue,
      marker
    });
    state.lastReasonCode = "PRIMITIVE_CREATED";
    return buildResult(state, "created", "PRIMITIVE_CREATED");
  }

  function removeAtlasVisualPrimitive({ primitiveId } = {}) {
    state.lastOperation = "remove";
    const primitiveIdValue = sanitizeString(primitiveId);
    const existing = primitiveIdValue
      ? state.primitives.get(primitiveIdValue) ?? null
      : null;

    if (!existing) {
      state.lastReasonCode = "PRIMITIVE_NOT_FOUND";
      return buildResult(state, "noop", "PRIMITIVE_NOT_FOUND");
    }

    existing.marker?.remove?.();
    state.primitives.delete(primitiveIdValue);
    state.lastReasonCode = "PRIMITIVE_REMOVED";
    return buildResult(state, "removed", "PRIMITIVE_REMOVED");
  }

  function clearAllAtlasVisualPrimitives() {
    state.lastOperation = "clear_all";
    for (const entry of state.primitives.values()) {
      entry.marker?.remove?.();
    }
    state.primitives.clear();
    state.lastReasonCode = "ALL_PRIMITIVES_CLEARED";
    return buildResult(state, "cleared", "ALL_PRIMITIVES_CLEARED");
  }

  return deepFreeze({
    upsertAtlasVisualPrimitive,
    removeAtlasVisualPrimitive,
    clearAllAtlasVisualPrimitives,
    getAtlasVisualPrimitiveLayerStatus
  });
}
