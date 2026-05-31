import type { Application } from '@jat/shared';

// In-memory store with seed data for follow-up demo (CRUD added in Step 4).
const applications: Application[] = [
  {
    id: 'seed-1',
    company: 'Acme Corp',
    role: 'Software Engineer',
    status: 'applied',
    appliedDate: '2026-05-20',
  },
  {
    id: 'seed-2',
    company: 'Beta Inc',
    role: 'Full Stack Developer',
    status: 'applied',
    appliedDate: '2026-05-28',
  },
  {
    id: 'seed-3',
    company: 'Gamma LLC',
    role: 'Senior Engineer',
    status: 'interviewing',
    appliedDate: '2026-05-01',
    lastContactDate: '2026-05-27',
  },
  {
    id: 'seed-4',
    company: 'Delta Co',
    role: 'Staff Engineer',
    status: 'wishlist',
  },
  {
    id: 'seed-5',
    company: 'Echo Systems',
    role: 'Platform Engineer',
    status: 'rejected',
    appliedDate: '2026-04-01',
    lastContactDate: '2026-04-15',
  },
];

export function getApplications(): readonly Application[] {
  return applications;
}
