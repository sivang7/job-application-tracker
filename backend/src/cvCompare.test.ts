import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteCvMetadataFileIfExists, deleteCvsDirIfExists } from './cvPersistence.js';
import { compareCvVersions } from './cvCompare.js';
import { createCvProfile, reloadCvStoreFromDisk, uploadCvVersion } from './cvStore.js';

vi.mock('./cvTextExtraction.js', () => ({
  extractCvText: vi.fn(async () => 'extracted text'),
}));

import { extractCvText } from './cvTextExtraction.js';

const pdfBuffer = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(64, 0)]);

describe('compareCvVersions', () => {
  let previousMeta: string | undefined;
  let previousCvsDir: string | undefined;
  let tempDir: string;

  beforeEach(() => {
    previousMeta = process.env.CV_METADATA_FILE;
    previousCvsDir = process.env.CVS_DATA_DIR;
    tempDir = mkdtempSync(join(tmpdir(), 'jat-cv-compare-'));
    process.env.CV_METADATA_FILE = join(tempDir, 'cv-profiles.json');
    process.env.CVS_DATA_DIR = join(tempDir, 'cvs');
    deleteCvMetadataFileIfExists();
    deleteCvsDirIfExists();
    reloadCvStoreFromDisk();
    vi.mocked(extractCvText).mockReset();
    vi.mocked(extractCvText).mockResolvedValue('extracted text');
  });

  afterEach(() => {
    deleteCvMetadataFileIfExists();
    deleteCvsDirIfExists();
    for (const [key, value] of [
      ['CV_METADATA_FILE', previousMeta],
      ['CVS_DATA_DIR', previousCvsDir],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('rejects missing or identical version ids', async () => {
    expect((await compareCvVersions('', 'x')).ok).toBe(false);
    expect((await compareCvVersions('a', '')).ok).toBe(false);
    const same = await compareCvVersions('same', 'same');
    expect(same.ok).toBe(false);
    if (!same.ok) expect(same.status).toBe(400);
  });

  it('returns 404 for unknown version', async () => {
    const result = await compareCvVersions('missing-a', 'missing-b');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it('compares versions across different profiles', async () => {
    const profileA = createCvProfile('Backend role', pdfBuffer, 'a.pdf');
    const profileB = createCvProfile('Frontend role', pdfBuffer, 'b.pdf');
    if (!profileA.ok || !profileB.ok) throw new Error('setup failed');

    vi.mocked(extractCvText)
      .mockResolvedValueOnce('backend cv text')
      .mockResolvedValueOnce('frontend cv text');

    const result = await compareCvVersions(
      profileA.data.currentVersion.id,
      profileB.data.currentVersion.id,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.from.profileDescription).toBe('Backend role');
    expect(result.data.to.profileDescription).toBe('Frontend role');
    expect(result.data.fromText).toBe('backend cv text');
    expect(result.data.toText).toBe('frontend cv text');
  });

  it('orders sides by uploadedAt regardless of query order', async () => {
    const created = createCvProfile('One profile', pdfBuffer, 'v1.pdf');
    if (!created.ok) throw new Error('setup failed');

    const v1Id = created.data.currentVersion.id;
    await new Promise((r) => setTimeout(r, 5));
    const uploaded = uploadCvVersion(created.data.id, pdfBuffer, 'v2.pdf');
    if (!uploaded.ok) throw new Error('upload failed');

    const v2Id = uploaded.data.currentVersion.id;

    const result = await compareCvVersions(v2Id, v1Id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.from.version.id).toBe(v1Id);
    expect(result.data.to.version.id).toBe(v2Id);
  });

  it('returns 422 when both extractions are empty', async () => {
    const a = createCvProfile('A', pdfBuffer, 'a.pdf');
    const b = createCvProfile('B', pdfBuffer, 'b.pdf');
    if (!a.ok || !b.ok) throw new Error('setup failed');

    vi.mocked(extractCvText).mockResolvedValue('');

    const result = await compareCvVersions(a.data.currentVersion.id, b.data.currentVersion.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(422);
  });
});
