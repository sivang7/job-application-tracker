import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SEED_APPLICATIONS } from './seeds.js';
import {
  deleteDataFileIfExists,
  getDataFilePath,
  loadApplications,
  saveApplications,
} from './persistence.js';

describe('persistence', () => {
  let previousPath: string | undefined;

  beforeEach(() => {
    previousPath = process.env.APPLICATIONS_DATA_FILE;
    const dir = mkdtempSync(join(tmpdir(), 'jat-persist-'));
    process.env.APPLICATIONS_DATA_FILE = join(dir, 'applications.json');
    deleteDataFileIfExists();
  });

  afterEach(() => {
    deleteDataFileIfExists();
    if (previousPath === undefined) {
      delete process.env.APPLICATIONS_DATA_FILE;
    } else {
      process.env.APPLICATIONS_DATA_FILE = previousPath;
    }
  });

  it('seeds file when missing', () => {
    const apps = loadApplications();
    expect(apps).toHaveLength(SEED_APPLICATIONS.length);
    expect(apps[0]?.id).toBe('seed-1');
    expect(readFileSync(getDataFilePath(), 'utf8')).toContain('seed-1');
  });

  it('round-trips save and load', () => {
    loadApplications();
    const custom = [
      {
        id: 'custom-1',
        company: 'Test Co',
        role: 'Dev',
        status: 'wishlist' as const,
      },
    ];
    saveApplications(custom);
    expect(loadApplications()).toEqual(custom);
  });

  it('throws on corrupt JSON', () => {
    const filePath = getDataFilePath();
    writeFileSync(filePath, '{ not json', 'utf8');
    expect(() => loadApplications()).toThrow(/Invalid JSON/);
  });

  it('throws on non-array JSON', () => {
    writeFileSync(getDataFilePath(), '{"id":"x"}', 'utf8');
    expect(() => loadApplications()).toThrow(/JSON array/);
  });
});
