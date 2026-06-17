import type { CvMimeType } from '@jat/shared';

export const MAX_CV_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_CV_DESCRIPTION_LENGTH = 5000;

const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
const DOCX_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK..

type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function validateCvDescription(value: unknown): ValidationResult<string> {
  if (typeof value !== 'string') {
    return { ok: false, error: 'description is required' };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: 'description cannot be empty' };
  }
  if (trimmed.length > MAX_CV_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      error: `description must be at most ${MAX_CV_DESCRIPTION_LENGTH} characters`,
    };
  }
  return { ok: true, data: trimmed };
}

function bufferStartsWith(buffer: Buffer, prefix: Buffer): boolean {
  if (buffer.length < prefix.length) return false;
  return buffer.subarray(0, prefix.length).equals(prefix);
}

export function detectCvMimeType(buffer: Buffer, originalFilename: string): CvMimeType | null {
  const lower = originalFilename.toLowerCase();
  if (bufferStartsWith(buffer, PDF_MAGIC) && lower.endsWith('.pdf')) {
    return 'application/pdf';
  }
  if (bufferStartsWith(buffer, DOCX_MAGIC) && lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return null;
}

export function validateCvFile(
  buffer: Buffer | undefined,
  originalFilename: string | undefined,
): ValidationResult<{ buffer: Buffer; mimeType: CvMimeType; originalFilename: string }> {
  if (!buffer || buffer.length === 0) {
    return { ok: false, error: 'file is required' };
  }
  if (buffer.length > MAX_CV_FILE_SIZE) {
    return { ok: false, error: `file must be at most ${MAX_CV_FILE_SIZE / (1024 * 1024)} MB` };
  }
  if (!originalFilename || typeof originalFilename !== 'string') {
    return { ok: false, error: 'file must have a filename' };
  }

  const mimeType = detectCvMimeType(buffer, originalFilename);
  if (!mimeType) {
    return { ok: false, error: 'file must be a PDF or DOCX document' };
  }

  return { ok: true, data: { buffer, mimeType, originalFilename } };
}
