import React, { useState } from 'react';
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
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { getTodayISO, addDays, formatFullDate, getYesterdayISO } from '../utils/dateUtils';
import { Priority } from '../types';

export function DailyTodoTab() {
  const {
    todos,
    createTodo,
    toggleTodoComplete,
    updateTodo,
    deleteTodo,
    rolloverUnfinishedTodos,
  } = usePlanner();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [inputText, setInputText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Items for selected date
  const dateTodos = todos.filter((t) => t.date === selectedDate);
  const completedCount = dateTodos.filter((t) => t.isCompleted).length;
  const progressPercent = dateTodos.length > 0 ? Math.round((completedCount / dateTodos.length) * 100) : 0;

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
    await createTodo(inputText.trim(), selectedDate, priority);
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

  return (
    <div className="flex-1 bg-[#f8f6f1] dark:bg-[#121317] p-3 sm:p-6 overflow-y-auto h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] pb-20 md:pb-6">
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
                Check off items when finished, uncheck if incomplete. Persisted to cloud.
              </p>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-1 bg-[#f4f2ec] dark:bg-[#22242b] p-1 rounded-xl border border-[#e5e2da] dark:border-[#292b34]">
              <button
                type="button"
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Previous Day"
                aria-label="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayISO())}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors min-h-[38px] ${
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
                className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
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

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
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
            Tap checkbox to check / uncheck
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

              return (
                <div
                  key={todo.id}
                  className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    todo.isCompleted
                      ? 'bg-[#f4f2ec]/60 dark:bg-[#15161a] border-[#e5e2da] dark:border-[#292b34] opacity-60'
                      : 'bg-[#fdfcf9] dark:bg-[#1a1b20] border-[#e5e2da] dark:border-[#292b34] hover:border-[#cfcbc2] shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleTodoComplete(todo.id)}
                      className="text-[#8c909c] hover:text-emerald-600 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
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
                      <div className="flex items-center gap-2 flex-1">
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
                        onClick={() => handleStartEdit(todo.id, todo.text)}
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

                  {/* Priority & Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8c909c]">
                      {todo.priority}
                    </span>

                    <button
                      type="button"
                      onClick={() => deleteTodo(todo.id)}
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
  );
}
