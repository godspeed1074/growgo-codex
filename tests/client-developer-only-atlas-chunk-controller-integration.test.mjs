import test from 'node:test';
import assert from 'node:assert/strict';
import { createAtlasAutomaticPopulationController, enableAutomaticViewportPopulation, requestAutomaticViewportPopulationRefresh, getAutomaticViewportPopulationControllerStatus } from '../client/developer-only-atlas-automatic-population-controller.mjs';
let bounds={south:-38.486,west:145.228,north:-38.482,east:145.234};
const controller=createAtlasAutomaticPopulationController({
  viewportIdentityProvider:()=>({viewportIdentity:`VP_${bounds.west}`,featureSourceGenerationId:'FEATURE_1',bounds,zoom:16}),
  atlasIdentityProvider:()=>({mapIdentityId:'MAP_PI_001',regionId:'PHILLIP_ISLAND',packageId:'PHILLIP_ISLAND_V1',recipeId:'COASTAL_LOCATION_RECIPE_001',selectorSeed:'PI_SEED_001'}),
  readinessProvider:()=>({approved:true}), liveFeatureAdapter:()=>({sourceFeatures:[],normalizedFeatures:[]}), populationPlanner:()=>({commands:[]}), populationDrawIntegration:()=>({drawCompleted:true}), populationReferenceReleaseProvider:()=>({released:true})
});
test('developer-only population diagnostics expose chunk add retain remove without rendering', () => {
  assert.equal(enableAutomaticViewportPopulation(controller).outcome,'enabled');
  const first=requestAutomaticViewportPopulationRefresh(controller,{eventName:'moveend'}); assert.equal(first.outcome,'queued');
  let status=getAutomaticViewportPopulationControllerStatus(controller); assert.equal(status.currentRelevantChunkIds.length>0,true); assert.equal(status.chunksAdded.length>0,true);
  bounds={south:-38.486,west:145.238,north:-38.482,east:145.244}; requestAutomaticViewportPopulationRefresh(controller,{eventName:'zoomend'});
  status=getAutomaticViewportPopulationControllerStatus(controller); assert.equal(status.chunksRemoved.length>0,true); assert.equal(status.currentRelevantChunkIds.length>0,true); assert.deepEqual(status.canonicalSafetyFlags,{runtimeExecutionEnabled:false,mapAttachmentAllowed:false,automaticRendererExecutionAllowed:false,lifecycleExecutionEnabled:false});
});
