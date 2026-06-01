import type {
  Application,
  ApiErrorBody,
  CreateApplicationInput,
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

export async function fetchApplications(): Promise<Application[]> {
  const res = await fetch(`${BASE_URL}/applications`);
  return handleJson<Application[]>(res);
}

export async function createApplication(
  input: CreateApplicationInput,
): Promise<Application> {
  const res = await fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleJson<Application>(res);
}

export async function updateApplication(
  id: string,
  input: UpdateApplicationInput,
): Promise<Application> {
  const res = await fetch(`${BASE_URL}/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleJson<Application>(res);
}

export async function deleteApplication(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/applications/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }
}
