import { describe, expect, it } from 'vitest';
import type { Application } from '@jat/shared';
import { cardDateLabel, contactSubtitle } from './cardDateLabel';

const baseApp = (overrides: Partial<Application> = {}): Application => ({
  id: '1',
  company: 'Acme',
  role: 'Engineer',
  status: 'applied',
  ...overrides,
});

describe('cardDateLabel', () => {
  it('returns null when no relevant date', () => {
    expect(cardDateLabel(baseApp({ status: 'wishlist' }), '2026-06-14')).toBeNull();
  });

  it('formats applied relative label', () => {
    expect(
      cardDateLabel(baseApp({ appliedDate: '2026-06-01' }), '2026-06-14'),
    ).toBe('Applied 1w ago');
  });

  it('prefers last contact for interviewing', () => {
    expect(
      cardDateLabel(
        baseApp({
          status: 'interviewing',
          appliedDate: '2026-01-01',
          lastContactDate: '2026-06-10',
        }),
        '2026-06-14',
      ),
    ).toBe('Contact 4d ago');
  });
});

describe('contactSubtitle', () => {
  it('returns null without contacts', () => {
    expect(contactSubtitle(baseApp())).toBeNull();
  });

  it('includes role when present', () => {
    expect(
      contactSubtitle(
        baseApp({
          contacts: [{ name: 'Pat', role: 'Recruiter' }],
        }),
      ),
    ).toBe('Pat · Recruiter');
  });
});
