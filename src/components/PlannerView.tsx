import React, { useState, useMemo, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { getDaysInRange, getTodayISO, isToday } from '../utils/dateUtils';
import { PlannerTask } from '../types';
import { TaskModal } from './TaskModal';
import { PlannerModal } from './PlannerModal';
import { SubjectModal } from './SubjectModal';
import { DailyViewModal } from './DailyViewModal';
import { BatchMoveModal } from './BatchMoveModal';
import { BatchTaskActionBar } from './BatchTaskActionBar';
import { PlannerToolbar } from './planner/PlannerToolbar';
import { PlannerMatrixTable } from './planner/PlannerMatrixTable';
import { PlannerDayFocusView } from './planner/PlannerDayFocusView';
import { usePlannerSelection } from './planner/usePlannerSelection';

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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Matrix orientation & Mobile mode
  const [matrixOrientation, setMatrixOrientation] = useState<'days-on-left' | 'days-on-top'>('days-on-left');
  const [mobileViewMode, setMobileViewMode] = useState<'matrix' | 'day-focus'>('day-focus');
  const [mobileSelectedDate, setMobileSelectedDate] = useState<string>(() => getTodayISO());

  // Zoom state
  const [zoom, setZoom] = useState<number>(() => {
    const saved = localStorage.getItem('planner_zoom');
    return saved ? Math.min(175, Math.max(50, Number(saved))) : 100;
  });

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.min(175, Math.max(50, newZoom));
    setZoom(clamped);
    localStorage.setItem('planner_zoom', String(clamped));
  };

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<PlannerTask | null>(null);
  const [initialTaskDate, setInitialTaskDate] = useState<string>('');
  const [initialTaskDayPart, setInitialTaskDayPart] = useState<string>('');
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isBatchMoveModalOpen, setIsBatchMoveModalOpen] = useState(false);

  // Multi-selection state
  const {
    selectedTaskIds,
    isSelectionMode,
    toggleTaskSelection,
    handleSelectAllInSection,
    clearSelection,
    toggleSelectionMode,
  } = usePlannerSelection();

  // Scroll element ref
  const matrixScrollRef = useRef<HTMLDivElement | null>(null);

  // Derived date range & day parts
  const days = useMemo(() => {
    if (!activePlanner) return [];
    return getDaysInRange(activePlanner.startDate, activePlanner.endDate);
  }, [activePlanner]);

  const dayParts = activePlanner?.dayParts || ['Morning', 'Afternoon', 'Evening', 'Night', 'Self Study'];

  // Sync mobile selected date if out of range
  const effectiveMobileDate = useMemo(() => {
    if (days.includes(mobileSelectedDate)) return mobileSelectedDate;
    const today = getTodayISO();
    if (days.includes(today)) return today;
    return days[0] || today;
  }, [days, mobileSelectedDate]);

  // Filter tasks belonging to active planner
  const filteredTasks = useMemo(() => {
    if (!activePlanner) return [];
    return tasks
      .filter((t) => t.plannerId === activePlanner.id)
      .filter((t) => {
        const matchesSearch = searchQuery
          ? t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()))
          : true;
        const matchesSubject =
          selectedSubjectFilter === 'all' || t.subjectId === selectedSubjectFilter;
        return matchesSearch && matchesSubject;
      });
  }, [tasks, activePlanner, searchQuery, selectedSubjectFilter]);

  // Scroll to today's column/row
  const scrollToToday = () => {
    const todayStr = getTodayISO();
    if (mobileViewMode === 'day-focus') {
      if (days.includes(todayStr)) {
        setMobileSelectedDate(todayStr);
      }
      return;
    }
    const el = matrixScrollRef.current;
    if (!el) return;
    const todayHeader = el.querySelector(`[data-matrix-header-date="${todayStr}"]`) as HTMLElement;
    if (todayHeader) {
      todayHeader.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  };

  const handleOpenAddTask = (date?: string, dayPart?: string) => {
    const targetDate = date || effectiveMobileDate || getTodayISO();
    const targetPart = dayPart || dayParts[0] || 'Morning';
    setInitialTaskDate(targetDate);
    setInitialTaskDayPart(targetPart);
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: PlannerTask) => {
    setTaskToEdit(task);
    setInitialTaskDate(task.date);
    setInitialTaskDayPart(task.dayPart);
    setIsTaskModalOpen(true);
  };

  const selectedTasksList = useMemo(() => {
    return tasks.filter((t) => selectedTaskIds.has(t.id));
  }, [tasks, selectedTaskIds]);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative pb-16 md:pb-0">
      {/* Top Planner Toolbar */}
      <PlannerToolbar
        activePlanner={activePlanner}
        subjects={subjects}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSubjectFilter={selectedSubjectFilter}
        onSubjectFilterChange={setSelectedSubjectFilter}
        matrixOrientation={matrixOrientation}
        onToggleOrientation={() =>
          setMatrixOrientation((prev) => (prev === 'days-on-left' ? 'days-on-top' : 'days-on-left'))
        }
        mobileViewMode={mobileViewMode}
        onToggleMobileView={() =>
          setMobileViewMode((prev) => (prev === 'day-focus' ? 'matrix' : 'day-focus'))
        }
        zoom={zoom}
        onZoomChange={handleZoomChange}
        isSelectionMode={isSelectionMode}
        selectedCount={selectedTaskIds.size}
        onToggleSelectionMode={toggleSelectionMode}
        onOpenAddTask={() => handleOpenAddTask()}
        onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
        onOpenPlannerModal={() => setIsPlannerModalOpen(true)}
        onScrollToToday={scrollToToday}
      />

      {/* Auto-Rollover Notice Banner */}
      {autoRolloverNotice && (
        <aside
          aria-label="Automatic Rollover Notice"
          className="mx-3 sm:mx-4 mt-2 px-3 py-2 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 shrink-0 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>Auto-Rollover:</strong> {autoRolloverNotice.count} unfinished tasks from past days moved to today.
            </span>
          </div>
          <button
            type="button"
            onClick={dismissAutoRolloverNotice}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* Mobile Day-Focus View (on small screens when mode is day-focus) */}
        <div className={`flex-1 flex flex-col min-h-0 ${mobileViewMode === 'day-focus' ? 'flex md:hidden' : 'hidden'}`}>
          <PlannerDayFocusView
            days={days}
            selectedDate={effectiveMobileDate}
            onSelectDate={setMobileSelectedDate}
            dayParts={dayParts}
            tasks={filteredTasks}
            subjects={subjects}
            selectedTaskIds={selectedTaskIds}
            isSelectionMode={isSelectionMode}
            onToggleTaskSelect={toggleTaskSelection}
            onSelectAllInSection={handleSelectAllInSection}
            onToggleComplete={toggleTaskComplete}
            onEditTask={handleEditTask}
            onOpenAddTask={handleOpenAddTask}
            onOpenDailyDetail={(date) => setSelectedDayForDetail(date)}
            onToggleSelectionMode={toggleSelectionMode}
          />
        </div>

        {/* Desktop & Matrix View */}
        <div className={`flex-1 flex flex-col min-h-0 ${mobileViewMode === 'day-focus' ? 'hidden md:flex' : 'flex'}`}>
          <PlannerMatrixTable
            days={days}
            dayParts={dayParts}
            tasks={filteredTasks}
            subjects={subjects}
            matrixOrientation={matrixOrientation}
            zoom={zoom}
            selectedTaskIds={selectedTaskIds}
            isSelectionMode={isSelectionMode}
            onToggleTaskSelect={toggleTaskSelection}
            onToggleComplete={toggleTaskComplete}
            onEditTask={handleEditTask}
            onOpenAddTask={handleOpenAddTask}
            onMoveTask={moveTask}
            onOpenDailyDetail={(date) => setSelectedDayForDetail(date)}
            scrollRef={matrixScrollRef}
          />
        </div>
      </div>

      {/* Multi-Selection Bottom Action Bar */}
      {selectedTaskIds.size > 0 && (
        <BatchTaskActionBar
          selectedCount={selectedTaskIds.size}
          availableCategories={subjects.map((s) => ({ id: s.id, name: s.name, color: s.color }))}
          categoryLabel="Subject"
          onBatchToggleComplete={() => {
            const selectedList = tasks.filter((t) => selectedTaskIds.has(t.id));
            const allDone = selectedList.length > 0 && selectedList.every((t) => t.isCompleted);
            batchToggleComplete(Array.from(selectedTaskIds), !allDone);
          }}
          onBatchDelete={() => {
            batchDeleteTasks(Array.from(selectedTaskIds));
            clearSelection();
          }}
          onOpenBatchMove={() => setIsBatchMoveModalOpen(true)}
          onSelectCategory={(subjectId) => batchUpdateTasksSubject(Array.from(selectedTaskIds), subjectId)}
          onClearSelection={clearSelection}
        />
      )}

      {/* Batch Move Modal */}
      {isBatchMoveModalOpen && (
        <BatchMoveModal
          isOpen={isBatchMoveModalOpen}
          onClose={() => setIsBatchMoveModalOpen(false)}
          selectedTaskCount={selectedTaskIds.size}
          availableDates={days}
          availableDayParts={dayParts}
          initialDate={effectiveMobileDate}
          onConfirmMove={async (targetDate, targetDayPart) => {
            await batchMoveTasks(Array.from(selectedTaskIds), targetDate, targetDayPart);
            clearSelection();
          }}
        />
      )}

      {/* Task Creation & Edit Modal */}
      {isTaskModalOpen && (
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
      )}

      {/* Planner Edit Modal */}
      {isPlannerModalOpen && activePlanner && (
        <PlannerModal
          isOpen={isPlannerModalOpen}
          onClose={() => setIsPlannerModalOpen(false)}
          plannerToEdit={activePlanner}
        />
      )}

      {/* Subjects Manager Modal */}
      {isSubjectModalOpen && (
        <SubjectModal
          isOpen={isSubjectModalOpen}
          onClose={() => setIsSubjectModalOpen(false)}
        />
      )}

      {/* Full Day Detail Modal */}
      {selectedDayForDetail && (
        <DailyViewModal
          date={selectedDayForDetail}
          onClose={() => setSelectedDayForDetail(null)}
          onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
        />
      )}
    </div>
  );
}
