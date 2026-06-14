import { useEffect, useState } from 'react';
import { ApiError, fetchApplications, fetchFollowUps } from '../api';
import {
  applicationsByMonth,
  computeApplicationStats,
  summarizeFollowUps,
  type ApplicationStats,
  type FollowUpSummary,
} from '../stats';
import { ApplicationsTimelineChart } from './ApplicationsTimelineChart';
import { StatusChart } from './StatusChart';

interface StatsDashboardProps {
  refreshKey: number;
  onError: (message: string) => void;
}

function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(1)}%`;
}

function formatUrgencyCount(summary: FollowUpSummary | null, urgency: 'low' | 'medium' | 'high') {
  if (!summary) return '—';
  return String(summary.byUrgency[urgency]);
}

export function StatsDashboard({ refreshKey, onError }: StatsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [applicationStats, setApplicationStats] = useState<ApplicationStats | null>(null);
  const [timelineData, setTimelineData] = useState<Array<{ month: string; count: number }>>([]);
  const [followUps, setFollowUps] = useState<FollowUpSummary | null>(null);
  const [followUpsFailed, setFollowUpsFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setLoading(true);
      setFollowUpsFailed(false);
      onError('');

      const [applicationsResult, followUpsResult] = await Promise.allSettled([
        fetchApplications(),
        fetchFollowUps(),
      ]);

      if (cancelled) return;

      if (applicationsResult.status === 'rejected') {
        setApplicationStats(null);
        setTimelineData([]);
        onError(
          applicationsResult.reason instanceof ApiError
            ? applicationsResult.reason.message
            : 'Failed to load application statistics',
        );
        setLoading(false);
        return;
      }

      const apps = applicationsResult.value;
      setApplicationStats(computeApplicationStats(apps));
      setTimelineData(applicationsByMonth(apps));

      if (followUpsResult.status === 'fulfilled') {
        setFollowUps(summarizeFollowUps(followUpsResult.value.reminders));
      } else {
        setFollowUps(null);
        setFollowUpsFailed(true);
        onError(
          followUpsResult.reason instanceof ApiError
            ? followUpsResult.reason.message
            : 'Failed to load follow-up reminders',
        );
      }

      setLoading(false);
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [onError, refreshKey]);

  if (loading) {
    return <p className="loading">Loading statistics…</p>;
  }

  if (!applicationStats) {
    return (
      <section className="stats-card">
        <h2>Stats unavailable</h2>
        <p>Application statistics could not be loaded.</p>
      </section>
    );
  }

  return (
    <div className="stats-layout">
      <section aria-labelledby="stats-summary-heading">
        <h2 id="stats-summary-heading">Summary</h2>
        <div className="stats-grid">
          <article className="stats-card">
            <h3>Total applications</h3>
            <p className="stats-value">{applicationStats.total}</p>
          </article>
          <article className="stats-card">
            <h3>In pipeline</h3>
            <p className="stats-value">{applicationStats.inPipeline}</p>
          </article>
          <article className="stats-card">
            <h3>Interview rate</h3>
            <p className="stats-value">{formatPercent(applicationStats.interviewRate)}</p>
          </article>
          <article className="stats-card">
            <h3>Overdue follow-ups</h3>
            <p className="stats-value">{followUps ? followUps.total : '—'}</p>
            {followUpsFailed ? (
              <p className="stats-note">Follow-up data unavailable right now.</p>
            ) : null}
          </article>
        </div>
      </section>

      <section aria-labelledby="stats-status-heading">
        <h2 id="stats-status-heading">Applications by status</h2>
        <StatusChart byStatus={applicationStats.byStatus} total={applicationStats.total} />
      </section>

      {timelineData.length > 0 ? (
        <section aria-labelledby="stats-timeline-heading">
          <h2 id="stats-timeline-heading">Applications over time</h2>
          <ApplicationsTimelineChart data={timelineData} />
        </section>
      ) : null}

      <section aria-labelledby="stats-urgency-heading">
        <h2 id="stats-urgency-heading">Overdue follow-ups by urgency</h2>
        <div className="stats-grid stats-grid--three">
          <article className="stats-card">
            <h3>Low urgency</h3>
            <p className="stats-value">{formatUrgencyCount(followUps, 'low')}</p>
          </article>
          <article className="stats-card">
            <h3>Medium urgency</h3>
            <p className="stats-value">{formatUrgencyCount(followUps, 'medium')}</p>
          </article>
          <article className="stats-card">
            <h3>High urgency</h3>
            <p className="stats-value">{formatUrgencyCount(followUps, 'high')}</p>
          </article>
        </div>
      </section>
    </div>
  );
}
