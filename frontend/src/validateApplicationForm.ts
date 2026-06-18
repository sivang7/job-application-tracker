import type { ApplicationFormValues } from './components/ApplicationFormFields';

const MAX_FIELD_LENGTH = 200;
const MAX_NOTES_LENGTH = 5000;
const MAX_LINK_LENGTH = 2000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s+\-().]+$/;

export type ApplicationFormFieldKey =
  | 'company'
  | 'role'
  | 'link'
  | 'jobSource'
  | 'description'
  | 'notes'
  | `contacts.${number}.name`
  | `contacts.${number}.email`
  | `contacts.${number}.phone`
  | `contacts.${number}.role`;

export type ApplicationFormErrors = Partial<Record<ApplicationFormFieldKey, string>>;

type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ApplicationFormErrors };

function contactRowHasContent(contact: ApplicationFormValues['contacts'][number]): boolean {
  return (
    contact.name.trim().length > 0 ||
    contact.email.trim().length > 0 ||
    contact.phone.trim().length > 0 ||
    contact.role.trim().length > 0
  );
}

export function isValidApplicationLink(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_LINK_LENGTH) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateApplicationForm(values: ApplicationFormValues): ValidationResult {
  const errors: ApplicationFormErrors = {};

  const company = values.company.trim();
  if (!company) {
    errors.company = 'Company is required';
  } else if (company.length > MAX_FIELD_LENGTH) {
    errors.company = `Company must be at most ${MAX_FIELD_LENGTH} characters`;
  }

  const role = values.role.trim();
  if (!role) {
    errors.role = 'Role is required';
  } else if (role.length > MAX_FIELD_LENGTH) {
    errors.role = `Role must be at most ${MAX_FIELD_LENGTH} characters`;
  }

  const link = values.link.trim();
  if (link) {
    if (link.length > MAX_LINK_LENGTH) {
      errors.link = `Link must be at most ${MAX_LINK_LENGTH} characters`;
    } else if (!isValidApplicationLink(link)) {
      errors.link = 'Link must be a valid http or https URL';
    }
  }

  const jobSource = values.jobSource.trim();
  if (jobSource.length > MAX_FIELD_LENGTH) {
    errors.jobSource = `Job source must be at most ${MAX_FIELD_LENGTH} characters`;
  }

  if (values.description.length > MAX_NOTES_LENGTH) {
    errors.description = `Description must be at most ${MAX_NOTES_LENGTH} characters`;
  }

  if (values.notes.length > MAX_NOTES_LENGTH) {
    errors.notes = `Notes must be at most ${MAX_NOTES_LENGTH} characters`;
  }

  values.contacts.forEach((contact, index) => {
    if (!contactRowHasContent(contact)) return;

    const name = contact.name.trim();
    if (!name) {
      errors[`contacts.${index}.name`] = 'Contact name is required when other contact fields are set';
    } else if (name.length > MAX_FIELD_LENGTH) {
      errors[`contacts.${index}.name`] = `Name must be at most ${MAX_FIELD_LENGTH} characters`;
    }

    const email = contact.email.trim();
    if (email) {
      if (email.length > MAX_FIELD_LENGTH) {
        errors[`contacts.${index}.email`] = `Email must be at most ${MAX_FIELD_LENGTH} characters`;
      } else if (!EMAIL_RE.test(email)) {
        errors[`contacts.${index}.email`] = 'Email must be a valid email address';
      }
    }

    const phone = contact.phone.trim();
    if (phone) {
      if (phone.length > MAX_FIELD_LENGTH) {
        errors[`contacts.${index}.phone`] = `Phone must be at most ${MAX_FIELD_LENGTH} characters`;
      } else if (!PHONE_RE.test(phone)) {
        errors[`contacts.${index}.phone`] =
          'Phone may only contain digits, spaces, +, -, (, and )';
      }
    }

    const contactRole = contact.role.trim();
    if (contactRole.length > MAX_FIELD_LENGTH) {
      errors[`contacts.${index}.role`] = `Title must be at most ${MAX_FIELD_LENGTH} characters`;
    }
  });

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}
