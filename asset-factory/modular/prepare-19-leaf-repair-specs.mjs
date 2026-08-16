import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const sourceDir = path.join(root, 'test-output/plant-26-leaf-production/specs');
const outDir = path.join(root, 'test-output/plant-26-leaf-production/repair-specs');
const ids = ['LEAF_003', 'LEAF_004', 'LEAF_011', 'LEAF_015', 'LEAF_016', 'LEAF_017', 'LEAF_018', 'LEAF_019'];
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
for (const id of ids) {
  const spec = JSON.parse(fs.readFileSync(path.join(sourceDir, `${id}.json`), 'utf8'));
  spec.candidates = spec.candidates.filter((candidate) => candidate.repairScope === 'FRONT_ONLY_SINGLE_LEAF_LOCAL_EDGE_CALIBRATION');
  if (!spec.candidates.length) throw new Error(`No local repair candidates for ${id}`);
  fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(spec, null, 2) + '\n');
}
console.log(JSON.stringify({ status: 'PASS_19_LEAF_REPAIR_SPECS_READY', output: outDir, leaves: ids, candidatesPerLeaf: ids.map((id) => [id, JSON.parse(fs.readFileSync(path.join(outDir, `${id}.json`), 'utf8')).candidates.length]) }, null, 2));
