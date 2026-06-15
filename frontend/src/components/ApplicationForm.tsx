import { useCallback, useState, type FormEvent } from 'react';
import { ApiError, createApplication } from '../api';
import type { ApplicationFormErrors } from '../validateApplicationForm';
import { validateApplicationForm } from '../validateApplicationForm';
import {
  ApplicationFormFields,
  emptyFormValues,
  formValuesToPayload,
  type ApplicationFormValues,
} from './ApplicationFormFields';
import { Modal } from './Modal';

interface ApplicationFormProps {
  onCreated: () => void;
  onError: (message: string) => void;
}

export function ApplicationForm({ onCreated, onError }: ApplicationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<ApplicationFormValues>(emptyFormValues());
  const [fieldErrors, setFieldErrors] = useState<ApplicationFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    if (submitting) return;
    setIsOpen(false);
    setValues(emptyFormValues());
    setFieldErrors({});
  }, [submitting]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validation = validateApplicationForm(values);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    onError('');
    try {
      await createApplication(formValuesToPayload(values));
      setValues(emptyFormValues());
      setIsOpen(false);
      onCreated();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to create application');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="board-toolbar">
        <button type="button" className="btn btn-primary" onClick={() => setIsOpen(true)}>
          + Add application
        </button>
      </div>

      <Modal
        title="Add application"
        isOpen={isOpen}
        onClose={handleClose}
        footer={
          <div className="form-actions">
            <button type="button" className="btn" onClick={handleClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" form="application-create-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add application'}
            </button>
          </div>
        }
      >
        <form id="application-create-form" onSubmit={handleSubmit} noValidate>
          {Object.keys(fieldErrors).length > 0 ? (
            <p className="form-summary-error" role="alert">
              Fix the highlighted fields before saving.
            </p>
          ) : null}
          <ApplicationFormFields
            values={values}
            onChange={setValues}
            errors={fieldErrors}
            idPrefix="create"
          />
        </form>
      </Modal>
    </>
  );
}
