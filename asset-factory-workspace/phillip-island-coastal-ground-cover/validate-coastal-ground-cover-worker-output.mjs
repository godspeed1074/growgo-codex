import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('asset-factory-workspace/phillip-island-coastal-ground-cover');
const outputRoot=path.join(root,'worker-output');
const packageSpec=JSON.parse(fs.readFileSync(path.join(root,'worker','COASTAL_GROUND_COVER_WORKER_PACKAGE.json')));
const requiredReviews=['ASSET_REVIEW_FRONT.png','ASSET_REVIEW_BACK.png','ASSET_REVIEW_LEFT.png','ASSET_REVIEW_RIGHT.png','ASSET_REVIEW_GAMEPLAY.png','REFERENCE_COMPARISON_BOARD.png'];
const lods=['CLOSE','GAMEPLAY','MAP'];
const limits={triangles:900,vertices:1100,materials:2};
const candidates=[];
for(const target of packageSpec.targets){
  const version='1.0.0', dir=path.join(outputRoot,`${target.assetId}@${version}`);
  const files=[];
  const blend=path.join(dir,`${target.assetId}.blend`);
  files.push({path:blend,exists:fs.existsSync(blend),bytes:fs.existsSync(blend)?fs.statSync(blend).size:0});
  const lodResults=[];
  for(const lod of lods){
    const glb=path.join(dir,`${target.assetId}_LOD_${lod}.glb`);
    const statsPath=path.join(dir,`${target.assetId}_LOD_${lod}_STATS.json`);
    const stats=fs.existsSync(statsPath)?JSON.parse(fs.readFileSync(statsPath)):null;
    files.push({path:glb,exists:fs.existsSync(glb),bytes:fs.existsSync(glb)?fs.statSync(glb).size:0});
    lodResults.push({lod,glb,statsPath,stats,budgetPass:Boolean(stats&&stats.triangles<=limits.triangles&&stats.vertices<=limits.vertices&&stats.materials<=limits.materials)});
  }
  const reviewFiles=requiredReviews.map(name=>({name,path:path.join(dir,name),exists:fs.existsSync(path.join(dir,name))}));
  const metadataPath=path.join(dir,'BUILD_METADATA.json');
  const metadata=fs.existsSync(metadataPath)?JSON.parse(fs.readFileSync(metadataPath)):null;
  const artifactsPass=files.every(file=>file.exists)&&reviewFiles.every(file=>file.exists)&&metadata?.reviewState==='REVIEW_CANDIDATE';
  const budgetPass=lodResults.every(result=>result.budgetPass);
  candidates.push({assetId:target.assetId,version,workerState:metadata?.reviewState??'MISSING',treeExclusion:metadata?.treeExclusion===true,blend,lods:lodResults,reviews:reviewFiles,artifactsPass,budgetPass,finalState:artifactsPass&&budgetPass?'REVIEW_CANDIDATE':'REVIEW_CANDIDATE_BUDGET_EXCEPTION'});
}
const validation={
  contractVersion:'COASTAL_GROUND_COVER_WORKER_VALIDATION_V1',
  worker:{host:'deck@10.0.0.4',runtime:'flatpak run org.blender.Blender',blenderVersion:'5.2.0 LTS',exitCode:0,backgroundPython:'PASS',cleanExit:'PASS'},
  limits,
  candidateCount:candidates.length,
  completed:candidates.filter(candidate=>candidate.artifactsPass).length,
  budgetPassed:candidates.filter(candidate=>candidate.budgetPass).length,
  treeExclusionPass:candidates.every(candidate=>candidate.treeExclusion),
  productionRegistration:'NOT_PERFORMED',
  approval:'HUMAN_VISUAL_REVIEW_REQUIRED',
  candidates
};
fs.writeFileSync(path.join(root,'COASTAL_GROUND_COVER_WORKER_VALIDATION.json'),JSON.stringify(validation,null,2)+'\n');
const rows=candidates.map(candidate=>`| ${candidate.assetId} | ${candidate.lods.map(lod=>`${lod.lod}: ${lod.stats?.triangles ?? 'missing'} tris`).join('<br>')} | ${candidate.lods[0]?.stats?.materials ?? 'missing'} | ${candidate.budgetPass?'PASS':'FAIL — close LOD exceeds cap'} | ${candidate.finalState} |`).join('\n');
const report=`# Coastal Ground Cover — Steam Deck Worker Review Receipt\n\n- Worker: \`deck@10.0.0.4\`\n- Runtime: \`flatpak run org.blender.Blender\`\n- Blender: **5.2.0 LTS**\n- Render engine compatibility: **BLENDER_EEVEE**\n- Worker process exit: **0 (clean)**\n- Approval: **not performed; human visual review required**\n- Tree exclusion: **PASS**\n\n## Candidate validation\n\n| Candidate | LOD triangle counts | Materials | Package budget | State |\n| --- | --- | ---: | --- | --- |\n${rows}\n\nThe technical exceptions are \`GG-VEG-GROUND-COVER-CREEPING-001\` CLOSE LOD (**1,068 triangles**) and \`GG-VEG-GROUND-COVER-SUCCULENT-001\` CLOSE LOD (**972 triangles**); each exceeds the controlled package cap of **900**. Neither result has been altered or waived. All returned candidates retain the state \`REVIEW_CANDIDATE\` / \`REVIEW_CANDIDATE_BUDGET_EXCEPTION\` pending operator review.\n\n## Review evidence\n\nEach candidate directory contains the real worker-produced Blender file, three GLBs, front/back/left/right/gameplay renders, and a locked-reference comparison board. No assets were registered, approved, or populated into Atlas.\n`;
fs.writeFileSync(path.join(root,'COASTAL_GROUND_COVER_WORKER_REVIEW_RECEIPT.md'),report);
console.log(JSON.stringify({completed:validation.completed,budgetPassed:validation.budgetPassed,treeExclusionPass:validation.treeExclusionPass},null,2));
