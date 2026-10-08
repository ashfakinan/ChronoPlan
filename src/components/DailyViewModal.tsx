import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Layers,
  CheckSquare,
  Check,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { formatFullDate, addDays, isToday, getDaysInRange } from '../utils/dateUtils';
import { TaskModal } from './TaskModal';
import { BatchMoveModal } from './BatchMoveModal';
import { BatchTaskActionBar } from './BatchTaskActionBar';
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
    batchMoveTasks,
    batchToggleComplete,
    batchDeleteTasks,
    setSelectedDayForDetail,
  } = usePlanner();

  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [addingTaskForDayPart, setAddingTaskForDayPart] = useState<string | null>(null);

  // Batch selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBatchMoveModalOpen, setIsBatchMoveModalOpen] = useState(false);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSelectAllInSection = (taskIds: string[]) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      const allSelected = taskIds.length > 0 && taskIds.every((id) => next.has(id));
      if (allSelected) {
        taskIds.forEach((id) => next.delete(id));
      } else {
        taskIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
  };

  const handleConfirmBatchMove = async (targetDate: string, targetDayPart: string) => {
    const ids = Array.from(selectedTaskIds);
    if (!ids.length) return;
    await batchMoveTasks(ids, targetDate, targetDayPart);
    handleClearSelection();
  };

  const handleBatchToggleComplete = async () => {
    const ids = Array.from(selectedTaskIds);
    if (!ids.length) return;
    const selectedTasks = tasks.filter((t) => ids.includes(t.id));
    const allCompleted = selectedTasks.every((t) => t.isCompleted);
    await batchToggleComplete(ids, !allCompleted);
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedTaskIds);
    if (!ids.length) return;
    if (window.confirm(`Delete ${ids.length} selected tasks?`)) {
      await batchDeleteTasks(ids);
      handleClearSelection();
    }
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

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedTaskIds(new Set());
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors flex items-center gap-1.5 min-h-[38px] ${
                isSelectionMode || selectedTaskIds.size > 0
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] border border-[#e5e2da] dark:border-[#292b34] hover:bg-[#eae7df]'
              }`}
              title="Batch select tasks to move between time blocks"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isSelectionMode || selectedTaskIds.size > 0 ? 'Batch Active' : 'Select'}</span>
            </button>

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

              return (
                <div
                  key={dayPart}
                  className="flex flex-col rounded-xl border p-3.5 transition-all min-h-[150px] border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20]"
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

                    <div className="flex items-center gap-1">
                      {(isSelectionMode || selectedTaskIds.size > 0) && partTasks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectAllInSection(partTasks.map((t) => t.id))}
                          className="px-2 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors min-h-[36px]"
                        >
                          {partTasks.every((t) => selectedTaskIds.has(t.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setAddingTaskForDayPart(dayPart)}
                        className="px-2 py-1 text-[#606470] dark:text-[#9aa0ae] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-md transition-colors text-xs flex items-center gap-1 min-h-[36px]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-1.5 flex-1">
                    {partTasks.length === 0 ? (
                      <div className="h-full flex items-center justify-center p-4 border border-dashed border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[11px] text-[#8c909c]">
                        No tasks in this section. Tap + Add
                      </div>
                    ) : (
                      partTasks.map((task) => {
                        const subj = getSubject(task.subjectId);
                        const isSelected = selectedTaskIds.has(task.id);

                        return (
                          <div
                            key={task.id}
                            onClick={() => {
                              if (isSelectionMode || selectedTaskIds.size > 0) {
                                toggleTaskSelection(task.id);
                              }
                            }}
                            className={`group relative flex items-start gap-2 p-2 rounded-lg border bg-[#fdfcf9] dark:bg-[#202127] shadow-2xs hover:shadow-xs transition-all select-none ${
                              isSelected
                                ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/70 dark:bg-blue-950/30'
                                : task.isCompleted
                                ? 'border-[#e5e2da] dark:border-[#292b34] opacity-60'
                                : 'border-[#e5e2da] dark:border-[#2f313c] hover:border-[#cfcbc2]'
                            }`}
                          >
                            <div
                              className="w-1 self-stretch rounded-full shrink-0"
                              style={{ backgroundColor: subj?.color || '#3B82F6' }}
                            />

                            {/* Selection Checkbox OR Toggle Complete */}
                            {isSelectionMode || selectedTaskIds.size > 0 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskSelection(task.id);
                                }}
                                className="w-11 h-11 min-w-[44px] min-h-[44px] -ml-1 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 rounded-lg hover:bg-blue-500/10"
                                aria-label={isSelected ? 'Deselect task' : 'Select task'}
                              >
                                {isSelected ? (
                                  <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-md border-2 border-[#8c909c] dark:border-[#525666] bg-transparent" />
                                )}
                              </button>
                            ) : (
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
                            )}

                            <div
                              className="flex-1 min-w-0 cursor-pointer pt-0.5"
                              onClick={() => {
                                if (!isSelectionMode && selectedTaskIds.size === 0) {
                                  setEditingTask(task);
                                }
                              }}
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

      {/* Batch Task Action Bar & Batch Move Modal */}
      <BatchTaskActionBar
        selectedCount={selectedTaskIds.size}
        onOpenBatchMove={() => setIsBatchMoveModalOpen(true)}
        onBatchToggleComplete={handleBatchToggleComplete}
        onBatchDelete={handleBatchDelete}
        onClearSelection={handleClearSelection}
      />

      <BatchMoveModal
        isOpen={isBatchMoveModalOpen}
        onClose={() => setIsBatchMoveModalOpen(false)}
        selectedTaskCount={selectedTaskIds.size}
        availableDayParts={dayParts}
        availableDates={activePlanner ? getDaysInRange(activePlanner.startDate, activePlanner.endDate) : [date]}
        initialDate={date}
        onConfirmMove={handleConfirmBatchMove}
      />
    </div>
  );
}
