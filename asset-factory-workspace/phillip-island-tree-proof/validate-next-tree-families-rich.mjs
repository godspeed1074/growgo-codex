import fs from 'node:fs';
import path from 'node:path';
import { MasterAssetIndex } from '../../asset-factory/modular/modular-asset-contract.mjs';
const root=path.resolve(import.meta.dirname),out=path.join(root,'next-family-rich-output/worker-output');
const receipt=JSON.parse(fs.readFileSync(path.join(out,'NEXT_TREE_FAMILIES_RICH_RECEIPT.json')));const index=JSON.parse(fs.readFileSync(path.resolve(root,'../../asset-factory/modular/MASTER_ASSET_INDEX.json')));const profiles=JSON.parse(fs.readFileSync(path.resolve(root,'../../asset-factory/modular/ASSET_BUDGET_PROFILES.json')));
const checks=[];const check=(name,pass)=>checks.push({name,pass:Boolean(pass)});
new MasterAssetIndex({index,budgetProfiles:profiles});check('MASTER_ASSET_INDEX_VALID',true);
check('NATIVE_ROUNDED_APPROVED',index.modules.some(x=>x.assetId==='GG-VEG-TREE-NATIVE-ROUNDED-001'&&x.assetVersion==='4.0.0'&&x.approvalState==='APPROVED'));
check('METHOD_APPROVED',fs.readFileSync(path.resolve(root,'../../asset-factory/GROWGO_CAMERA_AUTHORED_ILLUSTRATED_FOLIAGE_CLUSTER_METHOD.md'),'utf8').includes('APPROVED_PRODUCTION_METHOD'));
check('ATLAS_UNCHANGED',receipt.atlasArchitectureModified===false);check('PRODUCTION_ATLAS_DISABLED',receipt.productionPopulationModified===false);check('ANONYMOUS_GEOMETRY_ZERO',receipt.anonymousGeometryCount===0);
for(const f of receipt.families){const id=f.assetId;check(id+'_REVIEW_STATE',f.assetVersion==='2.0.0');for(const [lod,cards] of Object.entries({CLOSE:12,GAMEPLAY:8,MAP:3})){const s=f.lods[lod];check(id+'_'+lod+'_CARD_COUNT',s.cards===cards);check(id+'_'+lod+'_BUDGET',s.triangles<=320&&s.materials===2&&s.textures===1&&s.glbBytes<=3000000);check(id+'_'+lod+'_GLB',fs.existsSync(path.join(out,id+'@2.0.0_LOD_'+lod+'.glb')));}for(const suffix of ['GROWGO_GAMEPLAY_CAMERA_REVIEW.png','MOBILE_REVIEW.png','DETERMINISTIC_VARIATION_REVIEW.png'])check(id+'_'+suffix,fs.existsSync(path.join(out,id+'_'+suffix)));}
for(const n of ['TREE_EUCALYPTUS_COASTAL_002_RICH_SOURCE_REVIEW.png','TREE_COASTAL_WIND_001_RICH_SOURCE_REVIEW.png'])check(n,fs.existsSync(path.join(root,'next-family-rich-output',n)));
for(const n of ['GROWGO_APPROVED_TREE_METHOD_NEXT_FAMILIES_CONTEXT.png','GROWGO_NEXT_TREE_FAMILIES_MOBILE_REVIEW.png','GROWGO_TREE_FAMILY_MASS_VARIATION_REVIEW.png'])check(n,fs.existsSync(path.join(out,n)));
const result={status:checks.every(x=>x.pass)?'PASS':'FAIL',total:checks.length,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length,checks};fs.writeFileSync(path.join(root,'next-family-rich-output','NEXT_TREE_FAMILIES_RICH_VALIDATION.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(result.status!=='PASS')process.exitCode=1;
