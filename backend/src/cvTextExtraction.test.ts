import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { extractCvText, normalizeCvText } from './cvTextExtraction.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const cvsDir = join(dataDir, 'cvs');
const metadataPath = join(dataDir, 'cv-profiles.json');

interface LocalCvVersion {
  id: string;
  originalFilename: string;
  mimeType: 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}

function loadLocalPdfVersions(): LocalCvVersion[] {
  if (!existsSync(metadataPath) || !existsSync(cvsDir)) return [];

  const metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as {
    versions: LocalCvVersion[];
  };

  return metadata.versions.filter((v) => {
    if (v.mimeType !== 'application/pdf') return false;
    return existsSync(join(cvsDir, `${v.id}.pdf`));
  });
}

describe('normalizeCvText', () => {
  it('trims and collapses excessive blank lines', () => {
    expect(normalizeCvText('  hello \n\n\n\nworld  ')).toBe('hello\n\nworld');
  });

  it('normalizes line endings', () => {
    expect(normalizeCvText('a\r\nb\rc')).toBe('a\nb\nc');
  });

  it('strips trailing spaces before newlines', () => {
    expect(normalizeCvText('line one   \nline two')).toBe('line one\nline two');
  });
});

describe('extractCvText — local CV files', () => {
  const localPdfs = loadLocalPdfVersions();

  it.skipIf(localPdfs.length === 0)(
    'extracts non-empty text from each local PDF on disk',
    async () => {
      for (const version of localPdfs) {
        const buffer = readFileSync(join(cvsDir, `${version.id}.pdf`));
        const text = await extractCvText(buffer, version.mimeType);
        expect(text.length, version.originalFilename).toBeGreaterThan(50);
      }
    },
  );

  it.skipIf(localPdfs.length < 2)(
    'extracts recognizable content from Sivan CV PDFs for compare',
    async () => {
      const [first, second] = localPdfs;
      const textA = await extractCvText(
        readFileSync(join(cvsDir, `${first.id}.pdf`)),
        first.mimeType,
      );
      const textB = await extractCvText(
        readFileSync(join(cvsDir, `${second.id}.pdf`)),
        second.mimeType,
      );

      expect(textA).toMatch(/Sivan/i);
      expect(textB).toMatch(/Sivan/i);
      expect(textA).toMatch(/Zohar/i);
      expect(textB).toMatch(/Zohar/i);
    },
  );
});
