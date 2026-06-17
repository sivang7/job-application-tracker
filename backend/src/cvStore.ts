import { randomUUID } from 'node:crypto';
import type {
  ApplicationCvSnapshot,
  CvProfile,
  CvProfileSummary,
  CvVersion,
} from '@jat/shared';
import {
  deleteCvFile,
  loadCvMetadata,
  saveCvFile,
  saveCvMetadata,
  type CvMetadata,
} from './cvPersistence.js';
import { validateCvDescription, validateCvFile } from './cvValidation.js';

let metadata: CvMetadata = loadCvMetadata();

export function reloadCvStoreFromDisk(): void {
  metadata = loadCvMetadata();
}

export function getCvProfiles(): readonly CvProfile[] {
  return metadata.profiles;
}

export function getCvVersions(): readonly CvVersion[] {
  return metadata.versions;
}

export function getCvProfileById(id: string): CvProfile | undefined {
  return metadata.profiles.find((p) => p.id === id);
}

export function getCvVersionById(id: string): CvVersion | undefined {
  return metadata.versions.find((v) => v.id === id);
}

export function getVersionsForProfile(profileId: string): CvVersion[] {
  return metadata.versions
    .filter((v) => v.profileId === profileId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function getCurrentVersion(profileId: string): CvVersion | undefined {
  const versions = getVersionsForProfile(profileId);
  return versions[0];
}

function toProfileSummary(profile: CvProfile): CvProfileSummary | null {
  const currentVersion = getCurrentVersion(profile.id);
  if (!currentVersion) return null;
  const versionCount = metadata.versions.filter((v) => v.profileId === profile.id).length;
  return { ...profile, currentVersion, versionCount };
}

export function listCvProfileSummaries(): CvProfileSummary[] {
  return metadata.profiles
    .map(toProfileSummary)
    .filter((s): s is CvProfileSummary => s !== null);
}

export function buildApplicationCvSnapshot(
  cvVersionId: string | undefined,
  cvSnapshotDescription: string | undefined,
): ApplicationCvSnapshot | undefined {
  if (!cvVersionId) return undefined;
  const version = getCvVersionById(cvVersionId);
  if (!version) return undefined;
  const profile = getCvProfileById(version.profileId);
  return {
    versionId: version.id,
    profileId: version.profileId,
    description: cvSnapshotDescription ?? profile?.description ?? 'CV',
    originalFilename: version.originalFilename,
    uploadedAt: version.uploadedAt,
  };
}

type CreateProfileResult =
  | { ok: true; data: CvProfileSummary }
  | { ok: false; error: string; status: number };

export function createCvProfile(
  description: string,
  fileBuffer: Buffer,
  originalFilename: string,
): CreateProfileResult {
  const descResult = validateCvDescription(description);
  if (!descResult.ok) return { ok: false, error: descResult.error, status: 400 };

  const fileResult = validateCvFile(fileBuffer, originalFilename);
  if (!fileResult.ok) return { ok: false, error: fileResult.error, status: 400 };

  const now = new Date().toISOString();
  const profileId = randomUUID();
  const versionId = randomUUID();
  const profile: CvProfile = {
    id: profileId,
    description: descResult.data,
    createdAt: now,
    updatedAt: now,
  };
  const version: CvVersion = {
    id: versionId,
    profileId,
    originalFilename: fileResult.data.originalFilename,
    mimeType: fileResult.data.mimeType,
    uploadedAt: now,
  };

  saveCvFile(versionId, fileResult.data.mimeType, fileResult.data.buffer);
  metadata = {
    profiles: [...metadata.profiles, profile],
    versions: [...metadata.versions, version],
  };
  saveCvMetadata(metadata);

  const summary = toProfileSummary(profile);
  if (!summary) return { ok: false, error: 'Failed to create profile', status: 500 };
  return { ok: true, data: summary };
}

type UpdateDescriptionResult =
  | { ok: true; data: CvProfileSummary }
  | { ok: false; error: string; status: number };

export function updateCvProfileDescription(
  profileId: string,
  description: string,
): UpdateDescriptionResult {
  const profile = getCvProfileById(profileId);
  if (!profile) return { ok: false, error: 'CV profile not found', status: 404 };

  const descResult = validateCvDescription(description);
  if (!descResult.ok) return { ok: false, error: descResult.error, status: 400 };

  const updated: CvProfile = {
    ...profile,
    description: descResult.data,
    updatedAt: new Date().toISOString(),
  };
  metadata = {
    profiles: metadata.profiles.map((p) => (p.id === profileId ? updated : p)),
    versions: metadata.versions,
  };
  saveCvMetadata(metadata);

  const summary = toProfileSummary(updated);
  if (!summary) return { ok: false, error: 'Profile has no versions', status: 409 };
  return { ok: true, data: summary };
}

type UploadVersionResult =
  | { ok: true; data: CvProfileSummary }
  | { ok: false; error: string; status: number };

export function uploadCvVersion(
  profileId: string,
  fileBuffer: Buffer,
  originalFilename: string,
): UploadVersionResult {
  const profile = getCvProfileById(profileId);
  if (!profile) return { ok: false, error: 'CV profile not found', status: 404 };

  const fileResult = validateCvFile(fileBuffer, originalFilename);
  if (!fileResult.ok) return { ok: false, error: fileResult.error, status: 400 };

  const now = new Date().toISOString();
  const versionId = randomUUID();
  const version: CvVersion = {
    id: versionId,
    profileId,
    originalFilename: fileResult.data.originalFilename,
    mimeType: fileResult.data.mimeType,
    uploadedAt: now,
  };

  saveCvFile(versionId, fileResult.data.mimeType, fileResult.data.buffer);
  const updatedProfile: CvProfile = { ...profile, updatedAt: now };
  metadata = {
    profiles: metadata.profiles.map((p) => (p.id === profileId ? updatedProfile : p)),
    versions: [...metadata.versions, version],
  };
  saveCvMetadata(metadata);

  const summary = toProfileSummary(updatedProfile);
  if (!summary) return { ok: false, error: 'Failed to upload version', status: 500 };
  return { ok: true, data: summary };
}

type DeleteVersionResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export function deleteCvVersion(versionId: string, referenceCount: number): DeleteVersionResult {
  const version = getCvVersionById(versionId);
  if (!version) return { ok: false, error: 'CV version not found', status: 404 };
  if (referenceCount > 0) {
    return {
      ok: false,
      error: `Cannot delete: ${referenceCount} application(s) reference this version`,
      status: 409,
    };
  }

  deleteCvFile(versionId, version.mimeType);
  metadata = {
    profiles: metadata.profiles,
    versions: metadata.versions.filter((v) => v.id !== versionId),
  };
  saveCvMetadata(metadata);
  return { ok: true };
}

export function resolveCvProfileLink(profileId: string):
  | { ok: true; versionId: string; snapshotDescription: string }
  | { ok: false; error: string; status: number } {
  const profile = getCvProfileById(profileId);
  if (!profile) return { ok: false, error: 'CV profile not found', status: 404 };
  const current = getCurrentVersion(profileId);
  if (!current) return { ok: false, error: 'CV profile has no versions', status: 409 };
  return {
    ok: true,
    versionId: current.id,
    snapshotDescription: profile.description,
  };
}
