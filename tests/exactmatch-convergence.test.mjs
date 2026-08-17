import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'test-output/exactmatch-final');
test('exact-match convergence evidence and rollback gate are recorded',()=>{
 const review=JSON.parse(fs.readFileSync(path.join(root,'asset-factory/modular/SHOP_EXACTMATCH_CODEX_VISION_REVIEW.json')));
 const diff=JSON.parse(fs.readFileSync(path.join(root,'asset-factory/modular/SHOP_EXACTMATCH_VISION_DIFFERENCES.json')));
 const base=JSON.parse(fs.readFileSync(path.join(root,'asset-factory/modular/SHOP_EXACTMATCH_SAFE_BASELINE.json')));
 assert.equal(review.verdict,'VISION_NEEDS_CORRECTION');
 assert.equal(review.safeBaselineProtected,true);
 assert.equal(review.revertedIteration,'corner-block experiment (visually regressive)');
 assert.ok(diff.differences.length>=5);
 assert.equal(base.operatorApprovalRequired,true);
 for(const n of ['SHOP_EXACTMATCH_FRONT.png','SHOP_EXACTMATCH_GAMEPLAY.png','SHOP_EXACTMATCH_HERO.png','SHOP_EXACTMATCH_CLOSEUP.png','SHOP_EXACTMATCH_BACK.png','SHOP_EXACTMATCH_LEFT.png','SHOP_EXACTMATCH_RIGHT.png','SHOP_EXACTMATCH_COMPONENT_ID.png','SHOP_EXACTMATCH_GOLDEN_COMPARISON_BOARD.png','SHOP_EXACTMATCH_FOUR_SIDE_BOARD.png']) assert.equal(fs.existsSync(path.join(out,n)),true,n);
});
