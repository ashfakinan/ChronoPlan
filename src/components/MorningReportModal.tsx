import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { formatFullDate, getTodayISO } from '../utils/dateUtils';

export function MorningReportModal() {
  const {
    showMorningReport,
    dismissMorningReport,
    yesterdayStats,
    rolloverYesterdayRemaining,
    subjects,
    tasks,
    todos,
  } = usePlanner();

  const [rolledOver, setRolledOver] = useState(false);
  const [isRollingOver, setIsRollingOver] = useState(false);

  if (!showMorningReport) return null;

  const today = getTodayISO();
  const todayTasks = tasks.filter((t) => t.date === today);
  const todayTodos = todos.filter((t) => t.date === today);

  const getSubject = (subjectId: string) => subjects.find((s) => s.id === subjectId);

  const handleRollover = async () => {
    setIsRollingOver(true);
    await rolloverYesterdayRemaining();
    setIsRollingOver(false);
    setRolledOver(true);
  };

  const hasRemaining = yesterdayStats.remainingTasks.length > 0 || yesterdayStats.remainingTodos.length > 0;
  const hasCompleted = yesterdayStats.completedTasks.length > 0 || yesterdayStats.completedTodos.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Editorial Calm Header */}
        <div className="px-5 sm:px-6 py-5 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#606470] dark:text-[#9aa0ae]">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Daily Review & Morning Briefing</span>
              <span aria-hidden="true">·</span>
              <span>{formatFullDate(today)}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1f2126] dark:text-[#eceef2] mt-1 tracking-tight">
              {yesterdayStats.rate >= 80
                ? 'Strong completion yesterday. Maintain your pace.'
                : yesterdayStats.rate >= 50
                ? 'Solid progress. Ready to plan today.'
                : 'A fresh day has started. Time to plan with clarity.'}
            </h2>
          </div>

          <button
            type="button"
            onClick={dismissMorningReport}
            className="p-1.5 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-1"
            aria-label="Close daily review"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quiet Performance Bar */}
        <div className="px-5 sm:px-6 py-3 bg-[#f8f6f1] dark:bg-[#15161a] border-b border-[#e5e2da] dark:border-[#292b34] grid grid-cols-3 gap-3 text-center">
          <div className="p-2.5 rounded-xl bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34]">
            <div className="text-[10px] font-semibold text-[#8c909c] uppercase tracking-wider">
              Yesterday
            </div>
            <div className="text-xl font-black text-[#1f2126] dark:text-[#eceef2] mt-0.5 tabular-nums">
              {yesterdayStats.rate}%
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34]">
            <div className="text-[10px] font-semibold text-[#8c909c] uppercase tracking-wider">
              Done
            </div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">
              {yesterdayStats.completedCount}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34]">
            <div className="text-[10px] font-semibold text-[#8c909c] uppercase tracking-wider">
              Remaining
            </div>
            <div className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5 tabular-nums">
              {yesterdayStats.totalCount - yesterdayStats.completedCount}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Completed Section */}
          <div>
            <div className="text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>What You Completed ({yesterdayStats.completedTasks.length + yesterdayStats.completedTodos.length})</span>
            </div>

            {hasCompleted ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {yesterdayStats.completedTasks.map((t) => {
                  const s = getSubject(t.subjectId);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] text-xs text-[#606470] dark:text-[#9aa0ae]"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="line-through">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8c909c]">
                        {s && <span style={{ color: s.color }}>{s.name}</span>}
                        <span>·</span>
                        <span>{t.dayPart}</span>
                      </div>
                    </div>
                  );
                })}

                {yesterdayStats.completedTodos.map((td) => (
                  <div
                    key={td.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] text-xs text-[#606470] dark:text-[#9aa0ae]"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="line-through">{td.text}</span>
                    </div>
                    <span className="text-[10px] text-[#8c909c]">To-Do</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8c909c] italic p-3 bg-[#f8f6f1] dark:bg-[#15161a] rounded-xl">
                No items marked completed yesterday.
              </p>
            )}
          </div>

          {/* Remaining Section with Rollover Action */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Remaining Items ({yesterdayStats.remainingTasks.length + yesterdayStats.remainingTodos.length})</span>
              </div>

              {hasRemaining && !rolledOver && (
                <button
                  type="button"
                  onClick={handleRollover}
                  disabled={isRollingOver}
                  className="px-2.5 py-1 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1 min-h-[36px]"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  {isRollingOver ? 'Moving...' : 'Move to Today'}
                </button>
              )}

              {rolledOver && (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Moved to Today!
                </span>
              )}
            </div>

            {hasRemaining ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {yesterdayStats.remainingTasks.map((t) => {
                  const s = getSubject(t.subjectId);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] text-xs text-[#1f2126] dark:text-[#eceef2]"
                    >
                      <span className="font-medium">{t.title}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8c909c]">
                        {s && <span style={{ color: s.color }}>{s.name}</span>}
                        <span>·</span>
                        <span>{t.dayPart}</span>
                      </div>
                    </div>
                  );
                })}

                {yesterdayStats.remainingTodos.map((td) => (
                  <div
                    key={td.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] text-xs text-[#1f2126] dark:text-[#eceef2]"
                  >
                    <span>{td.text}</span>
                    <span className="text-[10px] text-[#8c909c]">To-Do</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 p-2.5 bg-emerald-500/10 rounded-xl font-medium">
                No unfinished tasks left over from yesterday.
              </p>
            )}
          </div>

          {/* Today's Agenda Preview */}
          <div className="p-3.5 rounded-xl bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] text-xs text-[#606470] dark:text-[#9aa0ae]">
            <div className="font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1">
              Today's Overview
            </div>
            <span>
              {todayTasks.length} planner tasks and {todayTodos.length} daily to-dos scheduled for today.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20] flex justify-end">
          <button
            type="button"
            onClick={dismissMorningReport}
            className="px-5 py-2 text-xs font-semibold bg-[#1f2126] text-[#fdfcf9] hover:bg-[#343842] dark:bg-[#eceef2] dark:text-[#121317] dark:hover:bg-[#d8dbe2] rounded-xl transition-colors min-h-[44px]"
          >
            Start Planning Today
          </button>
        </div>
      </div>
    </div>
  );
}
