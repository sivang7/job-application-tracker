import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { renderAsync } from 'docx-preview';
import type { CvVersion } from '@jat/shared';
import { ApiError, cvFileUrl, fetchCvVersion } from '../api';

function formatUploadedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function CvViewerPage() {
  const { versionId } = useParams<{ versionId: string }>();
  const [version, setVersion] = useState<CvVersion | null>(null);
  const [loadError, setLoadError] = useState('');
  const [renderError, setRenderError] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const pdfBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!versionId) {
      setLoadError('Missing CV version id');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError('');
      setRenderError('');

      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
        pdfBlobUrlRef.current = null;
        setPdfBlobUrl(null);
      }
      if (docxContainerRef.current) {
        docxContainerRef.current.innerHTML = '';
      }

      try {
        const meta = await fetchCvVersion(versionId!);
        if (cancelled) return;
        setVersion(meta);

        const fileRes = await fetch(cvFileUrl(versionId!));
        if (!fileRes.ok) {
          throw new ApiError('Failed to load CV file', fileRes.status);
        }

        if (meta.mimeType === 'application/pdf') {
          const blob = await fileRes.blob();
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          pdfBlobUrlRef.current = url;
          setPdfBlobUrl(url);
        } else {
          const buffer = await fileRes.arrayBuffer();
          if (cancelled || !docxContainerRef.current) return;
          try {
            await renderAsync(buffer, docxContainerRef.current, undefined, {
              inWrapper: true,
              className: 'docx',
            });
          } catch {
            setRenderError('Could not render this document. Try downloading the file instead.');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : 'Failed to load CV');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [versionId]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    document.title = version
      ? `${version.originalFilename} | CV Viewer`
      : 'CV Viewer | Job Application Tracker';
  }, [version]);

  const isDocx =
    version?.mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  return (
    <section className="cv-viewer">
      <header className="cv-viewer-header">
        <div>
          <Link to="/cvs" className="cv-viewer-back">
            ← Back to CV Tracker
          </Link>
          {version ? (
            <>
              <h2 className="cv-viewer-title">{version.originalFilename}</h2>
              <p className="cv-muted">Uploaded {formatUploadedAt(version.uploadedAt)}</p>
            </>
          ) : null}
        </div>
        {version ? (
          <a
            className="btn btn-primary"
            href={cvFileUrl(version.id, { download: true })}
            download={version.originalFilename}
          >
            Download
          </a>
        ) : null}
      </header>

      {loading ? <p className="cv-muted">Loading preview…</p> : null}
      {loadError ? (
        <p className="form-summary-error" role="alert">
          {loadError}
        </p>
      ) : null}
      {renderError ? (
        <p className="form-summary-error" role="alert">
          {renderError}
        </p>
      ) : null}

      {pdfBlobUrl ? (
        <iframe
          className="cv-viewer-pdf"
          title={version?.originalFilename ?? 'CV preview'}
          src={pdfBlobUrl}
        />
      ) : null}

      {isDocx ? <div ref={docxContainerRef} className="cv-viewer-docx" /> : null}
    </section>
  );
}
