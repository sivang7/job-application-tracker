import type {
  ApplicationWithCv,
  ApiErrorBody,
  CreateApplicationInput,
  CvProfileSummary,
  CvLinkedApplication,
  CvVersion,
  CvVersionCompareResult,
  CvVersionWithRefs,
  FollowUpRemindersResponse,
  UpdateApplicationInput,
} from '@jat/shared';

const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }
  return res.json() as Promise<T>;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchApplications(): Promise<ApplicationWithCv[]> {
  const res = await fetch(`${BASE_URL}/applications`);
  return handleJson<ApplicationWithCv[]>(res);
}

export async function fetchFollowUps(): Promise<FollowUpRemindersResponse> {
  const res = await fetch(`${BASE_URL}/applications/follow-ups`);
  return handleJson<FollowUpRemindersResponse>(res);
}

export async function createApplication(
  input: CreateApplicationInput,
): Promise<ApplicationWithCv> {
  const res = await fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleJson<ApplicationWithCv>(res);
}

export async function updateApplication(
  id: string,
  input: UpdateApplicationInput,
): Promise<ApplicationWithCv> {
  const res = await fetch(`${BASE_URL}/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleJson<ApplicationWithCv>(res);
}

export async function deleteApplication(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/applications/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }
}

export function cvFileUrl(versionId: string, options?: { download?: boolean }): string {
  const base = `${BASE_URL}/cv-versions/${versionId}/file`;
  return options?.download ? `${base}?download=1` : base;
}

export function cvViewerUrl(versionId: string): string {
  return `/cvs/view/${versionId}`;
}

export function cvCompareUrl(fromId: string, toId: string): string {
  const params = new URLSearchParams({ from: fromId, to: toId });
  return `/cvs/compare?${params.toString()}`;
}

export async function fetchCvVersionCompare(
  fromId: string,
  toId: string,
): Promise<CvVersionCompareResult> {
  const params = new URLSearchParams({ from: fromId, to: toId });
  const res = await fetch(`${BASE_URL}/cv-versions/compare?${params.toString()}`);
  return handleJson<CvVersionCompareResult>(res);
}

export async function fetchCvVersion(versionId: string): Promise<CvVersion> {
  const res = await fetch(`${BASE_URL}/cv-versions/${versionId}`);
  return handleJson<CvVersion>(res);
}

export async function fetchCvProfiles(): Promise<CvProfileSummary[]> {
  const res = await fetch(`${BASE_URL}/cv-profiles`);
  return handleJson<CvProfileSummary[]>(res);
}

export async function fetchCvProfileVersions(profileId: string): Promise<CvVersionWithRefs[]> {
  const res = await fetch(`${BASE_URL}/cv-profiles/${profileId}/versions`);
  return handleJson<CvVersionWithRefs[]>(res);
}

export async function createCvProfile(description: string, file: File): Promise<CvProfileSummary> {
  const form = new FormData();
  form.append('description', description);
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/cv-profiles`, { method: 'POST', body: form });
  return handleJson<CvProfileSummary>(res);
}

export async function updateCvProfileDescription(
  profileId: string,
  description: string,
): Promise<CvProfileSummary> {
  const res = await fetch(`${BASE_URL}/cv-profiles/${profileId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  return handleJson<CvProfileSummary>(res);
}

export async function uploadCvVersion(profileId: string, file: File): Promise<CvProfileSummary> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/cv-profiles/${profileId}/versions`, {
    method: 'POST',
    body: form,
  });
  return handleJson<CvProfileSummary>(res);
}

export async function deleteCvVersion(versionId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/cv-versions/${versionId}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }
}

export async function fetchCvProfileApplications(
  profileId: string,
): Promise<CvLinkedApplication[]> {
  const res = await fetch(`${BASE_URL}/cv-profiles/${profileId}/applications`);
  return handleJson<CvLinkedApplication[]>(res);
}

export async function fetchCvVersionApplications(
  versionId: string,
): Promise<CvLinkedApplication[]> {
  const res = await fetch(`${BASE_URL}/cv-versions/${versionId}/applications`);
  return handleJson<CvLinkedApplication[]>(res);
}
