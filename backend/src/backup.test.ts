import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Application } from '@jat/shared';
import {
  createRollingBackup,
  createSafetySnapshot,
  getRollingBackupPath,
  listBackups,
  looksLikeRealUserData,
  restoreBackup,
  validateBackupDir,
} from './backup.js';
import { getCvMetadataFilePath, getCvsDir } from './cvPersistence.js';
import { getDataFilePath } from './persistence.js';
import { SEED_APPLICATIONS } from './seeds.js';

describe('backup', () => {
  let previousEnv: Record<string, string | undefined>;
  let tempRoot: string;

  beforeEach(() => {
    previousEnv = {
      APPLICATIONS_DATA_FILE: process.env.APPLICATIONS_DATA_FILE,
      CV_METADATA_FILE: process.env.CV_METADATA_FILE,
      CVS_DATA_DIR: process.env.CVS_DATA_DIR,
      BACKUPS_DIR: process.env.BACKUPS_DIR,
    };
    tempRoot = mkdtempSync(join(tmpdir(), 'jat-backup-'));
    process.env.APPLICATIONS_DATA_FILE = join(tempRoot, 'data', 'applications.json');
    process.env.CV_METADATA_FILE = join(tempRoot, 'data', 'cv-profiles.json');
    process.env.CVS_DATA_DIR = join(tempRoot, 'data', 'cvs');
    process.env.BACKUPS_DIR = join(tempRoot, 'backups');
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  function writeLiveData(apps: Application[]) {
    mkdirSync(join(tempRoot, 'data'), { recursive: true });
    writeFileSync(getDataFilePath(), JSON.stringify(apps, null, 2));
    writeFileSync(
      getCvMetadataFilePath(),
      JSON.stringify({ profiles: [], versions: [] }, null, 2),
    );
  }

  it('detects seed data vs real user data', () => {
    writeLiveData(SEED_APPLICATIONS);
    expect(looksLikeRealUserData()).toBe(false);

    writeLiveData([
      ...SEED_APPLICATIONS,
      {
        id: 'real-1',
        company: 'Real Co',
        role: 'Engineer',
        status: 'applied',
      },
    ]);
    expect(looksLikeRealUserData()).toBe(true);
  });

  it('creates rolling backup and replaces previous latest folder', () => {
    writeLiveData([
      { id: 'a1', company: 'One', role: 'Dev', status: 'applied' },
    ]);
    const first = createRollingBackup();
    expect(first).toBe(getRollingBackupPath());

    writeLiveData([
      { id: 'a2', company: 'Two', role: 'Dev', status: 'wishlist' },
    ]);
    createRollingBackup();

    const latestApps = JSON.parse(readFileSync(join(first, 'applications.json'), 'utf8')) as Application[];
    expect(latestApps[0]?.company).toBe('Two');
    expect(listBackups().some((entry) => entry.name === 'latest')).toBe(true);
  });

  it('round-trips restore into live data directory', () => {
    writeLiveData([
      {
        id: 'a1',
        company: 'Acme',
        role: 'Engineer',
        status: 'applied',
        notes: 'backup me',
      },
    ]);
    createRollingBackup();

    writeLiveData([{ id: 'gone', company: 'Lost', role: 'Role', status: 'rejected' }]);
    restoreBackup(getRollingBackupPath(), { createPreRestoreSnapshot: false });

    const restored = JSON.parse(readFileSync(getDataFilePath(), 'utf8')) as Application[];
    expect(restored).toHaveLength(1);
    expect(restored[0]?.company).toBe('Acme');
    expect(restored[0]?.notes).toBe('backup me');
  });

  it('creates pre-restore safety snapshot by default', () => {
    writeLiveData([{ id: 'a1', company: 'Live', role: 'Dev', status: 'applied' }]);
    createRollingBackup();
    writeLiveData([{ id: 'a2', company: 'Changed', role: 'Dev', status: 'applied' }]);

    restoreBackup(getRollingBackupPath());
    const safety = listBackups().filter((entry) => entry.name.startsWith('pre-restore-'));
    expect(safety.length).toBe(1);
  });

  it('rejects backup missing referenced CV file', () => {
    const backupDir = join(tempRoot, 'broken-backup');
    mkdirSync(backupDir, { recursive: true });
    writeFileSync(join(backupDir, 'applications.json'), '[]');
    writeFileSync(
      join(backupDir, 'cv-profiles.json'),
      JSON.stringify(
        {
          profiles: [],
          versions: [
            {
              id: 'v1',
              profileId: 'p1',
              originalFilename: 'cv.pdf',
              mimeType: 'application/pdf',
              uploadedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
        null,
        2,
      ),
    );
    expect(() => validateBackupDir(backupDir)).toThrow(/missing CV file/i);
  });

  it('creates named safety snapshots', () => {
    writeLiveData(SEED_APPLICATIONS);
    const path = createSafetySnapshot('pre-seed-demo');
    expect(path).toContain('pre-seed-demo-');
    validateBackupDir(path);
    expect(existsSync(join(path, 'applications.json'))).toBe(true);
  });
});
