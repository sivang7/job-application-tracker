import type { Application, ApplicationStatus } from '@jat/shared';

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

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatRelativeDays(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1w ago' : `${weeks}w ago`;
  }
  const months = Math.floor(days / 30);
  return months === 1 ? '1mo ago' : `${months}mo ago`;
}

function primaryDateForStatus(app: Application): { date: string; prefix: string } | null {
  const { status, appliedDate, lastContactDate } = app;

  if (status === 'interviewing') {
    const date = lastContactDate ?? appliedDate;
    if (!date) return null;
    return { date, prefix: lastContactDate ? 'Contact' : 'Applied' };
  }

  if (status === 'applied' && appliedDate) {
    return { date: appliedDate, prefix: 'Applied' };
  }

  if (appliedDate) {
    return { date: appliedDate, prefix: 'Applied' };
  }

  return null;
}

export function cardDateLabel(app: Application, asOf = todayIsoDate()): string | null {
  const primary = primaryDateForStatus(app);
  if (!primary) return null;

  const anchor = parseIsoDate(primary.date);
  const asOfDate = parseIsoDate(asOf);
  if (!anchor || !asOfDate) return null;

  const days = daysBetween(anchor, asOfDate);
  return `${primary.prefix} ${formatRelativeDays(days)}`;
}

export function contactSubtitle(app: Application): string | null {
  const contact = app.contacts?.[0];
  if (!contact) return null;
  if (contact.role) return `${contact.name} · ${contact.role}`;
  return contact.name;
}
