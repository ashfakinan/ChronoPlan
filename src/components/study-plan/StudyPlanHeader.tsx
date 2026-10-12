import React, { useRef } from 'react';
import {
  BookOpen,
  Plus,
  Settings,
  RotateCcw,
  Search,
  Download,
  Upload,
  ChevronDown,
} from 'lucide-react';
import { StudySubject } from './types';

interface StudyPlanHeaderProps {
  title: string;
  subtitle: string;
  subjects: StudySubject[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedSubjectFilter: string;
  onSubjectFilterChange: (key: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  onOpenCustomize: () => void;
  onOpenAddChapter: () => void;
}

export function StudyPlanHeader({
  title,
  subtitle,
  subjects,
  searchQuery,
  onSearchChange,
  selectedSubjectFilter,
  onSubjectFilterChange,
  onExpandAll,
  onCollapseAll,
  onExport,
  onImport,
  onReset,
  onOpenCustomize,
  onOpenAddChapter,
}: StudyPlanHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border-b border-[#e5e2da] dark:border-[#292b34] p-3 sm:p-5 shrink-0 space-y-3">
      {/* Top row: Title & Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#1f2126] dark:text-[#eceef2] tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-[#606470] dark:text-[#9aa0ae]">{subtitle}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenAddChapter}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Chapter</span>
          </button>

          <button
            type="button"
            onClick={onOpenCustomize}
            className="px-2.5 py-1.5 text-xs bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] flex items-center gap-1 transition-colors cursor-pointer"
            title="Customize subjects, title, and plan structure"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-lg transition-colors cursor-pointer"
            title="Export plan as JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onImport}
            accept=".json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-lg transition-colors cursor-pointer"
            title="Import plan from JSON"
          >
            <Upload className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onReset}
            className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
            title="Reset to default syllabus"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Second row: Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-[#f4f2ec] dark:border-[#22242b]">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c909c]" />
            <input
              type="text"
              placeholder="Search chapters or topics..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => onSubjectFilterChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Expand / Collapse All */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={onExpandAll}
            className="px-2 py-1 text-xs text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-md transition-colors"
          >
            Expand All
          </button>
          <span className="text-[#8c909c] text-xs">·</span>
          <button
            type="button"
            onClick={onCollapseAll}
            className="px-2 py-1 text-xs text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-md transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>
    </div>
  );
}
