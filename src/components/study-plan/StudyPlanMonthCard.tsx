import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  StudyMonth,
  StudySubject,
  StudyChapter,
  ChapterState,
} from './types';
import { StudyPlanChapterCard } from './StudyPlanChapterCard';

interface StudyPlanMonthCardProps {
  month: StudyMonth;
  subjects: StudySubject[];
  isOpen: boolean;
  onToggleOpen: () => void;
  selectedSubjectFilter: string;
  searchQuery: string;
  getChapterState: (monthNumber: number, subjectKey: string, index: number) => ChapterState;
  onToggleChapterStatus: (
    monthNumber: number,
    subjectKey: string,
    index: number,
    field: 'r' | 'd'
  ) => void;
  onEditChapter: (monthId: string, subjectKey: string, chapter: StudyChapter) => void;
  onDeleteChapter: (monthId: string, subjectKey: string, chapterId: string) => void;
  onEditMonth: (month: StudyMonth) => void;
  onDeleteMonth: (monthId: string) => void;
  onOpenAddChapter: (monthId: string, subjectKey?: string) => void;
}

export function StudyPlanMonthCard({
  month,
  subjects,
  isOpen,
  onToggleOpen,
  selectedSubjectFilter,
  searchQuery,
  getChapterState,
  onToggleChapterStatus,
  onEditChapter,
  onDeleteChapter,
  onEditMonth,
  onDeleteMonth,
  onOpenAddChapter,
}: StudyPlanMonthCardProps) {
  // Count total chapters & completed chapters in this month
  let monthTotal = 0;
  let monthDone = 0;

  subjects.forEach((s) => {
    const list = month.subjectsData[s.key];
    if (Array.isArray(list)) {
      list.forEach((_, idx) => {
        monthTotal++;
        const st = getChapterState(month.n, s.key, idx);
        if (st.d) monthDone++;
      });
    }
  });

  const monthPercent = monthTotal > 0 ? Math.round((monthDone / monthTotal) * 100) : 100;

  // Filter subjects to show
  const visibleSubjects = subjects.filter((s) => {
    if (selectedSubjectFilter === 'all') return true;
    return s.key === selectedSubjectFilter;
  });

  return (
    <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl overflow-hidden shadow-2xs transition-all">
      {/* Month Accordion Header */}
      <div
        className="p-3 sm:p-4 bg-[#f8f6f1] dark:bg-[#20222a] border-b border-[#e5e2da] dark:border-[#292b34] flex items-center justify-between cursor-pointer select-none"
        onClick={onToggleOpen}
      >
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-bold text-[10px] tracking-wide">
            Month {month.n}
          </span>
          <span className="font-bold text-sm sm:text-base text-[#1f2126] dark:text-[#eceef2]">
            {month.label}
          </span>
          <span className="text-xs text-[#8c909c] font-normal hidden sm:inline">
            ({monthDone}/{monthTotal} done · {monthPercent}%)
          </span>
        </div>

        {/* Right tools: edit month, delete month, chevron */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onOpenAddChapter(month.id)}
            className="px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            title="Add chapter to this month"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span>
          </button>

          <button
            type="button"
            onClick={() => onEditMonth(month)}
            className="p-1.5 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors cursor-pointer"
            title="Edit month name"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteMonth(month.id)}
            className="p-1.5 text-[#8c909c] hover:text-red-600 rounded-lg transition-colors cursor-pointer"
            title="Delete month"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onToggleOpen}
            className="p-1.5 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors cursor-pointer"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Month Columns Body */}
      {isOpen && (
        <div className="p-3 sm:p-4">
          <div
            className={`grid gap-3.5 ${
              visibleSubjects.length === 1
                ? 'grid-cols-1'
                : visibleSubjects.length === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {visibleSubjects.map((sub) => {
              const data = month.subjectsData[sub.key];
              const isRevision = data === 'revision';
              const chapters = Array.isArray(data) ? data : [];

              // Filter by search query if any
              const filteredChapters = chapters.filter((ch) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                const name = (ch.name || ch.title || '').toLowerCase();
                const p = (ch.p || '').toLowerCase();
                const c = String(ch.c || '').toLowerCase();
                return name.includes(q) || p.includes(q) || c.includes(q);
              });

              return (
                <div
                  key={sub.key}
                  className="rounded-xl border border-[#e5e2da] dark:border-[#292b34] bg-[#f8f6f1]/40 dark:bg-[#14151a]/40 p-2.5 flex flex-col min-h-[140px]"
                >
                  {/* Subject Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e5e2da] dark:border-[#292b34]">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span className="font-bold text-xs" style={{ color: sub.color }}>
                        {sub.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenAddChapter(month.id, sub.key)}
                      className="p-1 text-[#8c909c] hover:text-blue-600 rounded-md transition-colors"
                      title={`Add ${sub.label} chapter`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subject Content */}
                  <div className="space-y-2 flex-1">
                    {isRevision ? (
                      <div className="h-full py-6 flex flex-col items-center justify-center text-center rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-dashed border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300">
                        <Sparkles className="w-5 h-5 mb-1" />
                        <span className="font-bold text-xs">Revision Month</span>
                        <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80">
                          Comprehensive practice & recall
                        </span>
                      </div>
                    ) : filteredChapters.length === 0 ? (
                      <div className="h-full py-4 flex flex-col items-center justify-center text-center text-xs text-[#8c909c] italic">
                        <span>No chapters scheduled</span>
                        <button
                          type="button"
                          onClick={() => onOpenAddChapter(month.id, sub.key)}
                          className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline not-italic font-medium"
                        >
                          + Add Chapter
                        </button>
                      </div>
                    ) : (
                      filteredChapters.map((chapter) => {
                        const originalIndex = chapters.indexOf(chapter);
                        const state = getChapterState(month.n, sub.key, originalIndex);

                        return (
                          <StudyPlanChapterCard
                            key={chapter.id}
                            chapter={chapter}
                            state={state}
                            subjectColor={sub.color}
                            onToggleStatus={(field) =>
                              onToggleChapterStatus(month.n, sub.key, originalIndex, field)
                            }
                            onEdit={() => onEditChapter(month.id, sub.key, chapter)}
                            onDelete={() => onDeleteChapter(month.id, sub.key, chapter.id)}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
