export type ApplicationStatus = 'wishlist' | 'applied' | 'interviewing' | 'offer' | 'rejected';

export interface Contact {
  name: string;
  email?: string;
  role?: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedDate?: string; // ISO date
  lastContactDate?: string; // ISO date
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
