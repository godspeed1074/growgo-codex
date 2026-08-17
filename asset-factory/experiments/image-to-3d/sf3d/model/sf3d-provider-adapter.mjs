// Experimental only. This adapter deliberately has no imports from the
// production Asset Factory and cannot register or promote an asset.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const availabilityPath = path.join(root, 'evaluation/SF3D_PROVIDER_AVAILABILITY.json');
const inputPath = path.join(root, 'input/SF3D_SHRUB_TARGET_ORIGINAL.png');

export function checkAvailability() {
  return JSON.parse(fs.readFileSync(availabilityPath, 'utf8'));
}

export function prepareInput() {
  return {
    path: inputPath,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(inputPath)).digest('hex'),
    preprocessing: JSON.parse(fs.readFileSync(path.join(root, 'SF3D_INPUT_PREPROCESSING.json'), 'utf8'))
  };
}

function blocked(method) {
  const availability = checkAvailability();
  if (availability.status === 'HARDWARE_BLOCKED') {
    throw new Error(`SF3D ${method} is blocked: ${availability.recommendedLocation}`);
  }
}

export function runInference() { blocked('inference'); }
export function collectOutput() { blocked('output collection'); }
export function inspectOutput() { blocked('output inspection'); }
export function createBlenderProof() { blocked('Blender proof'); }
