import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SEED_APPLICATIONS } from './backend/src/seeds.js';

const dir = mkdtempSync(join(tmpdir(), 'jat-test-'));
const dataFile = join(dir, 'applications.json');
process.env.APPLICATIONS_DATA_FILE = dataFile;
writeFileSync(dataFile, JSON.stringify(SEED_APPLICATIONS, null, 2));
