import { useEffect, useState, type FormEvent } from 'react';
import type { ApplicationWithCv, CvProfileSummary } from '@jat/shared';
import { ApiError, cvViewerUrl, fetchCvProfiles, updateApplication } from '../api';
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

function formatCvDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function applicationToFormValues(app: ApplicationWithCv): ApplicationFormValues {
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
    cvProfileId: app.cv?.profileId ?? '',
  };
}

interface ApplicationDetailModalProps {
  application: ApplicationWithCv | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (app: ApplicationWithCv) => void;
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
  const [initialCvProfileId, setInitialCvProfileId] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ApplicationFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [cvProfiles, setCvProfiles] = useState<CvProfileSummary[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    fetchCvProfiles()
      .then(setCvProfiles)
      .catch(() => setCvProfiles([]));
  }, [isOpen]);

  useEffect(() => {
    if (application && isOpen) {
      const formValues = applicationToFormValues(application);
      setValues(formValues);
      setInitialCvProfileId(formValues.cvProfileId);
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
      } as Parameters<typeof updateApplication>[1];

      if (values.cvProfileId !== initialCvProfileId) {
        patch.cvProfileId = values.cvProfileId ? values.cvProfileId : null;
      }

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

  const linkedCvLabel = application.cv
    ? `Linked snapshot: ${application.cv.description} — ${application.cv.originalFilename} (uploaded ${formatCvDate(application.cv.uploadedAt)})`
    : undefined;

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
        {application.cv ? (
          <p className="form-cv-view">
            <a href={cvViewerUrl(application.cv.versionId)} target="_blank" rel="noopener noreferrer">
              View linked CV ↗
            </a>
          </p>
        ) : null}
        <ApplicationFormFields
          values={values}
          onChange={setValues}
          errors={fieldErrors}
          idPrefix="edit"
          cvProfiles={cvProfiles}
          linkedCvLabel={linkedCvLabel}
        />
      </form>
    </Modal>
  );
}
