import React, { useState } from 'react';
import {
  X,
  Layers,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sun,
  Sunset,
  Moon,
  Coffee,
  BookOpen,
} from 'lucide-react';
import { formatFullDate, isToday } from '../utils/dateUtils';

interface BatchMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTaskCount: number;
  availableDayParts: string[];
  availableDates: string[];
  initialDate: string;
  onConfirmMove: (targetDate: string, targetDayPart: string) => Promise<void>;
}

export function BatchMoveModal({
  isOpen,
  onClose,
  selectedTaskCount,
  availableDayParts,
  availableDates,
  initialDate,
  onConfirmMove,
}: BatchMoveModalProps) {
  const [targetDate, setTargetDate] = useState(initialDate);
  const [selectedDayPart, setSelectedDayPart] = useState<string>(
    availableDayParts[0] || 'Morning'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial date if modal opens with different date
  React.useEffect(() => {
    if (isOpen) {
      setTargetDate(initialDate);
      if (availableDayParts.length > 0) {
        setSelectedDayPart(availableDayParts[0]);
      }
    }
  }, [isOpen, initialDate, availableDayParts]);

  if (!isOpen) return null;

  const getDayPartIcon = (dayPart: string) => {
    const lower = dayPart.toLowerCase();
    if (lower.includes('morning')) return <Sun className="w-4 h-4 text-amber-500" />;
    if (lower.includes('afternoon')) return <Coffee className="w-4 h-4 text-orange-500" />;
    if (lower.includes('evening')) return <Sunset className="w-4 h-4 text-indigo-500" />;
    if (lower.includes('night')) return <Moon className="w-4 h-4 text-blue-400" />;
    return <BookOpen className="w-4 h-4 text-emerald-500" />;
  };

  const handleExecuteMove = async (dayPartToMove: string) => {
    try {
      setIsSubmitting(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([25, 35]);
        } catch {
          // ignore
        }
      }
      await onConfirmMove(targetDate, dayPartToMove);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border-t sm:border border-[#e5e2da] dark:border-[#292b34] rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#1f2126] dark:text-[#eceef2]">
                Move {selectedTaskCount} {selectedTaskCount === 1 ? 'Task' : 'Tasks'}
              </h2>
              <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                Batch transfer tasks to another time block
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Target Date Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1f2126] dark:text-[#eceef2] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Target Date</span>
            </label>
            <select
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full p-3 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] focus:ring-2 focus:ring-blue-500 min-h-[46px] font-medium"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {formatFullDate(d)} {isToday(d) ? '(Today)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Time Block Selection */}
          <div>
            <label className="block text-xs font-bold text-[#1f2126] dark:text-[#eceef2] mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Select Destination Time Block</span>
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                Tap to move instantly
              </span>
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {availableDayParts.map((dp) => {
                const isSelected = selectedDayPart === dp;
                return (
                  <button
                    key={dp}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setSelectedDayPart(dp);
                      handleExecuteMove(dp);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between min-h-[52px] ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-[#1f2126] dark:text-[#eceef2] ring-2 ring-blue-500/40 shadow-xs'
                        : 'border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#202127] hover:border-blue-400 hover:bg-[#f4f2ec] dark:hover:bg-[#262831] text-[#1f2126] dark:text-[#eceef2]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#f4f2ec] dark:bg-[#22242b] flex items-center justify-center shrink-0">
                        {getDayPartIcon(dp)}
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold">{dp}</div>
                        <div className="text-[10px] text-[#606470] dark:text-[#9aa0ae]">
                          Shift {selectedTaskCount} {selectedTaskCount === 1 ? 'task' : 'tasks'} here
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold">
                      <span>Move</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] flex items-center justify-between">
          <span className="text-xs text-[#606470] dark:text-[#9aa0ae]">
            {selectedTaskCount} selected
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-xl transition-colors min-h-[44px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
