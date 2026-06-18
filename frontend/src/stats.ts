import {
  APPLICATION_STATUS_ORDER,
  type Application,
  type ApplicationStatus,
  type FollowUpReminder,
} from '@jat/shared';

export type StatusCounts = Record<ApplicationStatus, number>;

export interface ApplicationStats {
  total: number;
  byStatus: StatusCounts;
  inPipeline: number;
  offers: number;
  rejected: number;
  submitted: number;
  interviewRate: number | null;
  successRate: number | null;
}

export interface FollowUpSummary {
  total: number;
  byUrgency: Record<'low' | 'medium' | 'high', number>;
}

function emptyStatusCounts(): StatusCounts {
  return Object.fromEntries(
    APPLICATION_STATUS_ORDER.map((status) => [status, 0]),
  ) as StatusCounts;
}

export function computeApplicationStats(applications: Application[]): ApplicationStats {
  const byStatus = emptyStatusCounts();

  for (const app of applications) {
    byStatus[app.status] += 1;
  }

  const total = applications.length;
  const inPipeline = byStatus.applied + byStatus.interviewing;
  const offers = byStatus.offer;
  const rejected = byStatus.rejected;
  const submitted = total - byStatus.wishlist;
  const interviewRate = submitted > 0 ? ((byStatus.interviewing + offers) / submitted) * 100 : null;
  const outcomes = offers + rejected;
  const successRate = outcomes > 0 ? (offers / outcomes) * 100 : null;

  return {
    total,
    byStatus,
    inPipeline,
    offers,
    rejected,
    submitted,
    interviewRate,
    successRate,
  };
}

export function summarizeFollowUps(reminders: FollowUpReminder[]): FollowUpSummary {
  const byUrgency: FollowUpSummary['byUrgency'] = {
    low: 0,
    medium: 0,
    high: 0,
  };

  for (const reminder of reminders) {
    byUrgency[reminder.urgency] += 1;
  }

  return {
    total: reminders.length,
    byUrgency,
  };
}

export function applicationsByMonth(
  applications: Application[],
): Array<{ month: string; count: number }> {
  const grouped = new Map<string, number>();

  for (const app of applications) {
    if (!app.appliedDate) continue;
    const parsed = Date.parse(app.appliedDate);
    if (Number.isNaN(parsed)) continue;
    const month = new Date(parsed).toISOString().slice(0, 7);
    grouped.set(month, (grouped.get(month) ?? 0) + 1);
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, count]) => ({ month, count }));
}

export const JOB_SOURCE_NOT_SET = 'Not set';

export function applicationsByJobSource(
  applications: Application[],
): Array<{ source: string; count: number }> {
  const grouped = new Map<string, number>();

  for (const app of applications) {
    const trimmed = app.jobSource?.trim();
    const key = trimmed || JOB_SOURCE_NOT_SET;
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  return Array.from(grouped.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((left, right) => right.count - left.count || left.source.localeCompare(right.source));
}
