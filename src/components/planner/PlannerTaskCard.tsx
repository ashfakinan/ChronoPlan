import React from 'react';
import {
  CheckCircle2,
  Circle,
  Check,
  GripVertical,
  FileText,
} from 'lucide-react';
import { PlannerTask, Subject } from '../../types';

interface PlannerTaskCardProps {
  task: PlannerTask;
  subject?: Subject;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleComplete: (taskId: string) => void;
  onToggleSelect?: (taskId: string) => void;
  onEdit: (task: PlannerTask) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, task: PlannerTask) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
  compact?: boolean;
}

export function PlannerTaskCard({
  task,
  subject,
  isSelected = false,
  isSelectionMode = false,
  onToggleComplete,
  onToggleSelect,
  onEdit,
  onDragStart,
  onDragEnd,
  isDragging = false,
  compact = false,
}: PlannerTaskCardProps) {
  const isDone = task.isCompleted;

  return (
    <div
      draggable={!isSelectionMode}
      onDragStart={(e) => onDragStart?.(e, task)}
      onDragEnd={onDragEnd}
      style={{
        borderLeftWidth: subject ? '3px' : '1px',
        borderLeftColor: subject ? subject.color : undefined,
      }}
      className={`group/card relative rounded-lg border text-xs transition-all select-none ${
        compact ? 'p-1.5' : 'p-2'
      } ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/70 dark:bg-blue-950/30'
          : isDone
          ? 'bg-[#f4f2ec]/60 dark:bg-[#15161a] border-[#e5e2da] dark:border-[#292b34] opacity-65'
          : 'bg-[#fdfcf9] dark:bg-[#1c1d22] border-[#e5e2da] dark:border-[#292b34] hover:border-[#cfcac0] dark:hover:border-[#3c3f4c] shadow-2xs'
      } ${isDragging ? 'opacity-40 scale-95' : ''}`}
    >
      <div className="flex items-start gap-1.5">
        {/* Selection Checkbox in selection mode */}
        {isSelectionMode && onToggleSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(task.id);
            }}
            className="w-5 h-5 -ml-0.5 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 rounded-md hover:bg-blue-500/10 cursor-pointer"
            aria-label={isSelected ? 'Deselect task' : 'Select task'}
          >
            {isSelected ? (
              <div className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded border-2 border-[#8c909c] dark:border-[#525666] bg-transparent" />
            )}
          </button>
        )}

        {/* Complete Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task.id);
          }}
          className="text-[#8c909c] hover:text-emerald-600 transition-colors shrink-0 mt-0.5 cursor-pointer p-0.5 -m-0.5"
          aria-label={isDone ? 'Mark incomplete' : 'Mark done'}
        >
          {isDone ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Circle className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Task Content */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => {
            if (isSelectionMode && onToggleSelect) {
              onToggleSelect(task.id);
            } else {
              onEdit(task);
            }
          }}
        >
          <span
            className={`block break-words font-medium leading-snug ${
              isDone
                ? 'line-through text-[#8c909c] dark:text-[#727784]'
                : 'text-[#1f2126] dark:text-[#eceef2]'
            }`}
          >
            {task.title}
          </span>

          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {subject && (
              <span
                className="inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold tracking-wide"
                style={{
                  backgroundColor: `${subject.color}18`,
                  color: subject.color,
                }}
              >
                {subject.name}
              </span>
            )}

            {task.notes && (
              <span
                className="flex items-center gap-0.5 text-[9px] text-[#8c909c] dark:text-[#6e7380]"
                title={task.notes}
              >
                <FileText className="w-2.5 h-2.5" />
                <span className="truncate max-w-[90px]">{task.notes}</span>
              </span>
            )}
          </div>
        </div>

        {/* Drag handle hint for desktop */}
        {!isSelectionMode && (
          <div className="opacity-0 group-hover/card:opacity-40 hover:!opacity-100 transition-opacity cursor-grab text-[#8c909c] shrink-0 pt-0.5">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}
