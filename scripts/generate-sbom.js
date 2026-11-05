// ============================================================
// GENERATE SBOM — Software Bill of Materials (CycloneDX 1.5 JSON)
// Gerador nativo leve sem dependências externas vulneráveis
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const pkgPath = path.join(rootDir, 'package.json');
const lockPath = path.join(rootDir, 'package-lock.json');
const outPath = path.join(rootDir, 'sbom.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));

const components = [];
const packages = lock.packages || {};

for (const [pkgKey, pkgData] of Object.entries(packages)) {
  if (!pkgKey || pkgKey === '') continue; // Skip root package

  const name = pkgData.name || pkgKey.replace(/^node_modules\//, '');
  const version = pkgData.version || '0.0.0';
  const license = pkgData.license || 'UNLICENSED';

  const component = {
    type: 'library',
    name,
    version,
    purl: `pkg:npm/${name.startsWith('@') ? name.replace('/', '%2F') : name}@${version}`,
    licenses: [
      {
        license: {
          id: license
        }
      }
    ]
  };

  if (pkgData.resolved) {
    component.externalReferences = [
      {
        type: 'distribution',
        url: pkgData.resolved
      }
    ];
  }

  components.push(component);
}

const sbom = {
  $schema: 'http://cyclonedx.org/schema/bom-1.5.schema.json',
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  serialNumber: `urn:uuid:${crypto.randomUUID()}`,
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    tools: [
      {
        vendor: 'Shopping das Academias',
        name: 'native-sbom-generator',
        version: '1.0.0'
      }
    ],
    component: {
      type: 'application',
      name: pkg.name || 'cronograma-entregas',
      version: pkg.version || '1.0.0',
      description: pkg.description || ''
    }
  },
  components
};

fs.writeFileSync(outPath, JSON.stringify(sbom, null, 2), 'utf-8');
console.log(`✅ SBOM CycloneDX 1.5 gerado com sucesso em: ${outPath} (${components.length} componentes catalogados)`);
