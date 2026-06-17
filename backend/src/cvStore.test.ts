import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  deleteCvMetadataFileIfExists,
  deleteCvsDirIfExists,
  getCvFilePath,
} from './cvPersistence.js';
import {
  createCvProfile,
  deleteCvVersion,
  getCurrentVersion,
  reloadCvStoreFromDisk,
  uploadCvVersion,
} from './cvStore.js';
import { deleteDataFileIfExists } from './persistence.js';
import { createApplication, getApplicationById, reloadStoreFromDisk } from './store.js';

const pdfBuffer = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(64, 0)]);

describe('cvStore', () => {
  let previousMeta: string | undefined;
  let previousCvsDir: string | undefined;
  let previousApps: string | undefined;
  let tempDir: string;

  beforeEach(() => {
    previousMeta = process.env.CV_METADATA_FILE;
    previousCvsDir = process.env.CVS_DATA_DIR;
    previousApps = process.env.APPLICATIONS_DATA_FILE;
    tempDir = mkdtempSync(join(tmpdir(), 'jat-cv-'));
    process.env.CV_METADATA_FILE = join(tempDir, 'cv-profiles.json');
    process.env.CVS_DATA_DIR = join(tempDir, 'cvs');
    process.env.APPLICATIONS_DATA_FILE = join(tempDir, 'applications.json');
    deleteCvMetadataFileIfExists();
    deleteCvsDirIfExists();
    deleteDataFileIfExists();
    reloadCvStoreFromDisk();
    reloadStoreFromDisk();
  });

  afterEach(() => {
    deleteCvMetadataFileIfExists();
    deleteCvsDirIfExists();
    deleteDataFileIfExists();
    for (const [key, value] of [
      ['CV_METADATA_FILE', previousMeta],
      ['CVS_DATA_DIR', previousCvsDir],
      ['APPLICATIONS_DATA_FILE', previousApps],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('creates profile with first version', () => {
    const result = createCvProfile('Python backend', pdfBuffer, 'cv.pdf');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.versionCount).toBe(1);
    expect(result.data.currentVersion.originalFilename).toBe('cv.pdf');
    expect(existsSync(getCvFilePath(result.data.currentVersion.id, 'application/pdf'))).toBe(true);
  });

  it('uploads second version and keeps both', () => {
    const created = createCvProfile('Python backend', pdfBuffer, 'v1.pdf');
    if (!created.ok) throw new Error('setup failed');
    const v1 = created.data.currentVersion.id;

    const uploaded = uploadCvVersion(created.data.id, pdfBuffer, 'v2.pdf');
    expect(uploaded.ok).toBe(true);
    if (!uploaded.ok) return;

    expect(uploaded.data.versionCount).toBe(2);
    expect(getCurrentVersion(created.data.id)?.id).not.toBe(v1);
    expect(existsSync(getCvFilePath(v1, 'application/pdf'))).toBe(true);
  });

  it('blocks delete when version is referenced', () => {
    const created = createCvProfile('Role fit', pdfBuffer, 'cv.pdf');
    if (!created.ok) throw new Error('setup failed');
    const versionId = created.data.currentVersion.id;

    createApplication(
      { company: 'Co', role: 'Eng' },
      { cvVersionId: versionId, cvSnapshotDescription: 'Role fit' },
    );

    const deleted = deleteCvVersion(versionId, 1);
    expect(deleted).toEqual({
      ok: false,
      error: 'Cannot delete: 1 application(s) reference this version',
      status: 409,
    });
  });

  it('allows delete when unreferenced', () => {
    const created = createCvProfile('Role fit', pdfBuffer, 'cv.pdf');
    if (!created.ok) throw new Error('setup failed');
    const versionId = created.data.currentVersion.id;

    const deleted = deleteCvVersion(versionId, 0);
    expect(deleted).toEqual({ ok: true });
    expect(existsSync(getCvFilePath(versionId, 'application/pdf'))).toBe(false);
  });

  it('keeps application snapshot after new version upload', () => {
    const created = createCvProfile('Role fit', pdfBuffer, 'v1.pdf');
    if (!created.ok) throw new Error('setup failed');
    const v1 = created.data.currentVersion.id;

    const app = createApplication(
      { company: 'Co', role: 'Eng' },
      { cvVersionId: v1, cvSnapshotDescription: 'Role fit' },
    );

    uploadCvVersion(created.data.id, pdfBuffer, 'v2.pdf');
    expect(getApplicationById(app.id)?.cvVersionId).toBe(v1);
  });
});
