import React, { useState } from 'react';
import {
  Tag,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  Edit2,
  Check,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { NoteTag, ImportantNote } from '../types';
import { formatShortDate } from '../utils/dateUtils';
import { NoteModal } from './NoteModal';

interface SidebarProps {
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isOpenOnMobile, onCloseMobile }: SidebarProps) {
  const {
    notes,
    toggleNoteDone,
    schedules,
    saveScheduleForDayPart,
    activePlanner,
  } = usePlanner();

  const [activeTagFilter, setActiveTagFilter] = useState<string>('All');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<ImportantNote | null>(null);

  // Schedules state
  const [editingDayPart, setEditingDayPart] = useState<string | null>(null);
  const [scheduleText, setScheduleText] = useState('');

  // Collapse states for sidebar sections
  const [isNotesExpanded, setIsNotesExpanded] = useState(true);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(true);

  const dayParts = activePlanner?.dayParts || ['Morning', 'Afternoon', 'Evening', 'Night', 'Self Study'];

  // Filtered notes
  const filteredNotes = notes.filter((n) => {
    if (activeTagFilter === 'All') return true;
    return n.tag === activeTagFilter;
  });

  const handleStartEditSchedule = (dayPart: string, currentText: string) => {
    setEditingDayPart(dayPart);
    setScheduleText(currentText);
  };

  const handleSaveSchedule = async (dayPart: string) => {
    await saveScheduleForDayPart(dayPart, scheduleText.trim());
    setEditingDayPart(null);
  };

  const tagsList: ('All' | NoteTag)[] = ['All', 'Exam', 'Deadline', 'Reminder', 'Goal', 'Important'];

  const content = (
    <div className="flex-1 overflow-y-auto divide-y divide-[#e5e2da] dark:divide-[#292b34]">
      {/* 1. Important Notes Section */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsNotesExpanded(!isNotesExpanded)}
            className="flex items-center gap-2 text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider hover:text-blue-600 transition-colors min-h-[40px]"
          >
            <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Important Notes ({notes.length})</span>
            {isNotesExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#8c909c]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8c909c]" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setNoteToEdit(null);
              setIsNoteModalOpen(true);
            }}
            className="px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-1 min-h-[40px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {isNotesExpanded && (
          <>
            {/* Tag Filter Pills */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              {tagsList.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTagFilter(tag)}
                  className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors min-h-[34px] ${
                    activeTagFilter === tag
                      ? 'bg-[#1f2126] text-[#fdfcf9] dark:bg-[#eceef2] dark:text-[#121317] font-semibold'
                      : 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#606470] dark:text-[#9aa0ae] hover:bg-[#e5e2da] dark:hover:bg-[#292b34]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Notes List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-[#e5e2da] dark:border-[#292b34] rounded-xl">
                  <p className="text-xs text-[#8c909c]">No notes found.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNoteToEdit(null);
                      setIsNoteModalOpen(true);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 font-medium"
                  >
                    + Add a note or deadline
                  </button>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  return (
                    <div
                      key={note.id}
                      className={`group p-3 rounded-xl border transition-all ${
                        note.isDone
                          ? 'bg-[#f8f6f1] dark:bg-[#15161a] border-[#e5e2da] dark:border-[#292b34] opacity-60'
                          : 'bg-[#fdfcf9] dark:bg-[#1a1b20] border-[#e5e2da] dark:border-[#292b34] hover:border-[#cfcbc2] dark:hover:border-[#3b3e4a] shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleNoteDone(note.id)}
                          className="mt-0.5 text-[#8c909c] hover:text-emerald-600 transition-colors shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center -ml-1.5"
                          aria-label={note.isDone ? 'Mark incomplete' : 'Mark done'}
                        >
                          {note.isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div
                          className="flex-1 min-w-0 cursor-pointer pt-0.5"
                          onClick={() => {
                            setNoteToEdit(note);
                            setIsNoteModalOpen(true);
                          }}
                        >
                          <div
                            className={`text-xs font-semibold leading-tight ${
                              note.isDone
                                ? 'line-through text-[#8c909c]'
                                : 'text-[#1f2126] dark:text-[#eceef2]'
                            }`}
                          >
                            {note.title}
                          </div>
                          {note.content && (
                            <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae] mt-1 line-clamp-2 leading-relaxed">
                              {note.content}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setNoteToEdit(note);
                            setIsNoteModalOpen(true);
                          }}
                          className="p-1.5 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] transition-colors"
                          aria-label="Edit note"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Clean Unboxed Metadata */}
                      <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-[#f4f2ec] dark:border-[#22242b] text-[11px] text-[#8c909c]">
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          {note.tag}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatShortDate(note.date)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* 2. Schedule Section */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
            className="flex items-center gap-2 text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider hover:text-blue-600 transition-colors min-h-[40px]"
          >
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Fixed Schedule Plans</span>
            {isScheduleExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#8c909c]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8c909c]" />}
          </button>
          <span className="text-[11px] text-[#8c909c]">Routine</span>
        </div>

        {isScheduleExpanded && (
          <div className="space-y-3">
            <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
              Your fixed routines and plans per day-part:
            </p>

            <div className="space-y-2">
              {dayParts.map((part) => {
                const saved = schedules.find((s) => s.dayPart === part);
                const isEditing = editingDayPart === part;

                return (
                  <div
                    key={part}
                    className="p-3 rounded-xl border border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20] text-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-[#1f2126] dark:text-[#eceef2] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        {part}
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveSchedule(part)}
                            className="px-2.5 py-1 text-[11px] bg-blue-600 text-white rounded-md flex items-center gap-0.5 font-medium hover:bg-blue-700 min-h-[32px]"
                          >
                            <Check className="w-3 h-3" /> Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDayPart(null)}
                            className="px-2 py-1 text-[11px] text-[#8c909c] hover:text-[#1f2126] min-h-[32px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEditSchedule(part, saved?.text || '')}
                          className="p-1.5 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                          aria-label={`Edit ${part} schedule`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={scheduleText}
                        onChange={(e) => setScheduleText(e.target.value)}
                        placeholder="e.g. 07:30 Wakeup & Deep Focus Study"
                        maxLength={2000}
                        className="w-full p-2 bg-[#f4f2ec] dark:bg-[#22242b] border border-[#cfcbc2] dark:border-[#3b3e4a] rounded-lg text-[#1f2126] dark:text-[#eceef2] text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                      />
                    ) : (
                      <div
                        onClick={() => handleStartEditSchedule(part, saved?.text || '')}
                        className="cursor-pointer text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] transition-colors"
                      >
                        {saved?.text ? (
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {saved.text}
                          </p>
                        ) : (
                          <span className="italic text-[#8c909c] text-[11px]">
                            Tap to write routine for {part}...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <NoteModal
        isOpen={isNoteModalOpen}
        noteToEdit={noteToEdit}
        onClose={() => {
          setIsNoteModalOpen(false);
          setNoteToEdit(null);
        }}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-80 shrink-0 border-r border-[#e5e2da] dark:border-[#292b34] bg-[#f8f6f1] dark:bg-[#121317] flex-col h-[calc(100vh-4rem)] overflow-hidden">
        {content}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenOnMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-xs bg-[#f8f6f1] dark:bg-[#121317] h-full shadow-2xl flex flex-col z-10 border-r border-[#e5e2da] dark:border-[#292b34] animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#e5e2da] dark:border-[#292b34] flex items-center justify-between bg-[#fdfcf9] dark:bg-[#1a1b20]">
              <span className="text-sm font-bold text-[#1f2126] dark:text-[#eceef2]">
                Notes & Daily Routine
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-2 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close notes drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {content}
          </div>
        </div>
      )}
    </>
  );
}
