import { useDroppable } from '@dnd-kit/core';
import type { Application, ApplicationStatus } from '@jat/shared';
import { ApplicationCard } from './ApplicationCard';

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
  onDelete: (id: string) => void;
}

export function KanbanColumn({ status, applications, onDelete }: KanbanColumnProps) {
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
          <ApplicationCard key={app.id} application={app} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
}
