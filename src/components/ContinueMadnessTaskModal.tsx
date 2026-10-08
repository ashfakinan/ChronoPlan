import React, { useState, useEffect, useMemo } from 'react';
import { X, Layers, Sparkles, ArrowRight, Minus, Plus, Calendar } from 'lucide-react';
import { useMadness } from '../context/MadnessContext';
import { MadnessTask } from '../types';

interface ContinueMadnessTaskModalProps {
  task: MadnessTask | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContinueMadnessTaskModal({
  task,
  isOpen,
  onClose,
}: ContinueMadnessTaskModalProps) {
  const { days, continueTaskAcrossDays, addDay, addBatchTasks } = useMadness();

  const [continuedDaysCount, setContinuedDaysCount] = useState(3);
  const [autoAddMissingDays, setAutoAddMissingDays] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContinuedDaysCount(3);
      setAutoAddMissingDays(true);
    }
  }, [isOpen]);

  const sourceDay = useMemo(() => {
    if (!task) return null;
    return days.find((d) => d.id === task.dayId) || null;
  }, [task, days]);

  const sourceDayIndex = useMemo(() => {
    if (!task) return 0;
    return Math.max(0, days.findIndex((d) => d.id === task.dayId));
  }, [task, days]);

  // Target days calculation
  const { existingTargetDays, missingDaysCount, allPreviewDays } = useMemo(() => {
    if (!task || days.length === 0) {
      return { existingTargetDays: [], missingDaysCount: 0, allPreviewDays: [] };
    }

    const count = Math.max(2, Math.min(30, continuedDaysCount));
    const slice = days.slice(sourceDayIndex, sourceDayIndex + count);
    const missing = autoAddMissingDays ? Math.max(0, count - slice.length) : 0;

    const previewNames = slice.map((d) => ({ id: d.id, name: d.name, isSource: d.id === task.dayId }));

    for (let i = 1; i <= missing; i++) {
      previewNames.push({
        id: `virtual_${i}`,
        name: `Day ${days.length + i}`,
        isSource: false,
      });
    }

    return {
      existingTargetDays: slice,
      missingDaysCount: missing,
      allPreviewDays: previewNames,
    };
  }, [task, days, sourceDayIndex, continuedDaysCount, autoAddMissingDays]);

  if (!isOpen || !task) return null;

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      const targetDayIds: string[] = existingTargetDays.map((d) => d.id);

      // Create missing days if autoAddMissingDays is enabled
      if (autoAddMissingDays && missingDaysCount > 0) {
        for (let i = 1; i <= missingDaysCount; i++) {
          const nextDayNumber = days.length + i;
          const created = await addDay(`Day ${nextDayNumber}`);
          targetDayIds.push(created.id);
        }
      }

      await continueTaskAcrossDays(task.id, targetDayIds);
      onClose();
    } catch {
      // Ignore or log error
    } finally {
      setIsSubmitting(false);
    }
  };

  const newTasksToCreateCount = Math.max(0, allPreviewDays.length - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] flex items-center justify-between bg-[#f4f2ec] dark:bg-[#22242b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1f2126] dark:text-[#eceef2]">
                Continue Task Across Days
              </h2>
              <p className="text-xs text-[#606470] dark:text-[#9aa0ae]">
                Extend this task streak into upcoming days
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Task Info Pill */}
          <div className="p-3 rounded-xl bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#8c909c] tracking-wider">
              Selected Task
            </div>
            <div className="text-xs font-bold text-[#1f2126] dark:text-[#eceef2] truncate">
              {task.title}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#606470] dark:text-[#9aa0ae]">
              <Calendar className="w-3 h-3 text-blue-500" />
              <span>
                Currently in: <strong className="text-blue-600 dark:text-blue-400">{sourceDay?.name || 'Day 1'}</strong>
              </span>
            </div>
          </div>

          {/* Stepper question */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1.5">
              How many total consecutive days should this task cover?
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20] rounded-xl overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setContinuedDaysCount((prev) => Math.max(2, prev - 1))}
                  className="w-10 h-10 min-w-[40px] flex items-center justify-center text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] transition-colors cursor-pointer"
                  aria-label="Decrease days"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={2}
                  max={30}
                  value={continuedDaysCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setContinuedDaysCount(isNaN(val) ? 2 : Math.max(2, Math.min(30, val)));
                  }}
                  className="w-14 text-center font-bold text-sm bg-transparent border-0 text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setContinuedDaysCount((prev) => Math.min(30, prev + 1))}
                  className="w-10 h-10 min-w-[40px] flex items-center justify-center text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] transition-colors cursor-pointer"
                  aria-label="Increase days"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs font-medium text-[#606470] dark:text-[#9aa0ae]">
                consecutive days
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[2, 3, 5, 7].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setContinuedDaysCount(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    continuedDaysCount === preset
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] border border-[#e5e2da] dark:border-[#292b34]'
                  }`}
                >
                  {preset} Days
                </button>
              ))}
            </div>
          </div>

          {/* Auto add new days toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAddMissingDays}
              onChange={(e) => setAutoAddMissingDays(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 border-[#cfcbc2] dark:border-[#3a3d4a] focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
              Automatically create new days in Weekly Madness if needed
            </span>
          </label>

          {/* Live Preview */}
          <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Streak distribution preview:</span>
            </div>
            <p className="text-[11px] text-[#1f2126] dark:text-[#eceef2]">
              Will continue task across {allPreviewDays.length} days (creating {newTasksToCreateCount} new task{newTasksToCreateCount > 1 ? 's' : ''}):
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {allPreviewDays.map((d, idx) => (
                <React.Fragment key={d.id + idx}>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-2xs ${
                      d.isSource
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-[#fdfcf9] dark:bg-[#1a1b20] border-blue-400/40 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {d.name} {d.isSource && '(current)'}
                  </span>
                  {idx < allPreviewDays.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
            {missingDaysCount > 0 && (
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                ✦ Will automatically add {missingDaysCount} new day{missingDaysCount > 1 ? 's' : ''} to Weekly Madness.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#606470] dark:text-[#9aa0ae] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={isSubmitting || newTasksToCreateCount === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            {isSubmitting
              ? 'Continuing...'
              : `Continue Across ${allPreviewDays.length} Days`}
          </button>
        </div>
      </div>
    </div>
  );
}
