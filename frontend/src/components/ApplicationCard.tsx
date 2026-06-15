import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Application, FollowUpReminder } from '@jat/shared';
import { cardDateLabel, contactSubtitle } from '../cardDateLabel';

interface ApplicationCardProps {
  application: Application;
  reminder?: FollowUpReminder;
  onDelete: (id: string) => void;
  onOpen: (application: Application) => void;
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function ApplicationCard({
  application,
  reminder,
  onDelete,
  onOpen,
}: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } =
    useDraggable({
      id: application.id,
      data: { application },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const dateLabel = cardDateLabel(application);
  const contactLine = contactSubtitle(application);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`application-card${isDragging ? ' application-card--dragging' : ''}`}
    >
      <button
        type="button"
        className="application-card-delete"
        title="Delete application"
        aria-label="Delete application"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(application.id)}
      >
        <TrashIcon />
      </button>
      <div className="application-card-layout">
        <button
          type="button"
          className="application-card-drag-handle"
          ref={setActivatorNodeRef}
          aria-label="Drag to move"
          {...listeners}
          {...attributes}
        >
          ⠿
        </button>
        <div
          className="application-card-body"
          role="button"
          tabIndex={0}
          onClick={() => onOpen(application)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpen(application);
            }
          }}
        >
          <div className="application-card-company">
            {application.company}
            {application.link ? (
              <a
                className="application-card-link-icon"
                href={application.link}
                target="_blank"
                rel="noopener noreferrer"
                title="Open posting"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                ↗
              </a>
            ) : null}
          </div>
          <div className="application-card-role">{application.role}</div>
          {contactLine ? <div className="application-card-contact">{contactLine}</div> : null}
          <div className="application-card-badges">
            {dateLabel ? <span className="badge badge-date">{dateLabel}</span> : null}
            {reminder ? (
              <span className={`badge badge-urgency badge-urgency--${reminder.urgency}`}>
                {reminder.daysOverdue}d overdue
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
