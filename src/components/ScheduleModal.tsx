import React, { useState, useEffect } from 'react';
import { X, Clock, Trash2, Check, Layers, AlignLeft } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { FixedSchedule } from '../types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleToEdit?: FixedSchedule | null;
}

export function ScheduleModal({
  isOpen,
  onClose,
  scheduleToEdit,
}: ScheduleModalProps) {
  const { createSchedule, updateSchedule, deleteSchedule, activePlanner } = usePlanner();

  const [dayPart, setDayPart] = useState('');
  const [timeRange, setTimeRange] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const availableDayParts = activePlanner?.dayParts || [
    'Morning',
    'Afternoon',
    'Evening',
    'Night',
    'Self Study',
  ];

  useEffect(() => {
    if (scheduleToEdit) {
      setDayPart(scheduleToEdit.dayPart || '');
      setTimeRange(scheduleToEdit.timeRange || '');
      setText(scheduleToEdit.text || '');
    } else {
      setDayPart('');
      setTimeRange('');
      setText('');
    }
    setError('');
    setIsDeleting(false);
  }, [scheduleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = dayPart.trim();
    if (!trimmedName) {
      setError('Please provide a name for this schedule plan.');
      return;
    }

    try {
      if (scheduleToEdit) {
        await updateSchedule(scheduleToEdit.id, {
          dayPart: trimmedName,
          timeRange: timeRange.trim(),
          text: text.trim(),
        });
      } else {
        await createSchedule(trimmedName, text.trim(), timeRange.trim());
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save schedule plan.');
    }
  };

  const handleDelete = async () => {
    if (!scheduleToEdit) return;
    try {
      await deleteSchedule(scheduleToEdit.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete schedule plan.');
    }
  };

  const presetSuggestions = [
    'Morning Routine',
    'Deep Work Session',
    'Afternoon Lectures',
    'Self Study & Revision',
    'Evening Workout',
    'Night Wind-down',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#1f2126] dark:text-[#eceef2]">
                {scheduleToEdit ? 'Edit Schedule Plan' : 'New Schedule Plan'}
              </h2>
              <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                Customize your fixed daily routines and time blocks
              </p>
            </div>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Plan Name */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1">
              Plan Name / Day-Part Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={dayPart}
              onChange={(e) => setDayPart(e.target.value)}
              placeholder="e.g. Morning Routine, Deep Work, Night"
              maxLength={100}
              className="w-full px-3 py-2 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              autoFocus
            />

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1 mt-2">
              {presetSuggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setDayPart(sug)}
                  className="px-2 py-0.5 text-[10px] rounded-md bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] text-[#606470] dark:text-[#9aa0ae] border border-[#e5e2da] dark:border-[#292b34] transition-colors"
                >
                  {sug}
                </button>
              ))}
              {availableDayParts.map((dp) => (
                <button
                  key={dp}
                  type="button"
                  onClick={() => setDayPart(dp)}
                  className="px-2 py-0.5 text-[10px] rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 transition-colors font-medium"
                >
                  {dp}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1">
              Time Range (Optional)
            </label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c909c]" />
              <input
                type="text"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                placeholder="e.g. 07:00 - 08:30 or 21:00 - 22:00"
                maxLength={64}
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Routine Details / Description */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1">
              Routine Details & Plans
            </label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your fixed routine or plans for this block:&#10;• 07:00 Wakeup & Hydrate&#10;• 07:30 Deep Focus Session&#10;• 08:30 10-minute walk"
              maxLength={2000}
              className="w-full p-3 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#e5e2da] dark:border-[#292b34]">
            {scheduleToEdit ? (
              isDeleting ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors min-h-[38px]"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleting(false)}
                    className="px-2 py-1.5 text-xs text-[#8c909c] hover:text-[#1f2126] min-h-[38px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-500/10 rounded-lg font-medium transition-colors flex items-center gap-1 min-h-[40px]"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Plan
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[40px]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{scheduleToEdit ? 'Save Changes' : 'Create Plan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
