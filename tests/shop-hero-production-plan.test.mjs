import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=f=>JSON.parse(fs.readFileSync('asset-factory/modular/'+f));
test('hero breakdown binds reference components and avoids Layer B-only geometry',()=>{const p=read('SHOP_GOLDEN_REFERENCE_PRODUCTION_BREAKDOWN.json');assert.equal(p.scope,'PLAN_ONLY');assert.equal(p.components.length,9);assert.ok(p.protectedRules.includes('no Layer B-only geometry'));});
test('hero plan and visual value budget are bounded',()=>{const p=read('SHOP_HERO_MODULE_UPGRADE_PLAN.json'),b=read('SHOP_VISUAL_VALUE_BUDGET.json');assert.equal(p.scope,'PLAN_ONLY');assert.ok(p.newReusableDetailFamilies.length>0);assert.ok(b.rules.some(x=>x.decision==='EXCLUDE'));});
test('existing recipe remains untouched',()=>{const r=JSON.parse(fs.readFileSync('asset-factory/modular/SHOP_LAYER_B_RECIPE.json'));assert.equal(r.recipeId,'GG-REC-BLD-SIMPLE-SHOP-GROWGO-001');assert.equal(r.recipeVersion,'1.0.0');});
