import { useEffect, useRef, useState } from 'react';
import type { CvLinkedApplication, CvProfileSummary, CvVersionWithRefs } from '@jat/shared';
import {
  ApiError,
  cvViewerUrl,
  deleteCvVersion,
  fetchCvProfileApplications,
  fetchCvProfileVersions,
  fetchCvProfiles,
  fetchCvVersionApplications,
  updateCvProfileDescription,
  uploadCvVersion,
} from '../api';
import { CvApplicationsModal } from './CvApplicationsModal';
import { CvCreateModal } from './CvCreateModal';
interface CvTrackerPageProps {
  onError: (message: string) => void;
}

function formatUploadedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface CvProfileCardProps {
  profile: CvProfileSummary;
  onError: (message: string) => void;
  onChanged: () => void;
}

function UsedByApplicationsLabel({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
  const label = `Used by ${count} application${count === 1 ? '' : 's'}`;
  if (count === 0 || !onClick) {
    return <span>{label}</span>;
  }
  return (
    <button type="button" className="cv-ref-link" onClick={onClick}>
      {label}
    </button>
  );
}

function CvProfileCard({ profile, onError, onChanged }: CvProfileCardProps) {
  const [description, setDescription] = useState(profile.description);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<CvVersionWithRefs[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [uploading, setUploading] = useState(false);
  const versionInputRef = useRef<HTMLInputElement>(null);
  const [appsModalOpen, setAppsModalOpen] = useState(false);
  const [appsModalTitle, setAppsModalTitle] = useState('');
  const [appsModalApps, setAppsModalApps] = useState<CvLinkedApplication[]>([]);
  const [appsModalLoading, setAppsModalLoading] = useState(false);
  const [appsModalError, setAppsModalError] = useState('');
  useEffect(() => {
    setDescription(profile.description);
  }, [profile.description]);

  async function loadVersions() {
    setLoadingVersions(true);
    onError('');
    try {
      const data = await fetchCvProfileVersions(profile.id);
      setVersions(data);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to load versions');
    } finally {
      setLoadingVersions(false);
    }
  }

  async function toggleVersions() {
    const next = !versionsOpen;
    setVersionsOpen(next);
    if (next) await loadVersions();
  }

  async function handleSaveDescription() {
    if (description.trim() === profile.description) return;
    setSavingDesc(true);
    onError('');
    try {
      await updateCvProfileDescription(profile.id, description);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to update description');
    } finally {
      setSavingDesc(false);
    }
  }

  async function handleUploadVersion(file: File) {
    setUploading(true);
    onError('');
    try {
      await uploadCvVersion(profile.id, file);
      if (versionsOpen) await loadVersions();
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to upload version');
    } finally {
      setUploading(false);
      if (versionInputRef.current) versionInputRef.current.value = '';
    }
  }

  async function handleDeleteVersion(versionId: string) {
    onError('');
    try {
      await deleteCvVersion(versionId);
      await loadVersions();
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to delete version');
    }
  }

  async function openApplicationsModal(title: string, fetcher: () => Promise<CvLinkedApplication[]>) {
    setAppsModalTitle(title);
    setAppsModalApps([]);
    setAppsModalError('');
    setAppsModalOpen(true);
    setAppsModalLoading(true);
    onError('');
    try {
      const apps = await fetcher();
      setAppsModalApps(apps);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load applications';
      setAppsModalError(message);
      onError(message);
    } finally {
      setAppsModalLoading(false);
    }
  }

  function openProfileApplications() {
    void openApplicationsModal('Applications using this CV profile', () =>
      fetchCvProfileApplications(profile.id),
    );
  }

  function openVersionApplications(version: CvVersionWithRefs) {
    void openApplicationsModal(`Applications using ${version.originalFilename}`, () =>
      fetchCvVersionApplications(version.id),
    );
  }

  return (
    <article className="cv-profile-card">
      <CvApplicationsModal
        isOpen={appsModalOpen}
        title={appsModalTitle}
        applications={appsModalApps}
        loading={appsModalLoading}
        error={appsModalError || undefined}
        onClose={() => setAppsModalOpen(false)}
      />      <div className="cv-profile-card-header">
        <h3 className="cv-profile-card-title">CV profile</h3>
        <span className="cv-profile-card-meta">
          {profile.versionCount} version{profile.versionCount === 1 ? '' : 's'}
          {' · '}
          <UsedByApplicationsLabel
            count={profile.applicationCount ?? 0}
            onClick={
              (profile.applicationCount ?? 0) > 0 ? openProfileApplications : undefined
            }
          />
        </span>      </div>

      <div className="form-field">
        <label htmlFor={`cv-desc-${profile.id}`}>When is this CV relevant?</label>
        <textarea
          id={`cv-desc-${profile.id}`}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-sm"
          onClick={handleSaveDescription}
          disabled={savingDesc || description.trim() === profile.description}
        >
          {savingDesc ? 'Saving…' : 'Save description'}
        </button>
      </div>

      <div className="cv-profile-current">
        <strong>Current file:</strong> {profile.currentVersion.originalFilename}
        <span className="cv-profile-date">
          uploaded {formatUploadedAt(profile.currentVersion.uploadedAt)}
        </span>
        <a
          className="cv-version-view-link"
          href={cvViewerUrl(profile.currentVersion.id)}
          target="_blank"
          rel="noopener noreferrer"
        >
          View
        </a>
      </div>

      <div className="cv-profile-actions">
        <input
          ref={versionInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="cv-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUploadVersion(file);
          }}
          disabled={uploading}
        />
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => versionInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Upload new version'}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => void toggleVersions()}>
          {versionsOpen ? 'Hide version history' : 'Version history'}
        </button>
      </div>

      {versionsOpen ? (
        <div className="cv-version-list">
          {loadingVersions ? (
            <p className="cv-muted">Loading versions…</p>
          ) : versions.length === 0 ? (
            <p className="cv-muted">No versions found.</p>
          ) : (
            <ul>
              {versions.map((v) => (
                <li key={v.id} className="cv-version-row">
                  <div>
                    <span className="cv-version-filename">{v.originalFilename}</span>
                    <span className="cv-version-date">{formatUploadedAt(v.uploadedAt)}</span>
                    <span className="cv-version-refs">
                      <UsedByApplicationsLabel
                        count={v.referenceCount}
                        onClick={v.referenceCount > 0 ? () => openVersionApplications(v) : undefined}
                      />
                    </span>                  </div>
                  <div className="cv-version-row-actions">
                    <a
                      className="btn btn-sm"
                      href={cvViewerUrl(v.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      disabled={v.referenceCount > 0}
                      title={
                        v.referenceCount > 0
                          ? 'Cannot delete while applications reference this version'
                          : 'Delete this version'
                      }
                      onClick={() => void handleDeleteVersion(v.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </article>
  );
}

export function CvTrackerPage({ onError }: CvTrackerPageProps) {
  const [profiles, setProfiles] = useState<CvProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  async function loadProfiles() {
    setLoading(true);
    onError('');
    try {
      const data = await fetchCvProfiles();
      setProfiles(data);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to load CV profiles');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfiles();
  }, []);

  return (
    <section className="cv-tracker">
      <div className="board-toolbar">
        <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          + Add CV profile
        </button>
      </div>

      <CvCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void loadProfiles()}
        onError={onError}
      />

      <div className="cv-profile-list">
        <h2>Your CV profiles</h2>
        {loading ? (
          <p className="cv-muted">Loading…</p>
        ) : profiles.length === 0 ? (
          <p className="cv-muted">
            No CV profiles yet. Click <strong>+ Add CV profile</strong> to upload your first CV.
          </p>
        ) : (
          profiles.map((p) => (
            <CvProfileCard
              key={p.id}
              profile={p}
              onError={onError}
              onChanged={() => void loadProfiles()}
            />
          ))
        )}
      </div>
    </section>
  );
}
