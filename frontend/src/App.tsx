import { useEffect, useState } from 'react';
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { checkHealth } from './api';
import { ApplicationForm } from './components/ApplicationForm';
import { KanbanBoard } from './components/KanbanBoard';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { StatsDashboard } from './components/StatsDashboard';
import { CvTrackerPage } from './components/CvTrackerPage';
import { CvViewerPage } from './components/CvViewerPage';
import './App.css';

type HealthState = 'checking' | 'ok' | 'unreachable';

export function App() {
  const [health, setHealth] = useState<HealthState>('checking');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const location = useLocation();

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

  useEffect(() => {
    setError('');
  }, [location.pathname]);

  const healthClass =
    health === 'ok' ? 'health-ok' : health === 'unreachable' ? 'health-bad' : 'health-checking';
  const isStatsRoute = location.pathname === '/stats';
  const isCvsRoute = location.pathname.startsWith('/cvs');
  const isCvViewerRoute = location.pathname.startsWith('/cvs/view/');

  useEffect(() => {
    document.title = isCvViewerRoute
      ? 'CV Viewer | Job Application Tracker'
      : isStatsRoute
        ? 'Stats | Job Application Tracker'
        : isCvsRoute
          ? 'CV Tracker | Job Application Tracker'
          : 'Board | Job Application Tracker';
  }, [isStatsRoute, isCvsRoute, isCvViewerRoute]);

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>Job Application Tracker</h1>
          <p className="app-subtitle">
            {isStatsRoute
              ? 'Stats dashboard — pipeline and follow-up insights'
              : isCvViewerRoute
                ? 'CV viewer — preview and download resume files'
                : isCvsRoute
                  ? 'CV Tracker — manage resume versions and link them to applications'
                  : 'Kanban board — drag cards between columns to update status'}
          </p>
        </div>
        <div className="header-right">
          <nav aria-label="Main" className="main-nav">
            <NavLink
              to="/board"
              className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
            >
              Board
            </NavLink>
            <NavLink
              to="/stats"
              className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
            >
              Stats
            </NavLink>
            <NavLink
              to="/cvs"
              className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
            >
              CV Tracker
            </NavLink>
          </nav>
          <span className={`health-badge ${healthClass}`}>
            <span className="health-dot" aria-hidden />
            Backend {health === 'checking' ? '…' : health}
          </span>
        </div>
      </header>

      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}

      <Routes>
        <Route path="/" element={<Navigate to="/board" replace />} />
        <Route
          path="/board"
          element={
            <RouteErrorBoundary routeName="Board">
              <BoardPage
                refreshKey={refreshKey}
                onCreated={() => setRefreshKey((k) => k + 1)}
                onError={setError}
              />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/stats"
          element={
            <RouteErrorBoundary routeName="Stats">
              <StatsDashboard refreshKey={refreshKey} onError={setError} />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/cvs/view/:versionId"
          element={
            <RouteErrorBoundary routeName="CV Viewer">
              <CvViewerPage />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/cvs"
          element={
            <RouteErrorBoundary routeName="CV Tracker">
              <CvTrackerPage onError={setError} />
            </RouteErrorBoundary>
          }
        />
        <Route path="*" element={<Navigate to="/board" replace />} />
      </Routes>
    </main>
  );
}

interface BoardPageProps {
  refreshKey: number;
  onCreated: () => void;
  onError: (message: string) => void;
}

function BoardPage({ refreshKey, onCreated, onError }: BoardPageProps) {
  return (
    <>
      <ApplicationForm onCreated={onCreated} onError={onError} />
      <KanbanBoard refreshKey={refreshKey} onError={onError} />
    </>
  );
}
