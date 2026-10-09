import React, { useState, useMemo, useRef } from 'react';
import {
  Shuffle,
  Plus,
  Tag,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  Check,
  X,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Copy,
  Layers,
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  LayoutGrid,
  Columns,
  List,
  CheckSquare,
} from 'lucide-react';
import { useMadness } from '../context/MadnessContext';
import { MadnessCategory, MadnessDay, MadnessTask } from '../types';
import { CategoryManagerModal } from './CategoryManagerModal';
import { AddMadnessTaskModal } from './AddMadnessTaskModal';
import { ContinueMadnessTaskModal } from './ContinueMadnessTaskModal';
import { BatchTaskActionBar } from './BatchTaskActionBar';
import { ZoomController } from './ZoomController';

type ViewMode = 'board' | 'focus' | 'list';

export function ScatteredWeeklyMadnessTab() {
  const {
    days,
    categories,
    tasks,
    addDay,
    renameDay,
    deleteDay,
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    batchDeleteTasks,
    batchUpdateTasksCategory,
    moveTaskToDay,
    duplicateTask,
    clearCompletedInDay,
    moveIncompleteToDay,
    filterCategoryId,
    setFilterCategoryId,
    searchQuery,
    setSearchQuery,
    totalTasksCount,
    completedTasksCount,
  } = useMadness();

  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [selectedFocusDayId, setSelectedFocusDayId] = useState<string>(days[0]?.id || '');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [modalInitialDayId, setModalInitialDayId] = useState<string>('');
  const [modalInitialCategoryId, setModalInitialCategoryId] = useState<string>('');
  const [taskToContinue, setTaskToContinue] = useState<MadnessTask | null>(null);

  // Zoom state (Min 50%, Max 100%)
  const [zoom, setZoom] = useState<number>(() => {
    const saved = localStorage.getItem('madness_zoom');
    return saved ? Math.min(100, Math.max(50, Number(saved))) : 100;
  });

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    localStorage.setItem('madness_zoom', String(newZoom));
  };

  // Batch Selection State
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Touch and hold detection
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const holdTriggeredRef = useRef<boolean>(false);

  const startHoldDetection = (taskId: string, clientX: number, clientY: number) => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTriggeredRef.current = false;
    touchStartPosRef.current = { x: clientX, y: clientY };

    holdTimerRef.current = setTimeout(() => {
      holdTriggeredRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch {
          // ignore
        }
      }
      setIsSelectionMode(true);
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        next.add(taskId);
        return next;
      });
    }, 450);
  };

  const cancelHoldDetection = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  const handleTouchMoveDetection = (clientX: number, clientY: number) => {
    if (!touchStartPosRef.current || !holdTimerRef.current) return;
    const dx = Math.abs(clientX - touchStartPosRef.current.x);
    const dy = Math.abs(clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      cancelHoldDetection();
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
  };

  const selectedTasksList = useMemo(() => {
    return tasks.filter((t) => selectedTaskIds.has(t.id));
  }, [tasks, selectedTaskIds]);

  const isAllSameCategory = useMemo(() => {
    if (selectedTasksList.length <= 1) return true;
    const firstCatId = selectedTasksList[0].categoryId || 'none';
    return selectedTasksList.every((t) => (t.categoryId || 'none') === firstCatId);
  }, [selectedTasksList]);

  const currentCategory = useMemo(() => {
    if (selectedTasksList.length === 0 || !isAllSameCategory) return undefined;
    const catId = selectedTasksList[0].categoryId;
    return categories.find((c) => c.id === catId);
  }, [selectedTasksList, isAllSameCategory, categories]);

  const handleBatchChangeCategory = async (catId: string) => {
    const ids = Array.from(selectedTaskIds);
    if (!ids.length) return;
    if (!isAllSameCategory) {
      alert('Selected tasks have different categories. You cannot change all of them together unless all selected tasks have the same category.');
      return;
    }
    await batchUpdateTasksCategory(ids, catId);
  };

  // Changing category by changing one task card:
  const handleTaskChangeCategory = async (taskId: string, newCatId?: string) => {
    setActiveMoveTaskId(null);
    if (selectedTaskIds.has(taskId)) {
      if (isAllSameCategory) {
        await batchUpdateTasksCategory(Array.from(selectedTaskIds), newCatId);
      } else {
        await updateTask(taskId, { categoryId: newCatId });
        alert('Selected tasks have different categories. Only this task was updated. (To change all selected tasks, make sure all selected have the same category.)');
      }
    } else {
      await updateTask(taskId, { categoryId: newCatId });
    }
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedTaskIds);
    if (!ids.length) return;
    if (window.confirm(`Delete ${ids.length} selected madness tasks?`)) {
      await batchDeleteTasks(ids);
      handleClearSelection();
    }
  };

  // Day renaming state
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayName, setEditingDayName] = useState('');

  // Per-day quick add input state and refs
  const [quickTaskTexts, setQuickTaskTexts] = useState<Record<string, string>>({});
  const [quickTaskCats, setQuickTaskCats] = useState<Record<string, string>>({});
  const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  // Task editing inline state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');

  // Active day menu dropdown
  const [activeMenuDayId, setActiveMenuDayId] = useState<string | null>(null);

  // Active task move dropdown
  const [activeMoveTaskId, setActiveMoveTaskId] = useState<string | null>(null);

  // Ensure selected focus day is valid
  React.useEffect(() => {
    if (days.length > 0 && (!selectedFocusDayId || !days.some((d) => d.id === selectedFocusDayId))) {
      setSelectedFocusDayId(days[0].id);
    }
  }, [days, selectedFocusDayId]);

  const handleStartRenameDay = (day: MadnessDay) => {
    setEditingDayId(day.id);
    setEditingDayName(day.name);
    setActiveMenuDayId(null);
  };

  const handleSaveRenameDay = async (dayId: string) => {
    if (editingDayName.trim()) {
      await renameDay(dayId, editingDayName.trim());
    }
    setEditingDayId(null);
  };

  const handleQuickAdd = async (dayId: string) => {
    const text = quickTaskTexts[dayId]?.trim();
    if (!text) {
      inputRefs.current[dayId]?.focus();
      return;
    }
    const catId = quickTaskCats[dayId];
    await addTask(dayId, text, catId);
    setQuickTaskTexts((prev) => ({ ...prev, [dayId]: '' }));
    // If filter is active and doesn't match this task's category, clear filter so the task is visible
    if (filterCategoryId && catId !== filterCategoryId) {
      setFilterCategoryId(null);
    }
    inputRefs.current[dayId]?.focus();
  };

  const handleStartEditTask = (task: MadnessTask) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setActiveMoveTaskId(null);
  };

  const handleSaveEditTask = async (taskId: string) => {
    if (editTaskTitle.trim()) {
      await updateTask(taskId, { title: editTaskTitle.trim() });
    }
    setEditingTaskId(null);
  };

  const progressPercent =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Filter tasks
  const getFilteredTasksForDay = (dayId: string) => {
    return tasks
      .filter((t) => t.dayId === dayId)
      .filter((t) => {
        if (!filterCategoryId) return true;
        return t.categoryId === filterCategoryId;
      })
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        return t.title.toLowerCase().includes(searchQuery.toLowerCase());
      });
  };

  return (
    <div className="flex-1 bg-[#f8f6f1] dark:bg-[#121317] overflow-y-auto h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] p-3 sm:p-6 pb-24 md:pb-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 flex-1 flex flex-col">
        {/* Header Hero Card */}
        <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Shuffle className="w-4 h-4" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-[#1f2126] dark:text-[#eceef2] tracking-tight">
                  Scattered Weekly Madness
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  Freeform Weekly
                </span>
              </div>
              <p className="text-xs text-[#606470] dark:text-[#9aa0ae] mt-1">
                Dump, scatter, and categorize your tasks across customizable days. No rigid hours or sections.
              </p>
            </div>

            {/* Quick Metrics & Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Progress Pill */}
              <div className="bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] px-3 py-1.5 rounded-xl flex items-center gap-3">
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-[#8c909c]">Weekly Done</div>
                  <div className="text-xs font-bold text-[#1f2126] dark:text-[#eceef2]">
                    {completedTasksCount} / {totalTasksCount} ({progressPercent}%)
                  </div>
                </div>
                <div className="w-16 h-2 bg-[#e5e2da] dark:bg-[#292b34] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-[#f4f2ec] dark:bg-[#22242b] p-0.5 rounded-xl border border-[#e5e2da] dark:border-[#292b34]">
                <button
                  type="button"
                  onClick={() => setViewMode('board')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1 transition-colors ${
                    viewMode === 'board'
                      ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] shadow-xs'
                      : 'text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
                  }`}
                  title="Board View (Side-by-side columns)"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('focus')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1 transition-colors ${
                    viewMode === 'focus'
                      ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] shadow-xs'
                      : 'text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
                  }`}
                  title="Day Focus View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Day Focus</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] shadow-xs'
                      : 'text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>

              {/* Batch Select Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedTaskIds(new Set());
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelectionMode || selectedTaskIds.size > 0
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] text-[#1f2126] dark:text-[#eceef2] hover:bg-[#eeebe3] dark:hover:bg-[#2a2d36]'
                }`}
                title="Select tasks to batch change category or delete"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>
                  {selectedTaskIds.size > 0 ? `${selectedTaskIds.size} Selected` : 'Select'}
                </span>
              </button>

              {/* Zoom Controller (Max 50% Zoom Out) */}
              <ZoomController zoom={zoom} onZoomChange={handleZoomChange} />

              {/* Add Task Button */}
              <button
                type="button"
                onClick={() => {
                  setModalInitialDayId(selectedFocusDayId || days[0]?.id || '');
                  setModalInitialCategoryId(filterCategoryId || '');
                  setIsAddTaskModalOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>

              {/* Add Day Button */}
              <button
                type="button"
                onClick={() => addDay()}
                className="px-3 py-1.5 bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eeebe3] dark:hover:bg-[#2a2d36] border border-[#e5e2da] dark:border-[#292b34] text-[#1f2126] dark:text-[#eceef2] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Add Day
              </button>

              {/* Manage Categories Button */}
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3 py-1.5 bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eeebe3] dark:hover:bg-[#2a2d36] border border-[#e5e2da] dark:border-[#292b34] text-[#1f2126] dark:text-[#eceef2] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5" />
                Categories ({categories.length})
              </button>
            </div>
          </div>

          {/* Filter, Search & Category Quick Pills */}
          <div className="pt-2 border-t border-[#f4f2ec] dark:border-[#22242b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <span className="text-[11px] font-semibold text-[#8c909c] flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" />
                Filter:
              </span>
              <button
                type="button"
                onClick={() => setFilterCategoryId(null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  filterCategoryId === null
                    ? 'bg-[#1f2126] text-white dark:bg-[#eceef2] dark:text-[#1f2126]'
                    : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
                }`}
              >
                All Categories ({tasks.length})
              </button>

              {categories.map((cat) => {
                const count = tasks.filter((t) => t.categoryId === cat.id).length;
                const isSelected = filterCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilterCategoryId(isSelected ? null : cat.id)}
                    style={{
                      borderColor: isSelected ? cat.color : undefined,
                      backgroundColor: isSelected ? `${cat.color}20` : undefined,
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                      isSelected
                        ? 'font-bold'
                        : 'bg-[#f4f2ec] dark:bg-[#22242b] border-transparent text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span style={{ color: isSelected ? cat.color : undefined }}>{cat.name}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-2 py-1 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 whitespace-nowrap flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                New Category
              </button>
            </div>

            {/* Quick Search Input */}
            <div className="relative min-w-[180px] sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c909c]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Zoomable Content Area (Max 50% Zoom Out) */}
        <div style={{ zoom: `${zoom}%` }} className="space-y-4">
          {/* VIEW MODE 1: DAY FOCUS VIEW (Tab pills switcher for days) */}
          {viewMode === 'focus' && (
            <div className="space-y-4">
              {/* Day Switcher Carousel */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-[#fdfcf9] dark:bg-[#1a1b20] p-2 rounded-xl border border-[#e5e2da] dark:border-[#292b34]">
                {days.map((day) => {
                  const dayTasks = tasks.filter((t) => t.dayId === day.id);
                  const dayDone = dayTasks.filter((t) => t.isCompleted).length;
                  const isSelected = selectedFocusDayId === day.id;

                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => setSelectedFocusDayId(day.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                          : 'bg-[#f4f2ec] dark:bg-[#22242b] border-transparent text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
                      }`}
                    >
                      <span>{day.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-[#e5e2da] dark:bg-[#292b34] text-[#1f2126] dark:text-[#eceef2]'
                        }`}
                      >
                        {dayDone}/{dayTasks.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Single Day Card Focus */}
              {days
                .filter((d) => d.id === selectedFocusDayId)
                .map((day) => (
                  <div key={day.id} className="max-w-3xl mx-auto">
                    {renderDayColumn(day, false)}
                  </div>
                ))}
            </div>
          )}

          {/* VIEW MODE 2: BOARD VIEW (Side-by-Side Responsive Horizontal Columns) */}
          {viewMode === 'board' && (
            <div className="flex-1 flex gap-4 overflow-x-auto pb-6 items-start">
              {days.map((day) => (
                <div
                  key={day.id}
                  className="w-72 sm:w-80 shrink-0 flex flex-col max-h-[calc(100vh-14rem)]"
                >
                  {renderDayColumn(day, true)}
                </div>
              ))}

              {/* "+ Add Day" Column Placeholder at the end */}
              <div className="w-72 sm:w-80 shrink-0">
                <button
                  type="button"
                  onClick={() => addDay()}
                  className="w-full h-32 rounded-2xl border-2 border-dashed border-[#e5e2da] dark:border-[#292b34] hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 flex flex-col items-center justify-center gap-2 text-[#606470] dark:text-[#9aa0ae] hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-xs font-semibold">Add Another Day</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: LIST VIEW (Vertically stacked cards) */}
          {viewMode === 'list' && (
            <div className="space-y-4 max-w-4xl mx-auto w-full">
              {days.map((day) => (
                <div key={day.id}>{renderDayColumn(day, false)}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      {/* Add Task Modal */}
      <AddMadnessTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        initialDayId={modalInitialDayId}
        initialCategoryId={modalInitialCategoryId}
      />

      {/* Continue Task Modal */}
      <ContinueMadnessTaskModal
        task={taskToContinue}
        isOpen={!!taskToContinue}
        onClose={() => setTaskToContinue(null)}
      />

      {/* Batch Task Action Bar */}
      <BatchTaskActionBar
        selectedCount={selectedTaskIds.size}
        onBatchDelete={handleBatchDelete}
        onClearSelection={handleClearSelection}
        isAllSameCategory={isAllSameCategory}
        currentCategoryName={currentCategory?.name || (selectedTasksList.length > 0 ? 'No Category' : undefined)}
        currentCategoryColor={currentCategory?.color}
        availableCategories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        }))}
        onSelectCategory={handleBatchChangeCategory}
        categoryLabel="Category"
      />
    </div>
  );

  // Helper renderer for a Day column/card
  function renderDayColumn(day: MadnessDay, isScrollableColumn: boolean) {
    const dayFilteredTasks = getFilteredTasksForDay(day.id);
    const allDayTasks = tasks.filter((t) => t.dayId === day.id);
    const dayCompleted = allDayTasks.filter((t) => t.isCompleted).length;
    const isEditingThisDay = editingDayId === day.id;

    return (
      <div
        className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl flex flex-col shadow-xs transition-all"
      >
        {/* Day Header */}
        <div className="p-3.5 border-b border-[#e5e2da] dark:border-[#292b34] flex items-center justify-between gap-2 relative bg-[#faf9f5] dark:bg-[#1c1d23] rounded-t-2xl">
          <div className="flex-1 min-w-0">
            {isEditingThisDay ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editingDayName}
                  onChange={(e) => setEditingDayName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRenameDay(day.id);
                    if (e.key === 'Escape') setEditingDayId(null);
                  }}
                  autoFocus
                  placeholder="e.g. Day 1 - Sprint"
                  className="w-full px-2 py-1 text-xs font-bold bg-[#fdfcf9] dark:bg-[#1a1b20] border border-blue-500 rounded-md text-[#1f2126] dark:text-[#eceef2]"
                />
                <button
                  type="button"
                  onClick={() => handleSaveRenameDay(day.id)}
                  className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDayId(null)}
                  className="p-1 bg-gray-200 dark:bg-gray-700 text-[#1f2126] dark:text-[#eceef2] rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2
                  onClick={() => handleStartRenameDay(day)}
                  title="Click to rename"
                  className="text-sm font-bold text-[#1f2126] dark:text-[#eceef2] truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 group"
                >
                  <span>{day.name}</span>
                  <Edit2 className="w-3 h-3 text-[#8c909c] opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>
                <span className="text-[10px] font-semibold text-[#8c909c] bg-[#e5e2da] dark:bg-[#292b34] px-1.5 py-0.5 rounded-full shrink-0">
                  {dayCompleted}/{allDayTasks.length}
                </span>
              </div>
            )}
          </div>

          {/* Day Actions Dropdown Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setActiveMenuDayId(activeMenuDayId === day.id ? null : day.id)}
              className="p-1 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {activeMenuDayId === day.id && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-xl shadow-lg z-20 py-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleStartRenameDay(day)}
                  className="w-full px-3 py-1.5 text-left text-[#1f2126] dark:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                  Rename Day
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await clearCompletedInDay(day.id);
                    setActiveMenuDayId(null);
                  }}
                  className="w-full px-3 py-1.5 text-left text-[#1f2126] dark:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Clear Completed
                </button>
                {days.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        const currentIdx = days.findIndex((d) => d.id === day.id);
                        const nextDay = days[(currentIdx + 1) % days.length];
                        await moveIncompleteToDay(day.id, nextDay.id);
                        setActiveMenuDayId(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-[#1f2126] dark:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] flex items-center gap-2"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                      Move Unfinished Next
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteDay(day.id);
                        setActiveMenuDayId(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Day
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Add Task Form in Day */}
        <div className="p-3 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuickAdd(day.id);
            }}
            className="space-y-2"
          >
            <div className="flex items-center gap-1.5">
              <input
                ref={(el) => {
                  inputRefs.current[day.id] = el;
                }}
                type="text"
                value={quickTaskTexts[day.id] || ''}
                onChange={(e) =>
                  setQuickTaskTexts((prev) => ({ ...prev, [day.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAdd(day.id);
                  }
                }}
                placeholder={`+ Add task to ${day.name}...`}
                className="flex-1 px-2.5 py-1.5 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleQuickAdd(day.id)}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg transition-all flex items-center gap-1 font-semibold text-xs shrink-0 cursor-pointer shadow-xs"
                title="Add task"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[11px]">Add</span>
              </button>
            </div>

            {/* Quick Category Selector */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              <span className="text-[10px] text-[#8c909c] shrink-0">Cat:</span>
              <button
                type="button"
                onClick={() =>
                  setQuickTaskCats((prev) => ({
                    ...prev,
                    [day.id]: '',
                  }))
                }
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
                  !quickTaskCats[day.id]
                    ? 'bg-[#1f2126] text-white dark:bg-[#eceef2] dark:text-[#1f2126]'
                    : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae]'
                }`}
              >
                None
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setQuickTaskCats((prev) => ({
                      ...prev,
                      [day.id]: c.id,
                    }))
                  }
                  style={{
                    backgroundColor: quickTaskCats[day.id] === c.id ? `${c.color}25` : undefined,
                    borderColor: quickTaskCats[day.id] === c.id ? c.color : 'transparent',
                    color: quickTaskCats[day.id] === c.id ? c.color : undefined,
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap border transition-colors flex items-center gap-1 ${
                    quickTaskCats[day.id] === c.id
                      ? 'font-bold'
                      : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae]'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Task Cards List */}
        <div
          className={`p-2 space-y-2 flex-1 ${
            isScrollableColumn ? 'overflow-y-auto' : ''
          }`}
        >
          {dayFilteredTasks.length === 0 ? (
            <div className="py-6 px-3 text-center border border-dashed border-[#e5e2da] dark:border-[#292b34] rounded-xl my-1">
              <p className="text-xs text-[#8c909c]">No tasks here yet.</p>
              <button
                type="button"
                onClick={() => inputRefs.current[day.id]?.focus()}
                className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add a task
              </button>
            </div>
          ) : (
            dayFilteredTasks.map((task) => {
              const taskCat = categories.find((c) => c.id === task.categoryId);
              const isEditing = editingTaskId === task.id;
              const isSelected = selectedTaskIds.has(task.id);

              return (
                <div
                  key={task.id}
                  onTouchStart={(e) =>
                    startHoldDetection(task.id, e.touches[0].clientX, e.touches[0].clientY)
                  }
                  onTouchMove={(e) =>
                    handleTouchMoveDetection(e.touches[0].clientX, e.touches[0].clientY)
                  }
                  onTouchEnd={cancelHoldDetection}
                  onTouchCancel={cancelHoldDetection}
                  onMouseDown={(e) => {
                    if (e.button === 0) startHoldDetection(task.id, e.clientX, e.clientY);
                  }}
                  onMouseMove={(e) => handleTouchMoveDetection(e.clientX, e.clientY)}
                  onMouseUp={cancelHoldDetection}
                  onClick={() => {
                    if (holdTriggeredRef.current) {
                      holdTriggeredRef.current = false;
                      return;
                    }
                    if (isSelectionMode || selectedTaskIds.size > 0) {
                      toggleTaskSelection(task.id);
                    }
                  }}
                  className={`group relative p-2.5 rounded-xl border transition-all select-none ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs'
                      : task.isCompleted
                      ? 'bg-[#f4f2ec]/60 dark:bg-[#1a1b20]/60 border-[#e5e2da] dark:border-[#292b34] opacity-75'
                      : 'bg-[#fdfcf9] dark:bg-[#22242b] border-[#e5e2da] dark:border-[#292b34] hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs'
                  }`}
                >
                  {isEditing ? (
                    <div
                      className="space-y-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editTaskTitle}
                        onChange={(e) => setEditTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEditTask(task.id);
                          if (e.key === 'Escape') setEditingTaskId(null);
                        }}
                        autoFocus
                        className="w-full px-2 py-1 text-xs bg-[#fdfcf9] dark:bg-[#1a1b20] border border-blue-500 rounded-md text-[#1f2126] dark:text-[#eceef2]"
                      />
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => handleSaveEditTask(task.id)}
                          className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px] font-medium"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTaskId(null)}
                          className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-[#1f2126] dark:text-[#eceef2] rounded text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      {/* Selection Checkbox (visible in selection mode or when tasks selected) */}
                      {(isSelectionMode || selectedTaskIds.size > 0) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskSelection(task.id);
                          }}
                          className="pt-0.5 shrink-0 text-blue-600 dark:text-blue-400 hover:scale-105 transition-transform"
                          aria-label={isSelected ? 'Deselect task' : 'Select task'}
                        >
                          {isSelected ? (
                            <div className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded border-2 border-[#8c909c] dark:border-[#525666] bg-transparent" />
                          )}
                        </button>
                      )}

                      {/* Completion Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskComplete(task.id);
                        }}
                        className="pt-0.5 shrink-0 text-[#606470] dark:text-[#9aa0ae] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        {task.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-50 dark:fill-emerald-950/40" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      {/* Title & Category Badge */}
                      <div className="flex-1 min-w-0">
                        <div
                          onClick={() => {
                            if (isSelectionMode || selectedTaskIds.size > 0) {
                              toggleTaskSelection(task.id);
                            } else {
                              handleStartEditTask(task);
                            }
                          }}
                          className={`text-xs text-[#1f2126] dark:text-[#eceef2] cursor-pointer break-words leading-relaxed ${
                            task.isCompleted
                              ? 'line-through text-[#8c909c] dark:text-[#8c909c]'
                              : 'font-medium'
                          }`}
                        >
                          {task.title}
                        </div>

                        {/* Category Badge & Move Info */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {taskCat && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMoveTaskId(
                                  activeMoveTaskId === task.id ? null : task.id
                                );
                              }}
                              style={{
                                backgroundColor: `${taskCat.color}15`,
                                color: taskCat.color,
                                borderColor: `${taskCat.color}35`,
                              }}
                              className="px-2 py-0.2 rounded-full text-[10px] font-semibold border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                              title={
                                selectedTaskIds.has(task.id)
                                  ? isAllSameCategory
                                    ? `Change category for all ${selectedTaskIds.size} selected tasks`
                                    : 'Selected tasks have mixed categories (only this task will update)'
                                  : 'Click to change category'
                              }
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: taskCat.color }}
                              />
                              {taskCat.name}
                            </button>
                          )}

                          {task.isContinued && (
                            <span
                              title="Continued task across multiple days"
                              className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 flex items-center gap-1"
                            >
                              <Layers className="w-2.5 h-2.5" />
                              Continued
                            </span>
                          )}

                          {/* Quick Change Category Dropdown on Click */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMoveTaskId(
                                  activeMoveTaskId === task.id ? null : task.id
                                );
                              }}
                              className="opacity-75 sm:opacity-0 group-hover:opacity-100 text-[10px] text-[#8c909c] hover:text-blue-600 dark:hover:text-blue-400 px-1 rounded transition-opacity cursor-pointer"
                            >
                              Move...
                            </button>

                            {/* Move / Change Popover */}
                            {activeMoveTaskId === task.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-0 top-full mt-1 w-48 bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-xl shadow-xl z-30 p-2 text-xs space-y-2 animate-in fade-in"
                              >
                                <div>
                                  <div className="text-[10px] font-bold text-[#8c909c] uppercase mb-1">
                                    Move to Day:
                                  </div>
                                  <div className="space-y-0.5 max-h-28 overflow-y-auto">
                                    {days.map((d) => (
                                      <button
                                        key={d.id}
                                        type="button"
                                        onClick={async () => {
                                          await moveTaskToDay(task.id, d.id);
                                          setActiveMoveTaskId(null);
                                        }}
                                        className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center justify-between ${
                                          d.id === task.dayId
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                                            : 'hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2]'
                                        }`}
                                      >
                                        <span className="truncate">{d.name}</span>
                                        {d.id === task.dayId && <Check className="w-3 h-3" />}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-1 border-t border-[#e5e2da] dark:border-[#292b34]">
                                  <div className="text-[10px] font-bold text-[#8c909c] uppercase mb-1">
                                    {selectedTaskIds.has(task.id) && isAllSameCategory
                                      ? `Change Category (All ${selectedTaskIds.size}):`
                                      : 'Change Category:'}
                                  </div>
                                  <div className="space-y-0.5 max-h-28 overflow-y-auto">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await handleTaskChangeCategory(task.id, undefined);
                                      }}
                                      className="w-full text-left px-2 py-1 rounded text-xs hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] text-[#8c909c]"
                                    >
                                      None
                                    </button>
                                    {categories.map((c) => (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={async () => {
                                          await handleTaskChangeCategory(task.id, c.id);
                                        }}
                                        className="w-full text-left px-2 py-1 rounded text-xs hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] flex items-center gap-1.5"
                                      >
                                        <span
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: c.color }}
                                        />
                                        <span className="truncate">{c.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-1 border-t border-[#e5e2da] dark:border-[#292b34]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTaskToContinue(task);
                                      setActiveMoveTaskId(null);
                                    }}
                                    className="w-full text-left px-2 py-1 rounded text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <Layers className="w-3.5 h-3.5" />
                                    Continue across days...
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons (Hover) */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setTaskToContinue(task)}
                          className="p-1 text-[#8c909c] hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                          title="Continue task across days"
                        >
                          <Layers className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditTask(task)}
                          className="p-1 text-[#8c909c] hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                          title="Edit task"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateTask(task.id)}
                          className="p-1 text-[#8c909c] hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                          title="Duplicate task"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-[#8c909c] hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Add Task Button in Day Card */}
        <div className="p-2 border-t border-[#e5e2da]/70 dark:border-[#292b34]/70 bg-[#faf9f5]/50 dark:bg-[#1c1d23]/50 rounded-b-2xl">
          <button
            type="button"
            onClick={() => {
              setModalInitialDayId(day.id);
              setModalInitialCategoryId(filterCategoryId || '');
              setIsAddTaskModalOpen(true);
            }}
            className="w-full py-1 text-xs text-[#606470] dark:text-[#9aa0ae] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add task to {day.name}</span>
          </button>
        </div>
      </div>
    );
  }
}
