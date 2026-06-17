import { useDroppable } from '@dnd-kit/core';
import type { ApplicationStatus, ApplicationWithCv, FollowUpReminder } from '@jat/shared';
import { ApplicationCard } from './ApplicationCard';

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: ApplicationWithCv[];
  remindersByAppId: Map<string, FollowUpReminder>;
  onDelete: (id: string) => void;
  onOpen: (application: ApplicationWithCv) => void;
}

export function KanbanColumn({
  status,
  applications,
  remindersByAppId,
  onDelete,
  onOpen,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column${isOver ? ' kanban-column--over' : ''}`}
      aria-label={`${status} column`}
    >
      <header className="kanban-column-header">
        {status}{' '}
        <span className="kanban-column-count">({applications.length})</span>
      </header>
      <div className="kanban-column-body">
        {applications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            reminder={remindersByAppId.get(app.id)}
            onDelete={onDelete}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}
