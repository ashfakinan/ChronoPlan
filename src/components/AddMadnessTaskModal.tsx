import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Minus, Calendar, Tag, FileText, Sparkles, ArrowRight, Layers } from 'lucide-react';
import { useMadness } from '../context/MadnessContext';

interface AddMadnessTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDayId?: string;
  initialCategoryId?: string;
}

export function AddMadnessTaskModal({
  isOpen,
  onClose,
  initialDayId,
  initialCategoryId,
}: AddMadnessTaskModalProps) {
  const { days, categories, addTask, addBatchTasks, addDay, setFilterCategoryId } = useMadness();

  const [title, setTitle] = useState('');
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Continued task state
  const [isContinuedTask, setIsContinuedTask] = useState(false);
  const [continuedDaysCount, setContinuedDaysCount] = useState(3);
  const [autoAddMissingDays, setAutoAddMissingDays] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setNotes('');
      setErrorMsg('');
      setSelectedDayId(initialDayId || (days[0]?.id ?? ''));
      setSelectedCategoryId(initialCategoryId || '');
      setIsContinuedTask(false);
      setContinuedDaysCount(Math.max(2, Math.min(days.length || 3, 3)));
      setAutoAddMissingDays(true);
    }
  }, [isOpen, initialDayId, initialCategoryId, days]);

  // Calculate target days for continuous task preview and execution
  const { targetExistingDays, missingDaysCount, totalCalculatedCount, previewDayNames } = useMemo(() => {
    if (!selectedDayId || days.length === 0) {
      return {
        targetExistingDays: [],
        missingDaysCount: 0,
        totalCalculatedCount: 1,
        previewDayNames: [],
      };
    }

    const startIdx = Math.max(0, days.findIndex((d) => d.id === selectedDayId));
    const count = Math.max(2, Math.min(30, continuedDaysCount));

    const existingSlice = days.slice(startIdx, startIdx + count);
    const missingCount = autoAddMissingDays ? Math.max(0, count - existingSlice.length) : 0;

    const names: string[] = existingSlice.map((d) => d.name);
    for (let i = 1; i <= missingCount; i++) {
      names.push(`Day ${days.length + i}`);
    }

    return {
      targetExistingDays: existingSlice,
      missingDaysCount: missingCount,
      totalCalculatedCount: names.length,
      previewDayNames: names,
    };
  }, [selectedDayId, days, continuedDaysCount, autoAddMissingDays]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('Please enter a task title');
      return;
    }

    const dayIdToUse = selectedDayId || days[0]?.id;
    if (!dayIdToUse) {
      setErrorMsg('No days available to assign this task');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isContinuedTask && totalCalculatedCount > 1) {
        // Collect day IDs
        const finalDayIds: string[] = targetExistingDays.map((d) => d.id);

        // Auto-create missing days if needed
        if (autoAddMissingDays && missingDaysCount > 0) {
          for (let i = 1; i <= missingDaysCount; i++) {
            const nextDayNumber = days.length + i;
            const createdDay = await addDay(`Day ${nextDayNumber}`);
            finalDayIds.push(createdDay.id);
          }
        }

        // Shared continuedGroupId for group linkage
        const continuedGroupId = `cgroup_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const tasksToCreate = finalDayIds.map((targetDayId) => ({
          dayId: targetDayId,
          title: cleanTitle,
          categoryId: selectedCategoryId || undefined,
          notes: notes.trim() || undefined,
          isContinued: true,
          continuedGroupId,
        }));

        await addBatchTasks(tasksToCreate);
      } else {
        await addTask(
          dayIdToUse,
          cleanTitle,
          selectedCategoryId || undefined,
          notes.trim() || undefined
        );
      }

      // Reset filter so user immediately sees their new task
      setFilterCategoryId(null);
      onClose();
    } catch {
      setErrorMsg('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDay = days.find((d) => d.id === selectedDayId) || days[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] flex items-center justify-between bg-[#f4f2ec] dark:bg-[#22242b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1f2126] dark:text-[#eceef2]">
                Add Task to Weekly Madness
              </h2>
              <p className="text-xs text-[#606470] dark:text-[#9aa0ae]">
                Freeform weekly task with multi-day continuous work support
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="e.g. Brainstorm marketing ideas, Buy supplies, Fix bug..."
              autoFocus
              className="w-full px-3 py-2 text-sm bg-[#f8f6f1] dark:bg-[#121317] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {errorMsg && <p className="text-xs text-rose-500 mt-1">{errorMsg}</p>}
          </div>

          {/* Day Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#606470] dark:text-[#9aa0ae]" />
                {isContinuedTask ? 'Starting Day' : 'Select Day'}
              </label>
              {isContinuedTask && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                  Begins on this day
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-[#f8f6f1] dark:bg-[#121317] rounded-xl border border-[#e5e2da] dark:border-[#292b34]">
              {days.map((day) => {
                const isSelected = selectedDayId === day.id;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setSelectedDayId(day.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] border border-[#e5e2da] dark:border-[#292b34]'
                    }`}
                  >
                    {day.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONTINUED TASK FEATURE */}
          <div
            className={`rounded-xl border transition-all overflow-hidden ${
              isContinuedTask
                ? 'border-blue-500/70 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs'
                : 'border-[#e5e2da] dark:border-[#292b34] bg-[#f8f6f1]/60 dark:bg-[#15161a]'
            }`}
          >
            {/* Checkbox trigger bar */}
            <label className="flex items-start gap-3 p-3 cursor-pointer select-none">
              <input
                type="checkbox"
                id="madness-continued-task-checkbox"
                checked={isContinuedTask}
                onChange={(e) => setIsContinuedTask(e.target.checked)}
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
                  Work on this task continuously across consecutive days in Weekly Madness
                </p>
              </div>
            </label>

            {/* Expanded Menu for Continued Task */}
            {isContinuedTask && (
              <div className="px-3 pb-3.5 pt-1 border-t border-blue-200/50 dark:border-blue-900/40 space-y-3">
                {/* Start Day Indicator */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="text-[11px] text-[#1f2126] dark:text-[#eceef2] truncate">
                      <span>Starts from: </span>
                      <strong className="text-blue-700 dark:text-blue-300">
                        {selectedDay?.name || 'Day 1'}
                      </strong>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                    Continuous streak
                  </span>
                </div>

                {/* Question Prompt */}
                <div>
                  <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1.5">
                    How many days will this task be worked on continuously?
                  </label>

                  {/* Stepper & Number Input */}
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

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[2, 3, 5, 7].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setContinuedDaysCount(preset)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all min-h-[30px] cursor-pointer ${
                          continuedDaysCount === preset
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] border border-[#e5e2da] dark:border-[#292b34]'
                        }`}
                      >
                        {preset} Days
                      </button>
                    ))}
                    {days.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setContinuedDaysCount(days.length)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all min-h-[30px] cursor-pointer ${
                          continuedDaysCount === days.length
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] border border-[#e5e2da] dark:border-[#292b34]'
                        }`}
                      >
                        All {days.length} Days
                      </button>
                    )}
                  </div>
                </div>

                {/* Auto-add missing days toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoAddMissingDays}
                    onChange={(e) => setAutoAddMissingDays(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 border-[#cfcbc2] dark:border-[#3a3d4a] focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                    Automatically add new days to Weekly Madness if streak extends past current days
                  </span>
                </label>

                {/* Live summary preview box */}
                <div className="p-2.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Automatic continuous distribution:</span>
                  </div>

                  <p className="text-[11px] text-[#1f2126] dark:text-[#eceef2] leading-relaxed">
                    Will create{' '}
                    <strong className="font-bold text-blue-600 dark:text-blue-400">
                      {totalCalculatedCount} tasks
                    </strong>{' '}
                    across {previewDayNames.length} consecutive days:
                  </p>

                  {/* Flow of day names */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {previewDayNames.map((dName, idx) => (
                      <React.Fragment key={dName + idx}>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#fdfcf9] dark:bg-[#1a1b20] border border-blue-400/40 text-blue-700 dark:text-blue-300 shadow-2xs">
                          {dName}
                        </span>
                        {idx < previewDayNames.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {missingDaysCount > 0 && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium pt-1">
                      ✦ Weekly Madness will automatically add {missingDaysCount} new day{missingDaysCount > 1 ? 's' : ''} to fit all continuous tasks.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#606470] dark:text-[#9aa0ae]" />
              Category
            </label>
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#f8f6f1] dark:bg-[#121317] rounded-xl border border-[#e5e2da] dark:border-[#292b34]">
              <button
                type="button"
                onClick={() => setSelectedCategoryId('')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  !selectedCategoryId
                    ? 'bg-[#1f2126] text-white dark:bg-[#eceef2] dark:text-[#1f2126]'
                    : 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#606470] dark:text-[#9aa0ae] border border-[#e5e2da] dark:border-[#292b34]'
                }`}
              >
                None
              </button>
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    style={{
                      borderColor: isSelected ? cat.color : undefined,
                      backgroundColor: isSelected ? `${cat.color}25` : undefined,
                      color: isSelected ? cat.color : undefined,
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'font-bold'
                        : 'bg-[#fdfcf9] dark:bg-[#1a1b20] border-[#e5e2da] dark:border-[#292b34] text-[#606470] dark:text-[#9aa0ae]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#606470] dark:text-[#9aa0ae]" />
              Notes / Sub-items (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any extra details, links, or bullet points..."
              rows={2}
              className="w-full px-3 py-2 text-xs bg-[#f8f6f1] dark:bg-[#121317] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e2da] dark:border-[#292b34]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#606470] dark:text-[#9aa0ae] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              {isContinuedTask ? (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Adding...' : `Add Continuous Task (${totalCalculatedCount} Days)`}
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Adding...' : 'Add Task'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
