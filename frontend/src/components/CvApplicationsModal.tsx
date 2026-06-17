import type { CvLinkedApplication } from '@jat/shared';
import { Modal } from './Modal';

interface CvApplicationsModalProps {
  isOpen: boolean;
  title: string;
  applications: CvLinkedApplication[];
  loading: boolean;
  error?: string;
  onClose: () => void;
}

export function CvApplicationsModal({
  isOpen,
  title,
  applications,
  loading,
  error,
  onClose,
}: CvApplicationsModalProps) {
  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      {loading ? <p className="cv-muted">Loading applications…</p> : null}
      {error ? (
        <p className="form-summary-error" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && applications.length === 0 ? (
        <p className="cv-muted">No linked applications.</p>
      ) : null}
      {!loading && !error && applications.length > 0 ? (
        <table className="cv-apps-table">
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>{app.company}</td>
                <td>{app.role}</td>
                <td>{app.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </Modal>
  );
}
