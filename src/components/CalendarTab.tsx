import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Tag,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { getMonthDaysGrid, isToday } from '../utils/dateUtils';
import { DailyViewModal } from './DailyViewModal';
import { SubjectModal } from './SubjectModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarTab() {
  const { tasks, notes, subjects, setSelectedDayForDetail, selectedDayForDetail } = usePlanner();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(today.getMonth());
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  const monthDays = useMemo(() => {
    return getMonthDaysGrid(currentYear, currentMonthIndex);
  }, [currentYear, currentMonthIndex]);

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonthIndex(now.getMonth());
  };

  const getSubject = (subjectId: string) => subjects.find((s) => s.id === subjectId);

  return (
    <div className="flex-1 bg-[#f8f6f1] dark:bg-[#121317] flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] pb-16 md:pb-0 overflow-hidden">
      {/* Calendar Header */}
      <div className="px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#f4f2ec] dark:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2] flex items-center justify-center border border-[#e5e2da] dark:border-[#292b34]">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-[#1f2126] dark:text-[#eceef2] tracking-tight">
              {MONTH_NAMES[currentMonthIndex]} {currentYear}
            </h1>
            <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae] hidden sm:block">
              Monthly overview of all tasks and important notes
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 bg-[#f4f2ec] dark:bg-[#22242b] p-1 rounded-xl border border-[#e5e2da] dark:border-[#292b34]">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1 text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] rounded-lg transition-colors min-h-[38px]"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Names Bar */}
      <div className="grid grid-cols-7 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] text-center py-2 text-[11px] font-bold text-[#606470] dark:text-[#9aa0ae] uppercase tracking-wider">
        {WEEKDAY_NAMES.map((name, i) => (
          <div key={name} className={i === 0 || i === 6 ? 'opacity-70' : ''}>
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 sm:grid-rows-6 divide-x divide-y divide-[#e5e2da] dark:divide-[#292b34] overflow-y-auto">
        {monthDays.map(({ date, isCurrentMonth }) => {
          const dayNumber = parseInt(date.split('-')[2], 10);
          const dayTasks = tasks.filter((t) => t.date === date);
          const dayNotes = notes.filter((n) => n.date === date);
          const isCurrToday = isToday(date);

          return (
            <div
              key={date}
              onClick={() => setSelectedDayForDetail(date)}
              className={`group min-h-[80px] sm:min-h-[110px] p-1.5 sm:p-2 flex flex-col transition-colors cursor-pointer relative ${
                !isCurrentMonth
                  ? 'bg-[#f4f2ec]/40 dark:bg-[#15161a]/40 text-[#8c909c]'
                  : isCurrToday
                  ? 'bg-blue-500/5 dark:bg-blue-500/10'
                  : 'bg-[#fdfcf9] dark:bg-[#1a1b20] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b]'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                    isCurrToday
                      ? 'bg-blue-600 text-white font-extrabold'
                      : isCurrentMonth
                      ? 'text-[#1f2126] dark:text-[#eceef2] group-hover:text-blue-600'
                      : 'text-[#8c909c]'
                  }`}
                >
                  {dayNumber}
                </span>

                {(dayTasks.length > 0 || dayNotes.length > 0) && (
                  <span className="text-[9px] text-[#8c909c] font-medium hidden sm:inline">
                    {dayTasks.length + dayNotes.length}
                  </span>
                )}
              </div>

              {/* Items List inside cell */}
              <div className="space-y-1 flex-1 overflow-hidden">
                {/* Important Notes */}
                {dayNotes.map((note) => (
                  <div
                    key={note.id}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate flex items-center gap-1 bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] text-amber-800 dark:text-amber-400"
                  >
                    <Tag className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{note.title}</span>
                  </div>
                ))}

                {/* Tasks */}
                {dayTasks.slice(0, 3).map((task) => {
                  const s = getSubject(task.subjectId);
                  return (
                    <div
                      key={task.id}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1.5 ${
                        task.isCompleted
                          ? 'line-through text-[#8c909c] bg-[#f4f2ec]/60 dark:bg-[#22242b]/60'
                          : 'text-[#1f2126] dark:text-[#eceef2] bg-[#fdfcf9] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34]'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: s?.color || '#3B82F6' }}
                      />
                      <span className="truncate">{task.title}</span>
                    </div>
                  );
                })}

                {dayTasks.length > 3 && (
                  <div className="text-[9px] text-[#8c909c] px-1">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DailyViewModal
        date={selectedDayForDetail}
        onClose={() => setSelectedDayForDetail(null)}
        onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
      />

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
      />
    </div>
  );
}
