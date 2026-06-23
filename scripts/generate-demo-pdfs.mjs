/**
 * Generates minimal text PDFs for backend/demo/cvs/ (John Doe resume v1/v2).
 * Run: node scripts/generate-demo-pdfs.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'backend', 'demo', 'cvs');

function escapePdfText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildTextPdf(lines) {
  const fontSize = 12;
  const lineHeight = 16;
  const streamParts = ['BT', `/F1 ${fontSize} Tf 72 740 Td`];
  let first = true;
  for (const line of lines) {
    if (!first) {
      streamParts.push(`0 -${lineHeight} Td`);
    }
    streamParts.push(`(${escapePdfText(line)}) Tj`);
    first = false;
  }
  streamParts.push('ET');
  const stream = streamParts.join('\n');
  const streamLen = Buffer.byteLength(stream, 'ascii');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];

  let body = '%PDF-1.4\n';
  const xrefOffsets = [0];
  for (const obj of objects) {
    xrefOffsets.push(Buffer.byteLength(body, 'ascii'));
    body += obj;
  }

  const xrefStart = Buffer.byteLength(body, 'ascii');
  body += `xref\n0 ${objects.length + 1}\n`;
  body += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    body += `${String(xrefOffsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  body += `startxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(body, 'ascii');
}

const v1Lines = [
  'John Doe',
  'Software Engineer',
  '',
  'Experience',
  'Acme Corp — Software Engineer (2020–2024)',
  'Built web applications with TypeScript and React.',
  '',
  'Skills',
  'TypeScript, React, Node.js',
];

const v2Lines = [
  'John Doe',
  'Senior Software Engineer',
  '',
  'Experience',
  'Acme Corp — Software Engineer (2020–2024)',
  'Beta Inc — Senior Engineer (2024–present)',
  'Led migration to PostgreSQL and improved API reliability.',
  '',
  'Skills',
  'TypeScript, React, Node.js, PostgreSQL',
];

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'demo-cv-v1.pdf'), buildTextPdf(v1Lines));
writeFileSync(join(outDir, 'demo-cv-v2.pdf'), buildTextPdf(v2Lines));
console.log('Wrote backend/demo/cvs/demo-cv-v1.pdf and demo-cv-v2.pdf');
