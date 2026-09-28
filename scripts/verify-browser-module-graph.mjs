import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Validate literal local imports, including cache-busted dynamic imports.
// Run against the finished artifact, not just the source checkout.
export function verifyBrowserModuleGraph(root, entries = ['script.js']) {
  root = path.resolve(root);
  const pending = entries.map(entry => path.resolve(root, entry));
  const visited = new Set();
  while (pending.length) {
    const file = pending.pop();
    if (visited.has(file)) continue;
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Module escapes artifact: ${file}`);
    if (!statSync(file, { throwIfNoEntry: false })?.isFile()) throw new Error(`Missing browser module: ${relative}`);
    visited.add(file);
    const source = readFileSync(file, 'utf8');
    const patterns = [/\bfrom\s*["']([^"']+)["']/g, /\bimport\s*["']([^"']+)["']/g, /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g];
    for (const pattern of patterns) for (const [, raw] of source.matchAll(pattern)) {
      if (!raw.startsWith('.') && !raw.startsWith('/')) continue;
      const specifier = raw.split(/[?#]/, 1)[0];
      pending.push(specifier.startsWith('/') ? path.resolve(root, `.${specifier}`) : path.resolve(path.dirname(file), specifier));
    }
  }
  return visited.size;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error('Provide the finished deployment directory');
  console.log(`Verified ${verifyBrowserModuleGraph(process.argv[2])} browser modules.`);
}
