import type {
  Application,
  ApplicationWithCv,
  CreateApplicationInput,
  CvLinkedApplication,
  UpdateApplicationInput,
} from '@jat/shared';
import { buildApplicationCvSnapshot, getCvProfileById, getCvVersionById, getVersionsForProfile, resolveCvProfileLink } from './cvStore.js';
import { getApplications } from './store.js';
export type CvLinkResolution =
  | { ok: true; cvLink?: { cvVersionId: string; cvSnapshotDescription: string }; clear?: boolean }
  | { ok: false; error: string; status: number };

export function resolveCvLinkForCreate(
  input: CreateApplicationInput,
): CvLinkResolution {
  if (!input.cvProfileId) return { ok: true };
  const resolved = resolveCvProfileLink(input.cvProfileId);
  if (!resolved.ok) return resolved;
  return {
    ok: true,
    cvLink: {
      cvVersionId: resolved.versionId,
      cvSnapshotDescription: resolved.snapshotDescription,
    },
  };
}

export function resolveCvLinkForUpdate(
  input: UpdateApplicationInput,
): CvLinkResolution {
  if (!('cvProfileId' in input)) return { ok: true };
  if (input.cvProfileId === null) return { ok: true, clear: true };
  const resolved = resolveCvProfileLink(input.cvProfileId!);
  if (!resolved.ok) return resolved;
  return {
    ok: true,
    cvLink: {
      cvVersionId: resolved.versionId,
      cvSnapshotDescription: resolved.snapshotDescription,
    },
  };
}

export function stripCvProfileId<T extends CreateApplicationInput | UpdateApplicationInput>(
  input: T,
): Omit<T, 'cvProfileId'> {
  const { cvProfileId: _cv, ...rest } = input;
  return rest;
}

export function enrichApplication(app: Application): ApplicationWithCv {
  const cv = buildApplicationCvSnapshot(app.cvVersionId, app.cvSnapshotDescription);
  if (!cv) return app;
  return { ...app, cv };
}

export function enrichApplications(apps: readonly Application[]): ApplicationWithCv[] {
  return apps.map(enrichApplication);
}

export function countCvVersionReferences(versionId: string): number {
  return getApplications().filter((app) => app.cvVersionId === versionId).length;
}

export function countCvProfileReferences(profileId: string): number {
  const versionIds = new Set(getVersionsForProfile(profileId).map((v) => v.id));
  return getApplications().filter(
    (app) => app.cvVersionId !== undefined && versionIds.has(app.cvVersionId),
  ).length;
}

function toCvLinkedApplication(app: Application): CvLinkedApplication {
  return {
    id: app.id,
    company: app.company,
    role: app.role,
    status: app.status,
  };
}

function sortLinkedApplications(apps: CvLinkedApplication[]): CvLinkedApplication[] {
  return [...apps].sort((a, b) => {
    const byCompany = a.company.localeCompare(b.company);
    if (byCompany !== 0) return byCompany;
    return a.role.localeCompare(b.role);
  });
}

export function listApplicationsForCvVersion(versionId: string): CvLinkedApplication[] | null {
  if (!getCvVersionById(versionId)) return null;
  const apps = getApplications()
    .filter((app) => app.cvVersionId === versionId)
    .map(toCvLinkedApplication);
  return sortLinkedApplications(apps);
}

export function listApplicationsForCvProfile(profileId: string): CvLinkedApplication[] | null {
  if (!getCvProfileById(profileId)) return null;
  const versionIds = new Set(getVersionsForProfile(profileId).map((v) => v.id));
  const apps = getApplications()
    .filter((app) => app.cvVersionId !== undefined && versionIds.has(app.cvVersionId))
    .map(toCvLinkedApplication);
  return sortLinkedApplications(apps);
}