import { describe, expect, it } from 'vitest';
import type { Application, ApplicationStatus, FollowUpReminder, FollowUpUrgency } from '@jat/shared';
import { applicationsByMonth, computeApplicationStats, summarizeFollowUps } from './stats';

function makeApplication(
  id: string,
  status: ApplicationStatus,
  appliedDate?: string,
): Application {
  return {
    id,
    company: `Company ${id}`,
    role: `Role ${id}`,
    status,
    appliedDate,
  };
}

function makeReminder(id: string, urgency: FollowUpUrgency): FollowUpReminder {
  return {
    applicationId: id,
    company: `Company ${id}`,
    role: `Role ${id}`,
    status: 'applied',
    reason: 'No recent contact',
    daysOverdue: 7,
    urgency,
    anchorDate: '2026-01-01',
  };
}

describe('computeApplicationStats', () => {
  it('returns zeros and null rates for empty input', () => {
    const stats = computeApplicationStats([]);

    expect(stats.total).toBe(0);
    expect(stats.byStatus).toEqual({
      wishlist: 0,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
    });
    expect(stats.inPipeline).toBe(0);
    expect(stats.offers).toBe(0);
    expect(stats.rejected).toBe(0);
    expect(stats.submitted).toBe(0);
    expect(stats.interviewRate).toBeNull();
    expect(stats.successRate).toBeNull();
  });

  it('computes mixed status counts including inPipeline and submitted', () => {
    const applications: Application[] = [
      makeApplication('1', 'wishlist'),
      makeApplication('2', 'applied'),
      makeApplication('3', 'applied'),
      makeApplication('4', 'interviewing'),
      makeApplication('5', 'offer'),
      makeApplication('6', 'rejected'),
    ];

    const stats = computeApplicationStats(applications);

    expect(stats.byStatus).toEqual({
      wishlist: 1,
      applied: 2,
      interviewing: 1,
      offer: 1,
      rejected: 1,
    });
    expect(stats.inPipeline).toBe(3);
    expect(stats.submitted).toBe(5);
  });

  it('calculates interview rate as (interviewing + offers) / submitted * 100', () => {
    const applications: Application[] = [
      makeApplication('1', 'applied'),
      makeApplication('2', 'applied'),
      makeApplication('3', 'interviewing'),
      makeApplication('4', 'offer'),
      makeApplication('5', 'wishlist'),
    ];

    const stats = computeApplicationStats(applications);

    expect(stats.submitted).toBe(4);
    expect(stats.interviewRate).toBe(50);
  });

  it('uses only offers + rejected in success rate denominator', () => {
    const applications: Application[] = [
      makeApplication('1', 'applied'),
      makeApplication('2', 'interviewing'),
      makeApplication('3', 'offer'),
      makeApplication('4', 'offer'),
      makeApplication('5', 'rejected'),
      makeApplication('6', 'wishlist'),
    ];

    const stats = computeApplicationStats(applications);

    expect(stats.offers).toBe(2);
    expect(stats.rejected).toBe(1);
    expect(stats.successRate).toBeCloseTo((2 / 3) * 100, 5);
  });

  it('returns null interview rate when all applications are wishlist', () => {
    const applications: Application[] = [
      makeApplication('1', 'wishlist'),
      makeApplication('2', 'wishlist'),
      makeApplication('3', 'wishlist'),
    ];

    const stats = computeApplicationStats(applications);

    expect(stats.submitted).toBe(0);
    expect(stats.interviewRate).toBeNull();
  });
});

describe('summarizeFollowUps', () => {
  it('returns zero counts for empty reminders', () => {
    const summary = summarizeFollowUps([]);

    expect(summary.total).toBe(0);
    expect(summary.byUrgency).toEqual({
      low: 0,
      medium: 0,
      high: 0,
    });
  });

  it('counts mixed follow-up urgencies', () => {
    const reminders: FollowUpReminder[] = [
      makeReminder('1', 'low'),
      makeReminder('2', 'medium'),
      makeReminder('3', 'high'),
      makeReminder('4', 'high'),
    ];

    const summary = summarizeFollowUps(reminders);

    expect(summary.total).toBe(4);
    expect(summary.byUrgency).toEqual({
      low: 1,
      medium: 1,
      high: 2,
    });
  });
});

describe('applicationsByMonth', () => {
  it('groups by month and skips missing/invalid appliedDate values', () => {
    const applications: Application[] = [
      makeApplication('1', 'applied', '2026-01-04'),
      makeApplication('2', 'interviewing', '2026-01-15'),
      makeApplication('3', 'offer', '2026-02-01'),
      makeApplication('4', 'wishlist'),
      makeApplication('5', 'applied', ''),
      makeApplication('6', 'rejected', 'not-a-date'),
    ];

    const monthly = applicationsByMonth(applications);

    expect(monthly).toEqual([
      { month: '2026-01', count: 2 },
      { month: '2026-02', count: 1 },
    ]);
  });
});
