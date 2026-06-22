import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ReactDiffViewer from 'react-diff-viewer-continued';
import type { CvVersionCompareResult } from '@jat/shared';
import { ApiError, cvViewerUrl, fetchCvVersionCompare } from '../api';

function formatUploadedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function sideLabel(side: CvVersionCompareResult['from']): string {
  return `${side.profileDescription} — ${side.version.originalFilename}`;
}

export function CvComparePage() {
  const [searchParams] = useSearchParams();
  const fromId = searchParams.get('from') ?? '';
  const toId = searchParams.get('to') ?? '';

  const [result, setResult] = useState<CvVersionCompareResult | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [splitView, setSplitView] = useState(false);

  useEffect(() => {
    if (!fromId || !toId) {
      setLoadError('Select two versions to compare');
      setLoading(false);
      setResult(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const data = await fetchCvVersionCompare(fromId, toId);
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : 'Failed to compare CVs');
          setResult(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [fromId, toId]);

  useEffect(() => {
    document.title = result
      ? `Compare CVs | Job Application Tracker`
      : 'Compare CVs | Job Application Tracker';
  }, [result]);

  return (
    <section className="cv-compare">
      <header className="cv-compare-header">
        <div>
          <Link to="/cvs" className="cv-viewer-back">
            ← Back to CV Tracker
          </Link>
          <h2 className="cv-compare-title">Compare CV versions</h2>
          <p className="cv-muted cv-compare-hint">
            Text-only diff — layout and images are not compared. Scanned PDFs may show little or no
            text.
          </p>
        </div>
        {result ? (
          <div className="cv-compare-view-toggle">
            <button
              type="button"
              className={`btn btn-sm${splitView ? ' btn-primary' : ''}`}
              onClick={() => setSplitView(true)}
            >
              Split
            </button>
            <button
              type="button"
              className={`btn btn-sm${!splitView ? ' btn-primary' : ''}`}
              onClick={() => setSplitView(false)}
            >
              Unified
            </button>
          </div>
        ) : null}
      </header>

      {loading ? <p className="cv-muted">Loading comparison…</p> : null}
      {loadError ? (
        <p className="form-summary-error" role="alert">
          {loadError}
        </p>
      ) : null}

      {result ? (
        <>
          <div className="cv-compare-labels">
            <div className="cv-compare-side">
              <span className="cv-compare-side-tag">Older</span>
              <strong>{sideLabel(result.from)}</strong>
              <span className="cv-muted">
                Uploaded {formatUploadedAt(result.from.version.uploadedAt)}
              </span>
              <a
                href={cvViewerUrl(result.from.version.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="cv-version-view-link"
              >
                View file ↗
              </a>
            </div>
            <div className="cv-compare-side">
              <span className="cv-compare-side-tag">Newer</span>
              <strong>{sideLabel(result.to)}</strong>
              <span className="cv-muted">
                Uploaded {formatUploadedAt(result.to.version.uploadedAt)}
              </span>
              <a
                href={cvViewerUrl(result.to.version.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="cv-version-view-link"
              >
                View file ↗
              </a>
            </div>
          </div>
          <div className="cv-compare-diff">
            <ReactDiffViewer
              oldValue={result.fromText}
              newValue={result.toText}
              splitView={splitView}
              useDarkTheme={false}
              leftTitle={sideLabel(result.from)}
              rightTitle={sideLabel(result.to)}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}
