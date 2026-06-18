import type {
  Application,
  ApplicationStatus,
  Contact,
  CreateApplicationInput,
  UpdateApplicationInput,
} from '@jat/shared';
import { isApplicationStatus } from '@jat/shared';
import { parseIsoDate } from './reminders.js';

const MAX_FIELD_LENGTH = 200;
const MAX_NOTES_LENGTH = 5000;
const MAX_LINK_LENGTH = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s+\-().]+$/;

type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

function trimRequired(value: unknown, field: string): ValidationResult<string> {
  if (typeof value !== 'string') {
    return { ok: false, error: `${field} is required` };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: `${field} cannot be empty` };
  }
  if (trimmed.length > MAX_FIELD_LENGTH) {
    return { ok: false, error: `${field} must be at most ${MAX_FIELD_LENGTH} characters` };
  }
  return { ok: true, data: trimmed };
}

function optionalIsoDate(value: unknown, field: string): ValidationResult<string | undefined> {
  if (value === undefined) return { ok: true, data: undefined };
  if (typeof value !== 'string' || !parseIsoDate(value)) {
    return { ok: false, error: `Invalid ${field}; use YYYY-MM-DD` };
  }
  return { ok: true, data: value };
}

function optionalLongText(
  value: unknown,
  field: string,
): ValidationResult<string | undefined> {
  if (value === undefined) return { ok: true, data: undefined };
  if (typeof value !== 'string') {
    return { ok: false, error: `${field} must be a string` };
  }
  if (value.length > MAX_NOTES_LENGTH) {
    return { ok: false, error: `${field} must be at most ${MAX_NOTES_LENGTH} characters` };
  }
  return { ok: true, data: value };
}

function optionalNotes(value: unknown): ValidationResult<string | undefined> {
  return optionalLongText(value, 'notes');
}

function optionalDescription(value: unknown): ValidationResult<string | undefined> {
  return optionalLongText(value, 'description');
}

function optionalLink(value: unknown): ValidationResult<string | undefined> {
  if (value === undefined) return { ok: true, data: undefined };
  if (typeof value !== 'string') {
    return { ok: false, error: 'link must be a string' };
  }
  if (value.length > MAX_LINK_LENGTH) {
    return { ok: false, error: `link must be at most ${MAX_LINK_LENGTH} characters` };
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, error: 'link must be an http or https URL' };
    }
  } catch {
    return { ok: false, error: 'link must be a valid URL' };
  }
  return { ok: true, data: value };
}

function optionalContactString(
  value: unknown,
  field: string,
): ValidationResult<string | undefined> {
  if (value === undefined) return { ok: true, data: undefined };
  if (typeof value !== 'string' || value.length > MAX_FIELD_LENGTH) {
    return { ok: false, error: `${field} must be a string` };
  }
  return { ok: true, data: value };
}

function optionalContactEmail(value: unknown): ValidationResult<string | undefined> {
  const result = optionalContactString(value, 'contact email');
  if (!result.ok || result.data === undefined) return result;
  if (!EMAIL_RE.test(result.data)) {
    return { ok: false, error: 'contact email must be a valid email address' };
  }
  return result;
}

function optionalContactPhone(value: unknown): ValidationResult<string | undefined> {
  const result = optionalContactString(value, 'contact phone');
  if (!result.ok || result.data === undefined) return result;
  if (!PHONE_RE.test(result.data)) {
    return {
      ok: false,
      error: 'contact phone may only contain digits, spaces, +, -, (, and )',
    };
  }
  return result;
}

function validateStatus(value: unknown): ValidationResult<ApplicationStatus | undefined> {
  if (value === undefined) return { ok: true, data: undefined };
  if (typeof value !== 'string' || !isApplicationStatus(value)) {
    return { ok: false, error: 'Invalid status' };
  }
  return { ok: true, data: value };
}

function optionalCvProfileId(value: unknown): ValidationResult<string | undefined> {
  if (value === undefined) return { ok: true, data: undefined };
  if (typeof value !== 'string' || !value.trim()) {
    return { ok: false, error: 'cvProfileId must be a non-empty string' };
  }
  return { ok: true, data: value.trim() };
}

