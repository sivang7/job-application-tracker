import type { ApplicationStatus, CvProfileSummary } from '@jat/shared';
import { APPLICATION_STATUS_ORDER } from '@jat/shared';
import { isValidApplicationLink, type ApplicationFormErrors } from '../validateApplicationForm';
import { ContactsEditor, type ContactDraft } from './ContactsEditor';

export interface ApplicationFormValues {
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedDate: string;
  lastContactDate: string;
  link: string;
  jobSource: string;
  description: string;
  notes: string;
  contacts: ContactDraft[];
  cvProfileId: string;
}

export const emptyFormValues = (): ApplicationFormValues => ({
  company: '',
  role: '',
  status: 'wishlist',
  appliedDate: '',
  lastContactDate: '',
  link: '',
  jobSource: '',
  description: '',
  notes: '',
  contacts: [],
  cvProfileId: '',
});

interface ApplicationFormFieldsProps {
  values: ApplicationFormValues;
  onChange: (values: ApplicationFormValues) => void;
  errors?: ApplicationFormErrors;
  idPrefix?: string;
  cvProfiles?: CvProfileSummary[];
  linkedCvLabel?: string;
  jobSourceOptions?: string[];
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="field-error" role="alert">
      {message}
    </span>
  );
}

export function ApplicationFormFields({
  values,
  onChange,
  errors = {},
  idPrefix = 'app',
  cvProfiles = [],
  linkedCvLabel,
  jobSourceOptions = [],
}: ApplicationFormFieldsProps) {
  function set<K extends keyof ApplicationFormValues>(key: K, value: ApplicationFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="application-form-fields">
      <div className="form-row">
        <div className="form-field">
          <label htmlFor={`${idPrefix}-company`}>Company</label>
          <input
            id={`${idPrefix}-company`}
            value={values.company}
            onChange={(e) => set('company', e.target.value)}
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={errors.company ? `${idPrefix}-company-error` : undefined}
          />
          <FieldError id={`${idPrefix}-company-error`} message={errors.company} />
        </div>
        <div className="form-field">
          <label htmlFor={`${idPrefix}-role`}>Role</label>
          <input
            id={`${idPrefix}-role`}
            value={values.role}
            onChange={(e) => set('role', e.target.value)}
            aria-invalid={errors.role ? true : undefined}
            aria-describedby={errors.role ? `${idPrefix}-role-error` : undefined}
          />
          <FieldError id={`${idPrefix}-role-error`} message={errors.role} />
        </div>
        <div className="form-field">
          <label htmlFor={`${idPrefix}-status`}>Status</label>
          <select
            id={`${idPrefix}-status`}
            value={values.status}
            onChange={(e) => set('status', e.target.value as ApplicationStatus)}
          >
            {APPLICATION_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor={`${idPrefix}-appliedDate`}>Applied date</label>
          <input
            id={`${idPrefix}-appliedDate`}
            type="date"
            value={values.appliedDate}
            onChange={(e) => set('appliedDate', e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor={`${idPrefix}-lastContactDate`}>Last contact date</label>
          <input
            id={`${idPrefix}-lastContactDate`}
            type="date"
            value={values.lastContactDate}
            onChange={(e) => set('lastContactDate', e.target.value)}
          />
        </div>
        <div className="form-field form-field--wide">
          <label htmlFor={`${idPrefix}-link`}>Job posting link</label>
          <input
            id={`${idPrefix}-link`}
            type="url"
            value={values.link}
            onChange={(e) => set('link', e.target.value)}
            placeholder="https://…"
            aria-invalid={errors.link ? true : undefined}
            aria-describedby={errors.link ? `${idPrefix}-link-error` : undefined}
          />
          <FieldError id={`${idPrefix}-link-error`} message={errors.link} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field form-field--wide">
          <label htmlFor={`${idPrefix}-jobSource`}>Where did you find this job?</label>
          <input
            id={`${idPrefix}-jobSource`}
            list={`${idPrefix}-jobSource-list`}
            value={values.jobSource}
            onChange={(e) => set('jobSource', e.target.value)}
            placeholder="e.g. LinkedIn"
            aria-invalid={errors.jobSource ? true : undefined}
            aria-describedby={
              errors.jobSource ? `${idPrefix}-jobSource-error` : `${idPrefix}-jobSource-hint`
            }
          />
          <datalist id={`${idPrefix}-jobSource-list`}>
            {jobSourceOptions.map((source) => (
              <option key={source} value={source} />
            ))}
          </datalist>
          <p id={`${idPrefix}-jobSource-hint`} className="form-hint">
            Pick a suggestion or type your own.
          </p>
          <FieldError id={`${idPrefix}-jobSource-error`} message={errors.jobSource} />
        </div>
      </div>

      {isValidApplicationLink(values.link) ? (
        <p className="form-link-preview">
          <a href={values.link.trim()} target="_blank" rel="noopener noreferrer">
            Open posting ↗
          </a>
        </p>
      ) : null}

      <div className="form-field">
        <label htmlFor={`${idPrefix}-description`}>Description</label>
        <textarea
          id={`${idPrefix}-description`}
          rows={3}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? `${idPrefix}-description-error` : undefined}
        />
        <FieldError id={`${idPrefix}-description-error`} message={errors.description} />
      </div>

      <div className="form-field">
        <label htmlFor={`${idPrefix}-notes`}>Notes</label>
        <textarea
          id={`${idPrefix}-notes`}
          rows={3}
          value={values.notes}
          onChange={(e) => set('notes', e.target.value)}
          aria-invalid={errors.notes ? true : undefined}
          aria-describedby={errors.notes ? `${idPrefix}-notes-error` : undefined}
        />
        <FieldError id={`${idPrefix}-notes-error`} message={errors.notes} />
      </div>

      <ContactsEditor
        contacts={values.contacts}
        onChange={(contacts) => set('contacts', contacts)}
        errors={errors}
        idPrefix={idPrefix}
      />

      <div className="form-field">
        <label htmlFor={`${idPrefix}-cv`}>CV sent with this application</label>
        <select
          id={`${idPrefix}-cv`}
          value={values.cvProfileId}
          onChange={(e) => set('cvProfileId', e.target.value)}
        >
          <option value="">None</option>
          {cvProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.description} — {p.currentVersion.originalFilename}
            </option>
          ))}
        </select>
        {linkedCvLabel ? <p className="form-hint">{linkedCvLabel}</p> : null}
      </div>
    </div>
  );
}

export function formValuesToPayload(values: ApplicationFormValues) {
  const contacts = values.contacts
    .map((d) => ({
      name: d.name.trim(),
      email: d.email.trim() || undefined,
      phone: d.phone.trim() || undefined,
      role: d.role.trim() || undefined,
    }))
    .filter((c) => c.name.length > 0);

  return {
    company: values.company.trim(),
    role: values.role.trim(),
    status: values.status,
    appliedDate: values.appliedDate || undefined,
    lastContactDate: values.lastContactDate || undefined,
    link: values.link.trim() || undefined,
    jobSource: values.jobSource.trim() || undefined,
    description: values.description || undefined,
    notes: values.notes || undefined,
    contacts: contacts.length > 0 ? contacts : undefined,
    cvProfileId: values.cvProfileId || undefined,
  };
}
