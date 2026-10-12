import React from 'react';
import { StudySubject, SubjectProgress } from './types';

interface StudyPlanProgressOverviewProps {
  subjects: StudySubject[];
  totalChapters: number;
  completedChapters: number;
  routineChapters: number;
  overallPercentage: number;
  bySubject: Record<string, SubjectProgress>;
}

export function StudyPlanProgressOverview({
  subjects,
  totalChapters,
  completedChapters,
  routineChapters,
  overallPercentage,
  bySubject,
}: StudyPlanProgressOverviewProps) {
  return (
    <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border-b border-[#e5e2da] dark:border-[#292b34] p-3 sm:p-5 shrink-0 space-y-3">
      {/* Overall Progress */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span className="text-[#1f2126] dark:text-[#eceef2]">
            Overall Syllabus Completion
          </span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">
            {completedChapters} of {totalChapters} chapters ({overallPercentage}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#f4f2ec] dark:bg-[#22242b] overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
      </div>

      {/* Per-subject breakdown cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {subjects.map((sub) => {
          const p = bySubject[sub.key] || { total: 0, completed: 0, routine: 0, percentage: 0 };
          return (
            <div
              key={sub.key}
              className="p-2.5 rounded-xl border border-[#e5e2da] dark:border-[#292b34] bg-[#f8f6f1]/50 dark:bg-[#14151a]/50"
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="truncate" style={{ color: sub.color }}>
                  {sub.label}
                </span>
                <span className="text-[11px] font-bold text-[#1f2126] dark:text-[#eceef2]">
                  {p.percentage}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#e5e2da] dark:bg-[#292b34] overflow-hidden mb-1">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${p.percentage}%`, backgroundColor: sub.color }}
                />
              </div>
              <div className="text-[10px] text-[#8c909c]">
                {p.completed}/{p.total} completed
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
