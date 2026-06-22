import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import type { CvMimeType } from '@jat/shared';

export function normalizeCvText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function extractCvText(buffer: Buffer, mimeType: CvMimeType): Promise<string> {
  let raw: string;

  if (mimeType === 'application/pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      raw = result.text ?? '';
    } finally {
      await parser.destroy();
    }
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    raw = result.value ?? '';
  } else {
    throw new Error('Unsupported CV file type');
  }

  return normalizeCvText(raw);
}
