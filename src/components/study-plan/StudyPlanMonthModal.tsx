import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { StudyMonth } from './types';

interface StudyPlanMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: StudyMonth | null;
  onSave: (monthId: string, newLabel: string) => void;
}

export function StudyPlanMonthModal({
  isOpen,
  onClose,
  month,
  onSave,
}: StudyPlanMonthModalProps) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (month) {
      setLabel(month.label);
    }
  }, [month, isOpen]);

  if (!isOpen || !month) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onSave(month.id, label.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-sm text-[#1f2126] dark:text-[#eceef2]">
              Edit Month {month.n} Label
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1">
              Month Title / Time Period
            </label>
            <input
              type="text"
              placeholder="e.g. October 2026"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2]"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e2da] dark:border-[#292b34]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#606470] dark:text-[#9aa0ae] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
            >
              Save Label
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
