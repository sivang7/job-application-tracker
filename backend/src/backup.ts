import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { CvMimeType } from '@jat/shared';
import { getCvFileExtension, getCvMetadataFilePath, getCvsDir } from './cvPersistence.js';
import { getDataFilePath } from './persistence.js';
import { SEED_APPLICATIONS } from './seeds.js';

export const ROLLING_BACKUP_DIRNAME = 'latest';

const SEED_IDS = new Set(SEED_APPLICATIONS.map((app) => app.id));

export function getDataDir(): string {
  return dirname(getDataFilePath());
}

export function getBackupsDir(): string {
  return process.env.BACKUPS_DIR ?? join(getDataDir(), 'backups');
}

export function getRollingBackupPath(): string {
  return join(getBackupsDir(), ROLLING_BACKUP_DIRNAME);
}

export function looksLikeRealUserData(applicationsPath = getDataFilePath()): boolean {
  if (!existsSync(applicationsPath)) return false;
  let apps: unknown;
  try {
    apps = JSON.parse(readFileSync(applicationsPath, 'utf8'));
  } catch {
    return true;
  }
  if (!Array.isArray(apps) || apps.length === 0) return false;
  return !(
    apps.length === SEED_IDS.size &&
    apps.every((app) => typeof app === 'object' && app !== null && SEED_IDS.has((app as { id: string }).id))
  );
}

function copyDataTree(sourceDir: string, destDir: string): void {
  if (existsSync(destDir)) {
    rmSync(destDir, { recursive: true, force: true });
  }
  mkdirSync(destDir, { recursive: true });

  const appsSrc = join(sourceDir, 'applications.json');
  const cvMetaSrc = join(sourceDir, 'cv-profiles.json');
  const cvsSrc = join(sourceDir, 'cvs');

  if (!existsSync(appsSrc) || !existsSync(cvMetaSrc)) {
    throw new Error(`Backup is missing applications.json or cv-profiles.json in ${sourceDir}`);
  }

  cpSync(appsSrc, join(destDir, 'applications.json'));
  cpSync(cvMetaSrc, join(destDir, 'cv-profiles.json'));

  if (existsSync(cvsSrc)) {
    cpSync(cvsSrc, join(destDir, 'cvs'), { recursive: true });
  } else {
    mkdirSync(join(destDir, 'cvs'), { recursive: true });
  }
}

function copyLiveDataToDir(destDir: string): void {
  const dataDir = getDataDir();
  mkdirSync(destDir, { recursive: true });

  const appsPath = getDataFilePath();
  const cvMetaPath = getCvMetadataFilePath();
  const cvsDir = getCvsDir();

  if (!existsSync(appsPath)) {
    throw new Error(`Live applications file not found: ${appsPath}`);
  }
  if (!existsSync(cvMetaPath)) {
    throw new Error(`Live CV metadata file not found: ${cvMetaPath}`);
  }

  cpSync(appsPath, join(destDir, 'applications.json'));
  cpSync(cvMetaPath, join(destDir, 'cv-profiles.json'));

  if (existsSync(cvsDir)) {
    cpSync(cvsDir, join(destDir, 'cvs'), { recursive: true });
  } else {
    mkdirSync(join(destDir, 'cvs'), { recursive: true });
  }
}

export function validateBackupDir(backupDir: string): void {
  const appsPath = join(backupDir, 'applications.json');
  const cvMetaPath = join(backupDir, 'cv-profiles.json');

  if (!existsSync(appsPath) || !existsSync(cvMetaPath)) {
    throw new Error(`Invalid backup: missing JSON files in ${backupDir}`);
  }

  let metadata: { versions?: Array<{ id: string; mimeType: string }> };
  try {
    metadata = JSON.parse(readFileSync(cvMetaPath, 'utf8')) as {
      versions?: Array<{ id: string; mimeType: string }>;
    };
  } catch {
    throw new Error(`Invalid backup: corrupt cv-profiles.json in ${backupDir}`);
  }

  const versions = metadata.versions ?? [];
  const cvsDir = join(backupDir, 'cvs');
  for (const version of versions) {
    const ext = getCvFileExtension(version.mimeType as CvMimeType);
    const filePath = join(cvsDir, `${version.id}${ext}`);
    if (!existsSync(filePath)) {
      throw new Error(`Invalid backup: missing CV file ${basename(filePath)}`);
    }
  }
}

export function createRollingBackup(): string {
  const dest = getRollingBackupPath();
  copyLiveDataToDir(dest);
  return dest;
}

export function createSafetySnapshot(prefix: 'pre-seed-demo' | 'pre-restore'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = join(getBackupsDir(), `${prefix}-${timestamp}`);
  copyLiveDataToDir(dest);
  return dest;
}

export interface BackupEntry {
  name: string;
  path: string;
  kind: 'rolling' | 'safety';
  modifiedAt: string;
}

export function listBackups(): BackupEntry[] {
  const backupsDir = getBackupsDir();
  if (!existsSync(backupsDir)) return [];

  const entries: BackupEntry[] = [];
  for (const name of readdirSync(backupsDir)) {
    const path = join(backupsDir, name);
    if (!statSync(path).isDirectory()) continue;
    const kind: BackupEntry['kind'] =
      name === ROLLING_BACKUP_DIRNAME ? 'rolling' : name.startsWith('pre-') ? 'safety' : 'safety';
    entries.push({
      name,
      path,
      kind,
      modifiedAt: statSync(path).mtime.toISOString(),
    });
  }

  return entries.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

export function resolveBackupPath(name?: string): string {
  if (!name || name === 'latest' || name === ROLLING_BACKUP_DIRNAME) {
    return getRollingBackupPath();
  }
  const path = join(getBackupsDir(), name);
  if (!existsSync(path)) {
    throw new Error(`Backup not found: ${name}`);
  }
  return path;
}

export async function isBackendRunning(port = Number(process.env.PORT ?? 3001)): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function restoreBackup(
  backupDir: string,
  options: { createPreRestoreSnapshot?: boolean } = {},
): void {
  validateBackupDir(backupDir);

  if (options.createPreRestoreSnapshot !== false) {
    if (existsSync(getDataFilePath()) || existsSync(getCvMetadataFilePath())) {
      createSafetySnapshot('pre-restore');
    }
  }

  const dataDir = getDataDir();
  const cvsDir = getCvsDir();
  mkdirSync(dataDir, { recursive: true });

  cpSync(join(backupDir, 'applications.json'), getDataFilePath());
  cpSync(join(backupDir, 'cv-profiles.json'), getCvMetadataFilePath());

  if (existsSync(cvsDir)) {
    rmSync(cvsDir, { recursive: true, force: true });
  }
  mkdirSync(cvsDir, { recursive: true });

  const backupCvs = join(backupDir, 'cvs');
  if (existsSync(backupCvs)) {
    for (const file of readdirSync(backupCvs)) {
      cpSync(join(backupCvs, file), join(cvsDir, file));
    }
  }
}

/** Copies a backup folder tree (used when validating round-trip in tests). */
export function copyBackupTree(sourceDir: string, destDir: string): void {
  copyDataTree(sourceDir, destDir);
}
