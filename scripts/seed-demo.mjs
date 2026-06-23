/**
 * Copies fictional demo data from backend/demo/ into backend/data/ for screenshots.
 * Overwrites local runtime data. Your real data is gitignored — run only when intended.
 *
 * Usage: npm run seed:demo
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const demoDir = join(root, 'backend', 'demo');
const dataDir = join(root, 'backend', 'data');
const demoCvsDir = join(demoDir, 'cvs');
const dataCvsDir = join(dataDir, 'cvs');

function copyFile(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
}

const appsSrc = join(demoDir, 'applications.json');
const cvMetaSrc = join(demoDir, 'cv-profiles.json');

if (!existsSync(appsSrc) || !existsSync(cvMetaSrc)) {
  console.error('Missing backend/demo/applications.json or cv-profiles.json');
  process.exit(1);
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