function optionalJobSource(value: unknown): ValidationResult<string | undefined> {
  if (value === undefined) return { ok: true, data: undefined };
  if (typeof value !== 'string') {
    return { ok: false, error: 'jobSource must be a string' };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: 'jobSource cannot be empty' };
  }
  if (trimmed.length > MAX_FIELD_LENGTH) {
    return { ok: false, error: `jobSource must be at most ${MAX_FIELD_LENGTH} characters` };
  }
  return { ok: true, data: trimmed };
}

function validateContacts(value: unknown): ValidationResult<Contact[] | undefined> {
  if (value === undefined) return { ok: true, data: undefined };
  if (!Array.isArray(value)) {
    return { ok: false, error: 'contacts must be an array' };
  }

  const contacts: Contact[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      return { ok: false, error: 'Each contact must be an object' };
    }
    const record = item as Record<string, unknown>;
    const nameResult = trimRequired(record.name, 'contact name');
    if (!nameResult.ok) return nameResult;

    const contact: Contact = { name: nameResult.data };
    if (record.email !== undefined) {
      const emailResult = optionalContactEmail(record.email);
      if (!emailResult.ok) return emailResult;
      if (emailResult.data !== undefined) contact.email = emailResult.data;
    }
    if (record.phone !== undefined) {
      const phoneResult = optionalContactPhone(record.phone);
      if (!phoneResult.ok) return phoneResult;
      if (phoneResult.data !== undefined) contact.phone = phoneResult.data;
    }
    if (record.role !== undefined) {
      const roleResult = optionalContactString(record.role, 'contact role');
      if (!roleResult.ok) return roleResult;
      if (roleResult.data !== undefined) contact.role = roleResult.data;
    }
    contacts.push(contact);
  }

  return { ok: true, data: contacts };
}

export function validateCreateInput(body: unknown): ValidationResult<CreateApplicationInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const raw = body as Record<string, unknown>;
  const companyResult = trimRequired(raw.company, 'company');
  if (!companyResult.ok) return companyResult;

  const roleResult = trimRequired(raw.role, 'role');
  if (!roleResult.ok) return roleResult;

  const statusResult = validateStatus(raw.status);
  if (!statusResult.ok) return statusResult;

  const appliedResult = optionalIsoDate(raw.appliedDate, 'appliedDate');
  if (!appliedResult.ok) return appliedResult;

  const lastContactResult = optionalIsoDate(raw.lastContactDate, 'lastContactDate');
  if (!lastContactResult.ok) return lastContactResult;

  const linkResult = optionalLink(raw.link);
  if (!linkResult.ok) return linkResult;

  const jobSourceResult = optionalJobSource(raw.jobSource);
  if (!jobSourceResult.ok) return jobSourceResult;

  const descriptionResult = optionalDescription(raw.description);
  if (!descriptionResult.ok) return descriptionResult;

  const notesResult = optionalNotes(raw.notes);
  if (!notesResult.ok) return notesResult;

  const contactsResult = validateContacts(raw.contacts);
  if (!contactsResult.ok) return contactsResult;

  const cvProfileResult = optionalCvProfileId(raw.cvProfileId);
  if (!cvProfileResult.ok) return cvProfileResult;

  const data: CreateApplicationInput = {
    company: companyResult.data,
    role: roleResult.data,
  };
  if (statusResult.data !== undefined) data.status = statusResult.data;
  if (appliedResult.data !== undefined) data.appliedDate = appliedResult.data;
  if (lastContactResult.data !== undefined) data.lastContactDate = lastContactResult.data;
  if (linkResult.data !== undefined) data.link = linkResult.data;
  if (jobSourceResult.data !== undefined) data.jobSource = jobSourceResult.data;
  if (descriptionResult.data !== undefined) data.description = descriptionResult.data;
  if (notesResult.data !== undefined) data.notes = notesResult.data;
  if (contactsResult.data !== undefined) data.contacts = contactsResult.data;
  if (cvProfileResult.data !== undefined) data.cvProfileId = cvProfileResult.data;

  return { ok: true, data };
}

