import React, { useState, useEffect } from 'react';
import { X, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { PlannerTask } from '../types';

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
    updateTask,
    deleteTask,
  } = usePlanner();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [dayPart, setDayPart] = useState('');
  const [notes, setNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setSubjectId(taskToEdit.subjectId);
      setDate(taskToEdit.date);
      setDayPart(taskToEdit.dayPart);
      setNotes(taskToEdit.notes || '');
      setIsCompleted(taskToEdit.isCompleted);
    } else {
      setTitle('');
      setDate(initialDate || (activePlanner ? activePlanner.startDate : ''));
      setDayPart(initialDayPart || (activePlanner?.dayParts?.[0] || 'Morning'));
      setNotes('');
      setIsCompleted(false);
      if (subjects.length > 0) {
        setSubjectId(subjects[0].id);
      }
    }
  }, [taskToEdit, initialDate, initialDayPart, activePlanner, subjects, isOpen]);

  if (!isOpen) return null;

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
                Date
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
                className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors min-h-[44px]"
              >
                {taskToEdit ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
