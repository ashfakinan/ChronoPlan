import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Tag, FileText } from 'lucide-react';
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
  const { days, categories, addTask, setFilterCategoryId } = useMadness();

  const [title, setTitle] = useState('');
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setNotes('');
      setErrorMsg('');
      setSelectedDayId(initialDayId || (days[0]?.id ?? ''));
      setSelectedCategoryId(initialCategoryId || '');
    }
  }, [isOpen, initialDayId, initialCategoryId, days]);

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
      await addTask(dayIdToUse, cleanTitle, selectedCategoryId || undefined, notes.trim() || undefined);
      // Reset filter so the user can immediately see their task
      setFilterCategoryId(null);
      onClose();
    } catch {
      setErrorMsg('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1f2126] dark:text-[#eceef2]">
                Add Task to Weekly Madness
              </h2>
              <p className="text-xs text-[#606470] dark:text-[#9aa0ae]">
                Freeform weekly task with customizable day and category
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#606470] dark:text-[#9aa0ae]" />
              Select Day
            </label>
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
              <Plus className="w-3.5 h-3.5" />
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
