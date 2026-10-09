import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  Trash2,
  X,
  Tag,
  AlertCircle,
  Check,
  ChevronDown,
} from 'lucide-react';

export interface BatchCategoryOption {
  id: string;
  name: string;
  color?: string;
}

interface BatchTaskActionBarProps {
  selectedCount: number;
  onOpenBatchMove?: () => void;
  onBatchToggleComplete?: () => void;
  onBatchDelete: () => void;
  onClearSelection: () => void;
  isAllCompleted?: boolean;
  // Category / Subject batch support:
  isAllSameCategory?: boolean;
  currentCategoryName?: string;
  currentCategoryColor?: string;
  availableCategories?: BatchCategoryOption[];
  onSelectCategory?: (categoryId: string) => void;
  categoryLabel?: string; // e.g. "Category" or "Subject"
}

export function BatchTaskActionBar({
  selectedCount,
  onOpenBatchMove,
  onBatchToggleComplete,
  onBatchDelete,
  onClearSelection,
  isAllCompleted = false,
  isAllSameCategory,
  currentCategoryName,
  currentCategoryColor,
  availableCategories,
  onSelectCategory,
  categoryLabel = 'Category',
}: BatchTaskActionBarProps) {
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [showMixedWarning, setShowMixedWarning] = useState(false);

  if (selectedCount === 0) return null;

  const hasCategoryFeature =
    availableCategories !== undefined &&
    availableCategories.length > 0 &&
    onSelectCategory !== undefined;

  return (
    <aside
      aria-label="Batch task actions"
      className="fixed bottom-18 md:bottom-6 left-3 right-3 md:left-auto md:right-8 z-45 max-w-2xl mx-auto md:mx-0 animate-in slide-in-from-bottom-3 duration-200"
    >
      <div className="bg-[#1f2126] text-[#fdfcf9] dark:bg-[#eceef2] dark:text-[#121317] border border-[#3e4252] dark:border-[#d1d5db] rounded-2xl p-2 sm:p-2.5 shadow-2xl flex items-center justify-between gap-2 flex-wrap">
        {/* Count badge */}
        <div className="flex items-center gap-2 pl-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <span className="text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap">
            {selectedCount} {selectedCount === 1 ? 'task' : 'tasks'} selected
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {/* Category Change Button / Status */}
          {hasCategoryFeature && (
            <div className="relative">
              {isAllSameCategory ? (
                // Enabled: All selected tasks have the SAME category!
                <button
                  type="button"
                  onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs active:scale-98 min-h-[38px]"
                  title={`Change ${categoryLabel} for all ${selectedCount} selected tasks`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span className="max-w-[100px] sm:max-w-[130px] truncate">
                    {currentCategoryName ? currentCategoryName : `Set ${categoryLabel}`}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-80" />
                </button>
              ) : (
                // Disabled / Locked: Selected tasks have DIFFERENT categories!
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMixedWarning(!showMixedWarning)}
                    className="px-2.5 py-1.5 bg-amber-500/20 text-amber-300 dark:text-amber-800 border border-amber-500/40 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                    title={`Different ${categoryLabel.toLowerCase()}s selected. Cannot change all together.`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="hidden sm:inline">Mixed {categoryLabel}s</span>
                    <span className="sm:hidden">Mixed</span>
                  </button>

                  {showMixedWarning && (
                    <div className="absolute bottom-full right-0 mb-2 w-60 p-2.5 bg-[#2a2d36] text-white dark:bg-[#ffffff] dark:text-[#121317] border border-[#444857] dark:border-[#e5e2da] rounded-xl shadow-xl text-[11px] leading-snug z-50 animate-in fade-in zoom-in-95">
                      <div className="font-bold text-amber-400 dark:text-amber-600 mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Different {categoryLabel}s Selected
                      </div>
                      <p className="text-[#c5c8d2] dark:text-[#4b5563]">
                        All selected tasks must have the same {categoryLabel.toLowerCase()} to change them all at once. Select tasks of the same {categoryLabel.toLowerCase()} to enable batch change.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowMixedWarning(false)}
                        className="mt-2 text-[10px] text-blue-400 dark:text-blue-600 font-semibold hover:underline block text-right"
                      >
                        Got it
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Popover for selecting new category */}
              {isCategoryPickerOpen && isAllSameCategory && (
                <div className="absolute bottom-full right-0 mb-2 w-52 p-2 bg-[#2a2d36] text-white dark:bg-[#ffffff] dark:text-[#121317] border border-[#444857] dark:border-[#e5e2da] rounded-xl shadow-2xl z-50 space-y-1 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold text-[#8c909c] uppercase tracking-wider">
                    Change {categoryLabel} to:
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {availableCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat.id);
                          setIsCategoryPickerOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-black/10 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {cat.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                          )}
                          <span className="truncate">{cat.name}</span>
                        </div>
                        {currentCategoryName === cat.name && (
                          <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Move to Block / Section (Optional, for Planner) */}
          {onOpenBatchMove && (
            <button
              type="button"
              onClick={onOpenBatchMove}
              className="px-2.5 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 active:scale-98 min-h-[38px]"
              title="Move selected tasks to another time block"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Move</span>
            </button>
          )}

          {/* Toggle Complete (Optional) */}
          {onBatchToggleComplete && (
            <button
              type="button"
              onClick={onBatchToggleComplete}
              className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 min-h-[38px] min-w-[38px] justify-center"
              title={isAllCompleted ? 'Mark incomplete' : 'Mark complete'}
              aria-label={isAllCompleted ? 'Mark incomplete' : 'Mark complete'}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            </button>
          )}

          {/* Delete Button */}
          <button
            type="button"
            onClick={onBatchDelete}
            className="px-2.5 sm:px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 dark:text-red-600 border border-red-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 min-h-[38px]"
            title={`Delete ${selectedCount} selected tasks`}
            aria-label="Delete selected tasks"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          {/* Clear Selection */}
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1.5 hover:bg-white/10 dark:hover:bg-black/10 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center text-[#8c909c] hover:text-white dark:hover:text-black"
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
