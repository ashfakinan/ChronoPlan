import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  CheckCircle2,
  Circle,
  CalendarRange,
  Sparkles,
  Plus,
  Minus,
  Check,
  CalendarDays,
  Calendar,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { PlannerTask } from '../types';
import { addDays, formatDisplayDate, parseISODate, getTodayISO, isToday } from '../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: PlannerTask | null;
  initialDate?: string;
  initialDayPart?: string;
  onOpenSubjectModal?: () => void;
}

export function TaskModal({
  isOpen,
  onClose,
  taskToEdit,
  initialDate,
  initialDayPart,
  onOpenSubjectModal,
}: TaskModalProps) {
  const {
    activePlanner,
    subjects,
    createTask,
    createBatchTasks,
    updatePlanner,
    updateTask,
    deleteTask,
  } = usePlanner();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [dayPart, setDayPart] = useState('');
  const [notes, setNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  // Continued task state
  const [isContinuedTask, setIsContinuedTask] = useState(false);
  const [continuedDays, setContinuedDays] = useState(14);
  const [includeWeekends, setIncludeWeekends] = useState(true);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setSubjectId(taskToEdit.subjectId);
      setDate(taskToEdit.date);
      setDayPart(taskToEdit.dayPart);
      setNotes(taskToEdit.notes || '');
      setIsCompleted(taskToEdit.isCompleted);
      setIsContinuedTask(false);
    } else {
      setTitle('');
      // Current day (Today) is the proper default, never defaulting back to Monday / planner start date
      const todayISO = getTodayISO();
      const resolvedDate = initialDate && initialDate !== activePlanner?.startDate ? initialDate : todayISO;
      setDate(resolvedDate);
      setDayPart(initialDayPart || (activePlanner?.dayParts?.[0] || 'Morning'));
      setNotes('');
      setIsCompleted(false);
      setIsContinuedTask(false);
      setContinuedDays(14);
      setIncludeWeekends(true);
      if (subjects.length > 0) {
        setSubjectId(subjects[0].id);
      }
    }
  }, [taskToEdit, initialDate, initialDayPart, activePlanner, subjects, isOpen]);

  // Handle checking / unchecking Continued Task
  const handleToggleContinuedTask = (checked: boolean) => {
    setIsContinuedTask(checked);
    if (checked) {
      const todayISO = getTodayISO();
      // Ensure continued work starts from the CURRENT DAY (Today)
      if (!date || date < todayISO || (activePlanner && date === activePlanner.startDate && date !== todayISO)) {
        setDate(todayISO);
      }
    }
  };

  if (!isOpen) return null;

  // Calculate target dates list for continued task preview & submission
  const getCalculatedContinuedDates = (): string[] => {
    if (!date) return [];
    const count = Math.max(2, Math.min(120, continuedDays));
    const result: string[] = [];
    let cur = date;
    let safeguard = 0;

    while (result.length < count && safeguard < 300) {
      safeguard++;
      if (includeWeekends) {
        result.push(cur);
      } else {
        const dObj = parseISODate(cur);
        const day = dObj.getDay(); // 0 is Sunday, 6 is Saturday
        if (day !== 0 && day !== 6) {
          result.push(cur);
        }
      }
      cur = addDays(cur, 1);
    }
    return result;
  };

  const calculatedDates = isContinuedTask && !taskToEdit ? getCalculatedContinuedDates() : [];
  const lastCalculatedDate = calculatedDates.length > 0 ? calculatedDates[calculatedDates.length - 1] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId || !date || !dayPart) return;

    if (taskToEdit) {
      await updateTask(taskToEdit.id, {
        title: title.trim(),
        subjectId,
        date,
        dayPart,
        notes: notes.trim(),
        isCompleted,
      });
    } else {
      if (!activePlanner) return;

      if (isContinuedTask && calculatedDates.length > 1) {
        // Auto-extend planner date range if continued task exceeds current end date
        if (lastCalculatedDate && activePlanner.endDate && lastCalculatedDate > activePlanner.endDate) {
          await updatePlanner(activePlanner.id, {
            endDate: lastCalculatedDate,
          });
        }

        // Create tasks across all continuous days
        const tasksToCreate = calculatedDates.map((targetDate) => ({
          plannerId: activePlanner.id,
          title: title.trim(),
          subjectId,
          date: targetDate,
          dayPart,
          notes: notes.trim(),
          isCompleted: false,
          order: 0,
        }));

        await createBatchTasks(tasksToCreate);
      } else {
        // Single standard task
        await createTask({
          plannerId: activePlanner.id,
          title: title.trim(),
          subjectId,
          date,
          dayPart,
          notes: notes.trim(),
          isCompleted,
          order: 0,
        });
      }
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!taskToEdit) return;
    await deleteTask(taskToEdit.id);
    onClose();
  };

  const availableDayParts = activePlanner?.dayParts || ['Morning', 'Afternoon', 'Evening', 'Night', 'Self Study'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCompleted(!isCompleted)}
              className="text-[#8c909c] hover:text-emerald-600 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center -ml-1"
              aria-label="Toggle task completion"
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
            <h3 className="text-sm sm:text-base font-bold text-[#1f2126] dark:text-[#eceef2]">
              {taskToEdit ? 'Edit Task' : 'New Task'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider mb-1">
              Task Title
            </label>
            <input
              type="text"
              placeholder="What do you plan to complete?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={300}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-1 focus:ring-blue-500 min-h-[44px]"
            />
          </div>

          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider">
                Subject
              </label>
              {onOpenSubjectModal && (
                <button
                  type="button"
                  onClick={onOpenSubjectModal}
                  className="text-xs text-blue-700 dark:text-blue-400 hover:underline min-h-[30px]"
                >
                  + Subjects
                </button>
              )}
            </div>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-xs sm:text-sm bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden min-h-[44px]"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Day-Part Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider mb-1">
                {isContinuedTask ? 'Start Date' : 'Date'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider mb-1">
                Day-Part
              </label>
              <select
                value={dayPart}
                onChange={(e) => setDayPart(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden min-h-[44px]"
              >
                {availableDayParts.map((part) => (
                  <option key={part} value={part}>
                    {part}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CONTINUED TASK FEATURE (When creating a new task) */}
          {!taskToEdit && (
            <div className={`rounded-xl border transition-all overflow-hidden ${
              isContinuedTask
                ? 'border-blue-500/70 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs'
                : 'border-[#e5e2da] dark:border-[#292b34] bg-[#f8f6f1]/60 dark:bg-[#15161a]'
            }`}>
              {/* Checkbox trigger bar */}
              <label className="flex items-start gap-3 p-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="continued-task-checkbox"
                  checked={isContinuedTask}
                  onChange={(e) => handleToggleContinuedTask(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 border-[#cfcbc2] dark:border-[#3a3d4a] focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#1f2126] dark:text-[#eceef2]">
                      Continued task
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-600/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                      Multi-Day
                    </span>
                  </div>
                  <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae] mt-0.5 leading-snug">
                    Work on this task continuously across consecutive days (starts from current day)
                  </p>
                </div>
              </label>

              {/* Expanded Menu for Continued Task */}
              {isContinuedTask && (
                <div className="px-3 pb-3.5 pt-1 border-t border-blue-200/50 dark:border-blue-900/40 space-y-3">
                  {/* Start Date Indicator with Current Day / Today Reset */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="text-[11px] text-[#1f2126] dark:text-[#eceef2] truncate">
                        <span>Starts from: </span>
                        <strong className="text-blue-700 dark:text-blue-300">
                          {isToday(date) ? `Current Day (${formatDisplayDate(date)})` : formatDisplayDate(date)}
                        </strong>
                      </div>
                    </div>
                    {!isToday(date) && (
                      <button
                        type="button"
                        onClick={() => setDate(getTodayISO())}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0 shadow-2xs"
                      >
                        Start from Today
                      </button>
                    )}
                  </div>

                  {/* Question Prompt */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1.5">
                      How many days will this task will be worked on continuously?
                    </label>

                    {/* Stepper & Number Input */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20] rounded-xl overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setContinuedDays((prev) => Math.max(2, prev - 1))}
                          className="w-10 h-10 min-w-[40px] flex items-center justify-center text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] transition-colors"
                          aria-label="Decrease days"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={2}
                          max={90}
                          value={continuedDays}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setContinuedDays(isNaN(val) ? 2 : Math.max(2, Math.min(90, val)));
                          }}
                          className="w-14 text-center font-bold text-sm bg-transparent border-0 text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => setContinuedDays((prev) => Math.min(90, prev + 1))}
                          className="w-10 h-10 min-w-[40px] flex items-center justify-center text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] transition-colors"
                          aria-label="Increase days"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs font-medium text-[#606470] dark:text-[#9aa0ae]">
                        consecutive days
                      </span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[3, 7, 14, 21, 30].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setContinuedDays(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all min-h-[30px] ${
                            continuedDays === preset
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] border border-[#e5e2da] dark:border-[#292b34]'
                          }`}
                        >
                          {preset} Days {preset === 14 ? '(2 wks)' : preset === 7 ? '(1 wk)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weekend options */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeWeekends}
                      onChange={(e) => setIncludeWeekends(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 border-[#cfcbc2] dark:border-[#3a3d4a] focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                      Include weekend days (Saturday & Sunday)
                    </span>
                  </label>

                  {/* Live summary preview box */}
                  <div className="p-2.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Automatic continuous distribution:
                      </span>
                    </div>
                    <p className="text-[11px] text-[#1f2126] dark:text-[#eceef2] leading-relaxed">
                      Will create <strong className="font-bold text-blue-600 dark:text-blue-400">{calculatedDates.length} tasks</strong> from{' '}
                      <strong>{formatDisplayDate(date)}</strong> to{' '}
                      <strong>{lastCalculatedDate ? formatDisplayDate(lastCalculatedDate) : '...'}</strong> in <strong>{dayPart}</strong>.
                    </p>
                    {lastCalculatedDate && activePlanner?.endDate && lastCalculatedDate > activePlanner.endDate && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                        ✦ Planner date range will automatically expand to {formatDisplayDate(lastCalculatedDate)} to show all {calculatedDates.length} days.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Problems 12-25, page 84"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#e5e2da] dark:border-[#292b34]">
            {taskToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Delete task"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#606470] dark:text-[#9aa0ae] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-xl transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors min-h-[44px] flex items-center gap-1.5 shadow-xs"
              >
                {taskToEdit ? (
                  'Save Changes'
                ) : isContinuedTask && calculatedDates.length > 1 ? (
                  <>
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Create {calculatedDates.length} Continuous Tasks</span>
                  </>
                ) : (
                  'Add Task'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
