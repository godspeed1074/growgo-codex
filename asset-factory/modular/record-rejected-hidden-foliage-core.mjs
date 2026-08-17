import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'../..'),modular=path.join(root,'asset-factory/modular');
const front=JSON.parse(fs.readFileSync(path.join(modular,'PLANT_FRONT_GEOMETRY_AUTHORITY_LOCK_V1.json'),'utf8'));
const evaluation=JSON.parse(fs.readFileSync(path.join(modular,'PLANT_GAMEPLAY_OPTIMIZED_25D_EVALUATION.json'),'utf8'));
const rejection={status:'REJECTED',candidateId:'HIDDEN_FOLIAGE_CORE_001',scope:'isolated gameplay-optimized 2.5D experiment only',reasons:['VISIBLE_FROM_LOCKED_FRONT','FRONT_IOU_BELOW_98_PERCENT','FRONT_DRIFT_EXCEEDS_0_5_PERCENT','CARD_AND_SHELF_EFFECT_IN_GAMEPLAY_CONE'],frontAuthority:{lockVersion:front.lockVersion,status:front.status,checksum:front.finalRenderChecksum,preserved:true},metrics:evaluation.front,neverPromotedToLayerA:true,neverPromotedToLayerB:true,shopUnchanged:true,eucalyptusStarted:false,retainedOnlyAsRejectedEvidence:'asset-factory/modular/PLANT_GAMEPLAY_OPTIMIZED_2_5D_BOARD.png'};
fs.writeFileSync(path.join(modular,'PLANT_REJECTED_HIDDEN_FOLIAGE_CORE_001.json'),JSON.stringify(rejection,null,2)+'\n');
const statusPath=path.join(modular,'PLANT_26_LEAF_PRODUCTION_STATUS.json'),status=JSON.parse(fs.readFileSync(statusPath,'utf8'));status.rejectedHiddenFoliageCore=rejection;status.activePlantAuthority={lockVersion:front.lockVersion,status:'LOCKED_AND_PRESERVED',frontChecksum:front.finalRenderChecksum,hiddenGeometryAuthority:'NOT_GRANTED'};fs.writeFileSync(statusPath,JSON.stringify(status,null,2)+'\n');
console.log(JSON.stringify({rejection:rejection.status,frontAuthority:status.activePlantAuthority},null,2));
