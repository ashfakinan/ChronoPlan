import React, { useState, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Check,
  ArrowRight,
  Sparkles,
  Tag,
  CheckSquare,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { getTodayISO, addDays, formatFullDate, getYesterdayISO } from '../utils/dateUtils';
import { Priority } from '../types';
import { BatchTaskActionBar, BatchCategoryOption } from './BatchTaskActionBar';
import { ZoomController } from './ZoomController';

const TODO_CATEGORIES: BatchCategoryOption[] = [
  { id: 'General', name: 'General', color: '#6B7280' },
  { id: 'Work', name: 'Work', color: '#3B82F6' },
  { id: 'Personal', name: 'Personal', color: '#10B981' },
  { id: 'Study', name: 'Study', color: '#8B5CF6' },
  { id: 'Fitness', name: 'Fitness', color: '#EC4899' },
  { id: 'Urgent', name: 'Urgent', color: '#EF4444' },
];

export function DailyTodoTab() {
  const {
    todos,
    createTodo,
    toggleTodoComplete,
    updateTodo,
    deleteTodo,
    batchDeleteTodos,
    batchUpdateTodosCategory,
    rolloverUnfinishedTodos,
  } = usePlanner();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [inputText, setInputText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Zoom state (Min 50%, Max 100%)
  const [zoom, setZoom] = useState<number>(() => {
    const saved = localStorage.getItem('dailytodo_zoom');
    return saved ? Math.min(100, Math.max(50, Number(saved))) : 100;
  });

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    localStorage.setItem('dailytodo_zoom', String(newZoom));
  };

  // Batch Selection State
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activeCategoryPickerTodoId, setActiveCategoryPickerTodoId] = useState<string | null>(null);

  // Touch and hold detection
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const holdTriggeredRef = useRef<boolean>(false);

  const startHoldDetection = (todoId: string, clientX: number, clientY: number) => {
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
      setSelectedTodoIds((prev) => {
        const next = new Set(prev);
        next.add(todoId);
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

  const toggleTodoSelection = (id: string) => {
    setSelectedTodoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedTodoIds(new Set());
    setIsSelectionMode(false);
    setActiveCategoryPickerTodoId(null);
  };

  // Items for selected date
  const dateTodos = todos.filter((t) => t.date === selectedDate);
  const completedCount = dateTodos.filter((t) => t.isCompleted).length;
  const progressPercent = dateTodos.length > 0 ? Math.round((completedCount / dateTodos.length) * 100) : 0;

  // Selected todos and category matching logic
  const selectedTodosList = useMemo(() => {
    return dateTodos.filter((t) => selectedTodoIds.has(t.id));
  }, [dateTodos, selectedTodoIds]);

  const isAllSameCategory = useMemo(() => {
    if (selectedTodosList.length <= 1) return true;
    const firstCat = (selectedTodosList[0].category || 'General').trim().toLowerCase();
    return selectedTodosList.every((t) => (t.category || 'General').trim().toLowerCase() === firstCat);
  }, [selectedTodosList]);

  const currentCategoryName = useMemo(() => {
    if (selectedTodosList.length === 0 || !isAllSameCategory) return undefined;
    return selectedTodosList[0].category || 'General';
  }, [selectedTodosList, isAllSameCategory]);

  const currentCategoryColor = useMemo(() => {
    if (!currentCategoryName) return undefined;
    const found = TODO_CATEGORIES.find(
      (c) => c.name.toLowerCase() === currentCategoryName.toLowerCase()
    );
    return found?.color || '#3B82F6';
  }, [currentCategoryName]);

  const handleBatchUpdateCategory = async (newCategory: string) => {
    const ids = Array.from(selectedTodoIds);
    if (!ids.length) return;
    if (!isAllSameCategory) {
      alert('Selected to-dos have different categories. You cannot change all of them together unless all selected to-dos have the same category.');
      return;
    }
    await batchUpdateTodosCategory(ids, newCategory);
    setActiveCategoryPickerTodoId(null);
  };

  // Changing category by changing one todo card:
  const handleTodoChangeCategory = async (todoId: string, newCategory: string) => {
    setActiveCategoryPickerTodoId(null);
    if (selectedTodoIds.has(todoId)) {
      if (isAllSameCategory) {
        // Change ALL selected to-dos because all share the same category!
        await batchUpdateTodosCategory(Array.from(selectedTodoIds), newCategory);
      } else {
        // Mixed categories: only change this one, alert user
        await updateTodo(todoId, { category: newCategory });
        alert('Selected to-dos have different categories. Only this to-do was updated. (To change all selected to-dos, make sure all selected have the same category.)');
      }
    } else {
      await updateTodo(todoId, { category: newCategory });
    }
  };

  const handleBatchToggleComplete = async () => {
    const ids = Array.from(selectedTodoIds);
    if (!ids.length) return;
    const allCompleted = selectedTodosList.every((t) => t.isCompleted);
    for (const id of ids) {
      await updateTodo(id, { isCompleted: !allCompleted });
    }
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedTodoIds);
    if (!ids.length) return;
    if (window.confirm(`Delete ${ids.length} selected to-dos?`)) {
      await batchDeleteTodos(ids);
      handleClearSelection();
    }
  };

  // Check if yesterday has unfinished to-dos
  const yesterday = getYesterdayISO();
  const unfinishedYesterday = todos.filter((t) => t.date === yesterday && !t.isCompleted);

  const filteredTodos = dateTodos.filter((t) => {
    if (filter === 'active') return !t.isCompleted;
    if (filter === 'completed') return t.isCompleted;
    return true;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await createTodo(inputText.trim(), selectedDate, priority, selectedCategory);
    setInputText('');
  };

  const handleStartEdit = (id: string, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) return;
    await updateTodo(id, { text: editText.trim() });
    setEditingId(null);
  };

  const handleRolloverYesterday = async () => {
    await rolloverUnfinishedTodos(yesterday, selectedDate);
  };

  const getCategoryColor = (catName?: string) => {
    const name = catName || 'General';
    const found = TODO_CATEGORIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
    return found?.color || '#6B7280';
  };

  return (
    <div className="flex-1 bg-[#f8f6f1] dark:bg-[#121317] p-3 sm:p-6 overflow-y-auto h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* Header & Date Navigation Card */}
        <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f4f2ec] dark:border-[#22242b]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                <h1 className="text-base sm:text-lg font-bold text-[#1f2126] dark:text-[#eceef2] tracking-tight">
                  Daily To DO List
                </h1>
              </div>
              <p className="text-xs text-[#606470] dark:text-[#9aa0ae] mt-0.5">
                Touch and hold a task to select, delete, or batch change category.
              </p>
            </div>

            {/* Controls: Date Navigator, Zoom Controller & Select Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Batch Select Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedTodoIds(new Set());
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 min-h-[34px] ${
                  isSelectionMode || selectedTodoIds.size > 0
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#1f2126] dark:text-[#eceef2] bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36]'
                }`}
                title="Select to-dos to batch change category or delete"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>
                  {selectedTodoIds.size > 0 ? `${selectedTodoIds.size} Selected` : 'Select'}
                </span>
              </button>

              {/* Zoom Controller */}
              <ZoomController zoom={zoom} onZoomChange={handleZoomChange} />

              {/* Date Navigator */}
              <div className="flex items-center gap-1 bg-[#f4f2ec] dark:bg-[#22242b] p-1 rounded-xl border border-[#e5e2da] dark:border-[#292b34]">
                <button
                  type="button"
                  onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                  className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
                  title="Previous Day"
                  aria-label="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(getTodayISO())}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors min-h-[34px] ${
                    selectedDate === getTodayISO()
                      ? 'bg-[#1f2126] text-[#fdfcf9] dark:bg-[#eceef2] dark:text-[#121317]'
                      : 'text-[#606470] dark:text-[#9aa0ae] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36]'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
                  title="Next Day"
                  aria-label="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2 py-1 text-xs bg-transparent border-0 text-[#1f2126] dark:text-[#eceef2] font-medium focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Date Label & Progress */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs sm:text-sm font-semibold text-[#1f2126] dark:text-[#eceef2]">
                {formatFullDate(selectedDate)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#606470] dark:text-[#9aa0ae] font-medium">
                {completedCount} of {dateTodos.length} Finished ({progressPercent}%)
              </span>
              <div className="w-24 sm:w-28 h-2 bg-[#f4f2ec] dark:bg-[#22242b] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rollover notice if yesterday has items */}
        {selectedDate === getTodayISO() && unfinishedYesterday.length > 0 && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                You have <strong>{unfinishedYesterday.length} unfinished to-dos</strong> from yesterday.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRolloverYesterday}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors shrink-0 shadow-xs flex items-center gap-1 min-h-[38px]"
            >
              <ArrowRight className="w-3.5 h-3.5" /> Move to Today
            </button>
          </div>
        )}

        {/* Zoomable Content Area (Form, Filters & To-Dos) */}
        <div style={{ zoom: `${zoom}%` }} className="space-y-4 sm:space-y-6">
          {/* Add Todo Input */}
          <form
            onSubmit={handleAdd}
            className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3"
          >
            <input
              type="text"
              placeholder="Write down something you want to do today..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={300}
              className="flex-1 w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-1 focus:ring-blue-500 min-h-[44px]"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start flex-wrap">
              {/* Category Picker for New Todo */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] font-semibold min-h-[38px] cursor-pointer"
              >
                {TODO_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Priority */}
              <div className="flex items-center gap-1 bg-[#f4f2ec] dark:bg-[#22242b] p-1 rounded-xl">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg uppercase tracking-wider transition-colors min-h-[36px] ${
                      priority === p
                        ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] shadow-2xs'
                        : 'text-[#606470] dark:text-[#9aa0ae]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 min-h-[44px]"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </form>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-[#f4f2ec] dark:bg-[#22242b] p-1 rounded-xl border border-[#e5e2da] dark:border-[#292b34]">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors min-h-[34px] ${
                  filter === 'all'
                    ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] font-semibold shadow-2xs'
                    : 'text-[#606470] dark:text-[#9aa0ae]'
                }`}
              >
                All ({dateTodos.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('active')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors min-h-[34px] ${
                  filter === 'active'
                    ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] font-semibold shadow-2xs'
                    : 'text-[#606470] dark:text-[#9aa0ae]'
                }`}
              >
                Active ({dateTodos.length - completedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors min-h-[34px] ${
                  filter === 'completed'
                    ? 'bg-[#fdfcf9] dark:bg-[#1a1b20] text-[#1f2126] dark:text-[#eceef2] font-semibold shadow-2xs'
                    : 'text-[#606470] dark:text-[#9aa0ae]'
                }`}
              >
                Done ({completedCount})
              </button>
            </div>

            <span className="text-[11px] text-[#8c909c] hidden sm:inline">
              Touch & hold item to select · Tap checkbox to check/uncheck
            </span>
          </div>

          {/* To-Dos List */}
          <div className="space-y-2">
            {filteredTodos.length === 0 ? (
              <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-dashed border-[#e5e2da] dark:border-[#292b34] rounded-2xl p-8 text-center">
                <Flame className="w-8 h-8 text-[#8c909c] mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-medium text-[#1f2126] dark:text-[#eceef2]">
                  {filter === 'completed'
                    ? 'No completed tasks yet. Finish a task above!'
                    : 'No tasks on this day’s to-do list.'}
                </p>
              </div>
            ) : (
              filteredTodos.map((todo) => {
                const isEditing = editingId === todo.id;
                const isSelected = selectedTodoIds.has(todo.id);
                const catColor = getCategoryColor(todo.category);

                return (
                  <div
                    key={todo.id}
                    onTouchStart={(e) => startHoldDetection(todo.id, e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchMove={(e) => handleTouchMoveDetection(e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchEnd={cancelHoldDetection}
                    onTouchCancel={cancelHoldDetection}
                    onMouseDown={(e) => {
                      if (e.button === 0) startHoldDetection(todo.id, e.clientX, e.clientY);
                    }}
                    onMouseMove={(e) => handleTouchMoveDetection(e.clientX, e.clientY)}
                    onMouseUp={cancelHoldDetection}
                    onClick={() => {
                      if (holdTriggeredRef.current) {
                        holdTriggeredRef.current = false;
                        return;
                      }
                      if (isSelectionMode || selectedTodoIds.size > 0) {
                        toggleTodoSelection(todo.id);
                      }
                    }}
                    className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all select-none ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/70 dark:bg-blue-950/30'
                        : todo.isCompleted
                        ? 'bg-[#f4f2ec]/60 dark:bg-[#15161a] border-[#e5e2da] dark:border-[#292b34] opacity-60'
                        : 'bg-[#fdfcf9] dark:bg-[#1a1b20] border-[#e5e2da] dark:border-[#292b34] hover:border-[#cfcbc2] shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
                      {/* Selection Checkbox */}
                      {(isSelectionMode || selectedTodoIds.size > 0) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTodoSelection(todo.id);
                          }}
                          className="w-10 h-10 min-w-[40px] min-h-[40px] text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 rounded-lg hover:bg-blue-500/10"
                          aria-label={isSelected ? 'Deselect to-do' : 'Select to-do'}
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

                      {/* Completion Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTodoComplete(todo.id);
                        }}
                        className="text-[#8c909c] hover:text-emerald-600 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-1"
                        aria-label={todo.isCompleted ? 'Mark incomplete' : 'Mark finished'}
                      >
                        {todo.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      {/* Text / Editable text */}
                      {isEditing ? (
                        <div
                          className="flex items-center gap-2 flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            maxLength={300}
                            className="flex-1 px-2.5 py-1 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-blue-500 rounded-lg text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden min-h-[38px]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(todo.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md min-h-[38px] min-w-[38px] flex items-center justify-center"
                            aria-label="Save todo text"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            if (!isSelectionMode && selectedTodoIds.size === 0) {
                              handleStartEdit(todo.id, todo.text);
                            }
                          }}
                          className={`text-xs sm:text-sm cursor-pointer flex-1 min-w-0 break-words py-1 ${
                            todo.isCompleted
                              ? 'line-through text-[#8c909c]'
                              : 'text-[#1f2126] dark:text-[#eceef2] font-medium'
                          }`}
                        >
                          {todo.text}
                        </div>
                      )}
                    </div>

                    {/* Category Tag, Priority & Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Interactive Category Badge */}
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCategoryPickerTodoId(
                              activeCategoryPickerTodoId === todo.id ? null : todo.id
                            );
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 cursor-pointer transition-colors"
                          style={{
                            borderColor: `${catColor}40`,
                            backgroundColor: `${catColor}15`,
                            color: catColor,
                          }}
                          title={
                            selectedTodoIds.has(todo.id)
                              ? isAllSameCategory
                                ? `Change category for all ${selectedTodoIds.size} selected to-dos`
                                : 'Selected to-dos have mixed categories (only this to-do will update)'
                              : 'Change category'
                          }
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>{todo.category || 'General'}</span>
                        </button>

                        {/* Category Dropdown */}
                        {activeCategoryPickerTodoId === todo.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 w-44 p-1.5 bg-[#2a2d36] text-white dark:bg-[#ffffff] dark:text-[#121317] border border-[#444857] dark:border-[#e5e2da] rounded-xl shadow-2xl z-50 text-[11px] space-y-0.5 animate-in fade-in"
                          >
                            <div className="px-2 py-1 text-[9px] font-bold text-[#8c909c] uppercase tracking-wider">
                              {selectedTodoIds.has(todo.id) && isAllSameCategory
                                ? `Set all (${selectedTodoIds.size}) to:`
                                : 'Change Category to:'}
                            </div>
                            <div className="max-h-36 overflow-y-auto space-y-0.5">
                              {TODO_CATEGORIES.map((cat) => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => handleTodoChangeCategory(todo.id, cat.name)}
                                  className="w-full text-left px-2 py-1 rounded-md hover:bg-white/10 dark:hover:bg-black/10 flex items-center justify-between gap-1.5"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{ backgroundColor: cat.color }}
                                    />
                                    <span className="truncate">{cat.name}</span>
                                  </div>
                                  {(todo.category || 'General').toLowerCase() ===
                                    cat.name.toLowerCase() && (
                                    <Check className="w-3 h-3 text-blue-400" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8c909c]">
                        {todo.priority}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTodo(todo.id);
                        }}
                        className="p-1.5 text-[#8c909c] hover:text-red-500 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Delete to-do"
                        aria-label="Delete to-do"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Batch Task Action Bar */}
      <BatchTaskActionBar
        selectedCount={selectedTodoIds.size}
        onBatchToggleComplete={handleBatchToggleComplete}
        onBatchDelete={handleBatchDelete}
        onClearSelection={handleClearSelection}
        isAllSameCategory={isAllSameCategory}
        currentCategoryName={currentCategoryName}
        currentCategoryColor={currentCategoryColor}
        availableCategories={TODO_CATEGORIES}
        onSelectCategory={handleBatchUpdateCategory}
        categoryLabel="Category"
      />
    </div>
  );
}
