import React from 'react';
import {
  Layers,
  CheckCircle2,
  Trash2,
  X,
  CheckSquare,
} from 'lucide-react';

interface BatchTaskActionBarProps {
  selectedCount: number;
  onOpenBatchMove: () => void;
  onBatchToggleComplete: () => void;
  onBatchDelete: () => void;
  onClearSelection: () => void;
  isAllCompleted?: boolean;
}

export function BatchTaskActionBar({
  selectedCount,
  onOpenBatchMove,
  onBatchToggleComplete,
  onBatchDelete,
  onClearSelection,
  isAllCompleted = false,
}: BatchTaskActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <aside
      aria-label="Batch task actions"
      className="fixed bottom-18 md:bottom-6 left-3 right-3 md:left-auto md:right-8 z-45 max-w-xl mx-auto md:mx-0 animate-in slide-in-from-bottom-3 duration-200"
    >
      <div className="bg-[#1f2126] text-[#fdfcf9] dark:bg-[#eceef2] dark:text-[#121317] border border-[#3e4252] dark:border-[#d1d5db] rounded-2xl p-2.5 sm:p-3 shadow-2xl flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Count badge */}
        <div className="flex items-center gap-2 pl-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-bold tracking-tight">
            {selectedCount} {selectedCount === 1 ? 'task' : 'tasks'} selected
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* 1. Primary: Move to Block / Section */}
          <button
            type="button"
            onClick={onOpenBatchMove}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-98 min-h-[44px]"
            title="Move selected tasks to another time block"
          >
            <Layers className="w-4 h-4" />
            <span>Move to Block</span>
          </button>

          {/* 2. Toggle Complete */}
          <button
            type="button"
            onClick={onBatchToggleComplete}
            className="p-2.5 hover:bg-white/10 dark:hover:bg-black/10 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
            title={isAllCompleted ? 'Mark incomplete' : 'Mark complete'}
            aria-label={isAllCompleted ? 'Mark incomplete' : 'Mark complete'}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span className="hidden sm:inline text-[11px]">
              {isAllCompleted ? 'Uncomplete' : 'Complete'}
            </span>
          </button>

          {/* 3. Delete */}
          <button
            type="button"
            onClick={onBatchDelete}
            className="p-2.5 hover:bg-red-500/20 text-red-400 dark:text-red-600 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
            title="Delete selected tasks"
            aria-label="Delete selected tasks"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* 4. Clear Selection */}
          <button
            type="button"
            onClick={onClearSelection}
            className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-[#8c909c] hover:text-white dark:hover:text-black"
            title="Deselect all"
            aria-label="Deselect all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
