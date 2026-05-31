import { describe, expect, it } from 'vitest';
import type { Application } from '@jat/shared';
import {
  daysBetween,
  getFollowUpReminders,
  parseIsoDate,
} from './reminders.js';
import { getApplications } from './store.js';

const appliedApp = (overrides: Partial<Application> = {}): Application => ({
  id: 'app-1',
  company: 'Test Co',
  role: 'Engineer',
  status: 'applied',
  appliedDate: '2026-05-01',
  ...overrides,
});

describe('parseIsoDate', () => {
  it('parses valid YYYY-MM-DD', () => {
    expect(parseIsoDate('2026-05-15')).not.toBeNull();
  });

  it('returns null for malformed strings', () => {
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('05-15-2026')).toBeNull();
    expect(parseIsoDate('not-a-date')).toBeNull();
    expect(parseIsoDate('2026-05-15T00:00:00Z')).toBeNull();
  });

  it('returns null for invalid calendar dates', () => {
    expect(parseIsoDate('2026-02-30')).toBeNull();
  });
});

describe('daysBetween', () => {
  it('counts whole UTC days between dates', () => {
    const anchor = parseIsoDate('2026-05-01')!;
    const asOf = parseIsoDate('2026-05-08')!;
    expect(daysBetween(anchor, asOf)).toBe(7);
  });

  it('returns zero for same day', () => {
    const d = parseIsoDate('2026-05-01')!;
    expect(daysBetween(d, d)).toBe(0);
  });
});

describe('getFollowUpReminders', () => {
  it('returns empty array for empty input', () => {
    expect(getFollowUpReminders([], '2026-05-31')).toEqual([]);
  });

  it('returns empty array for invalid asOf', () => {
    expect(getFollowUpReminders([appliedApp()], 'bad-date')).toEqual([]);
  });

  it('reminds for applied status past 7-day threshold', () => {
    const reminders = getFollowUpReminders(
      [appliedApp({ appliedDate: '2026-05-01' })],
      '2026-05-09',
    );
    expect(reminders).toHaveLength(1);
    expect(reminders[0].daysOverdue).toBe(1);
    expect(reminders[0].applicationId).toBe('app-1');
    expect(reminders[0].anchorDate).toBe('2026-05-01');
  });

  it('does not remind on exact threshold day (exclusive boundary)', () => {
    const reminders = getFollowUpReminders(
      [appliedApp({ appliedDate: '2026-05-01' })],
      '2026-05-08',
    );
    expect(reminders).toHaveLength(0);
  });

  it('reminds for interviewing with 3-day threshold', () => {
    const reminders = getFollowUpReminders(
      [
        appliedApp({
          status: 'interviewing',
          appliedDate: '2026-05-01',
          lastContactDate: '2026-05-01',
        }),
      ],
      '2026-05-05',
    );
    expect(reminders).toHaveLength(1);
    expect(reminders[0].daysOverdue).toBe(1);
  });

  it('prefers lastContactDate over appliedDate as anchor', () => {
    const reminders = getFollowUpReminders(
      [
        appliedApp({
          appliedDate: '2026-01-01',
          lastContactDate: '2026-05-25',
        }),
      ],
      '2026-05-31',
    );
    expect(reminders).toHaveLength(0);

    const overdue = getFollowUpReminders(
      [
        appliedApp({
          appliedDate: '2026-01-01',
          lastContactDate: '2026-05-20',
        }),
      ],
      '2026-05-31',
    );
    expect(overdue).toHaveLength(1);
    expect(overdue[0].anchorDate).toBe('2026-05-20');
  });

  it('skips wishlist, rejected, and offer statuses', () => {
    const apps: Application[] = [
      appliedApp({ id: 'w', status: 'wishlist', appliedDate: '2026-01-01' }),
      appliedApp({ id: 'r', status: 'rejected', appliedDate: '2026-01-01' }),
      appliedApp({ id: 'o', status: 'offer', appliedDate: '2026-01-01' }),
    ];
    expect(getFollowUpReminders(apps, '2026-05-31')).toEqual([]);
  });

  it('skips remindable status when both dates are missing', () => {
    const reminders = getFollowUpReminders(
      [appliedApp({ appliedDate: undefined, lastContactDate: undefined })],
      '2026-05-31',
    );
    expect(reminders).toHaveLength(0);
  });

  it('skips when anchor date is malformed', () => {
    const reminders = getFollowUpReminders(
      [appliedApp({ appliedDate: 'not-valid' })],
      '2026-05-31',
    );
    expect(reminders).toHaveLength(0);
  });

  it('does not remind when asOf is before anchor date', () => {
    const reminders = getFollowUpReminders(
      [appliedApp({ appliedDate: '2026-05-20' })],
      '2026-05-15',
    );
    expect(reminders).toHaveLength(0);
  });

  it('assigns urgency tiers by days overdue', () => {
    const low = getFollowUpReminders(
      [appliedApp({ appliedDate: '2026-05-01' })],
      '2026-05-09',
    );
    expect(low[0].urgency).toBe('low');

    const medium = getFollowUpReminders(
      [appliedApp({ appliedDate: '2026-05-01' })],
      '2026-05-12',
    );
    expect(medium[0].urgency).toBe('medium');

    const high = getFollowUpReminders(
      [appliedApp({ appliedDate: '2026-05-01' })],
      '2026-05-16',
    );
    expect(high[0].urgency).toBe('high');
  });

  it('sorts reminders by daysOverdue descending', () => {
    const reminders = getFollowUpReminders(
      [
        appliedApp({ id: 'a', appliedDate: '2026-05-01' }),
        appliedApp({ id: 'b', appliedDate: '2026-01-01' }),
      ],
      '2026-05-31',
    );
    expect(reminders[0].daysOverdue).toBeGreaterThan(reminders[1].daysOverdue);
  });

  it('handles mixed statuses in one batch', () => {
    const reminders = getFollowUpReminders(
      [
        appliedApp({ id: 'due', appliedDate: '2026-05-01' }),
        appliedApp({ id: 'skip', status: 'wishlist', appliedDate: '2026-01-01' }),
        appliedApp({
          id: 'recent',
          status: 'interviewing',
          appliedDate: '2026-05-01',
          lastContactDate: '2026-05-29',
        }),
      ],
      '2026-05-31',
    );
    expect(reminders.map((r) => r.applicationId)).toEqual(['due']);
  });

  it('respects custom config thresholds', () => {
    const reminders = getFollowUpReminders(
      [appliedApp({ appliedDate: '2026-05-01' })],
      '2026-05-05',
      { thresholds: { applied: 3 } },
    );
    expect(reminders).toHaveLength(1);
    expect(reminders[0].daysOverdue).toBe(1);
  });
});

describe('seed data scenarios', () => {
  it('returns expected reminders for fixed asOf against store seed dates', () => {
    const reminders = getFollowUpReminders([...getApplications()], '2026-05-31');

    const ids = reminders.map((r) => r.applicationId);
    expect(ids).toContain('seed-1');
    expect(ids).toContain('seed-3');
    expect(ids).not.toContain('seed-2');
    expect(ids).not.toContain('seed-4');
    expect(ids).not.toContain('seed-5');
  });
});
