import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Layers,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { PlannerTask, Subject } from '../../types';
import { PlannerTaskCard } from './PlannerTaskCard';
import {
  formatShortDate,
  getWeekdayName,
  isToday,
  formatDisplayDate,
} from '../../utils/dateUtils';

interface PlannerDayFocusViewProps {
  days: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dayParts: string[];
  tasks: PlannerTask[];
  subjects: Subject[];
  selectedTaskIds: Set<string>;
  isSelectionMode: boolean;
  onToggleTaskSelect: (taskId: string) => void;
  onSelectAllInSection: (taskIds: string[]) => void;
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: PlannerTask) => void;
  onOpenAddTask: (date: string, dayPart: string) => void;
  onOpenDailyDetail: (date: string) => void;
  onToggleSelectionMode: () => void;
}

export function PlannerDayFocusView({
  days,
  selectedDate,
  onSelectDate,
  dayParts,
  tasks,
  subjects,
  selectedTaskIds,
  isSelectionMode,
  onToggleTaskSelect,
  onSelectAllInSection,
  onToggleComplete,
  onEditTask,
  onOpenAddTask,
  onOpenDailyDetail,
  onToggleSelectionMode,
}: PlannerDayFocusViewProps) {
  const currentIndex = days.indexOf(selectedDate);

  const handlePrevDay = () => {
    if (currentIndex > 0) {
      onSelectDate(days[currentIndex - 1]);
    }
  };

  const handleNextDay = () => {
    if (currentIndex < days.length - 1) {
      onSelectDate(days[currentIndex + 1]);
    }
  };

  const getSubject = (subjectId: string) => subjects.find((s) => s.id === subjectId);

  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const completedCount = dayTasks.filter((t) => t.isCompleted).length;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-3 sm:p-4 space-y-4">
      {/* Date Switcher Carousel */}
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl p-2.5 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e5e2da]/60 dark:border-[#292b34]/60">
          <button
            type="button"
            onClick={handlePrevDay}
            disabled={currentIndex <= 0}
            className="p-1 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-[#f4f2ec] dark:hover:bg-[#22242b]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold text-sm text-[#1f2126] dark:text-[#eceef2]">
                {selectedDate ? formatDisplayDate(selectedDate) : 'Select Date'}
              </span>
              {isToday(selectedDate) && (
                <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded-md text-[9px] font-bold uppercase tracking-wider">
                  Today
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#8c909c]">
              {completedCount} of {dayTasks.length} tasks completed
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            disabled={currentIndex >= days.length - 1}
            className="p-1 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-[#f4f2ec] dark:hover:bg-[#22242b]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {days.map((dateStr) => {
            const isSelected = dateStr === selectedDate;
            const isCurrentToday = isToday(dateStr);
            const count = tasks.filter((t) => t.date === dateStr).length;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onSelectDate(dateStr)}
                className={`flex-1 min-w-[58px] py-1.5 px-2 rounded-xl text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : isCurrentToday
                    ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-500/30 text-blue-700 dark:text-blue-400'
                    : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-tight">
                  {getWeekdayName(dateStr).slice(0, 3)}
                </div>
                <div className="text-xs font-bold leading-tight">
                  {formatShortDate(dateStr).split(' ')[1] || formatShortDate(dateStr)}
                </div>
                {count > 0 && (
                  <div
                    className={`text-[9px] font-medium leading-none mt-0.5 ${
                      isSelected ? 'text-blue-100' : 'text-[#8c909c]'
                    }`}
                  >
                    {count} tasks
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-header controls for active day */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onToggleSelectionMode}
          className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition-colors ${
            isSelectionMode || selectedTaskIds.size > 0
              ? 'bg-blue-600 text-white'
              : 'bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] text-[#606470] dark:text-[#9aa0ae]'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{isSelectionMode ? 'Batch Active' : 'Select'}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDailyDetail(selectedDate)}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <span>Full Day View</span>
          <span>→</span>
        </button>
      </div>

      {/* Day-parts Sections Stack */}
      <div className="space-y-3">
        {dayParts.map((dayPart) => {
          const partTasks = dayTasks.filter((t) => t.dayPart === dayPart);

          return (
            <div
              key={dayPart}
              className="rounded-2xl border border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20] p-3 shadow-2xs"
            >
              {/* Daypart Section Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#f4f2ec] dark:border-[#22242b]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1f2126] dark:text-[#eceef2]">
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{dayPart}</span>
                  <span className="text-[11px] text-[#8c909c] font-normal">
                    ({partTasks.length})
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {(isSelectionMode || selectedTaskIds.size > 0) && partTasks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onSelectAllInSection(partTasks.map((t) => t.id))}
                      className="px-2 py-0.5 text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-500/10 rounded-md"
                    >
                      {partTasks.every((t) => selectedTaskIds.has(t.id)) ? 'Deselect All' : 'Select All'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenAddTask(selectedDate, dayPart)}
                    className="px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-2 mt-2">
                {partTasks.length === 0 ? (
                  <div className="py-3 text-center text-xs text-[#8c909c] italic">
                    No tasks in {dayPart}
                  </div>
                ) : (
                  partTasks.map((task) => (
                    <PlannerTaskCard
                      key={task.id}
                      task={task}
                      subject={getSubject(task.subjectId)}
                      isSelected={selectedTaskIds.has(task.id)}
                      isSelectionMode={isSelectionMode || selectedTaskIds.size > 0}
                      onToggleComplete={onToggleComplete}
                      onToggleSelect={onToggleTaskSelect}
                      onEdit={onEditTask}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
