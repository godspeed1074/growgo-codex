import test from 'node:test';
import assert from 'node:assert/strict';
import { createAtlasAutomaticPopulationController, enableAutomaticViewportPopulation, disableAutomaticViewportPopulation, requestAutomaticViewportPopulationRefresh, runQueuedAutomaticViewportPopulationRefresh, getAutomaticViewportPopulationControllerStatus } from '../client/developer-only-atlas-automatic-population-controller.mjs';
import { createAtlasChunkPopulationReconciler } from '../client/developer-only-atlas-chunk-population-reconciler.mjs';
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

test('developer-gated controller reconciles chunk-owned references only after a queued refresh runs', () => {
  let localBounds={south:-38.486,west:145.228,north:-38.482,east:145.234};
  const calls={apply:0,release:0};
  const ownership=createAtlasChunkPopulationReconciler({
    populationFactory:({chunk})=>[{populationId:`POP_${chunk.chunkId}`,assetId:'TREE_EUCALYPTUS_001',placement:{x:chunk.x,y:chunk.y,rotation:0}}],
    populationApplyProvider:()=>{calls.apply+=1; return {applied:true};},
    populationReleaseProvider:()=>{calls.release+=1; return {released:true};}
  });
  const controlled=createAtlasAutomaticPopulationController({
    viewportIdentityProvider:()=>({viewportIdentity:`OWNERSHIP_${localBounds.west}`,featureSourceGenerationId:`OWNERSHIP_${localBounds.west}`,bounds:localBounds,zoom:16}),
    atlasIdentityProvider:()=>({mapIdentityId:'MAP_PI_001',regionId:'PHILLIP_ISLAND',packageId:'PHILLIP_ISLAND_V1',recipeId:'COASTAL_LOCATION_RECIPE_001',selectorSeed:'PI_SEED_001'}),
    readinessProvider:()=>({approved:true}), liveFeatureAdapter:()=>({sourceFeatures:[],normalizedFeatures:[]}), populationPlanner:()=>({commands:[]}), populationDrawIntegration:()=>({drawCompleted:true}), populationReferenceReleaseProvider:()=>({released:true}), chunkPopulationReconciler:ownership
  });
  enableAutomaticViewportPopulation(controlled);
  requestAutomaticViewportPopulationRefresh(controlled,{eventName:'moveend'});
  assert.equal(runQueuedAutomaticViewportPopulationRefresh(controlled).outcome,'completed');
  const afterFirst=getAutomaticViewportPopulationControllerStatus(controlled);
  assert.equal(afterFirst.chunkOwnedPopulationReferenceCount>0,true);
  const appliedOnce=calls.apply;
  requestAutomaticViewportPopulationRefresh(controlled,{eventName:'zoomend'});
  runQueuedAutomaticViewportPopulationRefresh(controlled);
  assert.equal(calls.apply,appliedOnce);
  localBounds={south:-38.486,west:145.248,north:-38.482,east:145.254};
  requestAutomaticViewportPopulationRefresh(controlled,{eventName:'moveend'});
  runQueuedAutomaticViewportPopulationRefresh(controlled);
  assert.equal(calls.release>0,true);
  disableAutomaticViewportPopulation(controlled);
  assert.equal(getAutomaticViewportPopulationControllerStatus(controlled).chunkOwnedPopulationReferenceCount,0);
});
