import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Application } from '@jat/shared';

interface ApplicationCardProps {
  application: Application;
  onDelete: (id: string) => void;
}

export function ApplicationCard({ application, onDelete }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { application },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`application-card${isDragging ? ' application-card--dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <div className="application-card-company">{application.company}</div>
      <div className="application-card-role">{application.role}</div>
      <div className="application-card-actions">
        <button
          type="button"
          className="btn btn-danger"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(application.id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
