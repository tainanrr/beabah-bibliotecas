/**
 * Script para auto-incrementar a versão do sistema a cada commit.
 * 
 * Padrão de versionamento:
 * - Major.Minor.Patch (ex: 1.0.0, 1.0.1, 1.0.2...)
 * - O Patch é incrementado automaticamente a cada commit
 * - Minor e Major são incrementados manualmente quando necessário
 * 
 * Uso: node scripts/bump-version.js [major|minor|patch]
 *   - Sem argumento: incrementa patch (padrão)
 *   - major: incrementa major (ex: 1.0.0 -> 2.0.0)
 *   - minor: incrementa minor (ex: 1.0.0 -> 1.1.0)
 *   - patch: incrementa patch (ex: 1.0.0 -> 1.0.1)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionFilePath = path.join(__dirname, '..', 'src', 'version.ts');
const packageJsonPath = path.join(__dirname, '..', 'package.json');

// Ler o arquivo de versão atual
const content = fs.readFileSync(versionFilePath, 'utf-8');

// Extrair versão atual
const versionMatch = content.match(/APP_VERSION\s*=\s*'(\d+)\.(\d+)\.(\d+)'/);
const buildMatch = content.match(/BUILD_NUMBER\s*=\s*(\d+)/);

if (!versionMatch || !buildMatch) {
  console.error('❌ Erro: Não foi possível ler a versão atual do arquivo src/version.ts');
  process.exit(1);
}

let major = parseInt(versionMatch[1]);
let minor = parseInt(versionMatch[2]);
let patch = parseInt(versionMatch[3]);
let buildNumber = parseInt(buildMatch[1]);

// Determinar tipo de bump
const bumpType = process.argv[2] || 'patch';

switch (bumpType) {
  case 'major':
    major++;
    minor = 0;
    patch = 0;
    break;
  case 'minor':
    minor++;
    patch = 0;
    break;
  case 'patch':
  default:
    patch++;
    break;
}

buildNumber++;

const newVersion = `${major}.${minor}.${patch}`;
const buildDate = new Date().toISOString();

// Gerar novo conteúdo do arquivo
const newContent = `// Este arquivo é atualizado automaticamente a cada commit
// NÃO edite manualmente - use o script de versionamento
export const APP_VERSION = '${newVersion}';
export const BUILD_NUMBER = ${buildNumber};
export const BUILD_DATE = '${buildDate}';
`;

// Salvar arquivo de versão
fs.writeFileSync(versionFilePath, newContent, 'utf-8');

// Atualizar também o package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

console.log(`✅ Versão atualizada: ${newVersion} (Build #${buildNumber})`);
console.log(`📅 Data: ${buildDate}`);
