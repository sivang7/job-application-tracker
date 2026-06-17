import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CvProfile, CvMimeType, CvVersion } from '@jat/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_METADATA_FILE = join(__dirname, '..', 'data', 'cv-profiles.json');
const DEFAULT_CVS_DIR = join(__dirname, '..', 'data', 'cvs');

export interface CvMetadata {
  profiles: CvProfile[];
  versions: CvVersion[];
}

export function getCvMetadataFilePath(): string {
  return process.env.CV_METADATA_FILE ?? DEFAULT_METADATA_FILE;
}

export function getCvsDir(): string {
  return process.env.CVS_DATA_DIR ?? DEFAULT_CVS_DIR;
}

function isValidCvProfile(value: unknown): value is CvProfile {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.description === 'string' &&
    typeof p.createdAt === 'string' &&
    typeof p.updatedAt === 'string'
  );
}

function isValidCvMimeType(value: unknown): value is CvMimeType {
  return (
    value === 'application/pdf' ||
    value === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

function isValidCvVersion(value: unknown): value is CvVersion {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.profileId === 'string' &&
    typeof v.originalFilename === 'string' &&
    isValidCvMimeType(v.mimeType) &&
    typeof v.uploadedAt === 'string'
  );
}

function parseMetadataFile(raw: string): CvMetadata {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in CV metadata file: ${getCvMetadataFilePath()}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`CV metadata file must contain a JSON object: ${getCvMetadataFilePath()}`);
  }

  const record = parsed as Record<string, unknown>;
  if (!Array.isArray(record.profiles) || !Array.isArray(record.versions)) {
    throw new Error(`CV metadata file must have profiles and versions arrays`);
  }

  for (const item of record.profiles) {
    if (!isValidCvProfile(item)) {
      throw new Error(`Invalid CV profile entry in metadata file`);
    }
  }

  for (const item of record.versions) {
    if (!isValidCvVersion(item)) {
      throw new Error(`Invalid CV version entry in metadata file`);
    }
  }

  return {
    profiles: record.profiles as CvProfile[],
    versions: record.versions as CvVersion[],
  };
}

export function loadCvMetadata(): CvMetadata {
  const filePath = getCvMetadataFilePath();
  const dir = dirname(filePath);

  if (!existsSync(filePath)) {
    mkdirSync(dir, { recursive: true });
    const empty: CvMetadata = { profiles: [], versions: [] };
    saveCvMetadata(empty);
    return empty;
  }

  const raw = readFileSync(filePath, 'utf8');
  return parseMetadataFile(raw);
}

export function saveCvMetadata(metadata: CvMetadata): void {
  const filePath = getCvMetadataFilePath();
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });

  const tempPath = `${filePath}.${process.pid}.tmp`;
  const content = JSON.stringify(metadata, null, 2);
  writeFileSync(tempPath, content, 'utf8');
  renameSync(tempPath, filePath);
}

export function getCvFileExtension(mimeType: CvMimeType): string {
  return mimeType === 'application/pdf' ? '.pdf' : '.docx';
}

export function getCvFilePath(versionId: string, mimeType: CvMimeType): string {
  return join(getCvsDir(), `${versionId}${getCvFileExtension(mimeType)}`);
}

export function saveCvFile(versionId: string, mimeType: CvMimeType, buffer: Buffer): void {
  const dir = getCvsDir();
  mkdirSync(dir, { recursive: true });
  const filePath = getCvFilePath(versionId, mimeType);
  const tempPath = `${filePath}.${process.pid}.tmp`;
  writeFileSync(tempPath, buffer);
  renameSync(tempPath, filePath);
}

export function deleteCvFile(versionId: string, mimeType: CvMimeType): void {
  const filePath = getCvFilePath(versionId, mimeType);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

export function deleteCvMetadataFileIfExists(): void {
  const filePath = getCvMetadataFilePath();
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

export function deleteCvsDirIfExists(): void {
  const dir = getCvsDir();
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}
