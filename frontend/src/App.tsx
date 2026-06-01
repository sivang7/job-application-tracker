import { useEffect, useState } from 'react';
import { checkHealth } from './api';
import { ApplicationForm } from './components/ApplicationForm';
import { KanbanBoard } from './components/KanbanBoard';
import './App.css';

type HealthState = 'checking' | 'ok' | 'unreachable';

export function App() {
  const [health, setHealth] = useState<HealthState>('checking');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    checkHealth().then((ok) => {
      if (!cancelled) {
        setHealth(ok ? 'ok' : 'unreachable');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const healthClass =
    health === 'ok' ? 'health-ok' : health === 'unreachable' ? 'health-bad' : 'health-checking';

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>Job Application Tracker</h1>
          <p className="app-subtitle">Kanban board — drag cards between columns to update status</p>
        </div>
        <span className={`health-badge ${healthClass}`}>
          <span className="health-dot" aria-hidden />
          Backend {health === 'checking' ? '…' : health}
        </span>
      </header>

      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}

      <ApplicationForm
        onCreated={() => setRefreshKey((k) => k + 1)}
        onError={setError}
      />

      <KanbanBoard refreshKey={refreshKey} onError={setError} />
    </main>
  );
}
