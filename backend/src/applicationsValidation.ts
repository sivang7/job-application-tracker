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

function optionalNotes(value: unknown): ValidationResult<string | undefined> {
  if (value === undefined) return { ok: true, data: undefined };
  if (typeof value !== 'string') {
    return { ok: false, error: 'notes must be a string' };
  }
  if (value.length > MAX_NOTES_LENGTH) {
    return { ok: false, error: `notes must be at most ${MAX_NOTES_LENGTH} characters` };
  }
  return { ok: true, data: value };
}

function validateStatus(value: unknown): ValidationResult<ApplicationStatus | undefined> {
  if (value === undefined) return { ok: true, data: undefined };
  if (typeof value !== 'string' || !isApplicationStatus(value)) {
    return { ok: false, error: 'Invalid status' };
  }
  return { ok: true, data: value };
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
      if (typeof record.email !== 'string' || record.email.length > MAX_FIELD_LENGTH) {
        return { ok: false, error: 'contact email must be a string' };
      }
      contact.email = record.email;
    }
    if (record.role !== undefined) {
      if (typeof record.role !== 'string' || record.role.length > MAX_FIELD_LENGTH) {
        return { ok: false, error: 'contact role must be a string' };
      }
      contact.role = record.role;
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

  const notesResult = optionalNotes(raw.notes);
  if (!notesResult.ok) return notesResult;

  const contactsResult = validateContacts(raw.contacts);
  if (!contactsResult.ok) return contactsResult;

  const data: CreateApplicationInput = {
    company: companyResult.data,
    role: roleResult.data,
  };
  if (statusResult.data !== undefined) data.status = statusResult.data;
  if (appliedResult.data !== undefined) data.appliedDate = appliedResult.data;
  if (lastContactResult.data !== undefined) data.lastContactDate = lastContactResult.data;
  if (notesResult.data !== undefined) data.notes = notesResult.data;
  if (contactsResult.data !== undefined) data.contacts = contactsResult.data;

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

  return { ok: true, data };
}

export function applyUpdate(app: Application, patch: UpdateApplicationInput): Application {
  const updated: Application = { ...app, ...patch };
  if ('appliedDate' in patch && patch.appliedDate === undefined) {
    delete updated.appliedDate;
  }
  if ('lastContactDate' in patch && patch.lastContactDate === undefined) {
    delete updated.lastContactDate;
  }
  if ('notes' in patch && patch.notes === undefined) {
    delete updated.notes;
  }
  if ('contacts' in patch && patch.contacts === undefined) {
    delete updated.contacts;
  }
  return updated;
}
