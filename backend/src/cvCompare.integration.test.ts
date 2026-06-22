import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { compareCvVersions } from './cvCompare.js';
import { reloadCvStoreFromDisk } from './cvStore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localMetadataPath = join(__dirname, '..', 'data', 'cv-profiles.json');
const localCvsDir = join(__dirname, '..', 'data', 'cvs');

function hasLocalCvFixtures(): boolean {
  if (!existsSync(localMetadataPath) || !existsSync(localCvsDir)) return false;
  const metadata = JSON.parse(readFileSync(localMetadataPath, 'utf8')) as {
    versions: Array<{ id: string; mimeType: string }>;
  };
  return metadata.versions.some(
    (v) =>
      v.mimeType === 'application/pdf' && existsSync(join(localCvsDir, `${v.id}.pdf`)),
  );
}

describe('compareCvVersions integration — local CV files', () => {
  let previousMeta: string | undefined;
  let previousCvsDir: string | undefined;

  beforeEach(() => {
    previousMeta = process.env.CV_METADATA_FILE;
    previousCvsDir = process.env.CVS_DATA_DIR;
    process.env.CV_METADATA_FILE = localMetadataPath;
    process.env.CVS_DATA_DIR = localCvsDir;
    reloadCvStoreFromDisk();
  });

  afterEach(() => {
    if (previousMeta === undefined) delete process.env.CV_METADATA_FILE;
    else process.env.CV_METADATA_FILE = previousMeta;
    if (previousCvsDir === undefined) delete process.env.CVS_DATA_DIR;
    else process.env.CVS_DATA_DIR = previousCvsDir;
    reloadCvStoreFromDisk();
  });

  it.skipIf(!hasLocalCvFixtures())(
    'compares oldest and newest real Sivan CV PDF versions end-to-end',
    async () => {
      const metadata = JSON.parse(readFileSync(localMetadataPath, 'utf8')) as {
        versions: Array<{ id: string; uploadedAt: string }>;
      };
      const pdfVersions = metadata.versions
        .filter((v) => existsSync(join(localCvsDir, `${v.id}.pdf`)))
        .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));

      expect(pdfVersions.length).toBeGreaterThanOrEqual(2);

      const older = pdfVersions[0].id;
      const newer = pdfVersions[pdfVersions.length - 1].id;

      const result = await compareCvVersions(older, newer);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.fromText.length).toBeGreaterThan(50);
      expect(result.data.toText.length).toBeGreaterThan(50);
      expect(result.data.fromText).toMatch(/Sivan/i);
      expect(result.data.toText).toMatch(/Sivan/i);
      expect(result.data.from.version.id).toBe(older);
      expect(result.data.to.version.id).toBe(newer);
    },
  );
});
