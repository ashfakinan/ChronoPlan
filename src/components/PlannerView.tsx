import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  GripVertical,
  Search,
  Settings,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  CalendarDays,
  MoveRight,
  ArrowUpDown,
  ArrowLeftRight,
  CheckSquare,
  Check,
  Sparkles,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import {
  getDaysInRange,
  formatShortDate,
  getWeekdayName,
  isToday,
  formatDisplayDate,
  formatFullDate,
  getTodayISO,
} from '../utils/dateUtils';
import { TaskModal } from './TaskModal';
import { PlannerModal } from './PlannerModal';
import { SubjectModal } from './SubjectModal';
import { DailyViewModal } from './DailyViewModal';
import { DragGhostOverlay } from './DragGhostOverlay';
import { BatchMoveModal } from './BatchMoveModal';
import { BatchTaskActionBar } from './BatchTaskActionBar';
import { useTaskDragAndScroll } from '../hooks/useTaskDragAndScroll';
import { PlannerTask } from '../types';

export function PlannerView() {
  const {
    activePlanner,
    tasks,
    subjects,
    toggleTaskComplete,
    moveTask,
    batchMoveTasks,
    batchToggleComplete,
    batchDeleteTasks,
    selectedDayForDetail,
    setSelectedDayForDetail,
  } = usePlanner();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Matrix orientation: 'days-on-left' (default requested by user: Days on left vertically, Day-parts at top)
  const [matrixOrientation, setMatrixOrientation] = useState<'days-on-left' | 'days-on-top'>('days-on-left');

  // Mobile navigation mode: 'day-focus' (sections: Morning, Afternoon, Evening, Night) or 'matrix'
  const [mobileViewMode, setMobileViewMode] = useState<'matrix' | 'day-focus'>('day-focus');
  const [mobileSelectedDate, setMobileSelectedDate] = useState<string>('');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<PlannerTask | null>(null);
  const [initialTaskDate, setInitialTaskDate] = useState<string>('');
  const [initialTaskDayPart, setInitialTaskDayPart] = useState<string>('');

  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // Quick move popup for mobile
  const [movingTask, setMovingTask] = useState<PlannerTask | null>(null);

  // Batch Task Selection and Move State
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBatchMoveModalOpen, setIsBatchMoveModalOpen] = useState(false);

  // Auto Side Scroll Feature state & refs
  const [autoSideScroll, setAutoSideScroll] = useState<boolean>(true);
  const dayCarouselRef = React.useRef<HTMLDivElement | null>(null);

  const handleSideScrollCarousel = (direction: 'left' | 'right') => {
    if (!dayCarouselRef.current) return;
    const scrollAmount = 240;
    dayCarouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleSideScrollMatrix = (direction: 'left' | 'right' | 'today') => {
    const container = document.getElementById('planner-matrix-scroll');
    if (!container) return;
    if (direction === 'left') {
      container.scrollBy({ left: -320, behavior: 'smooth' });
    } else if (direction === 'right') {
      container.scrollBy({ left: 320, behavior: 'smooth' });
    } else if (direction === 'today') {
      const todayStr = getTodayISO();
      const targetCell =
        container.querySelector<HTMLElement>(`[data-drop-date="${todayStr}"]`) ||
        container.querySelector<HTMLElement>(`[data-matrix-header-date="${todayStr}"]`);
      if (targetCell) {
        targetCell.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      } else {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSelectAllInSection = (taskIds: string[]) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      const allSelected = taskIds.length > 0 && taskIds.every((id) => next.has(id));
      if (allSelected) {
        taskIds.forEach((id) => next.delete(id));
      } else {
        taskIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
  };

  const handleConfirmBatchMove = async (targetDate: string, targetDayPart: string) => {
    const ids = Array.from(selectedTaskIds);
    if (!ids.length) return;
    await batchMoveTasks(ids, targetDate, targetDayPart);
    handleClearSelection();
  };

  const handleBatchToggleComplete = async () => {
    const ids = Array.from(selectedTaskIds);
    if (!ids.length) return;
    const selectedTasks = tasks.filter((t) => ids.includes(t.id));
    const allCompleted = selectedTasks.every((t) => t.isCompleted);
    await batchToggleComplete(ids, !allCompleted);
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedTaskIds);
    if (!ids.length) return;
    if (window.confirm(`Delete ${ids.length} selected tasks?`)) {
      await batchDeleteTasks(ids);
      handleClearSelection();
    }
  };

  // Touch and desktop drag-and-drop with natural finger scrolling
  const {
    isDragging,
    draggedTask,
    dropTarget,
    pointerPos,
    startTouchDrag,
    handleDesktopDragOver,
    handleDesktopDragLeave,
    handleDesktopDrop,
  } = useTaskDragAndScroll({
    onDropTask: async (taskId, targetDate, targetDayPart) => {
      await moveTask(taskId, targetDate, targetDayPart);
    },
    containerId: mobileViewMode === 'day-focus' ? 'day-focus-scroll' : 'planner-matrix-scroll',
  });

  // Touch-hold helper on task cards for mobile/tablet
  const holdTimerRef = React.useRef<number | null>(null);
  const touchStartPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const holdTriggeredRef = React.useRef<boolean>(false);

  const handleTaskTouchStart = (e: React.TouchEvent, task: PlannerTask) => {
    const touch = e.touches[0];
    if (!touch) return;
    holdTriggeredRef.current = false;
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
    }
    holdTimerRef.current = window.setTimeout(() => {
      holdTriggeredRef.current = true;
      startTouchDrag(e, task);
    }, 160);
  };

  const handleTaskTouchMove = (e: React.TouchEvent) => {
    if (holdTimerRef.current && touchStartPosRef.current) {
      const touch = e.touches[0];
      if (touch) {
        const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
        const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
        if (dx > 16 || dy > 16) {
          window.clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
      }
    }
  };

  const handleTaskTouchEnd = (e: React.TouchEvent) => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdTriggeredRef.current) {
      e.preventDefault();
      holdTriggeredRef.current = false;
    }
  };

  // Compute days in range for active planner
  const days = useMemo(() => {
    if (!activePlanner) return [];
    return getDaysInRange(activePlanner.startDate, activePlanner.endDate);
  }, [activePlanner]);

  // Set initial mobile selected date
  React.useEffect(() => {
    if (days.length > 0 && !mobileSelectedDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (days.includes(todayStr)) {
        setMobileSelectedDate(todayStr);
      } else {
        setMobileSelectedDate(days[0]);
      }
    }
  }, [days, mobileSelectedDate]);

  // Auto Side Scroll for Day Carousel in Day Focus mode
  React.useEffect(() => {
    if (autoSideScroll && mobileSelectedDate && dayCarouselRef.current) {
      const activeEl = dayCarouselRef.current.querySelector<HTMLElement>(
        `[data-day-pill="${mobileSelectedDate}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [mobileSelectedDate, autoSideScroll]);

  // Auto Side Scroll Matrix to Today on mount / orientation switch
  React.useEffect(() => {
    if (autoSideScroll && activePlanner) {
      const timer = window.setTimeout(() => {
        handleSideScrollMatrix('today');
      }, 350);
      return () => window.clearTimeout(timer);
    }
  }, [activePlanner?.id, autoSideScroll, matrixOrientation]);

  const dayParts = useMemo(() => {
    return activePlanner?.dayParts || ['Morning', 'Afternoon', 'Evening', 'Night', 'Self Study'];
  }, [activePlanner]);

  // Tasks belonging to this planner
  const plannerTasks = useMemo(() => {
    if (!activePlanner) return [];
    return tasks.filter((t) => t.plannerId === activePlanner.id);
  }, [tasks, activePlanner]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return plannerTasks.filter((t) => {
      const matchesSearch = searchQuery
        ? t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      const matchesSubject = selectedSubjectFilter === 'all' || t.subjectId === selectedSubjectFilter;
      return matchesSearch && matchesSubject;
    });
  }, [plannerTasks, searchQuery, selectedSubjectFilter]);

  const getSubject = (subjectId: string) => subjects.find((s) => s.id === subjectId);

  // Desktop & fallback drag state
  const [desktopDraggedTaskId, setDesktopDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDesktopDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, date: string, dayPart: string) => {
    handleDesktopDragOver(e, date, dayPart);
  };

  const handleDragLeave = () => {
    handleDesktopDragLeave();
  };

  const handleDrop = async (e: React.DragEvent, date: string, dayPart: string) => {
    await handleDesktopDrop(e, date, dayPart, desktopDraggedTaskId);
    setDesktopDraggedTaskId(null);
  };

  const handleOpenAddTask = (date: string, dayPart: string) => {
    setTaskToEdit(null);
    setInitialTaskDate(date);
    setInitialTaskDayPart(dayPart);
    setIsTaskModalOpen(true);
  };

  if (!activePlanner) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#f8f6f1] dark:bg-[#121317]">
        <div className="w-14 h-14 rounded-2xl bg-[#f4f2ec] dark:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2] flex items-center justify-center mb-4 border border-[#e5e2da] dark:border-[#292b34]">
          <Calendar className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[#1f2126] dark:text-[#eceef2] mb-1">
          No Planners Found
        </h2>
        <p className="text-xs text-[#606470] dark:text-[#9aa0ae] max-w-sm mb-5">
          Create your flexible planner with customizable date ranges and day-parts.
        </p>
        <button
          type="button"
          onClick={() => setIsPlannerModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 min-h-[44px]"
        >
          <Plus className="w-4 h-4" /> Create Planner
        </button>

        <PlannerModal
          isOpen={isPlannerModalOpen}
          onClose={() => setIsPlannerModalOpen(false)}
        />
      </div>
    );
  }

  const totalTasks = plannerTasks.length;
  const completedTasksCount = plannerTasks.filter((t) => t.isCompleted).length;
  const overallRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8f6f1] dark:bg-[#121317] h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] pb-16 md:pb-0 overflow-hidden">
      {/* Top Planner Controls Bar */}
      <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9]/80 dark:bg-[#1a1b20]/80 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3">
        {/* Planner title & stats */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-[#1f2126] dark:text-[#eceef2] tracking-tight">
              {activePlanner.title}
            </h1>
            <button
              type="button"
              onClick={() => setIsPlannerModalOpen(true)}
              className="p-1 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-md transition-colors"
              title="Edit Planner"
              aria-label="Edit Planner"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Unboxed clean metadata */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#606470] dark:text-[#9aa0ae] mt-0.5">
            <span>{formatDisplayDate(activePlanner.startDate)} – {formatDisplayDate(activePlanner.endDate)}</span>
            <span aria-hidden="true">·</span>
            <span>{days.length} Days</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {completedTasksCount}/{totalTasks} Done ({overallRate}%)
            </span>
          </div>
        </div>

        {/* View Controls & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Orientation Switcher (Days on Left vs Days on Top) */}
          <div className="hidden lg:flex items-center bg-[#f4f2ec] dark:bg-[#22242b] p-0.5 rounded-lg border border-[#e5e2da] dark:border-[#292b34]">
            <button
              type="button"
              onClick={() => setMatrixOrientation('days-on-left')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1 min-h-[30px] ${
                matrixOrientation === 'days-on-left'
                  ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] shadow-2xs font-semibold'
                  : 'text-[#606470] dark:text-[#9aa0ae]'
              }`}
              title="Days on Left vertically, Day-Parts horizontally at the top"
            >
              <ArrowUpDown className="w-3 h-3 text-blue-600" />
              <span>Days on Left</span>
            </button>
            <button
              type="button"
              onClick={() => setMatrixOrientation('days-on-top')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1 min-h-[30px] ${
                matrixOrientation === 'days-on-top'
                  ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] shadow-2xs font-semibold'
                  : 'text-[#606470] dark:text-[#9aa0ae]'
              }`}
              title="Days horizontally at the top, Day-Parts down the side"
            >
              <ArrowLeftRight className="w-3 h-3 text-blue-600" />
              <span>Days on Top</span>
            </button>
          </div>

          {/* Mobile View Switcher */}
          <div className="md:hidden flex items-center bg-[#f4f2ec] dark:bg-[#22242b] p-0.5 rounded-lg border border-[#e5e2da] dark:border-[#292b34]">
            <button
              type="button"
              onClick={() => setMobileViewMode('matrix')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1 min-h-[32px] ${
                mobileViewMode === 'matrix'
                  ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] shadow-2xs font-semibold'
                  : 'text-[#606470] dark:text-[#9aa0ae]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Grid
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('day-focus')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1 min-h-[32px] ${
                mobileViewMode === 'day-focus'
                  ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] shadow-2xs font-semibold'
                  : 'text-[#606470] dark:text-[#9aa0ae]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Agenda
            </button>
          </div>

          {/* Search (Desktop / Tablet) */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c909c]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-2.5 py-1 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-32 md:w-44"
            />
          </div>

          {/* Auto Side Scroll Control */}
          <div className="flex items-center bg-[#f4f2ec] dark:bg-[#22242b] p-0.5 rounded-lg border border-[#e5e2da] dark:border-[#292b34]">
            <button
              type="button"
              onClick={() => handleSideScrollMatrix('left')}
              className="p-1 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded transition-colors min-h-[30px] min-w-[28px] flex items-center justify-center"
              title="Side scroll left"
              aria-label="Side scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setAutoSideScroll(!autoSideScroll)}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1 min-h-[30px] ${
                autoSideScroll
                  ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                  : 'text-[#606470] dark:text-[#9aa0ae]'
              }`}
              title="Toggle Auto Side Scroll feature"
            >
              <ArrowLeftRight className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="hidden xl:inline">Auto Side Scroll</span>
              <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                autoSideScroll ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
              }`}>
                {autoSideScroll ? 'ON' : 'OFF'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleSideScrollMatrix('right')}
              className="p-1 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded transition-colors min-h-[30px] min-w-[28px] flex items-center justify-center"
              title="Side scroll right"
              aria-label="Side scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Batch Selection Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedTaskIds(new Set());
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 min-h-[34px] ${
              isSelectionMode || selectedTaskIds.size > 0
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[#1f2126] dark:text-[#eceef2] bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36]'
            }`}
            title="Batch select tasks to move between time blocks"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {selectedTaskIds.size > 0 ? `${selectedTaskIds.size} Selected` : 'Select'}
            </span>
          </button>

          {/* Manage Subjects */}
          <button
            type="button"
            onClick={() => setIsSubjectModalOpen(true)}
            className="px-2.5 py-1 text-xs font-medium text-[#1f2126] dark:text-[#eceef2] bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-lg hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] transition-colors flex items-center gap-1.5 min-h-[34px]"
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: subjects[0]?.color || '#3B82F6' }}
            />
            Subjects
          </button>

          {/* Add Task Button */}
          <button
            type="button"
            onClick={() => handleOpenAddTask(days[0] || activePlanner.startDate, dayParts[0] || 'Morning')}
            className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 min-h-[34px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>
        </div>
      </div>

      {/* MOBILE DAY FOCUS MODE (When on mobile and mobileViewMode === 'day-focus') */}
      <div
        id="day-focus-scroll"
        className={`md:hidden flex-1 overflow-y-auto ${mobileViewMode === 'day-focus' ? 'block' : 'hidden'}`}
      >
        {/* Horizontal Day Selector Carousel with Auto Side Scroll */}
        <div className="sticky top-0 z-10 bg-[#fdfcf9] dark:bg-[#1a1b20] border-b border-[#e5e2da] dark:border-[#292b34] px-2 py-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSideScrollCarousel('left')}
              className="p-1.5 rounded-lg text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] transition-colors shrink-0 min-h-[44px] min-w-[32px] flex items-center justify-center"
              title="Side scroll left"
              aria-label="Side scroll days left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div
              id="day-carousel-scroll"
              ref={dayCarouselRef}
              className="flex-1 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth"
            >
              {days.map((d) => {
                const dayTasks = filteredTasks.filter((t) => t.date === d);
                const done = dayTasks.filter((t) => t.isCompleted).length;
                const isSelected = mobileSelectedDate === d;
                const isCurr = isToday(d);

                return (
                  <button
                    key={d}
                    type="button"
                    data-day-pill={d}
                    onClick={() => setMobileSelectedDate(d)}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border transition-all shrink-0 min-w-[58px] min-h-[50px] ${
                      isSelected
                        ? 'bg-[#1f2126] text-[#fdfcf9] border-[#1f2126] dark:bg-[#eceef2] dark:text-[#121317] dark:border-[#eceef2] shadow-xs'
                        : 'bg-[#f4f2ec] dark:bg-[#22242b] border-[#e5e2da] dark:border-[#292b34] text-[#606470] dark:text-[#9aa0ae]'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {getWeekdayName(d)}
                    </span>
                    <span className="text-xs font-black mt-0.5">
                      {formatShortDate(d).split(' ')[1]}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isCurr && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-blue-600'}`} />
                      )}
                      <span className="text-[9px] opacity-80">
                        {done}/{dayTasks.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleSideScrollCarousel('right')}
              className="p-1.5 rounded-lg text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] transition-colors shrink-0 min-h-[44px] min-w-[32px] flex items-center justify-center"
              title="Side scroll right"
              aria-label="Side scroll days right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Day Content */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1f2126] dark:text-[#eceef2]">
                {formatFullDate(mobileSelectedDate)}
              </h2>
              <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                Tap task to edit or check box to complete
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedTaskIds(new Set());
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors flex items-center gap-1.5 min-h-[38px] ${
                  isSelectionMode || selectedTaskIds.size > 0
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2] border border-[#e5e2da] dark:border-[#292b34] hover:bg-[#eae7df]'
                }`}
                title="Select multiple tasks to move together"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{isSelectionMode || selectedTaskIds.size > 0 ? 'Batch Active' : 'Select'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDayForDetail(mobileSelectedDate)}
                className="px-2.5 py-1 text-xs text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg font-medium min-h-[38px] flex items-center"
              >
                Full Day View →
              </button>
            </div>
          </div>

          {/* Day-parts Stack */}
          <div className="space-y-3">
            {dayParts.map((dayPart) => {
              const partTasks = filteredTasks.filter(
                (t) => t.date === mobileSelectedDate && t.dayPart === dayPart
              );
              const isSectionDropTarget =
                dropTarget?.date === mobileSelectedDate && dropTarget?.dayPart === dayPart;

              return (
                <div
                  key={dayPart}
                  data-drop-target="true"
                  data-drop-date={mobileSelectedDate}
                  data-drop-daypart={dayPart}
                  className={`rounded-xl border transition-all p-3 shadow-2xs ${
                    isSectionDropTarget
                      ? 'border-blue-500 ring-2 ring-blue-500/60 bg-blue-500/15 dark:bg-blue-500/20 scale-[1.01]'
                      : 'border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#f4f2ec] dark:border-[#22242b]">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-[#1f2126] dark:text-[#eceef2]">
                      <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{dayPart}</span>
                      <span className="text-[11px] text-[#8c909c]">
                        ({partTasks.length})
                      </span>
                      {isSectionDropTarget && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-xs animate-pulse">
                          ✨ Drop here
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {(isSelectionMode || selectedTaskIds.size > 0) && partTasks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectAllInSection(partTasks.map((t) => t.id))}
                          className="px-2 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors min-h-[36px]"
                        >
                          {partTasks.every((t) => selectedTaskIds.has(t.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenAddTask(mobileSelectedDate, dayPart)}
                        className="px-2 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors flex items-center gap-1 min-h-[36px]"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    {partTasks.length === 0 ? (
                      <div className={`py-3 text-center text-[11px] rounded-lg transition-colors ${
                        isSectionDropTarget
                          ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 border border-dashed border-blue-400'
                          : 'text-[#8c909c] italic'
                      }`}>
                        {isSectionDropTarget ? `✨ Drop task into ${dayPart}` : `No tasks in ${dayPart}`}
                      </div>
                    ) : (
                      partTasks.map((task) => {
                        const subj = getSubject(task.subjectId);
                        const isTaskBeingDragged = draggedTask?.id === task.id;
                        const isSelected = selectedTaskIds.has(task.id);

                        return (
                          <div
                            key={task.id}
                            className={`flex items-start justify-between gap-2 p-2 rounded-lg border transition-all ${
                              isSelected
                                ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/70 dark:bg-blue-950/30'
                                : isTaskBeingDragged
                                ? 'opacity-35 scale-98 border-dashed border-blue-400 bg-blue-500/5'
                                : task.isCompleted
                                ? 'bg-[#f4f2ec]/60 dark:bg-[#15161a] border-[#e5e2da] dark:border-[#292b34] opacity-60'
                                : 'bg-[#fdfcf9] dark:bg-[#1a1b20] border-[#e5e2da] dark:border-[#292b34]'
                            }`}
                          >
                            <div className="flex items-start gap-1 flex-1 min-w-0">
                              {/* Selection Checkbox OR 44x44px Drag Grip Handle */}
                              {isSelectionMode || selectedTaskIds.size > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTaskSelection(task.id);
                                  }}
                                  className="w-11 h-11 min-w-[44px] min-h-[44px] -ml-1 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 rounded-lg hover:bg-blue-500/10"
                                  aria-label={isSelected ? 'Deselect task' : 'Select task'}
                                >
                                  {isSelected ? (
                                    <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-md border-2 border-[#8c909c] dark:border-[#525666] bg-transparent" />
                                  )}
                                </button>
                              ) : (
                                <div
                                  onTouchStart={(e) => {
                                    e.stopPropagation();
                                    startTouchDrag(e, task);
                                  }}
                                  className="w-11 h-11 min-w-[44px] min-h-[44px] -ml-1 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] active:text-blue-600 active:bg-blue-500/15 rounded-xl cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center shrink-0"
                                  title="Drag to move task"
                                  aria-label="Drag task"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => toggleTaskComplete(task.id)}
                                className="w-11 h-11 min-w-[44px] min-h-[44px] text-[#8c909c] hover:text-emerald-600 transition-colors shrink-0 flex items-center justify-center -ml-1"
                                aria-label={task.isCompleted ? 'Mark incomplete' : 'Mark done'}
                              >
                                {task.isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>

                              <div
                                className="flex-1 min-w-0 cursor-pointer pt-2.5 select-none"
                                onTouchStart={(e) => handleTaskTouchStart(e, task)}
                                onTouchMove={handleTaskTouchMove}
                                onTouchEnd={handleTaskTouchEnd}
                                onClick={() => {
                                  if (isSelectionMode || selectedTaskIds.size > 0) {
                                    toggleTaskSelection(task.id);
                                  } else if (!holdTriggeredRef.current) {
                                    setTaskToEdit(task);
                                    setIsTaskModalOpen(true);
                                  }
                                }}
                              >
                                <div
                                  className={`text-xs font-medium leading-snug break-words ${
                                    task.isCompleted
                                      ? 'line-through text-[#8c909c]'
                                      : 'text-[#1f2126] dark:text-[#eceef2]'
                                  }`}
                                >
                                  {task.title}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#8c909c]">
                                  {subj && (
                                    <span
                                      className="font-medium"
                                      style={{ color: subj.color }}
                                    >
                                      {subj.name}
                                    </span>
                                  )}
                                  {task.notes && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="truncate max-w-[120px]">
                                        {task.notes}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Mobile Quick Move Button */}
                            <button
                              type="button"
                              onClick={() => setMovingTask(task)}
                              className="px-2.5 py-1.5 bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-blue-500/10 text-[#606470] dark:text-[#9aa0ae] hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-[11px] font-semibold transition-colors min-h-[44px] flex items-center gap-1 shrink-0 mt-0.5"
                              title="Move to Night, Morning, or other sections"
                              aria-label="Move task"
                            >
                              <MoveRight className="w-3.5 h-3.5" />
                              <span>Shift</span>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MATRIX TABLE VIEW (Days on Left vertically, Day-Parts horizontally at top) */}
      <div className={`flex-1 overflow-auto p-2 sm:p-4 ${mobileViewMode === 'matrix' ? 'block' : 'hidden md:block'}`}>
        <div className="inline-block min-w-full align-top">
          {/* Quick Matrix Side Scroll Navigation Bar */}
          <div className="flex items-center justify-between pb-2 px-1 text-xs flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#606470] dark:text-[#9aa0ae] flex items-center gap-1">
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Side Scroll:</span>
              </span>
              <button
                type="button"
                onClick={() => handleSideScrollMatrix('left')}
                className="px-2.5 py-1 bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] text-[#1f2126] dark:text-[#eceef2] rounded-lg font-medium transition-colors flex items-center gap-1 border border-[#e5e2da] dark:border-[#292b34] min-h-[30px]"
                title="Scroll matrix left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Left</span>
              </button>
              <button
                type="button"
                onClick={() => handleSideScrollMatrix('today')}
                className="px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-400 rounded-lg font-semibold transition-colors flex items-center gap-1 border border-blue-500/20 min-h-[30px]"
                title="Auto scroll to Today"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Today</span>
              </button>
              <button
                type="button"
                onClick={() => handleSideScrollMatrix('right')}
                className="px-2.5 py-1 bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] text-[#1f2126] dark:text-[#eceef2] rounded-lg font-medium transition-colors flex items-center gap-1 border border-[#e5e2da] dark:border-[#292b34] min-h-[30px]"
                title="Scroll matrix right"
              >
                <span>Right</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAutoSideScroll(!autoSideScroll)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 border min-h-[30px] ${
                autoSideScroll
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                  : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#8c909c] border-[#e5e2da] dark:border-[#292b34]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoSideScroll ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              <span>Auto Side Scroll: {autoSideScroll ? 'Active' : 'Off'}</span>
            </button>
          </div>

          <div
            id="planner-matrix-scroll"
            className="border border-[#e5e2da] dark:border-[#292b34] rounded-2xl bg-[#fdfcf9] dark:bg-[#1a1b20] shadow-xs overflow-auto max-h-[calc(100vh-12rem)] scroll-smooth"
          >
            <table className="border-collapse table-auto min-w-full text-left">
              {/* ========================================================= */}
              {/* DAYS ON LEFT (ROWS), DAY-PARTS AT TOP (COLUMNS)           */}
              {/* User explicit request: Days name in left side vertically, */}
              {/* and parts name horizontally at the top!                   */}
              {/* ========================================================= */}
              {matrixOrientation === 'days-on-left' ? (
                <>
                  {/* Table Header: Day-Parts across the top */}
                  <thead>
                    <tr className="border-b border-[#e5e2da] dark:border-[#292b34]">
                      {/* Top-left Corner Cell: Sticky in both horizontal & vertical scroll */}
                      <th className="sticky top-0 left-0 z-30 w-44 min-w-[170px] max-w-[170px] p-3 font-semibold text-xs text-[#606470] dark:text-[#9aa0ae] border-r border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] uppercase tracking-wider shadow-[2px_2px_4px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1f2126] dark:text-[#eceef2]">Days</span>
                          <span className="text-[10px] text-[#8c909c] font-normal">Parts →</span>
                        </div>
                      </th>

                      {/* Day-Part Column Headers: Sticky top when scrolling vertically */}
                      {dayParts.map((dayPart) => {
                        const totalPartTasks = filteredTasks.filter((t) => t.dayPart === dayPart).length;
                        return (
                          <th
                            key={dayPart}
                            className="sticky top-0 z-20 w-64 min-w-[210px] p-3 border-r border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] select-none shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-[#1f2126] dark:text-[#eceef2]">
                                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span>{dayPart}</span>
                              </div>
                              <span className="text-[10px] font-semibold text-[#8c909c]">
                                {totalPartTasks} {totalPartTasks === 1 ? 'task' : 'tasks'}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Table Body: Days down the left side vertically (as rows) */}
                  <tbody className="divide-y divide-[#e5e2da] dark:divide-[#292b34]">
                    {days.map((dateStr) => {
                      const dayTasks = filteredTasks.filter((t) => t.date === dateStr);
                      const doneCount = dayTasks.filter((t) => t.isCompleted).length;
                      const isCurrent = isToday(dateStr);

                      return (
                        <tr key={dateStr} className="group">
                          {/* Day Row Header on the Left: Sticky left when scrolling horizontally */}
                          <td
                            data-matrix-header-date={dateStr}
                            onClick={() => setSelectedDayForDetail(dateStr)}
                            className={`sticky left-0 z-10 w-44 min-w-[170px] max-w-[170px] p-3.5 border-r border-[#e5e2da] dark:border-[#292b34] align-top cursor-pointer transition-colors select-none shadow-[2px_0_4px_rgba(0,0,0,0.04)] ${
                              isCurrent
                                ? 'bg-[#edf4ff] dark:bg-[#1a2333] hover:bg-[#e2edff] dark:hover:bg-[#202b3f]'
                                : 'bg-[#f8f6f1] dark:bg-[#16171b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36]'
                            }`}
                            title="Click to view full day schedule"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-bold uppercase tracking-wider ${
                                    isCurrent ? 'text-blue-700 dark:text-blue-400' : 'text-[#1f2126] dark:text-[#eceef2]'
                                  }`}
                                >
                                  {getWeekdayName(dateStr)}
                                </span>

                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-600 text-white rounded-md">
                                    Today
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-1 text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                                <span className="font-semibold text-[#1f2126] dark:text-[#eceef2]">
                                  {formatShortDate(dateStr)}
                                </span>
                                <span className="flex items-center gap-0.5 group-hover:text-blue-600 font-medium">
                                  {doneCount}/{dayTasks.length}
                                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Day-Part Cells in this Day's row */}
                          {dayParts.map((dayPart) => {
                            const cellTasks = filteredTasks.filter(
                              (t) => t.date === dateStr && t.dayPart === dayPart
                            );
                            const isDropTarget =
                              dropTarget?.date === dateStr && dropTarget?.dayPart === dayPart;

                            return (
                              <td
                                key={`${dateStr}-${dayPart}`}
                                data-drop-target="true"
                                data-drop-date={dateStr}
                                data-drop-daypart={dayPart}
                                onDragOver={(e) => handleDragOver(e, dateStr, dayPart)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, dateStr, dayPart)}
                                className={`w-64 min-w-[210px] p-2.5 border-r border-[#e5e2da] dark:border-[#292b34] align-top transition-colors min-h-[110px] relative ${
                                  isDropTarget
                                    ? 'bg-blue-500/15 ring-2 ring-blue-500/60 shadow-inner'
                                    : isCurrent
                                    ? 'bg-blue-500/5'
                                    : 'bg-[#fdfcf9] dark:bg-[#1a1b20]'
                                }`}
                              >
                                {isDropTarget && (
                                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-500/20 rounded px-1.5 py-0.5 mb-1.5 flex items-center gap-1 animate-pulse">
                                    ✨ Drop into {dayPart}
                                  </div>
                                )}

                                {/* Tasks list in this cell */}
                                <div className="space-y-1.5 min-h-[50px]">
                                  {cellTasks.map((task) => {
                                    const subj = getSubject(task.subjectId);
                                    const isBeingDragged = draggedTask?.id === task.id;

                                    return (
                                      <div
                                        key={task.id}
                                        draggable={!isSelectionMode}
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onClick={() => {
                                          if (isSelectionMode || selectedTaskIds.size > 0) {
                                            toggleTaskSelection(task.id);
                                          }
                                        }}
                                        className={`group/task relative flex items-start gap-1.5 p-2 rounded-lg border bg-[#fdfcf9] dark:bg-[#202127] shadow-2xs hover:shadow-xs transition-all select-none ${
                                          selectedTaskIds.has(task.id)
                                            ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/70 dark:bg-blue-950/30'
                                            : isBeingDragged
                                            ? 'opacity-30 scale-95 border-dashed border-blue-500 bg-blue-500/10'
                                            : task.isCompleted
                                            ? 'border-[#e5e2da] dark:border-[#292b34] opacity-60'
                                            : 'border-[#e5e2da] dark:border-[#2f313c] hover:border-[#cfcbc2]'
                                        }`}
                                      >
                                        {/* Subject Color Accent Stripe */}
                                        <div
                                          className="w-1 self-stretch rounded-full shrink-0"
                                          style={{ backgroundColor: subj?.color || '#3B82F6' }}
                                        />

                                        {/* Selection Checkbox OR Completion Checkbox */}
                                        {isSelectionMode || selectedTaskIds.size > 0 ? (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleTaskSelection(task.id);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0"
                                            aria-label={selectedTaskIds.has(task.id) ? 'Deselect task' : 'Select task'}
                                          >
                                            {selectedTaskIds.has(task.id) ? (
                                              <div className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                              </div>
                                            ) : (
                                              <div className="w-4 h-4 rounded border-2 border-[#8c909c] dark:border-[#525666] bg-transparent" />
                                            )}
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => toggleTaskComplete(task.id)}
                                            className="mt-0.5 text-[#8c909c] hover:text-emerald-600 transition-colors shrink-0"
                                            aria-label="Toggle task"
                                          >
                                            {task.isCompleted ? (
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            ) : (
                                              <Circle className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        )}

                                        {/* Task title & click to edit */}
                                        <div
                                          className="flex-1 min-w-0 cursor-pointer"
                                          onClick={() => {
                                            if (!isSelectionMode && selectedTaskIds.size === 0) {
                                              setTaskToEdit(task);
                                              setIsTaskModalOpen(true);
                                            }
                                          }}
                                        >
                                          <div
                                            className={`text-[11px] font-medium leading-snug break-words ${
                                              task.isCompleted
                                                ? 'line-through text-[#8c909c]'
                                                : 'text-[#1f2126] dark:text-[#eceef2]'
                                            }`}
                                          >
                                            {task.title}
                                          </div>

                                          {subj && (
                                            <div className="flex items-center gap-1 mt-1">
                                              <span
                                                className="text-[9px] font-semibold truncate max-w-[120px]"
                                                style={{ color: subj.color }}
                                              >
                                                {subj.name}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Touch & mouse grip handle - 44x44px hit area */}
                                        <div
                                          onTouchStart={(e) => {
                                            e.stopPropagation();
                                            startTouchDrag(e, task);
                                          }}
                                          className="w-11 h-11 min-w-[44px] min-h-[44px] -mr-1 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] active:text-blue-600 active:bg-blue-500/15 rounded-xl cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center shrink-0"
                                          title="Drag to move task"
                                          aria-label="Drag task"
                                        >
                                          <GripVertical className="w-4 h-4 opacity-75 group-hover/task:opacity-100 transition-opacity" />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Quick Add Button at bottom of cell */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddTask(dateStr, dayPart)}
                                  className="w-full mt-2 py-1 border border-dashed border-[#e5e2da] dark:border-[#292b34] hover:border-[#8c909c] rounded-md text-[10px] text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] flex items-center justify-center gap-1 opacity-70 hover:opacity-100 transition-all min-h-[30px]"
                                >
                                  <Plus className="w-3 h-3" /> Add
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </>
              ) : (
                /* ========================================================= */
                /* OPTION B: DAYS ON TOP (COLUMNS), DAY-PARTS ON LEFT (ROWS) */
                /* ========================================================= */
                <>
                  <thead>
                    <tr className="border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b]">
                      <th className="w-36 sm:w-44 p-3 font-semibold text-xs text-[#606470] dark:text-[#9aa0ae] border-r border-[#e5e2da] dark:border-[#292b34] uppercase tracking-wider">
                        <div className="flex items-center justify-between">
                          <span>Day-Parts</span>
                          <span className="text-[10px] text-[#8c909c]">↘ Days</span>
                        </div>
                      </th>

                      {days.map((dateStr) => {
                        const dayTasks = filteredTasks.filter((t) => t.date === dateStr);
                        const doneCount = dayTasks.filter((t) => t.isCompleted).length;
                        const isCurrent = isToday(dateStr);

                        return (
                          <th
                            key={dateStr}
                            data-matrix-header-date={dateStr}
                            onClick={() => setSelectedDayForDetail(dateStr)}
                            className={`p-3 border-r border-[#e5e2da] dark:border-[#292b34] cursor-pointer transition-colors group select-none min-w-[160px] ${
                              isCurrent
                                ? 'bg-blue-500/10 hover:bg-blue-500/15'
                                : 'hover:bg-[#eae7df] dark:hover:bg-[#2a2d36]'
                            }`}
                            title="Click to view detailed day schedule"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold uppercase tracking-wider ${
                                  isCurrent ? 'text-blue-700 dark:text-blue-400' : 'text-[#1f2126] dark:text-[#eceef2]'
                                }`}
                              >
                                {getWeekdayName(dateStr)}
                              </span>

                              {isCurrent && (
                                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-blue-600 text-white rounded-md">
                                  Today
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-1 text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                              <span className="font-semibold text-[#1f2126] dark:text-[#eceef2]">
                                {formatShortDate(dateStr)}
                              </span>
                              <span className="flex items-center gap-0.5 group-hover:text-blue-600">
                                {doneCount}/{dayTasks.length}
                                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e5e2da] dark:border-[#292b34]">
                    {dayParts.map((dayPart) => (
                      <tr key={dayPart} className="group">
                        <td className="p-3 border-r border-[#e5e2da] dark:border-[#292b34] bg-[#f8f6f1] dark:bg-[#16171b] align-top">
                          <div className="sticky left-0">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-[#1f2126] dark:text-[#eceef2]">
                              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span>{dayPart}</span>
                            </div>
                            <p className="text-[10px] text-[#8c909c] mt-1">
                              {filteredTasks.filter((t) => t.dayPart === dayPart).length} tasks
                            </p>
                          </div>
                        </td>

                        {days.map((dateStr) => {
                          const cellTasks = filteredTasks.filter(
                            (t) => t.date === dateStr && t.dayPart === dayPart
                          );
                          const isCellDropTarget =
                            dropTarget?.date === dateStr && dropTarget?.dayPart === dayPart;

                          return (
                            <td
                              key={`${dateStr}-${dayPart}`}
                              data-drop-target="true"
                              data-drop-date={dateStr}
                              data-drop-daypart={dayPart}
                              onDragOver={(e) => handleDragOver(e, dateStr, dayPart)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, dateStr, dayPart)}
                              className={`p-2 border-r border-[#e5e2da] dark:border-[#292b34] align-top transition-colors min-h-[110px] relative ${
                                isCellDropTarget
                                  ? 'bg-blue-500/15 ring-2 ring-blue-500/60 shadow-inner'
                                  : isToday(dateStr)
                                  ? 'bg-blue-500/5'
                                  : 'bg-[#fdfcf9] dark:bg-[#1a1b20]'
                              }`}
                            >
                              {isCellDropTarget && (
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-500/20 rounded px-1.5 py-0.5 mb-1.5 flex items-center gap-1 animate-pulse">
                                  ✨ Drop into {dayPart}
                                </div>
                              )}

                              <div className="space-y-1.5 min-h-[50px]">
                                {cellTasks.map((task) => {
                                  const subj = getSubject(task.subjectId);
                                  const isBeingDragged = draggedTask?.id === task.id;

                                  return (
                                    <div
                                      key={task.id}
                                      draggable={!isSelectionMode}
                                      onDragStart={(e) => handleDragStart(e, task.id)}
                                      onClick={() => {
                                        if (isSelectionMode || selectedTaskIds.size > 0) {
                                          toggleTaskSelection(task.id);
                                        }
                                      }}
                                      className={`group/task relative flex items-start gap-1.5 p-2 rounded-lg border bg-[#fdfcf9] dark:bg-[#202127] shadow-2xs hover:shadow-xs transition-all select-none ${
                                        selectedTaskIds.has(task.id)
                                          ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/70 dark:bg-blue-950/30'
                                          : isBeingDragged
                                          ? 'opacity-30 scale-95 border-dashed border-blue-500 bg-blue-500/10'
                                          : task.isCompleted
                                          ? 'border-[#e5e2da] dark:border-[#292b34] opacity-60'
                                          : 'border-[#e5e2da] dark:border-[#2f313c] hover:border-[#cfcbc2]'
                                      }`}
                                    >
                                      <div
                                        className="w-1 self-stretch rounded-full shrink-0"
                                        style={{ backgroundColor: subj?.color || '#3B82F6' }}
                                      />

                                      {/* Selection Checkbox OR Completion Checkbox */}
                                      {isSelectionMode || selectedTaskIds.size > 0 ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleTaskSelection(task.id);
                                          }}
                                          className="w-7 h-7 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0"
                                          aria-label={selectedTaskIds.has(task.id) ? 'Deselect task' : 'Select task'}
                                        >
                                          {selectedTaskIds.has(task.id) ? (
                                            <div className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center">
                                              <Check className="w-3 h-3 stroke-[3]" />
                                            </div>
                                          ) : (
                                            <div className="w-4 h-4 rounded border-2 border-[#8c909c] dark:border-[#525666] bg-transparent" />
                                          )}
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => toggleTaskComplete(task.id)}
                                          className="mt-0.5 text-[#8c909c] hover:text-emerald-600 transition-colors shrink-0"
                                          aria-label="Toggle task"
                                        >
                                          {task.isCompleted ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                          ) : (
                                            <Circle className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      )}

                                      <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => {
                                          if (!isSelectionMode && selectedTaskIds.size === 0) {
                                            setTaskToEdit(task);
                                            setIsTaskModalOpen(true);
                                          }
                                        }}
                                      >
                                        <div
                                          className={`text-[11px] font-medium leading-snug break-words ${
                                            task.isCompleted
                                              ? 'line-through text-[#8c909c]'
                                              : 'text-[#1f2126] dark:text-[#eceef2]'
                                          }`}
                                        >
                                          {task.title}
                                        </div>
                                        {subj && (
                                          <div className="flex items-center gap-1 mt-1">
                                            <span
                                              className="text-[9px] font-semibold truncate max-w-[100px]"
                                              style={{ color: subj.color }}
                                            >
                                              {subj.name}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Touch & mouse grip handle - 44x44px hit area */}
                                      <div
                                        onTouchStart={(e) => {
                                          e.stopPropagation();
                                          startTouchDrag(e, task);
                                        }}
                                        className="w-11 h-11 min-w-[44px] min-h-[44px] -mr-1 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] active:text-blue-600 active:bg-blue-500/15 rounded-xl cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center shrink-0"
                                        title="Drag to move task"
                                        aria-label="Drag task"
                                      >
                                        <GripVertical className="w-4 h-4 opacity-75 group-hover/task:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenAddTask(dateStr, dayPart)}
                                className="w-full mt-2 py-1 border border-dashed border-[#e5e2da] dark:border-[#292b34] hover:border-[#8c909c] rounded-md text-[10px] text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] flex items-center justify-center gap-1 opacity-70 hover:opacity-100 transition-all min-h-[30px]"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Mobile Move Task Sheet - 1-Tap Quick Shift */}
      {movingTask && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#fdfcf9] dark:bg-[#1a1b20] border-t sm:border border-[#e5e2da] dark:border-[#292b34] rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5e2da] dark:border-[#292b34]">
              <div className="min-w-0 pr-2">
                <span className="text-sm font-bold text-[#1f2126] dark:text-[#eceef2]">
                  Shift / Move Task
                </span>
                <p className="text-xs text-[#606470] dark:text-[#9aa0ae] truncate max-w-[220px]">
                  "{movingTask.title}"
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMovingTask(null)}
                className="text-xs font-semibold text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] p-2 rounded-lg"
              >
                Close
              </button>
            </div>

            {/* 1-Tap Instant Day-Part Shift */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#606470] dark:text-[#9aa0ae]">
                Tap section to move immediately:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {dayParts.map((dp) => {
                  const isCurrent = movingTask.dayPart === dp;
                  return (
                    <button
                      key={dp}
                      type="button"
                      onClick={async () => {
                        await moveTask(movingTask.id, movingTask.date, dp);
                        setMovingTask(null);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between min-h-[44px] ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-[#f4f2ec] dark:bg-[#22242b] border-[#e5e2da] dark:border-[#292b34] text-[#1f2126] dark:text-[#eceef2] hover:border-blue-500 active:scale-98'
                      }`}
                    >
                      <span className="truncate">{dp}</span>
                      {isCurrent ? (
                        <span className="text-[10px] opacity-90 font-bold ml-1">Current</span>
                      ) : (
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold ml-1">Move →</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Date Selector */}
            <div className="pt-2 border-t border-[#f4f2ec] dark:border-[#22242b] space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#8c909c]">
                Or move to another date:
              </label>
              <select
                value={movingTask.date}
                onChange={async (e) => {
                  await moveTask(movingTask.id, e.target.value, movingTask.dayPart);
                  setMovingTask(null);
                }}
                className="w-full p-2 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2]"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {formatFullDate(d)} {isToday(d) ? '(Today)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        initialDate={initialTaskDate}
        initialDayPart={initialTaskDayPart}
        onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
      />

      <PlannerModal
        isOpen={isPlannerModalOpen}
        onClose={() => setIsPlannerModalOpen(false)}
        plannerToEdit={activePlanner}
      />

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
      />

      <DailyViewModal
        date={selectedDayForDetail}
        onClose={() => setSelectedDayForDetail(null)}
        onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
      />

      {/* Floating Drag Ghost */}
      <DragGhostOverlay
        isDragging={isDragging}
        task={draggedTask}
        pointerPos={pointerPos}
        dropTarget={dropTarget}
        subject={draggedTask ? getSubject(draggedTask.subjectId) : undefined}
      />

      {/* Batch Task Action Bar & Batch Move Modal */}
      <BatchTaskActionBar
        selectedCount={selectedTaskIds.size}
        onOpenBatchMove={() => setIsBatchMoveModalOpen(true)}
        onBatchToggleComplete={handleBatchToggleComplete}
        onBatchDelete={handleBatchDelete}
        onClearSelection={handleClearSelection}
      />

      <BatchMoveModal
        isOpen={isBatchMoveModalOpen}
        onClose={() => setIsBatchMoveModalOpen(false)}
        selectedTaskCount={selectedTaskIds.size}
        availableDayParts={dayParts}
        availableDates={days}
        initialDate={mobileSelectedDate || days[0] || (activePlanner?.startDate ?? '')}
        onConfirmMove={handleConfirmBatchMove}
      />
    </div>
  );
}
