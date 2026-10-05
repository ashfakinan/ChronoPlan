import React, { useState, useEffect } from 'react';
import { X, Trash2, Tag, Calendar } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { ImportantNote, NoteTag } from '../types';
import { getTodayISO } from '../utils/dateUtils';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: ImportantNote | null;
}

const TAG_OPTIONS: NoteTag[] = ['Exam', 'Deadline', 'Reminder', 'Goal', 'Important', 'General'];

export function NoteModal({ isOpen, onClose, noteToEdit }: NoteModalProps) {
  const { createNote, updateNote, deleteNote } = usePlanner();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState<NoteTag>('Exam');
  const [date, setDate] = useState(getTodayISO());

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content || '');
      setTag(noteToEdit.tag);
      setDate(noteToEdit.date);
    } else {
      setTitle('');
      setContent('');
      setTag('Exam');
      setDate(getTodayISO());
    }
  }, [noteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    if (noteToEdit) {
      await updateNote(noteToEdit.id, {
        title: title.trim(),
        content: content.trim(),
        tag,
        date,
      });
    } else {
      await createNote(title.trim(), content.trim(), tag, date);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!noteToEdit) return;
    await deleteNote(noteToEdit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#fdfcf9] dark:bg-[#1a1b20] text-amber-700 dark:text-amber-400 flex items-center justify-center border border-[#e5e2da] dark:border-[#292b34]">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1f2126] dark:text-[#eceef2]">
                {noteToEdit ? 'Edit Note' : 'New Important Note'}
              </h3>
              <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                Tag deadlines, exams, and key reminders
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g. Physics Midterm Examination"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden min-h-[44px]"
            />
          </div>

          {/* Tag Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all min-h-[36px] ${
                    tag === t
                      ? 'bg-[#1f2126] text-[#fdfcf9] border-[#1f2126] dark:bg-[#eceef2] dark:text-[#121317] dark:border-[#eceef2]'
                      : 'bg-[#f4f2ec] dark:bg-[#22242b] border-[#e5e2da] dark:border-[#292b34] text-[#606470] dark:text-[#9aa0ae]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#8c909c]" />
              Event / Due Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] focus:outline-hidden min-h-[44px]"
            />
          </div>

          {/* Details / Content */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider mb-1">
              Details
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Bring scientific calculator and student ID."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f8f6f1] dark:bg-[#15161a] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#e5e2da] dark:border-[#292b34]">
            {noteToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Delete note"
                aria-label="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#606470] dark:text-[#9aa0ae] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-xl transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors min-h-[44px]"
              >
                {noteToEdit ? 'Save Changes' : 'Create Note'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
