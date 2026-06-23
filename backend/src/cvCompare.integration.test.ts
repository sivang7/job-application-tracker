import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { compareCvVersions } from './cvCompare.js';
import { reloadCvStoreFromDisk } from './cvStore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const demoMetadataPath = join(__dirname, '..', 'demo', 'cv-profiles.json');
const demoCvsDir = join(__dirname, '..', 'demo', 'cvs');

function hasDemoCvFixtures(): boolean {
  if (!existsSync(demoMetadataPath) || !existsSync(demoCvsDir)) return false;
  const metadata = JSON.parse(readFileSync(demoMetadataPath, 'utf8')) as {
    versions: Array<{ id: string; mimeType: string }>;
  };
  return metadata.versions.some(
    (v) =>
      v.mimeType === 'application/pdf' && existsSync(join(demoCvsDir, `${v.id}.pdf`)),
  );
}

describe('compareCvVersions integration — demo CV fixtures', () => {
  let previousMeta: string | undefined;
  let previousCvsDir: string | undefined;

  beforeEach(() => {
    previousMeta = process.env.CV_METADATA_FILE;
    previousCvsDir = process.env.CVS_DATA_DIR;
    process.env.CV_METADATA_FILE = demoMetadataPath;
    process.env.CVS_DATA_DIR = demoCvsDir;
    reloadCvStoreFromDisk();
  });

  afterEach(() => {
    if (previousMeta === undefined) delete process.env.CV_METADATA_FILE;
    else process.env.CV_METADATA_FILE = previousMeta;
    if (previousCvsDir === undefined) delete process.env.CVS_DATA_DIR;
    else process.env.CVS_DATA_DIR = previousCvsDir;
    reloadCvStoreFromDisk();
  });

  it.skipIf(!hasDemoCvFixtures())(
    'compares John Doe demo CV versions end-to-end',
    async () => {
      const metadata = JSON.parse(readFileSync(demoMetadataPath, 'utf8')) as {
        versions: Array<{ id: string; uploadedAt: string }>;
      };
      const pdfVersions = metadata.versions
        .filter((v) => existsSync(join(demoCvsDir, `${v.id}.pdf`)))
        .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));

      expect(pdfVersions.length).toBeGreaterThanOrEqual(2);

      const older = pdfVersions[0].id;
      const newer = pdfVersions[pdfVersions.length - 1].id;

      const result = await compareCvVersions(older, newer);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.fromText.length).toBeGreaterThan(20);
      expect(result.data.toText.length).toBeGreaterThan(20);
      expect(result.data.fromText).toMatch(/John Doe/i);
      expect(result.data.toText).toMatch(/John Doe/i);
      expect(result.data.from.version.id).toBe(older);
      expect(result.data.to.version.id).toBe(newer);
    },
  );
});
