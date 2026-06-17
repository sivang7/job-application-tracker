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

export type CvMimeType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface CvVersion {
  id: string;
  profileId: string;
  originalFilename: string;
  mimeType: CvMimeType;
  uploadedAt: string;
}

export interface CvProfile {
  id: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CvProfileSummary extends CvProfile {
  currentVersion: CvVersion;
  versionCount: number;
  /** Total applications referencing any version; set by GET /cv-profiles. */
  applicationCount?: number;
}

export interface ApplicationCvSnapshot {
  versionId: string;
  profileId: string;
  description: string;
  originalFilename: string;
  uploadedAt: string;
}

export interface CvLinkedApplication {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
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
  cvProfileId?: string;
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
  cvProfileId?: string | null;
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
  cvVersionId?: string;
  /** Profile description captured when the CV link was saved. */
  cvSnapshotDescription?: string;
}

export interface ApplicationWithCv extends Application {
  cv?: ApplicationCvSnapshot;
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

export interface CvVersionWithRefs extends CvVersion {
  referenceCount: number;
}

export interface FollowUpRemindersResponse {
  reminders: FollowUpReminder[];
  asOf: string;
}
