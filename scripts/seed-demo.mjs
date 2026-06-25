/**
 * Copies fictional demo data from backend/demo/ into backend/data/ for screenshots.
 * Overwrites local runtime data. Your real data is gitignored — run only when intended.
 *
 * Usage: npm run seed:demo
 *        npm run seed:demo -- --force   (overwrite real user data)
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const demoDir = join(root, 'backend', 'demo');
const dataDir = join(root, 'backend', 'data');
const demoCvsDir = join(demoDir, 'cvs');
const dataCvsDir = join(dataDir, 'cvs');
const appsPath = join(dataDir, 'applications.json');

const SEED_IDS = new Set(['seed-1', 'seed-2', 'seed-3', 'seed-4', 'seed-5']);
const force = process.argv.includes('--force');

function looksLikeRealUserData() {
  if (!existsSync(appsPath)) return false;
  let apps;
  try {
    apps = JSON.parse(readFileSync(appsPath, 'utf8'));
  } catch {
    return true;
  }
  if (!Array.isArray(apps) || apps.length === 0) return false;
  return !(
    apps.length === SEED_IDS.size &&
    apps.every((app) => app && typeof app.id === 'string' && SEED_IDS.has(app.id))
  );
}

function copyFile(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
}

function runSafetySnapshot() {
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(
    npx,
    ['tsx', 'src/cli/safety-backup-cli.ts', 'pre-seed-demo'],
    { cwd: join(root, 'backend'), stdio: 'inherit' },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (looksLikeRealUserData() && !force) {
  console.error('Real user data detected in backend/data/.');
  console.error('Pass --force to overwrite, or run npm run backup first.');
  process.exit(1);
}

const appsSrc = join(demoDir, 'applications.json');
const cvMetaSrc = join(demoDir, 'cv-profiles.json');

if (!existsSync(appsSrc) || !existsSync(cvMetaSrc)) {
  console.error('Missing backend/demo/applications.json or cv-profiles.json');
  process.exit(1);
}

if (existsSync(appsPath) || existsSync(join(dataDir, 'cv-profiles.json'))) {
  runSafetySnapshot();
}

mkdirSync(dataDir, { recursive: true });

copyFile(appsSrc, join(dataDir, 'applications.json'));
copyFile(cvMetaSrc, join(dataDir, 'cv-profiles.json'));

if (existsSync(dataCvsDir)) {
  rmSync(dataCvsDir, { recursive: true, force: true });
}
mkdirSync(dataCvsDir, { recursive: true });

const metadata = JSON.parse(readFileSync(cvMetaSrc, 'utf8'));
for (const version of metadata.versions) {
  if (version.mimeType !== 'application/pdf') continue;
  const src = join(demoCvsDir, `${version.id}.pdf`);
  const dest = join(dataCvsDir, `${version.id}.pdf`);
  if (!existsSync(src)) {
    console.error(`Missing demo PDF: ${src}`);
    console.error('Run: node scripts/generate-demo-pdfs.mjs');
    process.exit(1);
  }
  copyFile(src, dest);
}

console.log('Demo data copied to backend/data/');
console.log('Restart the backend if it is running, then open http://localhost:5173');
