import type {
  Application,
  ApplicationStatus,
  FollowUpConfig,
  FollowUpReminder,
  FollowUpUrgency,
} from '@jat/shared';

export const DEFAULT_FOLLOW_UP_CONFIG: FollowUpConfig = {
  thresholds: {
    applied: 7,
    interviewing: 3,
  },
};

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(dateStr: string): Date | null {
  const match = ISO_DATE_RE.exec(dateStr);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function daysBetween(anchor: Date, asOf: Date): number {
  return Math.floor((asOf.getTime() - anchor.getTime()) / 86_400_000);
}

function getAnchorDate(app: Application): string | undefined {
  return app.lastContactDate ?? app.appliedDate;
}

function urgencyForDaysOverdue(daysOverdue: number): FollowUpUrgency {
  if (daysOverdue >= 8) return 'high';
  if (daysOverdue >= 4) return 'medium';
  return 'low';
}

function reasonFor(app: Application, daysOverdue: number, threshold: number): string {
  const anchorLabel = app.lastContactDate ? 'last contact' : 'application';
  return `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} past ${threshold}-day follow-up threshold since ${anchorLabel}`;
}

export function getFollowUpReminders(
  applications: Application[],
  asOf: string,
  config: FollowUpConfig = DEFAULT_FOLLOW_UP_CONFIG,
): FollowUpReminder[] {
  const asOfDate = parseIsoDate(asOf);
  if (!asOfDate) return [];

  const reminders: FollowUpReminder[] = [];

  for (const app of applications) {
    const threshold = config.thresholds[app.status as ApplicationStatus];
    if (threshold === undefined) continue;

    const anchorStr = getAnchorDate(app);
    if (!anchorStr) continue;

    const anchorDate = parseIsoDate(anchorStr);
    if (!anchorDate) continue;

    const daysSinceAnchor = daysBetween(anchorDate, asOfDate);
    if (daysSinceAnchor <= threshold) continue;

    const daysOverdue = daysSinceAnchor - threshold;

    reminders.push({
      applicationId: app.id,
      company: app.company,
      role: app.role,
      status: app.status,
      reason: reasonFor(app, daysOverdue, threshold),
      daysOverdue,
      urgency: urgencyForDaysOverdue(daysOverdue),
      anchorDate: anchorStr,
    });
  }

  return reminders.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
