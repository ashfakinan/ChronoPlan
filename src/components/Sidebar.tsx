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
  Trash2,
  Type,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { NoteTag, ImportantNote, FixedSchedule } from '../types';
import { formatShortDate } from '../utils/dateUtils';
import { NoteModal } from './NoteModal';
import { ScheduleModal } from './ScheduleModal';

interface SidebarProps {
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isOpenOnMobile, onCloseMobile }: SidebarProps) {
  const {
    notes,
    toggleNoteDone,
    schedules,
    createSchedule,
    updateSchedule,
    renameSchedule,
    deleteSchedule,
    activePlanner,
  } = usePlanner();

  const [activeTagFilter, setActiveTagFilter] = useState<string>('All');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<ImportantNote | null>(null);

  // Schedules state & modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<FixedSchedule | null>(null);

  // Quick inline text editing
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [inlineScheduleText, setInlineScheduleText] = useState('');

  // Quick inline rename
  const [renamingScheduleId, setRenamingScheduleId] = useState<string | null>(null);
  const [inlineRenameText, setInlineRenameText] = useState('');

  // Delete confirmation
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);

  // Collapse states for sidebar sections
  const [isNotesExpanded, setIsNotesExpanded] = useState(true);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(true);

  const dayParts = activePlanner?.dayParts || ['Morning', 'Afternoon', 'Evening', 'Night', 'Self Study'];

  // Filtered notes
  const filteredNotes = notes.filter((n) => {
    if (activeTagFilter === 'All') return true;
    return n.tag === activeTagFilter;
  });

  const handleStartInlineEdit = (sched: FixedSchedule) => {
    setEditingScheduleId(sched.id);
    setInlineScheduleText(sched.text || '');
  };

  const handleSaveInlineText = async (schedId: string) => {
    await updateSchedule(schedId, { text: inlineScheduleText.trim() });
    setEditingScheduleId(null);
  };

  const handleStartInlineRename = (sched: FixedSchedule) => {
    setRenamingScheduleId(sched.id);
    setInlineRenameText(sched.dayPart || '');
  };

  const handleSaveInlineRename = async (schedId: string) => {
    const trimmed = inlineRenameText.trim();
    if (trimmed) {
      await renameSchedule(schedId, trimmed);
    }
    setRenamingScheduleId(null);
  };

  const handleDeleteSchedule = async (schedId: string) => {
    await deleteSchedule(schedId);
    setDeletingScheduleId(null);
  };

  const handleSeedFromDayParts = async () => {
    for (const dp of dayParts) {
      const exists = schedules.some((s) => s.dayPart.toLowerCase() === dp.toLowerCase());
      if (!exists) {
        await createSchedule(dp, `Fixed routine for ${dp}`);
      }
    }
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
            <span>Fixed Schedule Plans ({schedules.length})</span>
            {isScheduleExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#8c909c]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#8c909c]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setScheduleToEdit(null);
              setIsScheduleModalOpen(true);
            }}
            className="px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-1 min-h-[40px]"
            title="Add a new custom schedule plan"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Plan</span>
          </button>
        </div>

        {isScheduleExpanded && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[#606470] dark:text-[#9aa0ae]">
              <span>Your fixed daily routines and time blocks:</span>
              {schedules.length === 0 && (
                <button
                  type="button"
                  onClick={handleSeedFromDayParts}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Import Day-Parts
                </button>
              )}
            </div>

            {/* Schedules List */}
            <div className="space-y-2.5">
              {schedules.length === 0 ? (
                <div className="text-center py-6 px-3 border border-dashed border-[#e5e2da] dark:border-[#292b34] rounded-xl space-y-2">
                  <Clock className="w-6 h-6 text-[#8c909c] mx-auto opacity-60" />
                  <p className="text-xs font-semibold text-[#1f2126] dark:text-[#eceef2]">
                    No Fixed Plans Yet
                  </p>
                  <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                    Add your morning routine, workout block, deep study sessions, or evening plans.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleToEdit(null);
                      setIsScheduleModalOpen(true);
                    }}
                    className="mt-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1 min-h-[38px]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create First Plan
                  </button>
                </div>
              ) : (
                schedules.map((sched) => {
                  const isEditingText = editingScheduleId === sched.id;
                  const isRenaming = renamingScheduleId === sched.id;
                  const isConfirmingDelete = deletingScheduleId === sched.id;

                  return (
                    <div
                      key={sched.id}
                      className="p-3 rounded-xl border border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9] dark:bg-[#1a1b20] hover:border-[#cfcbc2] dark:hover:border-[#3b3e4a] shadow-2xs transition-all text-xs space-y-2"
                    >
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between gap-1.5 min-h-[28px]">
                        {/* Plan Name or Inline Rename Input */}
                        {isRenaming ? (
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <input
                              type="text"
                              value={inlineRenameText}
                              onChange={(e) => setInlineRenameText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineRename(sched.id);
                                if (e.key === 'Escape') setRenamingScheduleId(null);
                              }}
                              className="flex-1 px-2 py-0.5 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#cfcbc2] dark:border-[#3b3e4a] rounded-md text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-semibold"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveInlineRename(sched.id)}
                              className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                              title="Save name"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenamingScheduleId(null)}
                              className="p-1 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2]"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                            <span className="font-bold text-[#1f2126] dark:text-[#eceef2] flex items-center gap-1.5 truncate">
                              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="truncate">{sched.dayPart}</span>
                            </span>

                            {sched.timeRange && (
                              <span className="px-1.5 py-0.2 text-[10px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 rounded-md shrink-0">
                                {sched.timeRange}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Card Action Buttons */}
                        {!isRenaming && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-red-600 font-semibold">Delete?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSchedule(sched.id)}
                                  className="px-1.5 py-0.5 text-[10px] bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 min-h-[26px]"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingScheduleId(null)}
                                  className="px-1.5 py-0.5 text-[10px] text-[#8c909c] hover:text-[#1f2126] min-h-[26px]"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <>
                                {/* Quick Rename */}
                                <button
                                  type="button"
                                  onClick={() => handleStartInlineRename(sched)}
                                  className="p-1 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-md transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                                  title="Rename plan"
                                  aria-label={`Rename ${sched.dayPart}`}
                                >
                                  <Type className="w-3 h-3" />
                                </button>

                                {/* Edit Full Modal */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setScheduleToEdit(sched);
                                    setIsScheduleModalOpen(true);
                                  }}
                                  className="p-1 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-md transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                                  title="Edit plan details & time"
                                  aria-label={`Edit ${sched.dayPart}`}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => setDeletingScheduleId(sched.id)}
                                  className="p-1 text-[#8c909c] hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                                  title="Remove plan"
                                  aria-label={`Remove ${sched.dayPart}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Routine Details Text Area / Display */}
                      {isEditingText ? (
                        <div className="space-y-1.5 pt-1">
                          <textarea
                            rows={3}
                            value={inlineScheduleText}
                            onChange={(e) => setInlineScheduleText(e.target.value)}
                            placeholder="Write fixed routine for this plan..."
                            maxLength={2000}
                            className="w-full p-2 bg-[#f4f2ec] dark:bg-[#22242b] border border-[#cfcbc2] dark:border-[#3b3e4a] rounded-lg text-[#1f2126] dark:text-[#eceef2] text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingScheduleId(null)}
                              className="px-2 py-1 text-[11px] text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] min-h-[30px]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveInlineText(sched.id)}
                              className="px-2.5 py-1 text-[11px] bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold flex items-center gap-1 min-h-[30px]"
                            >
                              <Check className="w-3 h-3" /> Save Text
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartInlineEdit(sched)}
                          className="cursor-pointer group/text pt-0.5"
                          title="Click to edit routine text"
                        >
                          {sched.text ? (
                            <p className="whitespace-pre-wrap leading-relaxed text-[#606470] dark:text-[#9aa0ae] group-hover/text:text-[#1f2126] dark:group-hover/text-[#eceef2] transition-colors">
                              {sched.text}
                            </p>
                          ) : (
                            <span className="italic text-[#8c909c] text-[11px] hover:underline">
                              Tap to write routine for {sched.dayPart}...
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Note Modal */}
      <NoteModal
        isOpen={isNoteModalOpen}
        noteToEdit={noteToEdit}
        onClose={() => {
          setIsNoteModalOpen(false);
          setNoteToEdit(null);
        }}
      />

      {/* Schedule Plan Modal (Create & Edit) */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        scheduleToEdit={scheduleToEdit}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleToEdit(null);
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
