import { useCallback, useRef, useState, type FormEvent } from 'react';
import { ApiError, createCvProfile } from '../api';
import { Modal } from './Modal';

interface CvCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  onError: (message: string) => void;
}

export function CvCreateModal({ isOpen, onClose, onCreated, onError }: CvCreateModalProps) {
  const [description, setDescription] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setDescription('');
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return;
    reset();
    onClose();
  }, [onClose, reset, submitting]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pendingFile) {
      onError('Choose a PDF or DOCX file to upload');
      return;
    }
    if (!description.trim()) {
      onError('Add a description for when this CV is relevant');
      return;
    }

    setSubmitting(true);
    onError('');
    try {
      await createCvProfile(description.trim(), pendingFile);
      reset();
      onCreated();
      onClose();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to create CV profile');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Add CV profile"
      isOpen={isOpen}
      onClose={handleClose}
      footer={
        <div className="form-actions">
          <button type="button" className="btn" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form="cv-create-form" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Uploading…' : 'Create CV profile'}
          </button>
        </div>
      }
    >
      <form id="cv-create-form" onSubmit={handleSubmit} noValidate>
        <p className="cv-muted">
          Upload a PDF or DOCX and describe when you use this CV. You can upload newer versions later;
          applications keep the version you sent.
        </p>
        <div className="form-field">
          <label htmlFor="cv-new-description">When is this CV relevant?</label>
          <textarea
            id="cv-new-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Backend roles emphasizing Python and distributed systems"
          />
        </div>
        <div className="cv-create-file">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
          />
          {pendingFile ? <span className="cv-muted">{pendingFile.name}</span> : null}
        </div>
      </form>
    </Modal>
  );
}
