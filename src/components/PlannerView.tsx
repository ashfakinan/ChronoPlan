import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  Search,
  Settings,
  Layers,
  ChevronRight,
  LayoutGrid,
  CalendarDays,
  MoveRight,
  ArrowUpDown,
  ArrowLeftRight,
  CheckSquare,
  Check,
  X,
  Eye,
  EyeOff,
  GripVertical,
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
import { BatchMoveModal } from './BatchMoveModal';
import { BatchTaskActionBar } from './BatchTaskActionBar';
import { ZoomController } from './ZoomController';
import { PlannerTask } from '../types';

export function PlannerView() {
  const {
    activePlanner,
    tasks,
    subjects,
    updateTask,
    toggleTaskComplete,
    moveTask,
    batchMoveTasks,
    batchToggleComplete,
    batchDeleteTasks,
    batchUpdateTasksSubject,
    selectedDayForDetail,
    setSelectedDayForDetail,
    autoRolloverNotice,
    dismissAutoRolloverNotice,
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

  // Zoom state (Min 50%, Max 100%)
  const [zoom, setZoom] = useState<number>(() => {
    const saved = localStorage.getItem('planner_zoom');
    return saved ? Math.min(100, Math.max(50, Number(saved))) : 100;
  });

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    localStorage.setItem('planner_zoom', String(newZoom));
  };

  // Touch and hold (long press) detection for task selection
  const holdTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const holdTriggeredRef = React.useRef<boolean>(false);

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
          // ignore vibration error
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

  // Drag & Drop State for Planner GRID ONLY (Desktop / Matrix view)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ date: string; dayPart: string } | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    cancelHoldDetection();
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCell(null);
  };

  const handleDragOverCell = (e: React.DragEvent, date: string, dayPart: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverCell || dragOverCell.date !== date || dragOverCell.dayPart !== dayPart) {
      setDragOverCell({ date, dayPart });
    }
  };

  const handleDragLeaveCell = (e: React.DragEvent, date: string, dayPart: string) => {
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!currentTarget.contains(relatedTarget)) {
      if (dragOverCell?.date === date && dragOverCell?.dayPart === dayPart) {
        setDragOverCell(null);
      }
    }
  };

  const handleDropOnCell = async (e: React.DragEvent, targetDate: string, targetDayPart: string) => {
    e.preventDefault();
    setDragOverCell(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    if (selectedTaskIds.has(taskId) && selectedTaskIds.size > 1) {
      await batchMoveTasks(Array.from(selectedTaskIds), targetDate, targetDayPart);
    } else {
      await moveTask(taskId, targetDate, targetDayPart);
    }
    setDraggedTaskId(null);
  };

  // Batch Task Selection and Move State
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBatchMoveModalOpen, setIsBatchMoveModalOpen] = useState(false);
  const [activeCategoryPickerTaskId, setActiveCategoryPickerTaskId] = useState<string | null>(null);

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
    setActiveCategoryPickerTaskId(null);
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
    const selectedTasksList = tasks.filter((t) => ids.includes(t.id));
    const allCompleted = selectedTasksList.every((t) => t.isCompleted);
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

  // Selected tasks and same-category check
  const selectedTasksList = useMemo(() => {
    return tasks.filter((t) => selectedTaskIds.has(t.id));
  }, [tasks, selectedTaskIds]);

  const isAllSameCategory = useMemo(() => {
    if (selectedTasksList.length <= 1) return true;
    const firstSubjId = selectedTasksList[0].subjectId;
    return selectedTasksList.every((t) => t.subjectId === firstSubjId);
  }, [selectedTasksList]);

  const currentCategory = useMemo(() => {
    if (selectedTasksList.length === 0 || !isAllSameCategory) return undefined;
    return subjects.find((s) => s.id === selectedTasksList[0].subjectId);
  }, [selectedTasksList, isAllSameCategory, subjects]);

  const handleBatchUpdateSubject = async (newSubjectId: string) => {
    const ids = Array.from(selectedTaskIds);
    if (!ids.length) return;
    if (!isAllSameCategory) {
      alert('Selected tasks have different subjects. You cannot change all of them together unless all selected tasks have the same subject.');
      return;
    }
    await batchUpdateTasksSubject(ids, newSubjectId);
    setActiveCategoryPickerTaskId(null);
  };

  // Changing subject by changing one task:
  // If the task is selected, and ALL selected have the SAME subject, updates ALL of them!
  // If not all have the same subject, only updates this one task.
  const handleTaskChangeSubject = async (task: PlannerTask, newSubjectId: string) => {
    setActiveCategoryPickerTaskId(null);
    if (selectedTaskIds.has(task.id)) {
      if (isAllSameCategory) {
        await batchUpdateTasksSubject(Array.from(selectedTaskIds), newSubjectId);
      } else {
        await updateTask(task.id, { subjectId: newSubjectId });
        alert('Selected tasks have different subjects. Only this task was updated. Deselect tasks of other subjects to enable batch change.');
      }
    } else {
      await updateTask(task.id, { subjectId: newSubjectId });
    }
  };

  const todayStr = getTodayISO();

  // Compute all days in range for active planner
  const allDays = useMemo(() => {
    if (!activePlanner) return [];
    return getDaysInRange(activePlanner.startDate, activePlanner.endDate);
  }, [activePlanner]);

  // Check if a previous day (date < todayStr) has all tasks completed
  const isDayCompletedPastDay = (dateStr: string) => {
    if (dateStr >= todayStr) return false;
    const dayTasks = tasks.filter((t) => t.plannerId === activePlanner?.id && t.date === dateStr);
    return dayTasks.length === 0 || dayTasks.every((t) => t.isCompleted);
  };

  // Toggle to show completed past days if user explicitly wants to review them
  const [showCompletedPastDays, setShowCompletedPastDays] = useState<boolean>(false);

  // Count of previous completed days that are hidden
  const hiddenPastDaysCount = useMemo(() => {
    return allDays.filter((d) => isDayCompletedPastDay(d)).length;
  }, [allDays, tasks, activePlanner, todayStr]);

  // Visible days in planner view:
  // "when previous Day's all task is completed in planner view remove that from sight and make the current day TOP"
  const visibleDays = useMemo(() => {
    if (!allDays.length) return [];
    if (showCompletedPastDays) return allDays;

    const filtered = allDays.filter((d) => !isDayCompletedPastDay(d));
    // If all days would be filtered out (e.g. past archived planner), fallback to allDays so view isn't empty
    if (filtered.length === 0) return allDays;
    return filtered;
  }, [allDays, showCompletedPastDays, tasks, activePlanner, todayStr]);

  // Alias days to visibleDays so all matrix views render current day at the TOP and hide completed past days
  const days = visibleDays;

  // Set initial mobile selected date to today or first visible day
  React.useEffect(() => {
    if (visibleDays.length > 0) {
      if (!mobileSelectedDate || !visibleDays.includes(mobileSelectedDate)) {
        if (visibleDays.includes(todayStr)) {
          setMobileSelectedDate(todayStr);
        } else {
          setMobileSelectedDate(visibleDays[0]);
        }
      }
    }
  }, [visibleDays, mobileSelectedDate, todayStr]);

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
          <div className="flex items-center gap-1.5 text-[11px] text-[#606470] dark:text-[#9aa0ae] mt-0.5 flex-wrap">
            <span>{formatDisplayDate(activePlanner.startDate)} – {formatDisplayDate(activePlanner.endDate)}</span>
            <span aria-hidden="true">·</span>
            <span>{visibleDays.length} {visibleDays.length === 1 ? 'Day' : 'Days'}</span>
            {hiddenPastDaysCount > 0 && !showCompletedPastDays && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                  <span>Current day is TOP</span>
                  <span className="text-[10px] opacity-75">({hiddenPastDaysCount} completed past {hiddenPastDaysCount === 1 ? 'day' : 'days'} hidden)</span>
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {completedTasksCount}/{totalTasks} Done ({overallRate}%)
            </span>
          </div>
        </div>

        {/* View Controls & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Completed Past Days Toggle (when past days with completed tasks exist) */}
          {hiddenPastDaysCount > 0 && (
            <button
              type="button"
              onClick={() => setShowCompletedPastDays(!showCompletedPastDays)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 border min-h-[34px] ${
                showCompletedPastDays
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold'
                  : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae] border-[#e5e2da] dark:border-[#292b34] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
              }`}
              title={
                showCompletedPastDays
                  ? 'Hide completed past days to keep current day at top'
                  : 'View past completed days'
              }
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {showCompletedPastDays
                  ? `Hide ${hiddenPastDaysCount} completed past ${hiddenPastDaysCount === 1 ? 'day' : 'days'}`
                  : `${hiddenPastDaysCount} past completed ${hiddenPastDaysCount === 1 ? 'day' : 'days'} hidden`}
              </span>
            </button>
          )}

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

          {/* Zoom Controller (Max 50% Zoom Out) */}
          <ZoomController zoom={zoom} onZoomChange={handleZoomChange} />

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
            onClick={() => {
              const defaultDate = visibleDays.includes(todayStr) ? todayStr : (mobileSelectedDate || visibleDays[0] || todayStr);
              handleOpenAddTask(defaultDate, dayParts[0] || 'Morning');
            }}
            className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 min-h-[34px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>
        </div>
      </div>

      {/* Automatic Rollover Notice Banner */}
      {autoRolloverNotice && autoRolloverNotice.count > 0 && (
        <div className="mx-3 sm:mx-4 mt-2 mb-1 px-3.5 py-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/25 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 animate-in fade-in shrink-0">
          <div className="flex items-center gap-2">
            <MoveRight className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>{autoRolloverNotice.count}</strong> unfinished task{autoRolloverNotice.count > 1 ? 's' : ''} from previous {autoRolloverNotice.count > 1 ? 'days were' : 'day was'} automatically moved to <strong>Today</strong> without requiring confirmation.
            </span>
          </div>
          <button
            type="button"
            onClick={dismissAutoRolloverNotice}
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 rounded-md transition-colors"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Zoomable Content Area (Max 50% Zoom Out) */}
      <div
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
        style={{ zoom: `${zoom}%` }}
      >
        {/* MOBILE DAY FOCUS MODE (When on mobile and mobileViewMode === 'day-focus') */}
      <div
        id="day-focus-scroll"
        className={`md:hidden flex-1 overflow-y-auto ${mobileViewMode === 'day-focus' ? 'block' : 'hidden'}`}
      >
        {/* Horizontal Day Selector Carousel */}
        <div className="sticky top-0 z-10 bg-[#fdfcf9] dark:bg-[#1a1b20] border-b border-[#e5e2da] dark:border-[#292b34] px-3 py-2">
          <div
            id="day-carousel-scroll"
            className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none"
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

              return (
                <div
                  key={dayPart}
                  className="rounded-xl border transition-all p-3 shadow-2xs border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20]"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#f4f2ec] dark:border-[#22242b]">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-[#1f2126] dark:text-[#eceef2]">
                      <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{dayPart}</span>
                      <span className="text-[11px] text-[#8c909c]">
                        ({partTasks.length})
                      </span>
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
                      <div className="py-3 text-center text-[11px] rounded-lg text-[#8c909c] italic">
                        No tasks in {dayPart}
                      </div>
                    ) : (
                      partTasks.map((task) => {
                        const subj = getSubject(task.subjectId);
                        const isSelected = selectedTaskIds.has(task.id);

                        return (
                          <div
                            key={task.id}
                            onTouchStart={(e) => startHoldDetection(task.id, e.touches[0].clientX, e.touches[0].clientY)}
                            onTouchMove={(e) => handleTouchMoveDetection(e.touches[0].clientX, e.touches[0].clientY)}
                            onTouchEnd={cancelHoldDetection}
                            onTouchCancel={cancelHoldDetection}
                            onMouseDown={(e) => {
                              if (e.button === 0) startHoldDetection(task.id, e.clientX, e.clientY);
                            }}
                            onMouseMove={(e) => handleTouchMoveDetection(e.clientX, e.clientY)}
                            onMouseUp={cancelHoldDetection}
                            className={`flex items-start justify-between gap-2 p-2 rounded-lg border transition-all ${
                              isSelected
                                ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/70 dark:bg-blue-950/30'
                                : task.isCompleted
                                ? 'bg-[#f4f2ec]/60 dark:bg-[#15161a] border-[#e5e2da] dark:border-[#292b34] opacity-60'
                                : 'bg-[#fdfcf9] dark:bg-[#1a1b20] border-[#e5e2da] dark:border-[#292b34]'
                            }`}
                          >
                            <div className="flex items-start gap-1 flex-1 min-w-0">
                              {/* Selection Checkbox */}
                              {(isSelectionMode || selectedTaskIds.size > 0) && (
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
                                onClick={() => {
                                  if (holdTriggeredRef.current) {
                                    holdTriggeredRef.current = false;
                                    return;
                                  }
                                  if (isSelectionMode || selectedTaskIds.size > 0) {
                                    toggleTaskSelection(task.id);
                                  } else {
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
                                    <div className="relative inline-block">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveCategoryPickerTaskId(
                                            activeCategoryPickerTaskId === task.id ? null : task.id
                                          );
                                        }}
                                        className="font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                                        style={{ color: subj.color }}
                                        title={
                                          selectedTaskIds.has(task.id) && isAllSameCategory
                                            ? `Change subject for all ${selectedTaskIds.size} selected tasks`
                                            : 'Change subject'
                                        }
                                      >
                                        <span>{subj.name}</span>
                                      </button>

                                      {activeCategoryPickerTaskId === task.id && (
                                        <div
                                          onClick={(e) => e.stopPropagation()}
                                          className="absolute left-0 top-full mt-1 w-44 p-1.5 bg-[#2a2d36] text-white dark:bg-[#ffffff] dark:text-[#121317] border border-[#444857] dark:border-[#e5e2da] rounded-xl shadow-2xl z-50 text-[11px] space-y-0.5 animate-in fade-in"
                                        >
                                          <div className="px-2 py-1 text-[9px] font-bold text-[#8c909c] uppercase tracking-wider">
                                            {selectedTaskIds.has(task.id) && isAllSameCategory
                                              ? `Set all (${selectedTaskIds.size}) to:`
                                              : 'Change Subject to:'}
                                          </div>
                                          <div className="max-h-36 overflow-y-auto space-y-0.5">
                                            {subjects.map((s) => (
                                              <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => handleTaskChangeSubject(task, s.id)}
                                                className="w-full text-left px-2 py-1 rounded-md hover:bg-white/10 dark:hover:bg-black/10 flex items-center justify-between gap-1.5"
                                              >
                                                <div className="flex items-center gap-1.5 truncate">
                                                  <span
                                                    className="w-2 h-2 rounded-full shrink-0"
                                                    style={{ backgroundColor: s.color }}
                                                  />
                                                  <span className="truncate">{s.name}</span>
                                                </div>
                                                {task.subjectId === s.id && (
                                                  <Check className="w-3 h-3 text-blue-400" />
                                                )}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
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
          <div
            id="planner-matrix-scroll"
            className="border border-[#e5e2da] dark:border-[#292b34] rounded-2xl bg-[#fdfcf9] dark:bg-[#1a1b20] shadow-xs overflow-auto max-h-[calc(100vh-12rem)]"
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
                                {!isCurrent && dateStr < todayStr && isDayCompletedPastDay(dateStr) && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 rounded-md">
                                    Done
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

                            return (
                              <td
                                key={`${dateStr}-${dayPart}`}
                                onDragOver={(e) => handleDragOverCell(e, dateStr, dayPart)}
                                onDragLeave={(e) => handleDragLeaveCell(e, dateStr, dayPart)}
                                onDrop={(e) => handleDropOnCell(e, dateStr, dayPart)}
                                className={`w-64 min-w-[210px] p-2.5 border-r border-[#e5e2da] dark:border-[#292b34] align-top transition-all min-h-[110px] relative ${
                                  dragOverCell?.date === dateStr && dragOverCell?.dayPart === dayPart
                                    ? 'ring-2 ring-blue-500 ring-inset bg-blue-500/10 dark:bg-blue-500/20 shadow-inner'
                                    : isCurrent
                                    ? 'bg-blue-500/5'
                                    : 'bg-[#fdfcf9] dark:bg-[#1a1b20]'
                                }`}
                              >
                                {/* Tasks list in this cell */}
                                <div className="space-y-1.5 min-h-[50px]">
                                  {cellTasks.map((task) => {
                                    const subj = getSubject(task.subjectId);

                                    return (
                                      <div
                                        key={task.id}
                                        draggable={!isSelectionMode}
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onDragEnd={handleDragEnd}
                                        onTouchStart={(e) => startHoldDetection(task.id, e.touches[0].clientX, e.touches[0].clientY)}
                                        onTouchMove={(e) => handleTouchMoveDetection(e.touches[0].clientX, e.touches[0].clientY)}
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
                                        className={`group/task relative flex items-start gap-1.5 p-2 rounded-lg border bg-[#fdfcf9] dark:bg-[#202127] shadow-2xs hover:shadow-xs transition-all select-none ${
                                          draggedTaskId === task.id
                                            ? 'opacity-40 border-dashed border-blue-500 scale-[0.98]'
                                            : selectedTaskIds.has(task.id)
                                            ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/70 dark:bg-blue-950/30'
                                            : task.isCompleted
                                            ? 'border-[#e5e2da] dark:border-[#292b34] opacity-60'
                                            : 'border-[#e5e2da] dark:border-[#2f313c] hover:border-[#cfcbc2]'
                                        } ${!isSelectionMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                      >
                                        {/* Grip Drag Handle Icon (visible in Grid view) */}
                                        {!isSelectionMode && selectedTaskIds.size === 0 && (
                                          <GripVertical className="w-3 h-3 text-[#8c909c] opacity-0 group-hover/task:opacity-60 transition-opacity shrink-0 mt-0.5" />
                                        )}

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
                                            if (holdTriggeredRef.current) {
                                              holdTriggeredRef.current = false;
                                              return;
                                            }
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
                                              <div className="relative inline-block">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveCategoryPickerTaskId(
                                                      activeCategoryPickerTaskId === task.id ? null : task.id
                                                    );
                                                  }}
                                                  className="hover:underline cursor-pointer flex items-center gap-1"
                                                  title={
                                                    selectedTaskIds.has(task.id) && isAllSameCategory
                                                      ? `Change subject for all ${selectedTaskIds.size} selected tasks`
                                                      : 'Change subject'
                                                  }
                                                >
                                                  <span
                                                    className="text-[9px] font-semibold truncate max-w-[120px]"
                                                    style={{ color: subj.color }}
                                                  >
                                                    {subj.name}
                                                  </span>
                                                </button>

                                                {activeCategoryPickerTaskId === task.id && (
                                                  <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute left-0 top-full mt-1 w-44 p-1.5 bg-[#2a2d36] text-white dark:bg-[#ffffff] dark:text-[#121317] border border-[#444857] dark:border-[#e5e2da] rounded-xl shadow-2xl z-50 text-[11px] space-y-0.5 animate-in fade-in"
                                                  >
                                                    <div className="px-2 py-1 text-[9px] font-bold text-[#8c909c] uppercase tracking-wider">
                                                      {selectedTaskIds.has(task.id) && isAllSameCategory
                                                        ? `Set all (${selectedTaskIds.size}) to:`
                                                        : 'Change Subject to:'}
                                                    </div>
                                                    <div className="max-h-36 overflow-y-auto space-y-0.5">
                                                      {subjects.map((s) => (
                                                        <button
                                                          key={s.id}
                                                          type="button"
                                                          onClick={() => handleTaskChangeSubject(task, s.id)}
                                                          className="w-full text-left px-2 py-1 rounded-md hover:bg-white/10 dark:hover:bg-black/10 flex items-center justify-between gap-1.5"
                                                        >
                                                          <div className="flex items-center gap-1.5 truncate">
                                                            <span
                                                              className="w-2 h-2 rounded-full shrink-0"
                                                              style={{ backgroundColor: s.color }}
                                                            />
                                                            <span className="truncate">{s.name}</span>
                                                          </div>
                                                          {task.subjectId === s.id && (
                                                            <Check className="w-3 h-3 text-blue-400" />
                                                          )}
                                                        </button>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Drop indicator when dragging over cell */}
                                {dragOverCell?.date === dateStr && dragOverCell?.dayPart === dayPart && (
                                  <div className="py-1.5 px-2 my-1 border border-dashed border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 rounded-md text-center text-[10px] font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
                                    Drop here to move
                                  </div>
                                )}

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
                              {!isCurrent && dateStr < todayStr && isDayCompletedPastDay(dateStr) && (
                                <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 rounded-md">
                                  Done
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

                          return (
                            <td
                              key={`${dateStr}-${dayPart}`}
                              onDragOver={(e) => handleDragOverCell(e, dateStr, dayPart)}
                              onDragLeave={(e) => handleDragLeaveCell(e, dateStr, dayPart)}
                              onDrop={(e) => handleDropOnCell(e, dateStr, dayPart)}
                              className={`p-2 border-r border-[#e5e2da] dark:border-[#292b34] align-top transition-all min-h-[110px] relative ${
                                dragOverCell?.date === dateStr && dragOverCell?.dayPart === dayPart
                                  ? 'ring-2 ring-blue-500 ring-inset bg-blue-500/10 dark:bg-blue-500/20 shadow-inner'
                                  : isToday(dateStr)
                                  ? 'bg-blue-500/5'
                                  : 'bg-[#fdfcf9] dark:bg-[#1a1b20]'
                              }`}
                            >
                              <div className="space-y-1.5 min-h-[50px]">
                                {cellTasks.map((task) => {
                                  const subj = getSubject(task.subjectId);

                                  return (
                                    <div
                                      key={task.id}
                                      draggable={!isSelectionMode}
                                      onDragStart={(e) => handleDragStart(e, task.id)}
                                      onDragEnd={handleDragEnd}
                                      onTouchStart={(e) => startHoldDetection(task.id, e.touches[0].clientX, e.touches[0].clientY)}
                                      onTouchMove={(e) => handleTouchMoveDetection(e.touches[0].clientX, e.touches[0].clientY)}
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
                                      className={`group/task relative flex items-start gap-1.5 p-2 rounded-lg border bg-[#fdfcf9] dark:bg-[#202127] shadow-2xs hover:shadow-xs transition-all select-none ${
                                        draggedTaskId === task.id
                                          ? 'opacity-40 border-dashed border-blue-500 scale-[0.98]'
                                          : selectedTaskIds.has(task.id)
                                          ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/70 dark:bg-blue-950/30'
                                          : task.isCompleted
                                          ? 'border-[#e5e2da] dark:border-[#292b34] opacity-60'
                                          : 'border-[#e5e2da] dark:border-[#2f313c] hover:border-[#cfcbc2]'
                                      } ${!isSelectionMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                    >
                                      {/* Grip Drag Handle Icon (visible in Grid view) */}
                                      {!isSelectionMode && selectedTaskIds.size === 0 && (
                                        <GripVertical className="w-3 h-3 text-[#8c909c] opacity-0 group-hover/task:opacity-60 transition-opacity shrink-0 mt-0.5" />
                                      )}

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
                                          if (holdTriggeredRef.current) {
                                            holdTriggeredRef.current = false;
                                            return;
                                          }
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
                                            <div className="relative inline-block">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setActiveCategoryPickerTaskId(
                                                    activeCategoryPickerTaskId === task.id ? null : task.id
                                                  );
                                                }}
                                                className="hover:underline cursor-pointer flex items-center gap-1"
                                                title={
                                                  selectedTaskIds.has(task.id) && isAllSameCategory
                                                    ? `Change subject for all ${selectedTaskIds.size} selected tasks`
                                                    : 'Change subject'
                                                }
                                              >
                                                <span
                                                  className="text-[9px] font-semibold truncate max-w-[100px]"
                                                  style={{ color: subj.color }}
                                                >
                                                  {subj.name}
                                                </span>
                                              </button>

                                              {activeCategoryPickerTaskId === task.id && (
                                                <div
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="absolute left-0 top-full mt-1 w-44 p-1.5 bg-[#2a2d36] text-white dark:bg-[#ffffff] dark:text-[#121317] border border-[#444857] dark:border-[#e5e2da] rounded-xl shadow-2xl z-50 text-[11px] space-y-0.5 animate-in fade-in"
                                                >
                                                  <div className="px-2 py-1 text-[9px] font-bold text-[#8c909c] uppercase tracking-wider">
                                                    {selectedTaskIds.has(task.id) && isAllSameCategory
                                                      ? `Set all (${selectedTaskIds.size}) to:`
                                                      : 'Change Subject to:'}
                                                  </div>
                                                  <div className="max-h-36 overflow-y-auto space-y-0.5">
                                                    {subjects.map((s) => (
                                                      <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => handleTaskChangeSubject(task, s.id)}
                                                        className="w-full text-left px-2 py-1 rounded-md hover:bg-white/10 dark:hover:bg-black/10 flex items-center justify-between gap-1.5"
                                                      >
                                                        <div className="flex items-center gap-1.5 truncate">
                                                          <span
                                                            className="w-2 h-2 rounded-full shrink-0"
                                                            style={{ backgroundColor: s.color }}
                                                          />
                                                          <span className="truncate">{s.name}</span>
                                                        </div>
                                                        {task.subjectId === s.id && (
                                                          <Check className="w-3 h-3 text-blue-400" />
                                                        )}
                                                      </button>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Drop indicator when dragging over cell */}
                              {dragOverCell?.date === dateStr && dragOverCell?.dayPart === dayPart && (
                                <div className="py-1.5 px-2 my-1 border border-dashed border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 rounded-md text-center text-[10px] font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
                                  Drop here to move
                                </div>
                              )}

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
                {allDays.map((d) => (
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

      {/* Batch Task Action Bar & Batch Move Modal */}
      <BatchTaskActionBar
        selectedCount={selectedTaskIds.size}
        onOpenBatchMove={() => setIsBatchMoveModalOpen(true)}
        onBatchToggleComplete={handleBatchToggleComplete}
        onBatchDelete={handleBatchDelete}
        onClearSelection={handleClearSelection}
        isAllSameCategory={isAllSameCategory}
        currentCategoryName={currentCategory?.name || (selectedTasksList.length > 0 ? 'No Subject' : undefined)}
        currentCategoryColor={currentCategory?.color}
        availableCategories={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
        }))}
        onSelectCategory={handleBatchUpdateSubject}
        categoryLabel="Subject"
      />

      <BatchMoveModal
        isOpen={isBatchMoveModalOpen}
        onClose={() => setIsBatchMoveModalOpen(false)}
        selectedTaskCount={selectedTaskIds.size}
        availableDayParts={dayParts}
        availableDates={allDays}
        initialDate={mobileSelectedDate || visibleDays[0] || (activePlanner?.startDate ?? '')}
        onConfirmMove={handleConfirmBatchMove}
      />
    </div>
  );
}
