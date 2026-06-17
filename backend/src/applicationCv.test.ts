import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  countCvProfileReferences,
  listApplicationsForCvProfile,
  listApplicationsForCvVersion,
  resolveCvLinkForCreate,
  resolveCvLinkForUpdate,
} from './applicationCv.js';
import { deleteCvMetadataFileIfExists, deleteCvsDirIfExists } from './cvPersistence.js';
import { deleteDataFileIfExists, getDataFilePath } from './persistence.js';
import { createCvProfile, reloadCvStoreFromDisk, uploadCvVersion } from './cvStore.js';
import { createApplication, reloadStoreFromDisk } from './store.js';

const pdfBuffer = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(64, 0)]);

describe('applicationCv linking', () => {
  let previousMeta: string | undefined;
  let previousCvsDir: string | undefined;
  let previousApps: string | undefined;

  beforeEach(() => {
    previousMeta = process.env.CV_METADATA_FILE;
    previousCvsDir = process.env.CVS_DATA_DIR;
    previousApps = process.env.APPLICATIONS_DATA_FILE;
    const tempDir = mkdtempSync(join(tmpdir(), 'jat-app-cv-'));
    process.env.CV_METADATA_FILE = join(tempDir, 'cv-profiles.json');
    process.env.CVS_DATA_DIR = join(tempDir, 'cvs');
    process.env.APPLICATIONS_DATA_FILE = join(tempDir, 'applications.json');
    deleteCvMetadataFileIfExists();
    deleteCvsDirIfExists();
    deleteDataFileIfExists();
    writeFileSync(getDataFilePath(), '[]');
    reloadCvStoreFromDisk();
    reloadStoreFromDisk();
  });

  afterEach(() => {
    deleteCvMetadataFileIfExists();
    deleteCvsDirIfExists();
    deleteDataFileIfExists();
    if (previousMeta === undefined) delete process.env.CV_METADATA_FILE;
    else process.env.CV_METADATA_FILE = previousMeta;
    if (previousCvsDir === undefined) delete process.env.CVS_DATA_DIR;
    else process.env.CVS_DATA_DIR = previousCvsDir;
    if (previousApps === undefined) delete process.env.APPLICATIONS_DATA_FILE;
    else process.env.APPLICATIONS_DATA_FILE = previousApps;
  });

  it('resolves cvProfileId to current version on create', () => {
    const profile = createCvProfile('Backend CV', pdfBuffer, 'cv.pdf');
    if (!profile.ok) throw new Error('setup failed');

    const result = resolveCvLinkForCreate({
      company: 'Co',
      role: 'Eng',
      cvProfileId: profile.data.id,
    });
    expect(result.ok).toBe(true);
    if (!result.ok || !result.cvLink) throw new Error('expected link');
    expect(result.cvLink.cvVersionId).toBe(profile.data.currentVersion.id);
    expect(result.cvLink.cvSnapshotDescription).toBe('Backend CV');
  });

  it('clears link when cvProfileId is null on update', () => {
    const result = resolveCvLinkForUpdate({ cvProfileId: null });
    expect(result).toEqual({ ok: true, clear: true });
  });

  it('counts applications across all versions of a profile', () => {
    const profile = createCvProfile('Role fit', pdfBuffer, 'v1.pdf');
    if (!profile.ok) throw new Error('setup failed');
    const v1 = profile.data.currentVersion.id;

    createApplication(
      { company: 'Co A', role: 'Eng' },
      { cvVersionId: v1, cvSnapshotDescription: 'Role fit' },
    );

    const uploaded = uploadCvVersion(profile.data.id, pdfBuffer, 'v2.pdf');
    if (!uploaded.ok) throw new Error('upload failed');
    const v2 = uploaded.data.currentVersion.id;

    createApplication(
      { company: 'Co B', role: 'Eng' },
      { cvVersionId: v2, cvSnapshotDescription: 'Role fit' },
    );

    expect(countCvProfileReferences(profile.data.id)).toBe(2);
  });

  it('lists applications for a profile across versions', () => {
    const profile = createCvProfile('Role fit', pdfBuffer, 'v1.pdf');
    if (!profile.ok) throw new Error('setup failed');
    const v1 = profile.data.currentVersion.id;

    createApplication(
      { company: 'Zebra Co', role: 'Designer', status: 'applied' },
      { cvVersionId: v1, cvSnapshotDescription: 'Role fit' },
    );

    const uploaded = uploadCvVersion(profile.data.id, pdfBuffer, 'v2.pdf');
    if (!uploaded.ok) throw new Error('upload failed');
    const v2 = uploaded.data.currentVersion.id;

    createApplication(
      { company: 'Acme Corp', role: 'Engineer', status: 'interviewing' },
      { cvVersionId: v2, cvSnapshotDescription: 'Role fit' },
    );

    const profileApps = listApplicationsForCvProfile(profile.data.id);
    expect(profileApps).toHaveLength(2);
    expect(profileApps?.[0]).toEqual({
      id: expect.any(String),
      company: 'Acme Corp',
      role: 'Engineer',
      status: 'interviewing',
    });

    const versionApps = listApplicationsForCvVersion(v1);
    expect(versionApps).toHaveLength(1);
    expect(versionApps?.[0]?.company).toBe('Zebra Co');
  });

  it('returns null when listing applications for missing profile or version', () => {
    expect(listApplicationsForCvProfile('missing')).toBeNull();
    expect(listApplicationsForCvVersion('missing')).toBeNull();
  });
});