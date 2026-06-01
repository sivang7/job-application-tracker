import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { Application, ApplicationStatus } from '@jat/shared';
import { APPLICATION_STATUS_ORDER, isApplicationStatus } from '@jat/shared';
import {
  ApiError,
  deleteApplication,
  fetchApplications,
  updateApplication,
} from '../api';
import { KanbanColumn } from './KanbanColumn';
import { ApplicationCard } from './ApplicationCard';

interface KanbanBoardProps {
  refreshKey: number;
  onError: (message: string) => void;
}

function groupByStatus(applications: Application[]): Record<ApplicationStatus, Application[]> {
  const groups = Object.fromEntries(
    APPLICATION_STATUS_ORDER.map((status) => [status, [] as Application[]]),
  ) as Record<ApplicationStatus, Application[]>;

  for (const app of applications) {
    groups[app.status].push(app);
  }
  return groups;
}

function resolveDropStatus(
  applications: Application[],
  overId: string,
): ApplicationStatus | null {
  if (isApplicationStatus(overId)) return overId;
  const overApp = applications.find((a) => a.id === overId);
  return overApp?.status ?? null;
}

export function KanbanBoard({ refreshKey, onError }: KanbanBoardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeApp, setActiveApp] = useState<Application | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    onError('');
    try {
      const apps = await fetchApplications();
      setApplications(apps);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  function handleDragStart(event: DragStartEvent) {
    const app = applications.find((a) => a.id === event.active.id);
    setActiveApp(app ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveApp(null);
    const { active, over } = event;
    if (!over) return;

    const appId = String(active.id);
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const newStatus = resolveDropStatus(applications, String(over.id));
    if (!newStatus || app.status === newStatus) return;

    const previous = applications;
    setApplications((apps) =>
      apps.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)),
    );

    try {
      const updated = await updateApplication(appId, { status: newStatus });
      setApplications((apps) => apps.map((a) => (a.id === appId ? updated : a)));
    } catch (err) {
      setApplications(previous);
      onError(err instanceof ApiError ? err.message : 'Failed to update status');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this application?')) return;

    onError('');
    try {
      await deleteApplication(id);
      setApplications((apps) => apps.filter((a) => a.id !== id));
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to delete application');
    }
  }

  if (loading) {
    return <p className="loading">Loading applications…</p>;
  }

  const grouped = groupByStatus(applications);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {APPLICATION_STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            applications={grouped[status]}
            onDelete={handleDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {activeApp ? (
          <ApplicationCard application={activeApp} onDelete={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
