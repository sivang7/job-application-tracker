import { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { Application, ApplicationStatus, FollowUpReminder } from '@jat/shared';
import { APPLICATION_STATUS_ORDER, isApplicationStatus } from '@jat/shared';
import {
  ApiError,
  deleteApplication,
  fetchApplications,
  fetchFollowUps,
  updateApplication,
} from '../api';
import { ApplicationDetailModal } from './ApplicationDetailModal';
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

function remindersToMap(reminders: FollowUpReminder[]): Map<string, FollowUpReminder> {
  return new Map(reminders.map((r) => [r.applicationId, r]));
}

export function KanbanBoard({ refreshKey, onError }: KanbanBoardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [remindersByAppId, setRemindersByAppId] = useState<Map<string, FollowUpReminder>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    onError('');
    try {
      const [apps, followUps] = await Promise.all([fetchApplications(), fetchFollowUps()]);
      setApplications(apps);
      setRemindersByAppId(remindersToMap(followUps.reminders));
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const selectedApplication = useMemo(() => {
    if (!selectedApp) return null;
    return applications.find((a) => a.id === selectedApp.id) ?? selectedApp;
  }, [applications, selectedApp]);

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
      if (selectedApp?.id === id) {
        setDetailOpen(false);
        setSelectedApp(null);
      }
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to delete application');
    }
  }

  function handleOpen(application: Application) {
    setSelectedApp(application);
    setDetailOpen(true);
  }

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  function handleSaved(updated: Application) {
    setApplications((apps) => apps.map((a) => (a.id === updated.id ? updated : a)));
    void load();
  }

  if (loading) {
    return <p className="loading">Loading applications…</p>;
  }

  const grouped = groupByStatus(applications);

  return (
    <>
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
              remindersByAppId={remindersByAppId}
              onDelete={handleDelete}
              onOpen={handleOpen}
            />
          ))}
        </div>
        <DragOverlay>
          {activeApp ? (
            <ApplicationCard
              application={activeApp}
              reminder={remindersByAppId.get(activeApp.id)}
              onDelete={() => {}}
              onOpen={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <ApplicationDetailModal
        application={selectedApplication}
        isOpen={detailOpen}
        onClose={handleCloseDetail}
        onSaved={handleSaved}
        onError={onError}
      />
    </>
  );
}
