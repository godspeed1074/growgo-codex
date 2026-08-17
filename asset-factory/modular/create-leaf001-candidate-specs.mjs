import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/CENTRAL_TARGET_LEAF_CONTOUR.json'), 'utf8'));
const outDir = path.join(root, 'test-output/central-leaf-candidates/specs');
fs.mkdirSync(outDir, { recursive: true });

const candidates = {
  'LEAF001_C24_LOCAL_SHOULDER_BASE': [
    [94.5, 31.5], [97, 33.5], [98, 35], [100, 37.2], [101, 39], [103.5, 40], [105.5, 44.5], [106.5, 46], [105, 48], [105, 56], [102, 61], [100, 65], [98, 67], [96, 69], [94, 69], [90, 66], [87, 63], [85, 59], [83, 53], [83, 47], [85, 43], [86.5, 38], [89, 35], [92.5, 31.5],
  ],
  'LEAF001_C28_LOCAL_SHOULDER_BASE': [
    [94.5, 31.5], [97, 33.5], [98, 35], [99, 36], [101, 39], [103.5, 40], [105.5, 44.5], [106.5, 46], [105.7, 47], [105, 48], [105, 56], [102, 61], [100, 65], [98.5, 66.5], [96, 69], [94, 69], [92, 68], [90, 66], [88, 64.5], [87, 63], [85, 59], [84, 56], [83, 53], [83, 47], [85, 43], [86.5, 38], [89, 35], [92.5, 31.5],
  ],
  'LEAF001_C32_LOCAL_SHOULDER_BASE': [
    [94.5, 31.5], [96, 32.5], [97, 33.5], [98, 35], [99, 36], [100, 37.2], [101, 39], [103.5, 40], [105, 43], [105.5, 44.5], [106.5, 46], [105, 48], [105, 52], [105, 56], [102, 61], [101, 63], [100, 65], [97, 68], [96, 69], [94, 69], [92, 68], [90, 66], [88, 64.5], [87, 63], [85, 59], [84, 56], [83, 53], [83, 47], [85, 43], [86.5, 38], [89, 35], [92.5, 31.5],
  ],
};

for (const [candidateId, chosenContour] of Object.entries(candidates)) {
  const spec = { ...source, candidateId, chosenContour, chosenVertexCount: chosenContour.length, contourSource: 'TARGET_SPECIFIC_LOCAL_MICRO_CALIBRATION', outputs: { ...source.outputs, candidateId } };
  fs.writeFileSync(path.join(outDir, `${candidateId}.json`), JSON.stringify(spec, null, 2) + '\n');
}
console.log(JSON.stringify(Object.fromEntries(Object.entries(candidates).map(([id, contour]) => [id, contour.length])), null, 2));
