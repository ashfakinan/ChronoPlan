import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { PlannerTask, Subject } from '../../types';
import { PlannerTaskCard } from './PlannerTaskCard';
import {
  formatShortDate,
  getWeekdayName,
  isToday,
} from '../../utils/dateUtils';

interface PlannerMatrixTableProps {
  days: string[];
  dayParts: string[];
  tasks: PlannerTask[];
  subjects: Subject[];
  matrixOrientation: 'days-on-left' | 'days-on-top';
  zoom: number;
  selectedTaskIds: Set<string>;
  isSelectionMode: boolean;
  onToggleTaskSelect: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: PlannerTask) => void;
  onOpenAddTask: (date: string, dayPart: string) => void;
  onMoveTask: (
    taskId: string,
    targetDate: string,
    targetDayPart: string,
    targetTaskId?: string,
    position?: 'before' | 'after'
  ) => Promise<void>;
  onOpenDailyDetail: (date: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function PlannerMatrixTable({
  days,
  dayParts,
  tasks,
  subjects,
  matrixOrientation,
  zoom,
  selectedTaskIds,
  isSelectionMode,
  onToggleTaskSelect,
  onToggleComplete,
  onEditTask,
  onOpenAddTask,
  onMoveTask,
  onOpenDailyDetail,
  scrollRef,
}: PlannerMatrixTableProps) {
  const [draggedTask, setDraggedTask] = useState<PlannerTask | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ date: string; dayPart: string } | null>(null);

  const getSubject = (subjectId: string) => subjects.find((s) => s.id === subjectId);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: PlannerTask) => {
    setDraggedTask(task);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>, date: string, dayPart: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverCell || dragOverCell.date !== date || dragOverCell.dayPart !== dayPart) {
      setDragOverCell({ date, dayPart });
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLTableCellElement>, date: string, dayPart: string) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!draggedTask) return;
    if (draggedTask.date === date && draggedTask.dayPart === dayPart) {
      setDraggedTask(null);
      return;
    }
    await onMoveTask(draggedTask.id, date, dayPart);
    setDraggedTask(null);
  };

  // Zoom factor scaling
  const zoomFactor = zoom / 100;
  const cellMinWidth = Math.round(180 * zoomFactor);

  if (matrixOrientation === 'days-on-left') {
    // Days on left (Rows = Days, Columns = Day-Parts)
    return (
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto bg-[#f8f6f1] dark:bg-[#121317] relative select-text"
      >
        <table className="w-full border-collapse text-left table-fixed">
          {/* Header Row: Corner Cell + Day-Parts */}
          <thead className="sticky top-0 z-20 bg-[#f4f2ec] dark:bg-[#1a1b20] border-b border-[#e5e2da] dark:border-[#292b34] shadow-2xs">
            <tr>
              <th
                className="sticky left-0 z-30 bg-[#f4f2ec] dark:bg-[#1a1b20] p-2.5 border-r border-[#e5e2da] dark:border-[#292b34] text-[11px] font-bold text-[#606470] dark:text-[#9aa0ae] uppercase tracking-wider"
                style={{ width: `${Math.round(140 * zoomFactor)}px` }}
              >
                Date / Day-Part
              </th>
              {dayParts.map((dp) => (
                <th
                  key={dp}
                  data-daypart-header={dp}
                  className="p-2.5 border-r border-[#e5e2da] dark:border-[#292b34] text-xs font-bold text-[#1f2126] dark:text-[#eceef2] text-center uppercase tracking-wide truncate"
                  style={{ minWidth: `${cellMinWidth}px` }}
                >
                  {dp}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body Rows: One row per Date */}
          <tbody className="divide-y divide-[#e5e2da] dark:divide-[#292b34]">
            {days.map((dateStr) => {
              const isCurrent = isToday(dateStr);
              const dayTasks = tasks.filter((t) => t.date === dateStr);
              const doneCount = dayTasks.filter((t) => t.isCompleted).length;

              return (
                <tr
                  key={dateStr}
                  className={`transition-colors ${
                    isCurrent ? 'bg-blue-500/[0.03] dark:bg-blue-500/[0.05]' : ''
                  }`}
                >
                  {/* Sticky Date Row Header */}
                  <th
                    data-matrix-header-date={dateStr}
                    className={`sticky left-0 z-10 p-2.5 border-r border-[#e5e2da] dark:border-[#292b34] align-top transition-colors ${
                      isCurrent
                        ? 'bg-blue-50/90 dark:bg-blue-950/60 font-semibold text-blue-700 dark:text-blue-300'
                        : 'bg-[#f4f2ec] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2]'
                    }`}
                  >
                    <div
                      className="cursor-pointer group/date"
                      onClick={() => onOpenDailyDetail(dateStr)}
                      title="Click to view full day details"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-tight text-[#8c909c] group-hover/date:text-blue-600">
                          {getWeekdayName(dateStr).slice(0, 3)}
                        </span>
                        {isCurrent && (
                          <span className="px-1 py-0.2 rounded-xs bg-blue-600 text-white text-[8px] font-bold uppercase tracking-wider">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold leading-tight group-hover/date:text-blue-600 transition-colors">
                        {formatShortDate(dateStr)}
                      </div>
                      <div className="text-[10px] text-[#8c909c] font-normal mt-0.5">
                        {doneCount}/{dayTasks.length} done
                      </div>
                    </div>
                  </th>

                  {/* Intersecting Cells: Day-Parts */}
                  {dayParts.map((dayPart) => {
                    const cellTasks = dayTasks
                      .filter((t) => t.dayPart === dayPart)
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                    const isDragOver =
                      dragOverCell?.date === dateStr && dragOverCell?.dayPart === dayPart;

                    return (
                      <td
                        key={dayPart}
                        onDragOver={(e) => handleDragOver(e, dateStr, dayPart)}
                        onDrop={(e) => handleDrop(e, dateStr, dayPart)}
                        className={`p-2 border-r border-[#e5e2da] dark:border-[#292b34] align-top transition-colors group/cell min-h-[72px] ${
                          isDragOver
                            ? 'bg-blue-500/15 ring-2 ring-blue-500 ring-inset'
                            : isCurrent
                            ? 'bg-blue-500/[0.02]'
                            : 'bg-[#fdfcf9] dark:bg-[#16171c]'
                        }`}
                        style={{ minWidth: `${cellMinWidth}px` }}
                      >
                        {/* Tasks in cell */}
                        <div className="space-y-1.5 min-h-[44px]">
                          {cellTasks.map((task) => (
                            <PlannerTaskCard
                              key={task.id}
                              task={task}
                              subject={getSubject(task.subjectId)}
                              isSelected={selectedTaskIds.has(task.id)}
                              isSelectionMode={isSelectionMode || selectedTaskIds.size > 0}
                              onToggleComplete={onToggleComplete}
                              onToggleSelect={onToggleTaskSelect}
                              onEdit={onEditTask}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              isDragging={draggedTask?.id === task.id}
                              compact={zoom < 90}
                            />
                          ))}
                        </div>

                        {/* Quick Add Button */}
                        <button
                          type="button"
                          onClick={() => onOpenAddTask(dateStr, dayPart)}
                          className="w-full mt-1.5 py-1 border border-dashed border-[#e5e2da] dark:border-[#292b34] hover:border-blue-500 rounded-lg text-[10px] text-[#8c909c] hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1 transition-all opacity-0 group-hover/cell:opacity-100 cursor-pointer"
                          title={`Add task to ${dayPart}`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Days on top (Columns = Days, Rows = Day-Parts)
  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-auto bg-[#f8f6f1] dark:bg-[#121317] relative select-text"
    >
      <table className="w-full border-collapse text-left table-fixed">
        {/* Header Row: Corner Cell + Dates */}
        <thead className="sticky top-0 z-20 bg-[#f4f2ec] dark:bg-[#1a1b20] border-b border-[#e5e2da] dark:border-[#292b34] shadow-2xs">
          <tr>
            <th
              className="sticky left-0 z-30 bg-[#f4f2ec] dark:bg-[#1a1b20] p-2.5 border-r border-[#e5e2da] dark:border-[#292b34] text-[11px] font-bold text-[#606470] dark:text-[#9aa0ae] uppercase tracking-wider"
              style={{ width: `${Math.round(140 * zoomFactor)}px` }}
            >
              Day-Part / Date
            </th>
            {days.map((dateStr) => {
              const isCurrent = isToday(dateStr);
              return (
                <th
                  key={dateStr}
                  data-matrix-header-date={dateStr}
                  className={`p-2.5 border-r border-[#e5e2da] dark:border-[#292b34] text-center uppercase tracking-wide truncate ${
                    isCurrent
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold'
                      : 'text-[#1f2126] dark:text-[#eceef2] font-semibold'
                  }`}
                  style={{ minWidth: `${cellMinWidth}px` }}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => onOpenDailyDetail(dateStr)}
                  >
                    <div className="text-[10px] text-[#8c909c]">
                      {getWeekdayName(dateStr).slice(0, 3)}
                    </div>
                    <div className="text-xs font-bold leading-tight">
                      {formatShortDate(dateStr)}
                    </div>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Body Rows: One row per Day-Part */}
        <tbody className="divide-y divide-[#e5e2da] dark:divide-[#292b34]">
          {dayParts.map((dayPart) => (
            <tr key={dayPart}>
              {/* Sticky Day-Part Row Header */}
              <th
                data-daypart-header={dayPart}
                className="sticky left-0 z-10 p-2.5 bg-[#f4f2ec] dark:bg-[#1a1b20] border-r border-[#e5e2da] dark:border-[#292b34] align-top text-xs font-bold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wide"
              >
                {dayPart}
              </th>

              {/* Intersecting Cells: Dates */}
              {days.map((dateStr) => {
                const isCurrent = isToday(dateStr);
                const cellTasks = tasks
                  .filter((t) => t.date === dateStr && t.dayPart === dayPart)
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                const isDragOver =
                  dragOverCell?.date === dateStr && dragOverCell?.dayPart === dayPart;

                return (
                  <td
                    key={dateStr}
                    onDragOver={(e) => handleDragOver(e, dateStr, dayPart)}
                    onDrop={(e) => handleDrop(e, dateStr, dayPart)}
                    className={`p-2 border-r border-[#e5e2da] dark:border-[#292b34] align-top transition-colors group/cell min-h-[72px] ${
                      isDragOver
                        ? 'bg-blue-500/15 ring-2 ring-blue-500 ring-inset'
                        : isCurrent
                        ? 'bg-blue-500/[0.02]'
                        : 'bg-[#fdfcf9] dark:bg-[#16171c]'
                    }`}
                    style={{ minWidth: `${cellMinWidth}px` }}
                  >
                    <div className="space-y-1.5 min-h-[44px]">
                      {cellTasks.map((task) => (
                        <PlannerTaskCard
                          key={task.id}
                          task={task}
                          subject={getSubject(task.subjectId)}
                          isSelected={selectedTaskIds.has(task.id)}
                          isSelectionMode={isSelectionMode || selectedTaskIds.size > 0}
                          onToggleComplete={onToggleComplete}
                          onToggleSelect={onToggleTaskSelect}
                          onEdit={onEditTask}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedTask?.id === task.id}
                          compact={zoom < 90}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenAddTask(dateStr, dayPart)}
                      className="w-full mt-1.5 py-1 border border-dashed border-[#e5e2da] dark:border-[#292b34] hover:border-blue-500 rounded-lg text-[10px] text-[#8c909c] hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1 transition-all opacity-0 group-hover/cell:opacity-100 cursor-pointer"
                      title={`Add task to ${dayPart}`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
