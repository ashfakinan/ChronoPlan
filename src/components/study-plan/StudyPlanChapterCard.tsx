import React from 'react';
import { Edit2, Trash2, Check } from 'lucide-react';
import { StudyChapter, ChapterState } from './types';
import { getChapterDisplayName } from './constants';

interface StudyPlanChapterCardProps {
  chapter: StudyChapter;
  state: ChapterState;
  subjectColor: string;
  onToggleStatus: (field: 'r' | 'd') => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function StudyPlanChapterCard({
  chapter,
  state,
  subjectColor,
  onToggleStatus,
  onEdit,
  onDelete,
}: StudyPlanChapterCardProps) {
  const { prefix, name } = getChapterDisplayName(chapter);

  return (
    <div
      className={`group/chapter relative rounded-xl border p-2 text-xs transition-all ${
        state.d
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40 opacity-75'
          : state.r
          ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800/40'
          : 'bg-[#fdfcf9] dark:bg-[#1a1b20] border-[#e5e2da] dark:border-[#292b34] hover:border-[#cfcac0]'
      }`}
    >
      {/* Chapter Badges & Title */}
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            {prefix && (
              <span
                className="px-1.5 py-0.2 rounded-md text-[9px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${subjectColor}18`,
                  color: subjectColor,
                }}
              >
                {prefix}
              </span>
            )}
            {state.r && !state.d && (
              <span className="px-1 py-0.2 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[8px] font-bold">
                Routine
              </span>
            )}
          </div>

          <div
            className={`font-semibold text-xs mt-1 leading-snug break-words ${
              state.d
                ? 'line-through text-[#8c909c]'
                : 'text-[#1f2126] dark:text-[#eceef2]'
            }`}
          >
            {name || 'Chapter Topic'}
          </div>
        </div>

        {/* Edit / Delete quick buttons on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/chapter:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onEdit}
            className="p-1 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-md transition-colors"
            title="Edit chapter details"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-[#8c909c] hover:text-red-600 rounded-md transition-colors"
            title="Delete chapter"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* R (Routine) & D (Done) Checkboxes */}
      <div className="flex items-center gap-3 pt-1.5 border-t border-[#f4f2ec] dark:border-[#22242b] text-[11px]">
        {/* Added to Routine toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer text-[#606470] dark:text-[#9aa0ae] select-none hover:text-[#1f2126] dark:hover:text-[#eceef2]">
          <input
            type="checkbox"
            checked={state.r}
            onChange={() => onToggleStatus('r')}
            className="sr-only"
          />
          <div
            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
              state.r
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-[#8c909c] bg-transparent'
            }`}
          >
            {state.r && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </div>
          <span className="font-medium text-[10px]">Routine</span>
        </label>

        {/* Finished / Done toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer text-[#606470] dark:text-[#9aa0ae] select-none hover:text-[#1f2126] dark:hover:text-[#eceef2]">
          <input
            type="checkbox"
            checked={state.d}
            onChange={() => onToggleStatus('d')}
            className="sr-only"
          />
          <div
            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
              state.d
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-[#8c909c] bg-transparent'
            }`}
          >
            {state.d && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </div>
          <span className="font-medium text-[10px]">Done</span>
        </label>
      </div>
    </div>
  );
}
