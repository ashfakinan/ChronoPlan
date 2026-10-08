import React from 'react';
import {
  Calendar,
  CheckSquare,
  BarChart3,
  CalendarDays,
  FileText,
  Shuffle,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { usePlanner } from '../context/PlannerContext';
import { useMadness } from '../context/MadnessContext';
import { getTodayISO } from '../utils/dateUtils';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMobileSidebar: () => void;
}

export function MobileBottomNav({
  activeTab,
  setActiveTab,
  onOpenMobileSidebar,
}: MobileBottomNavProps) {
  const { todos, notes } = usePlanner();
  const { pendingTasksCount: pendingMadnessTasks } = useMadness();
  const today = getTodayISO();
  const pendingTodosToday = todos.filter((t) => t.date === today && !t.isCompleted).length;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fdfcf9]/95 dark:bg-[#1a1b20]/95 backdrop-blur-md border-t border-[#e5e2da] dark:border-[#292b34] pb-safe shadow-lg"
    >
      <div className="grid grid-cols-6 items-center h-15 px-0.5">
        {/* 1. Planner */}
        <button
          type="button"
          onClick={() => setActiveTab('planner')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'planner'
              ? 'text-blue-700 dark:text-blue-400 font-semibold'
              : 'text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
          }`}
        >
          <Calendar className="w-4.5 h-4.5 stroke-[2]" />
          <span className="text-[9px] tracking-tight mt-1">Planner</span>
        </button>

        {/* 2. Daily To-Do */}
        <button
          type="button"
          onClick={() => setActiveTab('todos')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'todos'
              ? 'text-blue-700 dark:text-blue-400 font-semibold'
              : 'text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
          }`}
        >
          <CheckSquare className="w-4.5 h-4.5 stroke-[2]" />
          <span className="text-[9px] tracking-tight mt-1">To-Do</span>
          {pendingTodosToday > 0 && (
            <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center shadow-xs">
              {pendingTodosToday}
            </span>
          )}
        </button>

        {/* 3. Scattered Weekly Madness */}
        <button
          type="button"
          onClick={() => setActiveTab('madness')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'madness'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
          }`}
        >
          <Shuffle className="w-4.5 h-4.5 stroke-[2]" />
          <span className="text-[9px] tracking-tight mt-1">Madness</span>
          {pendingMadnessTasks > 0 && (
            <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-indigo-600 text-white text-[8px] font-bold flex items-center justify-center shadow-xs">
              {pendingMadnessTasks}
            </span>
          )}
        </button>

        {/* 4. Calendar */}
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'calendar'
              ? 'text-blue-700 dark:text-blue-400 font-semibold'
              : 'text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
          }`}
        >
          <CalendarDays className="w-4.5 h-4.5 stroke-[2]" />
          <span className="text-[9px] tracking-tight mt-1">Calendar</span>
        </button>

        {/* 5. Analytics */}
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'analytics'
              ? 'text-blue-700 dark:text-blue-400 font-semibold'
              : 'text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
          }`}
        >
          <BarChart3 className="w-4.5 h-4.5 stroke-[2]" />
          <span className="text-[9px] tracking-tight mt-1">Analytics</span>
        </button>

        {/* 6. Notes & Routine */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="flex flex-col items-center justify-center h-full min-h-[44px] text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] transition-colors"
        >
          <FileText className="w-4.5 h-4.5 stroke-[2]" />
          <span className="text-[9px] tracking-tight mt-1">Notes ({notes.length})</span>
        </button>
      </div>
    </nav>
  );
}
