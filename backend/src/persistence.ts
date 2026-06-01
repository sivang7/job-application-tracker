import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Application } from '@jat/shared';
import { isApplicationStatus } from '@jat/shared';
import { SEED_APPLICATIONS } from './seeds.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_FILE = join(__dirname, '..', 'data', 'applications.json');

export function getDataFilePath(): string {
  return process.env.APPLICATIONS_DATA_FILE ?? DEFAULT_DATA_FILE;
}

function isValidApplication(value: unknown): value is Application {
  if (!value || typeof value !== 'object') return false;
  const app = value as Record<string, unknown>;
  return (
    typeof app.id === 'string' &&
    typeof app.company === 'string' &&
    typeof app.role === 'string' &&
    typeof app.status === 'string' &&
    isApplicationStatus(app.status)
  );
}

function parseApplicationsFile(raw: string): Application[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in applications data file: ${getDataFilePath()}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Applications data file must contain a JSON array: ${getDataFilePath()}`);
  }

  for (const item of parsed) {
    if (!isValidApplication(item)) {
      throw new Error(`Invalid application entry in data file: ${getDataFilePath()}`);
    }
  }

  return parsed as Application[];
}

export function loadApplications(): Application[] {
  const filePath = getDataFilePath();
  const dir = dirname(filePath);

  if (!existsSync(filePath)) {
    mkdirSync(dir, { recursive: true });
    const seeded = structuredClone(SEED_APPLICATIONS);
    saveApplications(seeded);
    return seeded;
  }

  const raw = readFileSync(filePath, 'utf8');
  return parseApplicationsFile(raw);
}

export function saveApplications(apps: Application[]): void {
  const filePath = getDataFilePath();
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });

  const tempPath = `${filePath}.${process.pid}.tmp`;
  const content = JSON.stringify(apps, null, 2);
  writeFileSync(tempPath, content, 'utf8');
  renameSync(tempPath, filePath);
}

export function deleteDataFileIfExists(): void {
  const filePath = getDataFilePath();
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}
