import { useEffect, useState } from 'react';
import { checkHealth } from './api';

type HealthState = 'checking' | 'ok' | 'unreachable';

export function App() {
  const [health, setHealth] = useState<HealthState>('checking');

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

  const statusColor =
    health === 'ok' ? '#16a34a' : health === 'unreachable' ? '#dc2626' : '#9ca3af';

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '4rem auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Job Application Tracker</h1>
      <p style={{ color: '#6b7280', marginTop: 0 }}>Squad sandbox - skeleton</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
        <span style={{ fontWeight: 600 }}>Backend status:</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: statusColor }}>
          <span
            aria-hidden
            style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, display: 'inline-block' }}
          />
          {health === 'checking' ? 'checking...' : health}
        </span>
      </div>
    </main>
  );
}
