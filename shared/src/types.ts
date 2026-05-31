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
