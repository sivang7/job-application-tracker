import { randomUUID } from 'node:crypto';
import type { Application, CreateApplicationInput, UpdateApplicationInput } from '@jat/shared';
import { loadApplications, saveApplications } from './persistence.js';
import { applyUpdate } from './applicationsValidation.js';

let applications: Application[] = loadApplications();

export function getApplications(): readonly Application[] {
  return applications;
}

export function getApplicationById(id: string): Application | undefined {
  return applications.find((app) => app.id === id);
}

export function createApplication(input: CreateApplicationInput): Application {
  const app: Application = {
    id: randomUUID(),
    company: input.company,
    role: input.role,
    status: input.status ?? 'wishlist',
    ...(input.appliedDate !== undefined && { appliedDate: input.appliedDate }),
    ...(input.lastContactDate !== undefined && { lastContactDate: input.lastContactDate }),
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.contacts !== undefined && { contacts: input.contacts }),
  };
  applications = [...applications, app];
  saveApplications(applications);
  return app;
}

export function updateApplication(
  id: string,
  patch: UpdateApplicationInput,
): Application | null {
  const index = applications.findIndex((app) => app.id === id);
  if (index === -1) return null;

  const updated = applyUpdate(applications[index], patch);
  applications = [...applications.slice(0, index), updated, ...applications.slice(index + 1)];
  saveApplications(applications);
  return updated;
}

export function deleteApplication(id: string): boolean {
  const index = applications.findIndex((app) => app.id === id);
  if (index === -1) return false;

  applications = [...applications.slice(0, index), ...applications.slice(index + 1)];
  saveApplications(applications);
  return true;
}

/** Replaces in-memory store from disk (for tests after env change). */
export function reloadStoreFromDisk(): void {
  applications = loadApplications();
}
