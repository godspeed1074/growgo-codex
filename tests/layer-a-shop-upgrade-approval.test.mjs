import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('test-output/shop-layer-a-upgrade');
const ids=['GG-BLD-FASCIA-SHOP-NAVY-001','GG-BLD-AWNING-SHOP-FABRIC-001','GG-BLD-WINDOW-SHOP-LARGE-002','GG-BLD-DOOR-SHOP-002','GG-VEG-PLANTER-SHRUB-001'];
test('all five comparison boards and complete board exist',()=>{
 for(const id of ids) assert.ok(fs.existsSync(path.join(root,`${id}@1.1.0`,'MODULE_UPGRADE_COMPARISON_BOARD.png')));
 assert.ok(fs.existsSync(path.join(root,'SHOP_LAYER_A_UPGRADE_COMPLETE_BOARD.png')));
});
test('approval remains operator-gated',()=>{
 const report=fs.readFileSync('asset-factory/modular/SHOP_LAYER_A_UPGRADE_APPROVAL_REPORT.md','utf8');
 assert.equal((report.match(/NEEDS_CORRECTION/g)||[]).length,5); assert.ok(report.includes('NO AUTOMATIC APPROVAL')); assert.ok(report.includes('No candidate is promoted'));
});
