// tests/setup.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { beforeEach } from 'vitest';

const loadedScripts = new Set();

// Helper global para carregar scripts com rastreamento de cobertura V8
globalThis.loadScript = function(relativePath) {
  const absPath = path.resolve(__dirname, relativePath);
  if (loadedScripts.has(absPath)) return;
  loadedScripts.add(absPath);
  const code = fs.readFileSync(absPath, 'utf-8');
  vm.runInThisContext(code, { filename: absPath });
};

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});
