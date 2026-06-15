import { useEffect, useState, type FormEvent } from 'react';
import type { Application } from '@jat/shared';
import { ApiError, updateApplication } from '../api';
import type { ApplicationFormErrors } from '../validateApplicationForm';
import { validateApplicationForm } from '../validateApplicationForm';
import {
  ApplicationFormFields,
  emptyFormValues,
  formValuesToPayload,
  type ApplicationFormValues,
} from './ApplicationFormFields';
import { contactsToDrafts } from './ContactsEditor';
import { Modal } from './Modal';

function applicationToFormValues(app: Application): ApplicationFormValues {
  return {
    company: app.company,
    role: app.role,
    status: app.status,
    appliedDate: app.appliedDate ?? '',
    lastContactDate: app.lastContactDate ?? '',
    link: app.link ?? '',
    description: app.description ?? '',
    notes: app.notes ?? '',
    contacts: contactsToDrafts(app.contacts),
  };
}

interface ApplicationDetailModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (app: Application) => void;
  onError: (message: string) => void;
}

export function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onSaved,
  onError,
}: ApplicationDetailModalProps) {
  const [values, setValues] = useState<ApplicationFormValues>(emptyFormValues());
  const [fieldErrors, setFieldErrors] = useState<ApplicationFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (application && isOpen) {
      setValues(applicationToFormValues(application));
      setFieldErrors({});
    }
  }, [application, isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!application) return;

    const validation = validateApplicationForm(values);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    onError('');
    try {
      const payload = formValuesToPayload(values);

      const patch = {
        company: payload.company,
        role: payload.role,
        status: payload.status,
        appliedDate: values.appliedDate || (application.appliedDate ? null : undefined),
        lastContactDate: values.lastContactDate || (application.lastContactDate ? null : undefined),
        link: values.link.trim() || (application.link ? null : undefined),
        description: values.description || (application.description ? null : undefined),
        notes: values.notes || (application.notes ? null : undefined),
        contacts:
          payload.contacts ??
          ((application.contacts?.length ?? 0) > 0 ? null : undefined),
      };

      const updated = await updateApplication(application.id, patch);
      onSaved(updated);
      onClose();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to update application');
    } finally {
      setSubmitting(false);
    }
  }

  if (!application) return null;

  return (
    <Modal
      title={`${application.company} — ${application.role}`}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form="application-detail-form" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      }
    >
      <form id="application-detail-form" onSubmit={handleSubmit} noValidate>
        {Object.keys(fieldErrors).length > 0 ? (
          <p className="form-summary-error" role="alert">
            Fix the highlighted fields before saving.
          </p>
        ) : null}
        <ApplicationFormFields
          values={values}
          onChange={setValues}
          errors={fieldErrors}
          idPrefix="edit"
        />
      </form>
    </Modal>
  );
}
