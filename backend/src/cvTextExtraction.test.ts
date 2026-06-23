import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { extractCvText, normalizeCvText } from './cvTextExtraction.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const demoDir = join(__dirname, '..', 'demo');
const demoCvsDir = join(demoDir, 'cvs');
const demoMetadataPath = join(demoDir, 'cv-profiles.json');

interface DemoCvVersion {
  id: string;
  originalFilename: string;
  mimeType: 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}

function loadDemoPdfVersions(): DemoCvVersion[] {
  if (!existsSync(demoMetadataPath) || !existsSync(demoCvsDir)) return [];

  const metadata = JSON.parse(readFileSync(demoMetadataPath, 'utf8')) as {
    versions: DemoCvVersion[];
  };

  return metadata.versions.filter((v) => {
    if (v.mimeType !== 'application/pdf') return false;
    return existsSync(join(demoCvsDir, `${v.id}.pdf`));
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

describe('extractCvText — demo CV fixtures', () => {
  const demoPdfs = loadDemoPdfVersions();

  it('extracts non-empty text from each demo PDF', async () => {
    expect(demoPdfs.length).toBeGreaterThanOrEqual(2);
    for (const version of demoPdfs) {
      const buffer = readFileSync(join(demoCvsDir, `${version.id}.pdf`));
      const text = await extractCvText(buffer, version.mimeType);
      expect(text.length, version.originalFilename).toBeGreaterThan(20);
    }
  });

  it('extracts John Doe content from demo PDFs for compare', async () => {
    expect(demoPdfs.length).toBeGreaterThanOrEqual(2);
    const [first, second] = demoPdfs;
    const textA = await extractCvText(
      readFileSync(join(demoCvsDir, `${first.id}.pdf`)),
      first.mimeType,
    );
    const textB = await extractCvText(
      readFileSync(join(demoCvsDir, `${second.id}.pdf`)),
      second.mimeType,
    );

    expect(textA).toMatch(/John Doe/i);
    expect(textB).toMatch(/John Doe/i);
    expect(textB).toMatch(/Senior Software Engineer/i);
    expect(textB).toMatch(/PostgreSQL/i);
  });
});
