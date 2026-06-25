import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Application, Contact } from '@jat/shared';
import * as XLSX from 'xlsx';
import { getDataDir } from './backup.js';

export const EXPORT_COLUMNS = [
  'Company',
  'Role',
  'Status',
  'Applied Date',
  'Last Contact',
  'Job Source',
  'Link',
  'Description',
  'Notes',
  'CV Snapshot',
  'Contacts',
] as const;

function formatContact(contact: Contact): string {
  const parts = [contact.name];
  if (contact.role?.trim()) parts.push(`(${contact.role.trim()})`);
  if (contact.email?.trim()) parts.push(contact.email.trim());
  if (contact.phone?.trim()) parts.push(contact.phone.trim());
  return parts.join(' ');
}

export function formatContacts(contacts: Contact[] | undefined): string {
  if (!contacts?.length) return '';
  return contacts.map(formatContact).join('; ');
}

export function applicationToRow(app: Application): Record<(typeof EXPORT_COLUMNS)[number], string> {
  return {
    Company: app.company,
    Role: app.role,
    Status: app.status,
    'Applied Date': app.appliedDate ?? '',
    'Last Contact': app.lastContactDate ?? '',
    'Job Source': app.jobSource ?? '',
    Link: app.link ?? '',
    Description: app.description ?? '',
    Notes: app.notes ?? '',
    'CV Snapshot': app.cvSnapshotDescription ?? '',
    Contacts: formatContacts(app.contacts),
  };
}

export function applicationsToRows(
  applications: Application[],
): Record<(typeof EXPORT_COLUMNS)[number], string>[] {
  return applications.map(applicationToRow);
}

export function getDefaultExportPath(): string {
  const exportsDir = process.env.EXPORTS_DIR ?? join(getDataDir(), 'exports');
  const date = new Date().toISOString().slice(0, 10);
  return join(exportsDir, `applications-${date}.xlsx`);
}

export function writeApplicationsExcel(
  applications: Application[],
  outputPath = getDefaultExportPath(),
): string {
  const rows = applicationsToRows(applications);
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...EXPORT_COLUMNS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

  mkdirSync(dirname(outputPath), { recursive: true });
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  writeFileSync(outputPath, buffer);
  return outputPath;
}