export function validateUpdateInput(body: unknown): ValidationResult<UpdateApplicationInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const raw = body as Record<string, unknown>;
  if (Object.keys(raw).length === 0) {
    return { ok: false, error: 'At least one field is required to update' };
  }

  const data: UpdateApplicationInput = {};

  if ('company' in raw) {
    const companyResult = trimRequired(raw.company, 'company');
    if (!companyResult.ok) return companyResult;
    data.company = companyResult.data;
  }

  if ('role' in raw) {
    const roleResult = trimRequired(raw.role, 'role');
    if (!roleResult.ok) return roleResult;
    data.role = roleResult.data;
  }

  if ('status' in raw) {
    const statusResult = validateStatus(raw.status);
    if (!statusResult.ok) return statusResult;
    if (statusResult.data === undefined) {
      return { ok: false, error: 'Invalid status' };
    }
    data.status = statusResult.data;
  }

  if ('appliedDate' in raw) {
    if (raw.appliedDate === null) {
      data.appliedDate = undefined;
    } else {
      const appliedResult = optionalIsoDate(raw.appliedDate, 'appliedDate');
      if (!appliedResult.ok) return appliedResult;
      data.appliedDate = appliedResult.data;
    }
  }

  if ('lastContactDate' in raw) {
    if (raw.lastContactDate === null) {
      data.lastContactDate = undefined;
    } else {
      const lastContactResult = optionalIsoDate(raw.lastContactDate, 'lastContactDate');
      if (!lastContactResult.ok) return lastContactResult;
      data.lastContactDate = lastContactResult.data;
    }
  }

  if ('link' in raw) {
    if (raw.link === null) {
      data.link = undefined;
    } else {
      const linkResult = optionalLink(raw.link);
      if (!linkResult.ok) return linkResult;
      data.link = linkResult.data;
    }
  }

  if ('jobSource' in raw) {
    if (raw.jobSource === null) {
      data.jobSource = undefined;
    } else {
      const jobSourceResult = optionalJobSource(raw.jobSource);
      if (!jobSourceResult.ok) return jobSourceResult;
      data.jobSource = jobSourceResult.data;
    }
  }

  if ('description' in raw) {
    if (raw.description === null) {
      data.description = undefined;
    } else {
      const descriptionResult = optionalDescription(raw.description);
      if (!descriptionResult.ok) return descriptionResult;
      data.description = descriptionResult.data;
    }
  }

  if ('notes' in raw) {
    if (raw.notes === null) {
      data.notes = undefined;
    } else {
      const notesResult = optionalNotes(raw.notes);
      if (!notesResult.ok) return notesResult;
      data.notes = notesResult.data;
    }
  }

  if ('contacts' in raw) {
    if (raw.contacts === null) {
      data.contacts = undefined;
    } else {
      const contactsResult = validateContacts(raw.contacts);
      if (!contactsResult.ok) return contactsResult;
      data.contacts = contactsResult.data;
    }
  }

  if ('cvProfileId' in raw) {
    if (raw.cvProfileId === null) {
      data.cvProfileId = null;
    } else {
      const cvResult = optionalCvProfileId(raw.cvProfileId);
      if (!cvResult.ok) return cvResult;
      if (cvResult.data === undefined) {
        return { ok: false, error: 'cvProfileId must be a non-empty string' };
      }
      data.cvProfileId = cvResult.data;
    }
  }

  return { ok: true, data };
}

export function applyUpdate(app: Application, patch: UpdateApplicationInput): Application {
  const updated: Application = { ...app };

  if (patch.company !== undefined) updated.company = patch.company;
  if (patch.role !== undefined) updated.role = patch.role;
  if (patch.status !== undefined) updated.status = patch.status;

  if ('appliedDate' in patch) {
    if (patch.appliedDate) updated.appliedDate = patch.appliedDate;
    else delete updated.appliedDate;
  }
  if ('lastContactDate' in patch) {
    if (patch.lastContactDate) updated.lastContactDate = patch.lastContactDate;
    else delete updated.lastContactDate;
  }
  if ('link' in patch) {
    if (patch.link) updated.link = patch.link;
    else delete updated.link;
  }
  if ('jobSource' in patch) {
    if (patch.jobSource) updated.jobSource = patch.jobSource;
    else delete updated.jobSource;
  }
  if ('description' in patch) {
    if (patch.description) updated.description = patch.description;
    else delete updated.description;
  }
  if ('notes' in patch) {
    if (patch.notes) updated.notes = patch.notes;
    else delete updated.notes;
  }
  if ('contacts' in patch) {
    if (patch.contacts?.length) updated.contacts = patch.contacts;
    else delete updated.contacts;
  }

  return updated;
}
