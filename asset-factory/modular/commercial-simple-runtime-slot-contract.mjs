export const EXCLUSIVE_SLOTS = Object.freeze({
  SIGN_PRESENTATION_SLOT: { owner: 'GG-BLD-SIGN-FASCIA-COMMERCIAL-001', fallback: 'FORBIDDEN', stacking: false },
  AWNING_PRESENTATION_SLOT: { owner: 'GG-BLD-AWNING-COMMERCIAL-001', fallback: 'FORBIDDEN', stacking: false },
  WINDOW_DISPLAY_SLOT: { owner: 'GG-BLD-WINDOW-SHOP-LARGE-002', fallback: 'TRANSPARENT_REVEALS_APPROVED_WINDOW', stacking: false },
});

export function resolveCommercialSimpleVariant({ structuralInstances, bindings }) {
  const structural = new Map(structuralInstances.map(item => [item.component, item]));
  for (const required of ['DOOR','WINDOW','WALL','PILASTER_MOLDING','BASE_PLINTH','FASCIA','ROOF','SHELL']) {
    const item = structural.get(required);
    if (!item?.approvedArtifactPath || item.exactReuse !== true) throw new Error(`EXACT_STRUCTURAL_SOURCE_REQUIRED:${required}`);
  }
  const active = {};
  for (const [slot, policy] of Object.entries(EXCLUSIVE_SLOTS)) {
    const choices = bindings.filter(binding => binding.slot === slot && binding.active !== false);
    if (choices.length !== 1) throw new Error(`EXCLUSIVE_SLOT_VIOLATION:${slot}:${choices.length}`);
    const choice = choices[0];
    if (choice.fallbackCard === true) throw new Error(`FALLBACK_CARD_FORBIDDEN:${slot}`);
    if (slot === 'WINDOW_DISPLAY_SLOT' && choice.alphaMode !== 'TRANSPARENT') throw new Error('WINDOW_DISPLAY_ALPHA_REQUIRED');
    active[slot] = { assetId: choice.assetId, retiredPresentations: bindings.filter(binding => binding.slot === slot && binding.assetId !== choice.assetId).map(binding => binding.assetId) };
  }
  return { status: 'PASS', active, duplicatePresentations: 0, fallbackCards: 0, anonymousGeometry: 0 };
}

// Permanent isolation rule for reusable Windows with a swappable display slot.
export function validateSwappableWindowDisplayIsolation({ structureDisplayPixels = 0, glassDisplayPixels = 0, interiorBackingDisplayPixels = 0, unknownOwnershipPixels = 0 }) {
  const counts = { structureDisplayPixels, glassDisplayPixels, interiorBackingDisplayPixels, unknownOwnershipPixels };
  for (const [key, value] of Object.entries(counts)) if (!Number.isInteger(value) || value < 0) throw new Error(`WINDOW_DISPLAY_AUDIT_INVALID:${key}`);
  if (Object.values(counts).some(Boolean)) throw new Error('WINDOW_DISPLAY_ISOLATION_REQUIRED');
  return { status: 'PASS', rule: 'WINDOW_DISPLAY_SLOT_OWNS_ALL_SHOP_SPECIFIC_DISPLAY_PIXELS', counts };
}
