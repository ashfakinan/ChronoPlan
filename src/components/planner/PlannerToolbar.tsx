import React from 'react';
import {
  Search,
  Plus,
  Settings,
  Layers,
  ArrowUpDown,
  ArrowLeftRight,
  CheckSquare,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Subject, Planner } from '../../types';
import { ZoomController } from '../ZoomController';

interface PlannerToolbarProps {
  activePlanner: Planner | null;
  subjects: Subject[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSubjectFilter: string;
  onSubjectFilterChange: (subjectId: string) => void;
  matrixOrientation: 'days-on-left' | 'days-on-top';
  onToggleOrientation: () => void;
  mobileViewMode: 'matrix' | 'day-focus';
  onToggleMobileView: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  isSelectionMode: boolean;
  selectedCount: number;
  onToggleSelectionMode: () => void;
  onOpenAddTask: () => void;
  onOpenSubjectModal: () => void;
  onOpenPlannerModal: () => void;
  onScrollToToday: () => void;
  hasAutoRolloverNotice?: boolean;
}

export function PlannerToolbar({
  activePlanner,
  subjects,
  searchQuery,
  onSearchChange,
  selectedSubjectFilter,
  onSubjectFilterChange,
  matrixOrientation,
  onToggleOrientation,
  mobileViewMode,
  onToggleMobileView,
  zoom,
  onZoomChange,
  isSelectionMode,
  selectedCount,
  onToggleSelectionMode,
  onOpenAddTask,
  onOpenSubjectModal,
  onOpenPlannerModal,
  onScrollToToday,
}: PlannerToolbarProps) {
  return (
    <header className="px-3 sm:px-4 py-2.5 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20] flex flex-wrap items-center justify-between gap-2.5 shrink-0 z-20">
      {/* Left section: Search & Subject filter */}
      <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-lg">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c909c]" />
          <input
            type="text"
            placeholder="Search tasks or notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Subject Filter */}
        <div className="shrink-0">
          <select
            value={selectedSubjectFilter}
            onChange={(e) => onSubjectFilterChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Subjects ({subjects.length})</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right controls: Orientation, Zoom, Selection, Add Task, Settings */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Scroll To Today */}
        <button
          type="button"
          onClick={onScrollToToday}
          className="px-2.5 py-1.5 text-xs bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Jump to today's date"
        >
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Today</span>
        </button>

        {/* Orientation Toggle (Desktop & Matrix) */}
        <button
          type="button"
          onClick={onToggleOrientation}
          className="hidden md:flex px-2.5 py-1.5 text-xs bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] items-center gap-1.5 transition-colors cursor-pointer"
          title={
            matrixOrientation === 'days-on-left'
              ? 'Switch to: Days on top, Day-parts on left'
              : 'Switch to: Days on left, Day-parts on top'
          }
        >
          {matrixOrientation === 'days-on-left' ? (
            <>
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Days on Left</span>
            </>
          ) : (
            <>
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Days on Top</span>
            </>
          )}
        </button>

        {/* Mobile View Toggle (Day-Focus vs Matrix) */}
        <button
          type="button"
          onClick={onToggleMobileView}
          className="md:hidden px-2.5 py-1.5 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] flex items-center gap-1 cursor-pointer"
        >
          {mobileViewMode === 'day-focus' ? 'Matrix' : 'Day View'}
        </button>

        {/* Zoom Controller */}
        <ZoomController zoom={zoom} onZoomChange={onZoomChange} />

        {/* Multi-Select Toggle */}
        <button
          type="button"
          onClick={onToggleSelectionMode}
          className={`px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
            isSelectionMode || selectedCount > 0
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2] border border-[#e5e2da] dark:border-[#292b34] hover:bg-[#eae7df]'
          }`}
          title="Multi-select tasks for batch move, complete, or delete"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {isSelectionMode ? `Selected (${selectedCount})` : 'Select'}
          </span>
        </button>

        {/* Subject Manager Button */}
        <button
          type="button"
          onClick={onOpenSubjectModal}
          className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-lg transition-colors cursor-pointer"
          title="Manage color-coded subjects"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Planner Settings Button */}
        <button
          type="button"
          onClick={onOpenPlannerModal}
          className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-lg transition-colors cursor-pointer"
          title="Edit planner date range & day-parts"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* + Add Task Button */}
        <button
          type="button"
          onClick={onOpenAddTask}
          className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}
