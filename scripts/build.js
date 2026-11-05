// ============================================================
// BUILD SCRIPT — Cronograma de Entregas
// Prepara o pacote de produção/homologação no diretório dist/
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

// Parse flags
const args = process.argv.slice(2);
const envArgIdx = args.indexOf('--env');
const environment = (envArgIdx !== -1 && args[envArgIdx + 1]) ? args[envArgIdx + 1] : (process.env.APP_ENV || 'production');

console.log(`🚀 Iniciando build para o ambiente: [${environment}]`);

// 1. Limpar / criar dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Copiar diretórios estáticos
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copiar css
if (fs.existsSync(path.join(rootDir, 'css'))) {
  copyDirSync(path.join(rootDir, 'css'), path.join(distDir, 'css'));
}

// Copiar js
if (fs.existsSync(path.join(rootDir, 'js'))) {
  copyDirSync(path.join(rootDir, 'js'), path.join(distDir, 'js'));
}

// Copiar arquivos HTML
const htmlFiles = ['index.html', 'app.html', 'admin.html'];
for (const file of htmlFiles) {
  const src = path.join(rootDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
  }
}

// 3. Injeção de variáveis de ambiente para o Supabase (se fornecidas no ambiente de CI/CD)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseAnonKey) {
  console.log(`🔒 Injetando credenciais do Supabase configuradas no ambiente [${environment}]...`);
  const configContent = `// ============================================================
// SUPABASE CONFIG — Gerado automaticamente pelo build (${environment})
// ============================================================

const SUPABASE_URL = '${supabaseUrl}';
const SUPABASE_ANON_KEY = '${supabaseAnonKey}';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }
});
`;
  fs.writeFileSync(path.join(distDir, 'js', 'supabase-config.js'), configContent, 'utf-8');
} else {
  console.log('ℹ️ Credenciais SUPABASE_URL / SUPABASE_ANON_KEY não informadas em process.env. Mantendo js/supabase-config.js existente.');
}

// 4. Gerar endpoint de verificação de integridade / saúde (health check)
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const gitCommit = process.env.GITHUB_SHA || process.env.GIT_COMMIT || 'local-dev';

const healthData = {
  status: 'healthy',
  name: pkg.name,
  version: pkg.version,
  environment,
  timestamp: new Date().toISOString(),
  commit: gitCommit
};

fs.writeFileSync(
  path.join(distDir, 'health.json'),
  JSON.stringify(healthData, null, 2),
  'utf-8'
);

console.log(`✅ Build concluído com sucesso em: ${distDir}`);
console.log(`📦 Arquivos gerados no bundle:`);
function listFiles(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      listFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`);
    } else {
      const stats = fs.statSync(path.join(dir, entry.name));
      console.log(`   - ${prefix}${entry.name} (${stats.size} bytes)`);
    }
  }
}
listFiles(distDir);

