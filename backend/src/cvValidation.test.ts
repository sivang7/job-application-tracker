import { describe, expect, it } from 'vitest';
import { detectCvMimeType, validateCvDescription, validateCvFile } from './cvValidation.js';

const pdfBuffer = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(64, 0)]);
const docxBuffer = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(64, 0)]);

describe('validateCvDescription', () => {
  it('accepts non-empty trimmed description', () => {
    const result = validateCvDescription('  Backend roles  ');
    expect(result).toEqual({ ok: true, data: 'Backend roles' });
  });

  it('rejects empty description', () => {
    expect(validateCvDescription('   ')).toEqual({
      ok: false,
      error: 'description cannot be empty',
    });
  });
});

describe('validateCvFile', () => {
  it('accepts PDF with magic bytes', () => {
    const result = validateCvFile(pdfBuffer, 'resume.pdf');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mimeType).toBe('application/pdf');
    }
  });

  it('accepts DOCX with magic bytes', () => {
    const result = validateCvFile(docxBuffer, 'resume.docx');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    }
  });

  it('rejects mismatched extension and magic', () => {
    const result = validateCvFile(pdfBuffer, 'resume.docx');
    expect(result.ok).toBe(false);
  });

  it('rejects missing file', () => {
    expect(validateCvFile(undefined, 'resume.pdf')).toEqual({
      ok: false,
      error: 'file is required',
    });
  });
});

describe('detectCvMimeType', () => {
  it('detects pdf', () => {
    expect(detectCvMimeType(pdfBuffer, 'cv.pdf')).toBe('application/pdf');
  });
});
