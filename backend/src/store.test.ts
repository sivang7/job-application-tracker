import { writeFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { getFollowUpReminders } from './reminders.js';
import { getDataFilePath } from './persistence.js';
import { SEED_APPLICATIONS } from './seeds.js';
import {
  createApplication,
  deleteApplication,
  getApplicationById,
  getApplications,
  reloadStoreFromDisk,
  updateApplication,
} from './store.js';

function resetStore(): void {
  writeFileSync(getDataFilePath(), JSON.stringify(SEED_APPLICATIONS, null, 2));
  reloadStoreFromDisk();
}

describe('store CRUD', () => {
  beforeEach(() => {
    resetStore();
  });

  it('lists seed applications', () => {
    expect(getApplications().length).toBeGreaterThanOrEqual(5);
    expect(getApplicationById('seed-1')?.company).toBe('Acme Corp');
  });

  it('creates application with uuid and default wishlist', () => {
    const app = createApplication({ company: 'New Co', role: 'PM' });
    expect(app.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(app.status).toBe('wishlist');
    expect(getApplicationById(app.id)).toEqual(app);
  });

  it('updates application partially', () => {
    const updated = updateApplication('seed-1', { status: 'interviewing' });
    expect(updated?.status).toBe('interviewing');
    expect(getApplicationById('seed-1')?.status).toBe('interviewing');
  });

  it('returns null when updating missing id', () => {
    expect(updateApplication('missing', { status: 'applied' })).toBeNull();
  });

  it('deletes application', () => {
    expect(deleteApplication('seed-2')).toBe(true);
    expect(getApplicationById('seed-2')).toBeUndefined();
    expect(deleteApplication('seed-2')).toBe(false);
  });

  it('persists mutations to disk', () => {
    createApplication({ company: 'Disk Co', role: 'Eng', status: 'applied' });
    reloadStoreFromDisk();
    expect(getApplications().some((a) => a.company === 'Disk Co')).toBe(true);
  });

  it('follow-ups reflect store after lastContactDate change', () => {
    updateApplication('seed-2', { lastContactDate: '2026-05-01' });
    const reminders = getFollowUpReminders([...getApplications()], '2026-05-31');
    const seed2 = reminders.find((r) => r.applicationId === 'seed-2');
    expect(seed2).toBeDefined();
  });
});
