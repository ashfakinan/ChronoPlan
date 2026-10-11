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
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
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
  ZoomIn,
  ZoomOut,
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
  const [mobileGridPartFilter, setMobileGridPartFilter] = useState<string>('all');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<PlannerTask | null>(null);
  const [initialTaskDate, setInitialTaskDate] = useState<string>('');
  const [initialTaskDayPart, setInitialTaskDayPart] = useState<string>('');

  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // Quick move popup for mobile
  const [movingTask, setMovingTask] = useState<PlannerTask | null>(null);

  // Zoom state (Min 50%, Max 175%)
  const [zoom, setZoom] = useState<number>(() => {
    const saved = localStorage.getItem('planner_zoom');
    return saved ? Math.min(175, Math.max(50, Number(saved))) : 100;
  });

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.min(175, Math.max(50, newZoom));
    setZoom(clamped);
    localStorage.setItem('planner_zoom', String(clamped));
  };

  // Mobile Grid layout density/mode: 'cards' (spacious multi-column schedule cards, default) vs 'matrix' (side-by-side table)
  const [mobileGridLayout, setMobileGridLayout] = useState<'matrix' | 'cards'>('cards');

  // Two-thumb pinch to zoom gesture (both thumbs inward = zoom out, outward = zoom in)
  const pinchContainerRef = React.useRef<HTMLDivElement>(null);
  const pinchStartDistRef = React.useRef<number | null>(null);
  const pinchStartZoomRef = React.useRef<number>(100);
  const [isPinching, setIsPinching] = useState(false);
  const [pinchFeedbackZoom, setPinchFeedbackZoom] = useState(zoom);
  const pinchTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const zoomRef = React.useRef(zoom);

  React.useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Attach native touch event listeners for two-thumb pinch-to-zoom
  React.useEffect(() => {
    const container = pinchContainerRef.current;
    if (!container) return;

    const calcTouchDist = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.hypot(dx, dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = calcTouchDist(e.touches[0], e.touches[1]);
        if (dist > 15) {
          pinchStartDistRef.current = dist;
          pinchStartZoomRef.current = zoomRef.current;
          setIsPinching(true);
          setPinchFeedbackZoom(zoomRef.current);
          if (pinchTimerRef.current) {
            clearTimeout(pinchTimerRef.current);
            pinchTimerRef.current = null;
          }
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDistRef.current && pinchStartDistRef.current > 15) {
        // Prevent default browser viewport page zooming
        if (e.cancelable) {
          e.preventDefault();
        }

        const currentDist = calcTouchDist(e.touches[0], e.touches[1]);
        const scale = currentDist / pinchStartDistRef.current;
        // Thumbs inward: currentDist < pinchStartDist -> scale < 1 -> zoom out
        // Thumbs outward: currentDist > pinchStartDist -> scale > 1 -> zoom in
        const rawZoom = pinchStartZoomRef.current * scale;
        const steppedZoom = Math.round(rawZoom / 5) * 5;
        const clamped = Math.max(50, Math.min(175, steppedZoom));

        if (clamped !== zoomRef.current) {
          zoomRef.current = clamped;
          setZoom(clamped);
          setPinchFeedbackZoom(clamped);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2 && pinchStartDistRef.current !== null) {
        pinchStartDistRef.current = null;
        localStorage.setItem('planner_zoom', String(zoomRef.current));
        pinchTimerRef.current = setTimeout(() => {
          setIsPinching(false);
        }, 700);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      if (pinchTimerRef.current) clearTimeout(pinchTimerRef.current);
    };
  }, []);

  // Manual Side Scroll state & controls for PC / Desktop
  const matrixScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  // Responsive device check for mobile & touch devices
  const [isMobileDevice, setIsMobileDevice] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hasTouch = 'ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0);
    return hasTouch || window.innerWidth < 1024;
  });

  const isMobileOrTouch = isMobileDevice || isTouchDevice;

  React.useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const hasTouch = 'ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0);
      setIsMobileDevice(isMobile);
      setIsTouchDevice(hasTouch || window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    }, 600);
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
    if (dx > 6 || dy > 6) {
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

  const mobileVisibleDayParts = useMemo(() => {
    if (mobileGridPartFilter === 'all') return dayParts;
    return dayParts.filter((p) => p === mobileGridPartFilter);
  }, [dayParts, mobileGridPartFilter]);

  const updateScrollState = React.useCallback(() => {
    const el = matrixScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(maxScroll > 6 && el.scrollLeft < maxScroll - 6);
    if (maxScroll > 0) {
      setScrollPercent(Math.min(100, Math.max(0, Math.round((el.scrollLeft / maxScroll) * 100))));
    } else {
      setScrollPercent(0);
    }
  }, []);

  React.useEffect(() => {
    const el = matrixScrollRef.current;
    if (!el) return;

    // Use requestAnimationFrame to ensure accurate metrics after render/tab switch
    const rafId = requestAnimationFrame(() => {
      updateScrollState();
    });

    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    const observer = new ResizeObserver(() => {
      updateScrollState();
    });
    observer.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      observer.disconnect();
    };
  }, [days, dayParts, matrixOrientation, zoom, mobileViewMode, updateScrollState]);

  const sideScroll = (direction: 'left' | 'right', amount?: number) => {
    const el = matrixScrollRef.current;
    if (!el) return;
    const delta = amount ?? Math.max(220, Math.floor(el.clientWidth * 0.5));
    el.scrollBy({
      left: direction === 'left' ? -delta : delta,
      behavior: 'smooth',
    });
  };

  const jumpToSide = (side: 'start' | 'end') => {
    const el = matrixScrollRef.current;
    if (!el) return;
    el.scrollTo({
      left: side === 'start' ? 0 : el.scrollWidth,
      behavior: 'smooth',
    });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const pct = Number(target.value);
    setScrollPercent(pct);
    const el = matrixScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll > 0) {
      el.scrollLeft = Math.round((pct / 100) * maxScroll);
    }
  };

  const scrollToToday = () => {
    if (mobileViewMode === 'day-focus') {
      if (visibleDays.includes(todayStr)) {
        setMobileSelectedDate(todayStr);
      }
      return;
    }
    const mobileTodayEl = document.getElementById(`mobile-grid-day-${todayStr}`);
    if (mobileTodayEl) {
      mobileTodayEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const el = matrixScrollRef.current;
    if (!el) return;
    const todayEl = el.querySelector(`[data-matrix-header-date="${todayStr}"]`) as HTMLElement;
    if (todayEl) {
      if (matrixOrientation === 'days-on-left') {
        // Today is a row: scroll vertically to center it
        todayEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      } else {
        // Today is a column: scroll horizontally to center it
        todayEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  const scrollToDayPart = (partName: string) => {
    const el = matrixScrollRef.current;
    if (!el) return;
    const header = el.querySelector(`[data-daypart-header="${partName}"]`) as HTMLElement;
    if (header) {
      const dayCol = el.querySelector('th.sticky') as HTMLElement;
      const stickyWidth = dayCol ? dayCol.getBoundingClientRect().width : (isMobileDevice ? 66 : 170);
      const headerRect = header.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const targetScroll = Math.max(0, el.scrollLeft + (headerRect.left - elRect.left) - stickyWidth);
      el.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  // Do not hijack vertical mouse wheel scrolling to horizontal side-scroll
  const handleHeaderWheel = () => {
    // Left empty deliberately: allow standard natural vertical scroll
  };

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
    <div
      ref={pinchContainerRef}
      className="flex-1 flex flex-col min-w-0 bg-[#f8f6f1] dark:bg-[#121317] h-full pb-16 md:pb-0 overflow-hidden relative"
    >
      {/* Real-time Pinch to Zoom HUD Feedback (Both thumbs inward = zoom out, outward = zoom in) */}
      {isPinching && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1f2126]/90 dark:bg-[#eceef2]/95 text-white dark:text-[#121317] shadow-xl backdrop-blur-md border border-white/20">
            {pinchFeedbackZoom >= 100 ? (
              <ZoomIn className="w-4 h-4 text-blue-400 dark:text-blue-600 shrink-0" />
            ) : (
              <ZoomOut className="w-4 h-4 text-amber-400 dark:text-amber-600 shrink-0" />
            )}
            <span className="text-xs font-black tabular-nums">{pinchFeedbackZoom}%</span>
            <span className="text-[10px] opacity-80 font-medium">
              {pinchFeedbackZoom > 100
                ? 'Zoomed In (Thumbs Outward)'
                : pinchFeedbackZoom < 100
                ? 'Zoomed Out (Thumbs Inward)'
                : 'Default (100%)'}
            </span>
          </div>
        </div>
      )}

      {/* Top Planner Controls Bar */}
      <div className="px-3 sm:px-6 py-2 sm:py-2.5 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9]/90 dark:bg-[#1a1b20]/90 backdrop-blur-xs shrink-0 flex flex-col gap-1.5 sm:gap-2">
        {/* Main Header Row: Title & High Priority Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Planner Title */}
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-[#1f2126] dark:text-[#eceef2] tracking-tight truncate">
              {activePlanner.title}
            </h1>
            <button
              type="button"
              onClick={() => setIsPlannerModalOpen(true)}
              className="p-1 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-md transition-colors shrink-0"
              title="Edit Planner"
              aria-label="Edit Planner"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile View Switcher (Grid vs Agenda) */}
            <div className="md:hidden flex items-center bg-[#f4f2ec] dark:bg-[#22242b] p-0.5 rounded-lg border border-[#e5e2da] dark:border-[#292b34]">
              <button
                type="button"
                onClick={() => setMobileViewMode('matrix')}
                className={`px-2 py-1 text-xs rounded-md font-semibold transition-colors flex items-center gap-1 min-h-[30px] ${
                  mobileViewMode === 'matrix'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#606470] dark:text-[#9aa0ae]'
                }`}
                title="Grid Matrix View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('day-focus')}
                className={`px-2 py-1 text-xs rounded-md font-semibold transition-colors flex items-center gap-1 min-h-[30px] ${
                  mobileViewMode === 'day-focus'
                    ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] shadow-2xs'
                    : 'text-[#606470] dark:text-[#9aa0ae]'
                }`}
                title="Agenda Day-by-Day View"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>

            {/* Desktop Orientation Switcher */}
            <div className="hidden lg:flex items-center bg-[#f4f2ec] dark:bg-[#22242b] p-0.5 rounded-lg border border-[#e5e2da] dark:border-[#292b34]">
              <button
                type="button"
                onClick={() => setMatrixOrientation('days-on-left')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1 min-h-[30px] ${
                  matrixOrientation === 'days-on-left'
                    ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] shadow-2xs font-semibold'
                    : 'text-[#606470] dark:text-[#9aa0ae]'
                }`}
                title="Days on Left vertically, Day-Parts horizontally at top"
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

            {/* Search (Desktop) */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c909c]" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2.5 py-1 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-32 md:w-40"
              />
            </div>

            {/* Zoom Controller (Desktop) */}
            <div className="hidden sm:block">
              <ZoomController zoom={zoom} onZoomChange={handleZoomChange} />
            </div>

            {/* Add Task Button */}
            <button
              type="button"
              onClick={() => {
                const defaultDate = visibleDays.includes(todayStr) ? todayStr : (mobileSelectedDate || visibleDays[0] || todayStr);
                handleOpenAddTask(defaultDate, dayParts[0] || 'Morning');
              }}
              className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 min-h-[30px] sm:min-h-[34px] shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Task</span>
            </button>
          </div>
        </div>

        {/* Secondary Subtitle / Filter Row */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 scrollbar-none text-[11px] text-[#606470] dark:text-[#9aa0ae]">
          {/* Metadata info */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <span>{formatDisplayDate(activePlanner.startDate)} – {formatDisplayDate(activePlanner.endDate)}</span>
            <span aria-hidden="true">·</span>
            <span>{visibleDays.length} {visibleDays.length === 1 ? 'Day' : 'Days'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {completedTasksCount}/{totalTasks} Done ({overallRate}%)
            </span>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Completed Past Days Toggle */}
            {hiddenPastDaysCount > 0 && (
              <button
                type="button"
                onClick={() => setShowCompletedPastDays(!showCompletedPastDays)}
                className={`px-2 py-0.5 text-[10px] rounded-md font-semibold transition-all flex items-center gap-1 border ${
                  showCompletedPastDays
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                    : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae] border-[#e5e2da] dark:border-[#292b34]'
                }`}
                title={showCompletedPastDays ? 'Hide completed past days' : 'View past completed days'}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{showCompletedPastDays ? 'Hide Past' : `${hiddenPastDaysCount} Past`}</span>
              </button>
            )}

            {/* Select Tasks Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedTaskIds(new Set());
              }}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 border ${
                isSelectionMode || selectedTaskIds.size > 0
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae] border-[#e5e2da] dark:border-[#292b34]'
              }`}
              title="Batch select tasks"
            >
              <CheckSquare className="w-3 h-3" />
              <span>{selectedTaskIds.size > 0 ? `${selectedTaskIds.size}` : 'Select'}</span>
            </button>

            {/* Subjects Button */}
            <button
              type="button"
              onClick={() => setIsSubjectModalOpen(true)}
              className="px-2 py-0.5 text-[10px] font-medium text-[#1f2126] dark:text-[#eceef2] bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-md hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] transition-colors flex items-center gap-1"
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ backgroundColor: subjects[0]?.color || '#3B82F6' }}
              />
              <span>Subjects</span>
            </button>
          </div>
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

      {/* Zoomable Content Area (Min 50%, Max 175% for Mobile Pinch & Desktop) */}
      <div
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
        style={{ zoom: `${zoom}%` }}
      >
        {/* MOBILE DAY FOCUS MODE (When on mobile and mobileViewMode === 'day-focus') */}
      <div
        id="day-focus-scroll"
        className={`md:hidden flex-1 overflow-y-auto pb-28 ${mobileViewMode === 'day-focus' ? 'block' : 'hidden'}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        {/* Day Selector Header with Prev / Today / Next buttons */}
        <div className="sticky top-0 z-10 bg-[#fdfcf9] dark:bg-[#1a1b20] border-b border-[#e5e2da] dark:border-[#292b34] px-3 py-2 space-y-2 shadow-2xs">
          {/* Quick Date Navigation Arrows Row */}
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => {
                const currentIndex = days.indexOf(mobileSelectedDate);
                if (currentIndex > 0) {
                  setMobileSelectedDate(days[currentIndex - 1]);
                }
              }}
              disabled={days.indexOf(mobileSelectedDate) <= 0}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] border border-[#e5e2da] dark:border-[#292b34] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-[#1f2126] dark:text-[#eceef2] cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {visibleDays.includes(todayStr) && (
              <button
                type="button"
                onClick={() => setMobileSelectedDate(todayStr)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                  mobileSelectedDate === todayStr
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500/30'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>Today</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const currentIndex = days.indexOf(mobileSelectedDate);
                if (currentIndex >= 0 && currentIndex < days.length - 1) {
                  setMobileSelectedDate(days[currentIndex + 1]);
                }
              }}
              disabled={days.indexOf(mobileSelectedDate) >= days.length - 1}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] border border-[#e5e2da] dark:border-[#292b34] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-[#1f2126] dark:text-[#eceef2] cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            id="day-carousel-scroll"
            className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none"
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

      {/* ========================================================= */}
      {/* MOBILE 2D MATRIX GRID (Authentic visual schedule grid)   */}
      {/* ========================================================= */}
      <div
        id="mobile-matrix-grid-scroll"
        className={`md:hidden flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-28 select-none ${
          mobileViewMode === 'matrix' ? 'flex flex-col' : 'hidden'
        }`}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        {/* Mobile Grid Column Filter & Navigation Controls */}
        <div className="sticky top-0 z-40 px-2.5 sm:px-3 py-2 bg-[#fdfcf9] dark:bg-[#1a1b20] border-b border-[#e5e2da] dark:border-[#292b34] flex flex-col gap-1.5 shrink-0 shadow-2xs">
          <div className="flex items-center justify-between gap-1 text-xs flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-bold text-[#1f2126] dark:text-[#eceef2] text-xs">
                Grid Matrix
              </span>
              <span className="text-[10px] text-[#8c909c]">
                ({days.length}d)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Layout Density Switcher: Table vs Roomy Cards */}
              <div className="flex items-center bg-[#f4f2ec] dark:bg-[#22242b] p-0.5 rounded-lg border border-[#e5e2da] dark:border-[#292b34] text-[10px]">
                <button
                  type="button"
                  onClick={() => setMobileGridLayout('matrix')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    mobileGridLayout === 'matrix'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-[#606470] dark:text-[#9aa0ae]'
                  }`}
                  title="Side-by-side Table Columns"
                >
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setMobileGridLayout('cards')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    mobileGridLayout === 'cards'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-[#606470] dark:text-[#9aa0ae]'
                  }`}
                  title="Spacious Multi-Column Cards"
                >
                  Cards
                </button>
              </div>

              {/* Compact Zoom Controls on Mobile */}
              <ZoomController compact zoom={zoom} onZoomChange={handleZoomChange} />

              {visibleDays.includes(todayStr) && (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(
                      mobileGridLayout === 'matrix'
                        ? `mobile-matrix-day-${todayStr}`
                        : `mobile-card-day-${todayStr}`
                    );
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-500/30 rounded-md flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <Calendar className="w-2.5 h-2.5" />
                  <span>Today</span>
                </button>
              )}
            </div>
          </div>

          {/* Day-Part Column Quick Selector & Gesture Tip */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[#8c909c] font-semibold shrink-0 mr-0.5 text-[9px]">Columns:</span>
              <button
                type="button"
                onClick={() => setMobileGridPartFilter('all')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-all shrink-0 cursor-pointer ${
                  mobileGridPartFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae] border border-[#e5e2da] dark:border-[#292b34]'
                }`}
              >
                All Parts ({dayParts.length})
              </button>
              {dayParts.map((part) => (
                <button
                  key={part}
                  type="button"
                  onClick={() => setMobileGridPartFilter(part)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all shrink-0 cursor-pointer ${
                    mobileGridPartFilter === part
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae] border border-[#e5e2da] dark:border-[#292b34]'
                  }`}
                >
                  {part}
                </button>
              ))}
            </div>

            <span className="text-[9px] text-[#8c909c] hidden xs:inline shrink-0 font-medium">
              Pinch 2 thumbs: Inward = out · Outward = in
            </span>
          </div>
        </div>

        {/* VIEW A: 2D Table Matrix (Comfortable columns with smooth horizontal panning) */}
        {mobileGridLayout === 'matrix' ? (
          <div className="w-full flex-1 overflow-x-auto select-none">
            <table className="min-w-[620px] w-full border-collapse border-spacing-0">
              <thead>
                <tr>
                  {/* Top-Left Sticky Corner Header */}
                  <th className="sticky top-[73px] left-0 z-30 w-16 min-w-[64px] max-w-[64px] p-2 bg-[#f4f2ec] dark:bg-[#22242b] border-b border-r border-[#e5e2da] dark:border-[#292b34] text-center shadow-[1px_1px_2px_rgba(0,0,0,0.04)]">
                    <span className="text-[10px] font-bold text-[#606470] dark:text-[#9aa0ae] block leading-none">Days</span>
                    <span className="text-[9px] text-[#8c909c] block mt-0.5 font-normal">↓</span>
                  </th>

                  {/* Sticky Day-Part Column Headers */}
                  {mobileVisibleDayParts.map((part) => {
                    const partTotal = filteredTasks.filter((t) => t.dayPart === part).length;
                    return (
                      <th
                        key={part}
                        className="sticky top-[73px] z-20 p-2 min-w-[135px] bg-[#f4f2ec] dark:bg-[#22242b] border-b border-r border-[#e5e2da] dark:border-[#292b34] text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                      >
                        <span className="text-xs font-bold text-[#1f2126] dark:text-[#eceef2] block truncate">
                          {part}
                        </span>
                        <span className="text-[10px] font-medium text-[#8c909c] block">
                          {partTotal} {partTotal === 1 ? 'task' : 'tasks'}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {days.map((dateStr) => {
                  const isCurrent = isToday(dateStr);
                  const dayTasks = filteredTasks.filter((t) => t.date === dateStr);
                  const doneCount = dayTasks.filter((t) => t.isCompleted).length;

                  return (
                    <tr
                      key={dateStr}
                      id={`mobile-matrix-day-${dateStr}`}
                      className={isCurrent ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''}
                    >
                      {/* Sticky Left Day Column Header */}
                      <td
                        onClick={() => {
                          setMobileSelectedDate(dateStr);
                          setMobileViewMode('day-focus');
                        }}
                        className={`sticky left-0 z-10 w-16 min-w-[64px] max-w-[64px] p-2 border-b border-r border-[#e5e2da] dark:border-[#292b34] text-center align-top cursor-pointer transition-colors shadow-[1px_0_2px_rgba(0,0,0,0.04)] ${
                          isCurrent
                            ? 'bg-[#edf4ff] dark:bg-[#1a2333] hover:bg-[#e2edff]'
                            : 'bg-[#f8f6f1] dark:bg-[#16171b] hover:bg-[#f0ece1]'
                        }`}
                        title="Tap to open in Day Agenda"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-[#8c909c]">
                          {getWeekdayName(dateStr).slice(0, 3)}
                        </span>
                        <span
                          className={`text-sm font-black block mt-0.5 leading-none ${
                            isCurrent
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-[#1f2126] dark:text-[#eceef2]'
                          }`}
                        >
                          {formatShortDate(dateStr).split(' ')[1]}
                        </span>
                        {isCurrent && (
                          <span className="inline-block mt-0.5 px-1 py-0.2 bg-blue-600 text-white rounded text-[8px] font-bold uppercase">
                            Today
                          </span>
                        )}
                        <span className="text-[9px] text-[#8c909c] font-semibold block mt-0.5 tabular-nums">
                          {doneCount}/{dayTasks.length}
                        </span>
                      </td>

                      {/* Intersecting Matrix Cells */}
                      {mobileVisibleDayParts.map((dayPart) => {
                        const cellTasks = dayTasks.filter((t) => t.dayPart === dayPart);

                        return (
                          <td
                            key={dayPart}
                            className={`p-2 border-b border-r border-[#e5e2da] dark:border-[#292b34] align-top min-w-[135px] transition-colors min-h-[64px] ${
                              isCurrent ? 'bg-blue-500/5' : 'bg-[#fdfcf9] dark:bg-[#1a1b20]'
                            }`}
                          >
                            <div className="space-y-1.5 min-h-[44px]">
                              {cellTasks.map((task) => {
                                const subj = getSubject(task.subjectId);
                                const isDone = task.isCompleted;

                                return (
                                  <div
                                    key={task.id}
                                    style={{
                                      borderLeftWidth: subj ? '3px' : '1px',
                                      borderLeftColor: subj ? subj.color : undefined,
                                    }}
                                    className={`flex items-start gap-1.5 p-1.5 rounded-lg border text-xs transition-all leading-tight relative overflow-hidden ${
                                      isDone
                                        ? 'bg-[#f4f2ec]/60 dark:bg-[#15161a] border-[#e5e2da] dark:border-[#292b34] opacity-60'
                                        : 'bg-[#fdfcf9] dark:bg-[#202127] border-[#e5e2da] dark:border-[#292b34] shadow-2xs'
                                    }`}
                                  >
                                    {/* Complete Checkbox */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTaskComplete(task.id);
                                      }}
                                      className="text-[#8c909c] hover:text-emerald-600 shrink-0 mt-0.5 cursor-pointer p-0.5 -m-0.5"
                                      aria-label={isDone ? 'Mark incomplete' : 'Mark done'}
                                    >
                                      {isDone ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      ) : (
                                        <Circle className="w-3.5 h-3.5" />
                                      )}
                                    </button>

                                    {/* Task Title */}
                                    <div
                                      className="flex-1 min-w-0 cursor-pointer"
                                      onClick={() => {
                                        setTaskToEdit(task);
                                        setIsTaskModalOpen(true);
                                      }}
                                    >
                                      <span
                                        className={`block break-words font-medium ${
                                          isDone
                                            ? 'line-through text-[#8c909c] dark:text-[#727784]'
                                            : 'text-[#1f2126] dark:text-[#eceef2]'
                                        }`}
                                      >
                                        {task.title}
                                      </span>
                                      {subj && (
                                        <span
                                          className="inline-block mt-0.5 px-1 py-0.2 rounded text-[8px] font-semibold"
                                          style={{
                                            backgroundColor: `${subj.color}20`,
                                            color: subj.color,
                                          }}
                                        >
                                          {subj.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Cell quick add button */}
                            <button
                              type="button"
                              onClick={() => handleOpenAddTask(dateStr, dayPart)}
                              className="w-full mt-1.5 py-1 border border-dashed border-[#e5e2da] dark:border-[#292b34] hover:border-blue-500 rounded-lg text-[9px] text-[#8c909c] hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1 transition-all cursor-pointer"
                              title={`Add task to ${dayPart}`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* VIEW B: Spacious Multi-Column Schedule Cards (Roomy, clear typography, zero cramming) */
          <div className="p-3 sm:p-4 space-y-3.5">
            {days.map((dateStr) => {
              const isCurrent = isToday(dateStr);
              const dayTasks = filteredTasks.filter((t) => t.date === dateStr);
              const doneCount = dayTasks.filter((t) => t.isCompleted).length;

              return (
                <div
                  key={dateStr}
                  id={`mobile-card-day-${dateStr}`}
                  className={`bg-[#fdfcf9] dark:bg-[#1a1b20] border rounded-2xl p-3.5 shadow-2xs space-y-3 transition-all ${
                    isCurrent
                      ? 'border-blue-500/40 ring-1 ring-blue-500/20'
                      : 'border-[#e5e2da] dark:border-[#292b34]'
                  }`}
                >
                  {/* Day Card Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#e5e2da]/70 dark:border-[#292b34]/70">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1f2126] dark:text-[#eceef2]">
                        {getWeekdayName(dateStr)}, {formatShortDate(dateStr)}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded-md text-[9px] font-bold uppercase tracking-wider">
                          Today
                        </span>
                      )}
                      <span className="text-xs text-[#8c909c] font-medium">
                        {doneCount}/{dayTasks.length} done
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddTask(dateStr, dayParts[0] || 'Morning')}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-500/20 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Task</span>
                    </button>
                  </div>

                  {/* If day has 0 tasks: Clean single welcoming empty state */}
                  {dayTasks.length === 0 ? (
                    <div className="py-3 px-3 rounded-xl bg-[#f8f6f1]/60 dark:bg-[#15161a]/60 border border-dashed border-[#e5e2da] dark:border-[#292b34] flex items-center justify-between text-xs text-[#8c909c]">
                      <span>No tasks scheduled for this day</span>
                      <button
                        type="button"
                        onClick={() => handleOpenAddTask(dateStr, dayParts[0] || 'Morning')}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  ) : (
                    /* Multi-Column Schedule Grid for this day */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {mobileVisibleDayParts.map((part) => {
                        const partTasks = dayTasks.filter((t) => t.dayPart === part);

                        return (
                          <div
                            key={part}
                            className="bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da]/70 dark:border-[#292b34]/70 rounded-xl p-2.5 flex flex-col justify-between min-h-[72px]"
                          >
                            <div>
                              {/* Part Subheader */}
                              <div className="flex items-center justify-between text-xs font-semibold text-[#606470] dark:text-[#9aa0ae] mb-2">
                                <span>{part}</span>
                                <span className="text-[10px] text-[#8c909c]">
                                  {partTasks.length} {partTasks.length === 1 ? 'task' : 'tasks'}
                                </span>
                              </div>

                              {/* Tasks List */}
                              {partTasks.length > 0 ? (
                                <div className="space-y-1.5">
                                  {partTasks.map((task) => {
                                    const subj = getSubject(task.subjectId);
                                    const isDone = task.isCompleted;

                                    return (
                                      <div
                                        key={task.id}
                                        style={{
                                          borderLeftWidth: subj ? '3px' : '1px',
                                          borderLeftColor: subj ? subj.color : undefined,
                                        }}
                                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs leading-snug transition-all ${
                                          isDone
                                            ? 'bg-[#f4f2ec]/60 dark:bg-[#121317] border-[#e5e2da] dark:border-[#292b34] opacity-60'
                                            : 'bg-[#fdfcf9] dark:bg-[#1f2127] border-[#e5e2da] dark:border-[#292b34] shadow-2xs'
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => toggleTaskComplete(task.id)}
                                          className="text-[#8c909c] hover:text-emerald-600 shrink-0 mt-0.5 cursor-pointer p-1 -m-1"
                                          aria-label={isDone ? 'Mark incomplete' : 'Mark done'}
                                        >
                                          {isDone ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                          ) : (
                                            <Circle className="w-4 h-4" />
                                          )}
                                        </button>

                                        <div
                                          className="flex-1 min-w-0 cursor-pointer"
                                          onClick={() => {
                                            setTaskToEdit(task);
                                            setIsTaskModalOpen(true);
                                          }}
                                        >
                                          <span
                                            className={`block font-medium text-xs sm:text-sm ${
                                              isDone
                                                ? 'line-through text-[#8c909c] dark:text-[#727784]'
                                                : 'text-[#1f2126] dark:text-[#eceef2]'
                                            }`}
                                          >
                                            {task.title}
                                          </span>
                                          {subj && (
                                            <span
                                              className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                                              style={{
                                                backgroundColor: `${subj.color}20`,
                                                color: subj.color,
                                              }}
                                            >
                                              {subj.name}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[11px] text-[#8c909c] italic py-1">No tasks</p>
                              )}
                            </div>

                            {/* Quick Add Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenAddTask(dateStr, part)}
                              className="mt-2 py-1 text-[11px] text-[#8c909c] hover:text-blue-600 dark:hover:text-blue-400 border border-dashed border-[#e5e2da] dark:border-[#292b34] hover:border-blue-500 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add to {part}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* DESKTOP MATRIX TABLE VIEW (Wide layout on desktop only)   */}
      {/* ========================================================= */}
      <div className="hidden md:flex flex-1 flex-col min-h-0 min-w-0 p-2 sm:p-4 overflow-hidden">
        {/* Dedicated Horizontal Side Scroll Slider - Visible only on PC/Desktop (Removed on Mobile and Touch Devices) */}
        {!isMobileOrTouch && (
          <div className="w-full shrink-0 mb-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-xl flex flex-col gap-1.5 shadow-2xs">
            {/* Main Scrubber Control Row */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-3">
              {/* Left Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => jumpToSide('start')}
                  disabled={!canScrollLeft}
                  className="hidden sm:flex px-2.5 py-1 rounded-lg border border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-semibold items-center gap-0.5 transition-colors cursor-pointer text-[#1f2126] dark:text-[#eceef2]"
                  title="Jump to Start (Left)"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                  <span>Start</span>
                </button>
                <button
                  type="button"
                  onClick={() => sideScroll('left')}
                  disabled={!canScrollLeft}
                  className="p-1 px-1.5 sm:py-1 rounded-lg border border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-semibold flex items-center transition-colors cursor-pointer text-[#1f2126] dark:text-[#eceef2]"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline ml-0.5">Left</span>
                </button>
              </div>

              {/* Slider Control */}
              <div className="flex-1 max-w-xl flex items-center gap-1.5 sm:gap-2.5 mx-auto min-w-0">
                <span className="text-[11px] font-bold text-[#606470] dark:text-[#9aa0ae] shrink-0 select-none hidden sm:flex items-center gap-1">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Slider:</span>
                </span>
                <span className="text-[10px] text-[#8c909c] hidden sm:inline select-none">Start</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={scrollPercent}
                  onInput={handleSliderChange}
                  onChange={handleSliderChange}
                  aria-label="Horizontal scroll slider"
                  className="flex-1 min-w-[60px] h-2.5 bg-[#e5e2da] dark:bg-[#292b34] rounded-lg appearance-none cursor-ew-resize accent-blue-600 hover:accent-blue-700 active:accent-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  title={`Drag slider to view other side: ${scrollPercent}%`}
                />
                <span className="text-[10px] text-[#8c909c] hidden sm:inline select-none">Other Side</span>
                <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-blue-400 w-7 sm:w-9 text-right tabular-nums shrink-0">
                  {scrollPercent}%
                </span>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-1 shrink-0">
                {visibleDays.includes(todayStr) && (
                  <button
                    type="button"
                    onClick={scrollToToday}
                    className="px-2 py-1 rounded-lg border border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    title="Jump to Today's date"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Today</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => sideScroll('right')}
                  disabled={!canScrollRight}
                  className="p-1 px-1.5 sm:py-1 rounded-lg border border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-semibold flex items-center transition-colors cursor-pointer text-[#1f2126] dark:text-[#eceef2]"
                  title="Scroll Right"
                >
                  <span className="hidden sm:inline mr-0.5">Right</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => jumpToSide('end')}
                  disabled={!canScrollRight}
                  className="px-2 sm:px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400 disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-bold flex items-center gap-0.5 transition-colors shadow-2xs cursor-pointer"
                  title="Jump to Other Side (Right)"
                >
                  <span className="hidden sm:inline">Other Side</span>
                  <span className="sm:hidden text-[10px]">End</span>
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Column Jump Pills */}
            {matrixOrientation === 'days-on-left' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1.5 border-t border-[#e5e2da]/60 dark:border-[#292b34]/60 scrollbar-none">
                <span className="text-[10px] font-bold text-[#8c909c] shrink-0 mr-0.5 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>Jump:</span>
                </span>
                <button
                  type="button"
                  onClick={() => jumpToSide('start')}
                  className="px-2 py-0.5 rounded-md bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] border border-[#e5e2da] dark:border-[#292b34] text-[10px] font-bold text-[#1f2126] dark:text-[#eceef2] shrink-0 transition-colors cursor-pointer active:scale-95"
                >
                  All
                </button>
                {dayParts.map((part) => {
                  const partTasksCount = filteredTasks.filter((t) => t.dayPart === part).length;
                  return (
                    <button
                      key={part}
                      type="button"
                      onClick={() => scrollToDayPart(part)}
                      className="px-2.5 py-0.5 rounded-md bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] border border-[#e5e2da] dark:border-[#292b34] text-[10px] font-semibold text-[#1f2126] dark:text-[#eceef2] shrink-0 flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                    >
                      <span>{part}</span>
                      <span className="text-[9px] text-[#8c909c]">({partTasksCount})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="relative flex-1 min-h-0 min-w-0 w-full group/matrix">
          <div
            id="planner-matrix-scroll"
            ref={matrixScrollRef}
            className="h-full w-full max-w-full overflow-x-auto overflow-y-auto border border-[#e5e2da] dark:border-[#292b34] rounded-xl sm:rounded-2xl bg-[#fdfcf9] dark:bg-[#1a1b20] shadow-xs scrollbar-thin select-none"
            style={{
              WebkitOverflowScrolling: 'touch',
            }}
          >
              <table className="border-separate border-spacing-0 table-auto min-w-full text-left">
                {/* ========================================================= */}
                {/* DAYS ON LEFT (ROWS), DAY-PARTS AT TOP (COLUMNS)           */}
                {/* User explicit request: Days name in left side vertically, */}
                {/* and parts name horizontally at the top!                   */}
                {/* ========================================================= */}
                {matrixOrientation === 'days-on-left' ? (
                  <>
                    {/* Table Header: Day-Parts across the top */}
                    <thead>
                    <tr>
                      {/* Top-left Corner Cell: Sticky in both horizontal & vertical scroll */}
                      <th className="sticky top-0 left-0 z-30 w-16 sm:w-44 min-w-[66px] sm:min-w-[170px] max-w-[70px] sm:max-w-[170px] p-1.5 sm:p-3 font-semibold text-xs text-[#606470] dark:text-[#9aa0ae] border-b border-r border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] uppercase tracking-wider shadow-[2px_2px_4px_rgba(0,0,0,0.04)]">
                        <div className="hidden sm:flex items-center justify-between">
                          <span className="font-bold text-[#1f2126] dark:text-[#eceef2]">Days</span>
                          <span className="text-[10px] text-[#8c909c] font-normal">Parts →</span>
                        </div>
                        <div className="sm:hidden text-center">
                          <span className="font-bold text-[10px] text-[#1f2126] dark:text-[#eceef2] block">Days</span>
                          <span className="text-[8px] text-[#8c909c] font-normal">→</span>
                        </div>
                      </th>

                      {/* Day-Part Column Headers: Sticky top when scrolling vertically */}
                      {dayParts.map((dayPart) => {
                        const totalPartTasks = filteredTasks.filter((t) => t.dayPart === dayPart).length;
                        return (
                          <th
                            key={dayPart}
                            data-daypart-header={dayPart}
                            className="sticky top-0 z-20 w-44 sm:w-64 min-w-[160px] sm:min-w-[210px] p-2 sm:p-3 border-b border-r border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] select-none shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
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
                  <tbody>
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
                            className={`sticky left-0 z-10 w-16 sm:w-44 min-w-[66px] sm:min-w-[170px] max-w-[70px] sm:max-w-[170px] p-1 sm:p-3.5 border-b border-r border-[#e5e2da] dark:border-[#292b34] align-top cursor-pointer transition-colors select-none shadow-[2px_0_4px_rgba(0,0,0,0.04)] ${
                              isCurrent
                                ? 'bg-[#edf4ff] dark:bg-[#1a2333] hover:bg-[#e2edff] dark:hover:bg-[#202b3f]'
                                : 'bg-[#f8f6f1] dark:bg-[#16171b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36]'
                            }`}
                            title="Click to view full day schedule"
                          >
                            {/* Desktop layout */}
                            <div className="hidden sm:block">
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

                            {/* Mobile compact badge layout */}
                            <div className="sm:hidden text-center flex flex-col items-center py-1">
                              <span
                                className={`text-[10px] font-extrabold uppercase tracking-tight ${
                                  isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-[#1f2126] dark:text-[#eceef2]'
                                }`}
                              >
                                {getWeekdayName(dateStr).slice(0, 3)}
                              </span>
                              <span className="text-[11px] font-bold text-[#1f2126] dark:text-[#eceef2] leading-tight">
                                {formatShortDate(dateStr)}
                              </span>
                              {isCurrent && (
                                <span className="mt-0.5 px-1 py-0.2 text-[8px] font-bold bg-blue-600 text-white rounded">
                                  Today
                                </span>
                              )}
                              {!isCurrent && dateStr < todayStr && isDayCompletedPastDay(dateStr) && (
                                <span className="mt-0.5 px-1 py-0.2 text-[8px] font-semibold bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 rounded">
                                  Done
                                </span>
                              )}
                              <span className="text-[9px] text-[#8c909c] font-semibold mt-1 tabular-nums">
                                {doneCount}/{dayTasks.length}
                              </span>
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
                                onDragOver={!isMobileOrTouch ? (e) => handleDragOverCell(e, dateStr, dayPart) : undefined}
                                onDragLeave={!isMobileOrTouch ? (e) => handleDragLeaveCell(e, dateStr, dayPart) : undefined}
                                onDrop={!isMobileOrTouch ? (e) => handleDropOnCell(e, dateStr, dayPart) : undefined}
                                className={`w-44 sm:w-64 min-w-[160px] sm:min-w-[210px] p-1.5 sm:p-2.5 border-b border-r border-[#e5e2da] dark:border-[#292b34] align-top transition-all min-h-[90px] relative ${
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
                                        draggable={!isMobileOrTouch && !isSelectionMode}
                                        onDragStart={!isMobileOrTouch ? (e) => handleDragStart(e, task.id) : undefined}
                                        onDragEnd={!isMobileOrTouch ? handleDragEnd : undefined}
                                        onTouchStart={(e) => startHoldDetection(task.id, e.touches[0].clientX, e.touches[0].clientY)}
                                        onTouchMove={(e) => handleTouchMoveDetection(e.touches[0].clientX, e.touches[0].clientY)}
                                        onTouchEnd={cancelHoldDetection}
                                        onTouchCancel={cancelHoldDetection}
                                        onMouseDown={(e) => {
                                          if (!isMobileOrTouch && e.button === 0) startHoldDetection(task.id, e.clientX, e.clientY);
                                        }}
                                        onMouseMove={!isMobileOrTouch ? (e) => handleTouchMoveDetection(e.clientX, e.clientY) : undefined}
                                        onMouseUp={!isMobileOrTouch ? cancelHoldDetection : undefined}
                                        onClick={() => {
                                          if (holdTriggeredRef.current) {
                                            holdTriggeredRef.current = false;
                                            return;
                                          }
                                          if (isSelectionMode || selectedTaskIds.size > 0) {
                                            toggleTaskSelection(task.id);
                                          }
                                        }}
                                        className={`group/task relative flex items-start gap-1.5 p-2 rounded-lg border bg-[#fdfcf9] dark:bg-[#202127] shadow-2xs hover:shadow-xs transition-all select-none touch-pan-y ${
                                          draggedTaskId === task.id
                                            ? 'opacity-40 border-dashed border-blue-500 scale-[0.98]'
                                            : selectedTaskIds.has(task.id)
                                            ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/70 dark:bg-blue-950/30'
                                            : task.isCompleted
                                            ? 'border-[#e5e2da] dark:border-[#292b34] opacity-60'
                                            : 'border-[#e5e2da] dark:border-[#2f313c] hover:border-[#cfcbc2]'
                                        } ${!isMobileOrTouch && !isSelectionMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                      >
                                        {/* Grip Drag Handle Icon (visible on Desktop Grid) */}
                                        {!isMobileOrTouch && !isSelectionMode && selectedTaskIds.size === 0 && (
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

                                        {/* Mobile Quick Move / Shift Button */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setMovingTask(task);
                                          }}
                                          className="sm:hidden p-1 text-[#8c909c] hover:text-blue-600 dark:hover:text-blue-400 active:bg-blue-50 dark:active:bg-blue-950/40 rounded transition-colors shrink-0 self-center"
                                          title="Move task to another day-part"
                                          aria-label="Shift task"
                                        >
                                          <MoveRight className="w-3 h-3" />
                                        </button>
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
                                  className="w-full mt-2 py-1 border border-dashed border-[#e5e2da] dark:border-[#292b34] hover:border-[#8c909c] active:bg-blue-500/10 rounded-md text-[10px] text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] flex items-center justify-center gap-1 opacity-75 hover:opacity-100 transition-all min-h-[28px] cursor-pointer"
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
                    <tr>
                      <th className="sticky top-0 left-0 z-30 w-28 sm:w-44 p-2 sm:p-3 font-semibold text-xs text-[#606470] dark:text-[#9aa0ae] border-b border-r border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] uppercase tracking-wider shadow-[2px_2px_4px_rgba(0,0,0,0.04)]">
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
                            className={`sticky top-0 z-20 p-2 sm:p-3 border-b border-r border-[#e5e2da] dark:border-[#292b34] cursor-pointer transition-colors group select-none min-w-[140px] sm:min-w-[160px] bg-[#f4f2ec] dark:bg-[#22242b] shadow-[0_2px_4px_rgba(0,0,0,0.04)] ${
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

                  <tbody>
                    {dayParts.map((dayPart) => (
                      <tr key={dayPart} className="group">
                        <td className="sticky left-0 z-10 p-2 sm:p-3 border-b border-r border-[#e5e2da] dark:border-[#292b34] bg-[#f8f6f1] dark:bg-[#16171b] align-top shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                          <div>
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
                              onDragOver={!isMobileOrTouch ? (e) => handleDragOverCell(e, dateStr, dayPart) : undefined}
                              onDragLeave={!isMobileOrTouch ? (e) => handleDragLeaveCell(e, dateStr, dayPart) : undefined}
                              onDrop={!isMobileOrTouch ? (e) => handleDropOnCell(e, dateStr, dayPart) : undefined}
                              className={`p-1.5 sm:p-2 border-b border-r border-[#e5e2da] dark:border-[#292b34] align-top transition-all min-h-[90px] relative ${
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
                                      draggable={!isMobileOrTouch && !isSelectionMode}
                                      onDragStart={!isMobileOrTouch ? (e) => handleDragStart(e, task.id) : undefined}
                                      onDragEnd={!isMobileOrTouch ? handleDragEnd : undefined}
                                      onTouchStart={(e) => startHoldDetection(task.id, e.touches[0].clientX, e.touches[0].clientY)}
                                      onTouchMove={(e) => handleTouchMoveDetection(e.touches[0].clientX, e.touches[0].clientY)}
                                      onTouchEnd={cancelHoldDetection}
                                      onTouchCancel={cancelHoldDetection}
                                      onMouseDown={(e) => {
                                        if (!isMobileOrTouch && e.button === 0) startHoldDetection(task.id, e.clientX, e.clientY);
                                      }}
                                      onMouseMove={!isMobileOrTouch ? (e) => handleTouchMoveDetection(e.clientX, e.clientY) : undefined}
                                      onMouseUp={!isMobileOrTouch ? cancelHoldDetection : undefined}
                                      onClick={() => {
                                        if (holdTriggeredRef.current) {
                                          holdTriggeredRef.current = false;
                                          return;
                                        }
                                        if (isSelectionMode || selectedTaskIds.size > 0) {
                                          toggleTaskSelection(task.id);
                                        }
                                      }}
                                      className={`group/task relative flex items-start gap-1.5 p-2 rounded-lg border bg-[#fdfcf9] dark:bg-[#202127] shadow-2xs hover:shadow-xs transition-all select-none touch-pan-y ${
                                        draggedTaskId === task.id
                                          ? 'opacity-40 border-dashed border-blue-500 scale-[0.98]'
                                          : selectedTaskIds.has(task.id)
                                          ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/70 dark:bg-blue-950/30'
                                          : task.isCompleted
                                          ? 'border-[#e5e2da] dark:border-[#292b34] opacity-60'
                                          : 'border-[#e5e2da] dark:border-[#2f313c] hover:border-[#cfcbc2]'
                                      } ${!isMobileOrTouch && !isSelectionMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                    >
                                      {/* Grip Drag Handle Icon (visible on Desktop Grid) */}
                                      {!isMobileOrTouch && !isSelectionMode && selectedTaskIds.size === 0 && (
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

                                      {/* Mobile Quick Move / Shift Button */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setMovingTask(task);
                                        }}
                                        className="sm:hidden p-1 text-[#8c909c] hover:text-blue-600 dark:hover:text-blue-400 active:bg-blue-50 dark:active:bg-blue-950/40 rounded transition-colors shrink-0 self-center"
                                        title="Move task to another section or date"
                                        aria-label="Shift task"
                                      >
                                        <MoveRight className="w-3 h-3" />
                                      </button>
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
                                className="w-full mt-2 py-1 border border-dashed border-[#e5e2da] dark:border-[#292b34] hover:border-[#8c909c] active:bg-blue-500/10 rounded-md text-[10px] text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] flex items-center justify-center gap-1 opacity-75 hover:opacity-100 transition-all min-h-[28px] cursor-pointer"
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
