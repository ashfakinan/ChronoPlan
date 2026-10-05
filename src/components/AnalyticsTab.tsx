import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Flame,
  Layers,
  Award,
  Clock,
  PieChart,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { getTodayISO, addDays, formatShortDate, getWeekdayName } from '../utils/dateUtils';

export function AnalyticsTab() {
  const { tasks, todos, subjects, activePlanner } = usePlanner();
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(14);

  const today = getTodayISO();

  // 1. Core KPIs
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const totalTodos = todos.length;
  const completedTodos = todos.filter((t) => t.isCompleted).length;

  const totalAllItems = totalTasks + totalTodos;
  const totalAllCompleted = completedTasks + completedTodos;
  const overallRate = totalAllItems > 0 ? Math.round((totalAllCompleted / totalAllItems) * 100) : 0;

  // Streak calculation
  const streak = useMemo(() => {
    let count = 0;
    let checkDate = today;
    for (let i = 0; i < 60; i++) {
      const hasCompletedTask = tasks.some((t) => t.date === checkDate && t.isCompleted);
      const hasCompletedTodo = todos.some((td) => td.date === checkDate && td.isCompleted);
      if (hasCompletedTask || hasCompletedTodo) {
        count++;
        checkDate = addDays(checkDate, -1);
      } else {
        if (i === 0) {
          checkDate = addDays(checkDate, -1);
          continue;
        }
        break;
      }
    }
    return count;
  }, [tasks, todos, today]);

  // 2. Trend Data over chosen timeRange
  const trendDays = useMemo(() => {
    const list: { date: string; planned: number; completed: number; rate: number }[] = [];
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const dayTasks = tasks.filter((t) => t.date === d);
      const dayTodos = todos.filter((td) => td.date === d);
      const totalPlanned = dayTasks.length + dayTodos.length;
      const totalDone = dayTasks.filter((t) => t.isCompleted).length + dayTodos.filter((td) => td.isCompleted).length;
      const rate = totalPlanned > 0 ? Math.round((totalDone / totalPlanned) * 100) : 0;
      list.push({
        date: d,
        planned: totalPlanned,
        completed: totalDone,
        rate,
      });
    }
    return list;
  }, [tasks, todos, today, timeRange]);

  // 3. Subject Distribution
  const subjectStats = useMemo(() => {
    return subjects.map((subj) => {
      const subjTasks = tasks.filter((t) => t.subjectId === subj.id);
      const completed = subjTasks.filter((t) => t.isCompleted).length;
      const rate = subjTasks.length > 0 ? Math.round((completed / subjTasks.length) * 100) : 0;
      return {
        subject: subj,
        total: subjTasks.length,
        completed,
        rate,
      };
    }).sort((a, b) => b.total - a.total);
  }, [tasks, subjects]);

  // 4. Day-Part Productivity
  const dayPartStats = useMemo(() => {
    const parts = activePlanner?.dayParts || ['Morning', 'Afternoon', 'Evening', 'Night', 'Self Study'];
    return parts.map((part) => {
      const partTasks = tasks.filter((t) => t.dayPart === part);
      const done = partTasks.filter((t) => t.isCompleted).length;
      const rate = partTasks.length > 0 ? Math.round((done / partTasks.length) * 100) : 0;
      return {
        dayPart: part,
        total: partTasks.length,
        completed: done,
        rate,
      };
    });
  }, [tasks, activePlanner]);

  const bestDayPart = useMemo(() => {
    const active = dayPartStats.filter((p) => p.total > 0);
    if (!active.length) return null;
    return active.reduce((best, cur) => (cur.rate > best.rate ? cur : best), active[0]);
  }, [dayPartStats]);

  const maxDailyTasks = Math.max(...trendDays.map((d) => d.planned), 5);

  return (
    <div className="flex-1 bg-[#f8f6f1] dark:bg-[#121317] p-4 sm:p-6 overflow-y-auto h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] pb-20 md:pb-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              <h1 className="text-base sm:text-lg font-bold text-[#1f2126] dark:text-[#eceef2] tracking-tight">
                Productivity Trends
              </h1>
            </div>
            <p className="text-xs text-[#606470] dark:text-[#9aa0ae] mt-0.5">
              Task velocity, subject balance, and daily habit consistency
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#fdfcf9] dark:bg-[#1a1b20] p-1 rounded-xl border border-[#e5e2da] dark:border-[#292b34] shadow-2xs">
            {([7, 14, 30] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors min-h-[34px] ${
                  timeRange === r
                    ? 'bg-[#1f2126] text-[#fdfcf9] dark:bg-[#eceef2] dark:text-[#121317]'
                    : 'text-[#606470] dark:text-[#9aa0ae] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b]'
                }`}
              >
                {r} Days
              </button>
            ))}
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Overall Rate */}
          <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl p-4 sm:p-5 shadow-xs">
            <span className="text-[11px] font-semibold text-[#8c909c] uppercase tracking-wider block">
              Overall Rate
            </span>
            <div className="text-2xl font-black text-[#1f2126] dark:text-[#eceef2] mt-1 tabular-nums">
              {overallRate}%
            </div>
            <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae] mt-1">
              {totalAllCompleted} of {totalAllItems} done
            </p>
          </div>

          {/* Current Streak */}
          <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl p-4 sm:p-5 shadow-xs">
            <span className="text-[11px] font-semibold text-[#8c909c] uppercase tracking-wider block">
              Active Streak
            </span>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1.5 tabular-nums">
              {streak} <span className="text-xs font-semibold text-[#8c909c]">Days</span>
            </div>
            <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae] mt-1">
              Consecutive days active
            </p>
          </div>

          {/* Completed Items */}
          <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl p-4 sm:p-5 shadow-xs">
            <span className="text-[11px] font-semibold text-[#8c909c] uppercase tracking-wider block">
              Items Finished
            </span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
              {completedTasks + completedTodos}
            </div>
            <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae] mt-1">
              {completedTasks} tasks · {completedTodos} to-dos
            </p>
          </div>

          {/* Best Day-Part */}
          <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl p-4 sm:p-5 shadow-xs">
            <span className="text-[11px] font-semibold text-[#8c909c] uppercase tracking-wider block">
              Best Day-Part
            </span>
            <div className="text-xl font-bold text-[#1f2126] dark:text-[#eceef2] mt-1 truncate">
              {bestDayPart ? bestDayPart.dayPart : 'Balanced'}
            </div>
            <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae] mt-1">
              {bestDayPart ? `${bestDayPart.rate}% efficiency` : 'No data yet'}
            </p>
          </div>
        </div>

        {/* 2. Productivity Trends Bar Chart */}
        <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider">
                Daily Task Velocity ({timeRange} Days)
              </h2>
              <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                Planned tasks (muted bar) vs Completed (green bar)
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#e5e2da] dark:bg-[#292b34]" />
                <span className="text-[#606470] dark:text-[#9aa0ae]">Planned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
                <span className="text-[#606470] dark:text-[#9aa0ae]">Completed</span>
              </div>
            </div>
          </div>

          {/* Interactive Chart Bars */}
          <div className="h-44 sm:h-52 flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 px-1 border-b border-[#f4f2ec] dark:border-[#22242b]">
            {trendDays.map((d) => {
              const plannedHeight = (d.planned / maxDailyTasks) * 100;
              const completedHeight = (d.completed / maxDailyTasks) * 100;

              return (
                <div key={d.date} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 bg-[#1f2126] text-[#fdfcf9] dark:bg-[#eceef2] dark:text-[#121317] text-[10px] font-semibold py-0.5 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow-md">
                    {formatShortDate(d.date)}: {d.completed}/{d.planned} ({d.rate}%)
                  </div>

                  {/* Dual Bar */}
                  <div className="w-full max-w-[24px] flex items-end gap-0.5 sm:gap-1 h-full">
                    <div
                      className="w-1/2 bg-[#e5e2da] dark:bg-[#292b34] rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(plannedHeight, 4)}%` }}
                    />
                    <div
                      className="w-1/2 bg-emerald-600 dark:bg-emerald-500 rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(completedHeight, 4)}%` }}
                    />
                  </div>

                  <span className="text-[9px] text-[#8c909c] font-medium mt-1">
                    {getWeekdayName(d.date).charAt(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Subjects & Day-Part Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Subject Distribution */}
          <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Subject Distribution
              </h2>
              <span className="text-xs text-[#8c909c]">{subjects.length} Subjects</span>
            </div>

            <div className="space-y-3">
              {subjectStats.map(({ subject, total, completed, rate }) => (
                <div key={subject.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1f2126] dark:text-[#eceef2] flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      {subject.name}
                    </span>
                    <span className="text-[#606470] dark:text-[#9aa0ae] tabular-nums">
                      {completed}/{total} ({rate}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#f4f2ec] dark:bg-[#22242b] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${rate}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day-Part Efficiency */}
          <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Day-Part Completion Efficiency
              </h2>
            </div>

            <div className="space-y-3">
              {dayPartStats.map(({ dayPart, total, completed, rate }) => (
                <div key={dayPart} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1f2126] dark:text-[#eceef2]">
                      {dayPart}
                    </span>
                    <span className="text-[#606470] dark:text-[#9aa0ae] tabular-nums">
                      {completed}/{total} ({rate}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#f4f2ec] dark:bg-[#22242b] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-600 dark:bg-purple-500 transition-all duration-300"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
