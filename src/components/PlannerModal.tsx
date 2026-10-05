import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Calendar, Layers } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { getTodayISO, addDays, formatDateToISO } from '../utils/dateUtils';
import { Planner } from '../types';

interface PlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  plannerToEdit?: Planner | null;
}

const DEFAULT_PARTS = ['Morning', 'Afternoon', 'Evening', 'Night', 'Self Study'];

export function PlannerModal({ isOpen, onClose, plannerToEdit }: PlannerModalProps) {
  const { createPlanner, updatePlanner, deletePlanner } = usePlanner();

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState(addDays(getTodayISO(), 6));
  const [dayParts, setDayParts] = useState<string[]>([...DEFAULT_PARTS]);
  const [newDayPartName, setNewDayPartName] = useState('');

  useEffect(() => {
    if (plannerToEdit) {
      setTitle(plannerToEdit.title);
      setStartDate(plannerToEdit.startDate);
      setEndDate(plannerToEdit.endDate);
      setDayParts(plannerToEdit.dayParts?.length ? [...plannerToEdit.dayParts] : [...DEFAULT_PARTS]);
    } else {
      const today = getTodayISO();
      setTitle('Weekly Focus Planner');
      setStartDate(today);
      setEndDate(addDays(today, 6));
      setDayParts([...DEFAULT_PARTS]);
    }
  }, [plannerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (days: number) => {
    const today = getTodayISO();
    setStartDate(today);
    setEndDate(addDays(today, days - 1));
  };

  const handleApplyThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(formatDateToISO(firstDay));
    setEndDate(formatDateToISO(lastDay));
  };

  const handleAddDayPart = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDayPartName.trim();
    if (!trimmed) return;
    if (dayParts.includes(trimmed)) return;
    setDayParts([...dayParts, trimmed]);
    setNewDayPartName('');
  };

  const handleRemoveDayPart = (index: number) => {
    if (dayParts.length <= 1) return;
    setDayParts(dayParts.filter((_, i) => i !== index));
  };

  const handleMoveDayPart = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= dayParts.length) return;
    const copy = [...dayParts];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setDayParts(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    if (startDate > endDate) {
      alert('Start date must be before or equal to end date.');
      return;
    }

    if (plannerToEdit) {
      await updatePlanner(plannerToEdit.id, {
        title: title.trim(),
        startDate,
        endDate,
        dayParts,
      });
    } else {
      await createPlanner(title.trim(), startDate, endDate, dayParts);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!plannerToEdit) return;
    if (window.confirm(`Are you sure you want to delete planner "${plannerToEdit.title}"?`)) {
      await deletePlanner(plannerToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] flex items-center justify-center border border-[#e5e2da] dark:border-[#292b34]">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1f2126] dark:text-[#eceef2]">
                {plannerToEdit ? 'Edit Planner' : 'Create Planner'}
              </h3>
              <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                Set custom date range and day-parts
              </p>
            </div>
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
          {/* Planner Title */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g. Midterm Preparation, 7-Day Sprint"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-1 focus:ring-blue-500 min-h-[42px]"
            />
          </div>

          {/* Date Range */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider">
                Date Range
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(7)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-[#f4f2ec] hover:bg-[#eae7df] dark:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2] rounded-md transition-colors min-h-[30px]"
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(14)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-[#f4f2ec] hover:bg-[#eae7df] dark:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2] rounded-md transition-colors min-h-[30px]"
                >
                  14 Days
                </button>
                <button
                  type="button"
                  onClick={handleApplyThisMonth}
                  className="px-2 py-0.5 text-[11px] font-medium bg-[#f4f2ec] hover:bg-[#eae7df] dark:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2] rounded-md transition-colors min-h-[30px]"
                >
                  Month
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] text-[#606470] dark:text-[#9aa0ae] mb-1">
                  Start Date
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden min-h-[42px]"
                />
              </div>
              <div>
                <span className="block text-[11px] text-[#606470] dark:text-[#9aa0ae] mb-1">
                  End Date
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden min-h-[42px]"
                />
              </div>
            </div>
          </div>

          {/* Day-Parts Customization */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Custom Day-Parts ({dayParts.length})
              </label>
            </div>

            <div className="space-y-1.5 mb-2.5 max-h-40 overflow-y-auto p-1 border border-[#e5e2da] dark:border-[#292b34] rounded-xl bg-[#f8f6f1] dark:bg-[#15161a]">
              {dayParts.map((part, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-1.5 bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-xs"
                >
                  <span className="font-medium text-[#1f2126] dark:text-[#eceef2]">
                    {part}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveDayPart(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-[#8c909c] hover:text-[#1f2126] disabled:opacity-20 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDayPart(index, 'down')}
                      disabled={index === dayParts.length - 1}
                      className="p-1 text-[#8c909c] hover:text-[#1f2126] disabled:opacity-20 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDayPart(index)}
                      disabled={dayParts.length <= 1}
                      className="p-1 text-[#8c909c] hover:text-red-500 disabled:opacity-20 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New Day-Part (e.g., Gym, Lab Work)"
                value={newDayPartName}
                onChange={(e) => setNewDayPartName(e.target.value)}
                maxLength={64}
                className="flex-1 px-3 py-1.5 text-xs bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden min-h-[38px]"
              />
              <button
                type="button"
                onClick={handleAddDayPart}
                className="px-3 py-1.5 text-xs font-semibold bg-[#f4f2ec] hover:bg-[#eae7df] dark:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2] rounded-lg transition-colors flex items-center gap-1 min-h-[38px]"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#e5e2da] dark:border-[#292b34]">
            {plannerToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" /> Delete
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
                {plannerToEdit ? 'Save Changes' : 'Create Planner'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
