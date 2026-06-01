import { useState, type FormEvent } from 'react';
import type { ApplicationStatus } from '@jat/shared';
import { APPLICATION_STATUS_ORDER } from '@jat/shared';
import { createApplication, ApiError } from '../api';

interface ApplicationFormProps {
  onCreated: () => void;
  onError: (message: string) => void;
}

export function ApplicationForm({ onCreated, onError }: ApplicationFormProps) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('wishlist');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    onError('');
    try {
      await createApplication({ company, role, status });
      setCompany('');
      setRole('');
      setStatus('wishlist');
      onCreated();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to create application');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="application-form" onSubmit={handleSubmit}>
      <h2>Add application</h2>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="company">Company</label>
          <input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="role">Role</label>
          <input id="role" value={role} onChange={(e) => setRole(e.target.value)} required />
        </div>
        <div className="form-field">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
          >
            {APPLICATION_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add application'}
        </button>
      </div>
    </form>
  );
}
