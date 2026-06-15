import type { Contact } from '@jat/shared';
import type { ApplicationFormErrors } from '../validateApplicationForm';

export type ContactDraft = {
  name: string;
  email: string;
  phone: string;
  role: string;
};

export const emptyContactDraft = (): ContactDraft => ({
  name: '',
  email: '',
  phone: '',
  role: '',
});

export function contactsToDrafts(contacts: Contact[] | undefined): ContactDraft[] {
  if (!contacts?.length) return [];
  return contacts.map((c) => ({
    name: c.name,
    email: c.email ?? '',
    phone: c.phone ?? '',
    role: c.role ?? '',
  }));
}

export function draftsToContacts(drafts: ContactDraft[]): Contact[] {
  return drafts
    .map((d) => ({
      name: d.name.trim(),
      email: d.email.trim() || undefined,
      phone: d.phone.trim() || undefined,
      role: d.role.trim() || undefined,
    }))
    .filter((c) => c.name.length > 0);
}

interface ContactsEditorProps {
  contacts: ContactDraft[];
  onChange: (contacts: ContactDraft[]) => void;
  errors?: ApplicationFormErrors;
  idPrefix?: string;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="field-error" role="alert">
      {message}
    </span>
  );
}

export function ContactsEditor({
  contacts,
  onChange,
  errors = {},
  idPrefix = 'app',
}: ContactsEditorProps) {
  function updateRow(index: number, patch: Partial<ContactDraft>) {
    onChange(contacts.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function removeRow(index: number) {
    onChange(contacts.filter((_, i) => i !== index));
  }

  return (
    <fieldset className="contacts-editor">
      <legend>Contacts</legend>
      {contacts.length === 0 ? (
        <p className="contacts-empty">No contacts yet.</p>
      ) : (
        <ul className="contacts-list">
          {contacts.map((contact, index) => (
            <li key={index} className="contact-row">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor={`${idPrefix}-contact-name-${index}`}>Name</label>
                  <input
                    id={`${idPrefix}-contact-name-${index}`}
                    value={contact.name}
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                    aria-invalid={errors[`contacts.${index}.name`] ? true : undefined}
                    aria-describedby={
                      errors[`contacts.${index}.name`]
                        ? `${idPrefix}-contact-name-${index}-error`
                        : undefined
                    }
                  />
                  <FieldError
                    id={`${idPrefix}-contact-name-${index}-error`}
                    message={errors[`contacts.${index}.name`]}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`${idPrefix}-contact-email-${index}`}>Email</label>
                  <input
                    id={`${idPrefix}-contact-email-${index}`}
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateRow(index, { email: e.target.value })}
                    aria-invalid={errors[`contacts.${index}.email`] ? true : undefined}
                    aria-describedby={
                      errors[`contacts.${index}.email`]
                        ? `${idPrefix}-contact-email-${index}-error`
                        : undefined
                    }
                  />
                  <FieldError
                    id={`${idPrefix}-contact-email-${index}-error`}
                    message={errors[`contacts.${index}.email`]}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`${idPrefix}-contact-phone-${index}`}>Phone</label>
                  <input
                    id={`${idPrefix}-contact-phone-${index}`}
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateRow(index, { phone: e.target.value })}
                    aria-invalid={errors[`contacts.${index}.phone`] ? true : undefined}
                    aria-describedby={
                      errors[`contacts.${index}.phone`]
                        ? `${idPrefix}-contact-phone-${index}-error`
                        : undefined
                    }
                  />
                  <FieldError
                    id={`${idPrefix}-contact-phone-${index}-error`}
                    message={errors[`contacts.${index}.phone`]}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`${idPrefix}-contact-role-${index}`}>Title</label>
                  <input
                    id={`${idPrefix}-contact-role-${index}`}
                    value={contact.role}
                    onChange={(e) => updateRow(index, { role: e.target.value })}
                    placeholder="e.g. Recruiter"
                    aria-invalid={errors[`contacts.${index}.role`] ? true : undefined}
                    aria-describedby={
                      errors[`contacts.${index}.role`]
                        ? `${idPrefix}-contact-role-${index}-error`
                        : undefined
                    }
                  />
                  <FieldError
                    id={`${idPrefix}-contact-role-${index}-error`}
                    message={errors[`contacts.${index}.role`]}
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => removeRow(index)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="btn"
        onClick={() => onChange([...contacts, emptyContactDraft()])}
      >
        + Add contact
      </button>
    </fieldset>
  );
}
