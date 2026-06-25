import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Application } from '@jat/shared';
import * as XLSX from 'xlsx';
import {
  EXPORT_COLUMNS,
  applicationToRow,
  formatContacts,
  writeApplicationsExcel,
} from './applicationsExport.js';

describe('applicationsExport', () => {
  let tempRoot: string;
  let previousExportsDir: string | undefined;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'jat-export-'));
    previousExportsDir = process.env.EXPORTS_DIR;
    process.env.EXPORTS_DIR = join(tempRoot, 'exports');
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
    if (previousExportsDir === undefined) delete process.env.EXPORTS_DIR;
    else process.env.EXPORTS_DIR = previousExportsDir;
  });

  const sampleApp: Application = {
    id: 'a1',
    company: 'Acme',
    role: 'Engineer',
    status: 'applied',
    appliedDate: '2026-05-01',
    jobSource: 'LinkedIn',
    cvSnapshotDescription: 'Backend CV',
    contacts: [
      { name: 'Jane Doe', role: 'Recruiter', email: 'jane@acme.com' },
      { name: 'Bob Smith', phone: '555-0100' },
    ],
  };

  it('formats contacts for a single cell', () => {
    expect(formatContacts(sampleApp.contacts)).toBe(
      'Jane Doe (Recruiter) jane@acme.com; Bob Smith 555-0100',
    );
  });

  it('maps application fields to export columns', () => {
    const row = applicationToRow(sampleApp);
    expect(Object.keys(row)).toEqual([...EXPORT_COLUMNS]);
    expect(row.Company).toBe('Acme');
    expect(row.Status).toBe('applied');
    expect(row['CV Snapshot']).toBe('Backend CV');
    expect(row.Contacts).toContain('Jane Doe');
  });

  it('writes an xlsx file with one row per application', () => {
    const outputPath = writeApplicationsExcel([sampleApp], join(tempRoot, 'out.xlsx'));
    const workbook = XLSX.read(readFileSync(outputPath), { type: 'buffer' });
    const sheet = workbook.Sheets.Applications;
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.Company).toBe('Acme');
    expect(rows[0]?.Contacts).toContain('Jane Doe');
  });
});
