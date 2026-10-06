import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Layers,
  GripVertical,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { formatFullDate, addDays, isToday } from '../utils/dateUtils';
import { TaskModal } from './TaskModal';
import { DragGhostOverlay } from './DragGhostOverlay';
import { useTaskDragAndScroll } from '../hooks/useTaskDragAndScroll';
import { PlannerTask } from '../types';

interface DailyViewModalProps {
  date: string | null;
  onClose: () => void;
  onOpenSubjectModal: () => void;
}

export function DailyViewModal({
  date,
  onClose,
  onOpenSubjectModal,
}: DailyViewModalProps) {
  const {
    activePlanner,
    tasks,
    subjects,
    toggleTaskComplete,
    moveTask,
    setSelectedDayForDetail,
  } = usePlanner();

  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [addingTaskForDayPart, setAddingTaskForDayPart] = useState<string | null>(null);

  // Touch and desktop drag with auto-scrolling
  const {
    isDragging,
    draggedTask,
    dropTarget,
    pointerPos,
    scrollDirections,
    startTouchDrag,
    handleDesktopDragOver,
    handleDesktopDragLeave,
    handleDesktopDrop,
  } = useTaskDragAndScroll({
    onDropTask: async (taskId, targetDate, targetDayPart) => {
      if (!date) return;
      await moveTask(taskId, targetDate, targetDayPart);
    },
    containerId: 'daily-modal-scroll',
  });

  const [desktopDraggedTaskId, setDesktopDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDesktopDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, dayPart: string) => {
    if (!date) return;
    handleDesktopDragOver(e, date, dayPart);
  };

  const handleDragLeave = () => {
    handleDesktopDragLeave();
  };

  const handleDrop = async (e: React.DragEvent, dayPart: string) => {
    if (!date) return;
    await handleDesktopDrop(e, date, dayPart, desktopDraggedTaskId);
    setDesktopDraggedTaskId(null);
  };

  const getSubject = (subjectId: string) => subjects.find((s) => s.id === subjectId);

  if (!date) return null;

  const dayParts = activePlanner?.dayParts || ['Morning', 'Afternoon', 'Evening', 'Night', 'Self Study'];

  // All tasks for this date
  const dateTasks = tasks.filter((t) => t.date === date);
  const completedCount = dateTasks.filter((t) => t.isCompleted).length;
  const progressPercent = dateTasks.length > 0 ? Math.round((completedCount / dateTasks.length) * 100) : 0;

  const handlePrevDay = () => {
    setSelectedDayForDetail(addDays(date, -1));
  };

  const handleNextDay = () => {
    setSelectedDayForDetail(addDays(date, 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 bg-[#fdfcf9] dark:bg-[#1a1b20] p-1 rounded-xl border border-[#e5e2da] dark:border-[#292b34]">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Previous Day"
                aria-label="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Next Day"
                aria-label="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#1f2126] dark:text-[#eceef2]">
                  {formatFullDate(date)}
                </h2>
                {isToday(date) && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-md">
                    Today
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                Detailed schedule breakdown across all day-parts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#fdfcf9] dark:bg-[#1a1b20] px-3 py-1.5 rounded-xl border border-[#e5e2da] dark:border-[#292b34] text-xs">
              <span className="text-[#8c909c]">Progress:</span>
              <span className="font-semibold text-[#1f2126] dark:text-[#eceef2] tabular-nums">
                {completedCount}/{dateTasks.length} ({progressPercent}%)
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Day-parts Grid */}
        <div id="daily-modal-scroll" className="p-3 sm:p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {dayParts.map((dayPart) => {
              const partTasks = dateTasks.filter((t) => t.dayPart === dayPart);
              const isDropTarget = dropTarget?.dayPart === dayPart;

              return (
                <div
                  key={dayPart}
                  data-drop-target="true"
                  data-drop-date={date}
                  data-drop-daypart={dayPart}
                  onDragOver={(e) => handleDragOver(e, dayPart)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dayPart)}
                  className={`flex flex-col rounded-xl border p-3.5 transition-all min-h-[150px] ${
                    isDropTarget
                      ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-500/10 dark:bg-blue-500/15'
                      : 'border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20]'
                  }`}
                >
                  {/* Day-part Header */}
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#f4f2ec] dark:border-[#22242b]">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs sm:text-sm font-semibold text-[#1f2126] dark:text-[#eceef2]">
                        {dayPart}
                      </span>
                      <span className="text-[10px] text-[#8c909c]">
                        ({partTasks.length})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAddingTaskForDayPart(dayPart)}
                      className="px-2 py-1 text-[#606470] dark:text-[#9aa0ae] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-md transition-colors text-xs flex items-center gap-1 min-h-[36px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-1.5 flex-1">
                    {partTasks.length === 0 ? (
                      <div className="h-full flex items-center justify-center p-4 border border-dashed border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[11px] text-[#8c909c]">
                        {isDropTarget ? '✨ Drop task here' : 'Drop task here or tap + Add'}
                      </div>
                    ) : (
                      partTasks.map((task) => {
                        const subj = getSubject(task.subjectId);
                        const isBeingDragged = draggedTask?.id === task.id;

                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            className={`group relative flex items-start gap-2 p-2 rounded-lg border bg-[#fdfcf9] dark:bg-[#202127] shadow-2xs hover:shadow-xs transition-all cursor-grab active:cursor-grabbing select-none ${
                              isBeingDragged
                                ? 'opacity-30 scale-95 border-dashed border-blue-500 bg-blue-500/10'
                                : task.isCompleted
                                ? 'border-[#e5e2da] dark:border-[#292b34] opacity-60'
                                : 'border-[#e5e2da] dark:border-[#2f313c] hover:border-[#cfcbc2]'
                            }`}
                          >
                            <div
                              className="w-1 self-stretch rounded-full shrink-0"
                              style={{ backgroundColor: subj?.color || '#3B82F6' }}
                            />

                            <button
                              type="button"
                              onClick={() => toggleTaskComplete(task.id)}
                              className="mt-0.5 text-[#8c909c] hover:text-emerald-600 transition-colors shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center -ml-1"
                              aria-label="Toggle task"
                            >
                              {task.isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>

                            <div
                              className="flex-1 min-w-0 cursor-pointer pt-0.5"
                              onClick={() => setEditingTask(task)}
                            >
                              <div
                                className={`text-xs font-medium leading-snug break-words ${
                                  task.isCompleted
                                    ? 'line-through text-[#8c909c]'
                                    : 'text-[#1f2126] dark:text-[#eceef2]'
                                }`}
                              >
                                {task.title}
                              </div>

                              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#8c909c]">
                                {subj && (
                                  <span
                                    className="font-medium"
                                    style={{ color: subj.color }}
                                  >
                                    {subj.name}
                                  </span>
                                )}
                                {task.notes && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="truncate max-w-[130px]">
                                      {task.notes}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Touch grip handle */}
                            <div
                              onTouchStart={(e) => startTouchDrag(e, task)}
                              className="p-1 -mr-1 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center shrink-0 min-h-[32px] min-w-[24px]"
                              title="Drag to move task"
                              aria-label="Drag task"
                            >
                              <GripVertical className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-[#1f2126] text-[#fdfcf9] hover:bg-[#343842] dark:bg-[#eceef2] dark:text-[#121317] dark:hover:bg-[#d8dbe2] rounded-xl transition-colors min-h-[44px]"
          >
            Done
          </button>
        </div>
      </div>

      {/* Floating Drag Ghost Overlay */}
      <DragGhostOverlay
        isDragging={isDragging}
        task={draggedTask}
        pointerPos={pointerPos}
        dropTarget={dropTarget}
        subject={draggedTask ? getSubject(draggedTask.subjectId) : undefined}
        scrollDirections={scrollDirections}
      />

      {editingTask && (
        <TaskModal
          isOpen={true}
          taskToEdit={editingTask}
          onClose={() => setEditingTask(null)}
          onOpenSubjectModal={onOpenSubjectModal}
        />
      )}

      {addingTaskForDayPart && (
        <TaskModal
          isOpen={true}
          initialDate={date}
          initialDayPart={addingTaskForDayPart}
          onClose={() => setAddingTaskForDayPart(null)}
          onOpenSubjectModal={onOpenSubjectModal}
        />
      )}
    </div>
  );
}
