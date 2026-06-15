export type ApplicationStatus = 'wishlist' | 'applied' | 'interviewing' | 'offer' | 'rejected';

export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  'wishlist',
  'applied',
  'interviewing',
  'offer',
  'rejected',
];

const APPLICATION_STATUS_SET = new Set<string>(APPLICATION_STATUS_ORDER);

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return APPLICATION_STATUS_SET.has(value);
}

export interface CreateApplicationInput {
  company: string;
  role: string;
  status?: ApplicationStatus;
  appliedDate?: string;
  lastContactDate?: string;
  link?: string;
  description?: string;
  notes?: string;
  contacts?: Contact[];
}

export type UpdateApplicationInput = {
  company?: string;
  role?: string;
  status?: ApplicationStatus;
  appliedDate?: string | null;
  lastContactDate?: string | null;
  link?: string | null;
  description?: string | null;
  notes?: string | null;
  contacts?: Contact[] | null;
};

export interface ApiErrorBody {
  error: string;
}

export interface Contact {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedDate?: string; // ISO date
  lastContactDate?: string; // ISO date
  link?: string;
  description?: string;
  notes?: string;
  contacts?: Contact[];
}

export type FollowUpUrgency = 'low' | 'medium' | 'high';

export interface FollowUpReminder {
  applicationId: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  reason: string;
  daysOverdue: number;
  urgency: FollowUpUrgency;
  anchorDate: string;
}

export interface FollowUpConfig {
  thresholds: Partial<Record<ApplicationStatus, number>>;
}

export interface FollowUpRemindersResponse {
  reminders: FollowUpReminder[];
  asOf: string;
}
