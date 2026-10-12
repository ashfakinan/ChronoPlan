import React, { useState, useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { StudyMonth, StudySubject, StudyChapter } from './types';

interface StudyPlanChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  months: StudyMonth[];
  subjects: StudySubject[];
  editingChapter?: {
    monthId: string;
    subjectKey: string;
    chapter: StudyChapter;
  } | null;
  initialMonthId?: string;
  initialSubjectKey?: string;
  onSave: (
    monthId: string,
    subjectKey: string,
    paper: string,
    number: string,
    name: string,
    chapterId?: string,
    oldMonthId?: string,
    oldSubjectKey?: string
  ) => void;
}

export function StudyPlanChapterModal({
  isOpen,
  onClose,
  months,
  subjects,
  editingChapter,
  initialMonthId,
  initialSubjectKey,
  onSave,
}: StudyPlanChapterModalProps) {
  const [targetMonthId, setTargetMonthId] = useState<string>('');
  const [targetSubjectKey, setTargetSubjectKey] = useState<string>('');
  const [paper, setPaper] = useState<string>('1st');
  const [number, setNumber] = useState<string>('');
  const [name, setName] = useState<string>('');

  useEffect(() => {
    if (editingChapter) {
      setTargetMonthId(editingChapter.monthId);
      setTargetSubjectKey(editingChapter.subjectKey);
      setPaper(editingChapter.chapter.p || '1st');
      setNumber(editingChapter.chapter.c !== undefined ? String(editingChapter.chapter.c) : '');
      setName(editingChapter.chapter.name || editingChapter.chapter.title || '');
    } else {
      setTargetMonthId(initialMonthId || months[0]?.id || 'm1');
      setTargetSubjectKey(initialSubjectKey || subjects[0]?.key || 'phy');
      setPaper('1st');
      setNumber('');
      setName('');
    }
  }, [editingChapter, initialMonthId, initialSubjectKey, months, subjects, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !number.trim()) return;

    if (editingChapter) {
      onSave(
        targetMonthId,
        targetSubjectKey,
        paper,
        number,
        name,
        editingChapter.chapter.id,
        editingChapter.monthId,
        editingChapter.subjectKey
      );
    } else {
      onSave(targetMonthId, targetSubjectKey, paper, number, name);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-sm text-[#1f2126] dark:text-[#eceef2]">
              {editingChapter ? 'Edit Chapter Topic' : 'Add Chapter Topic'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Target Month */}
            <div>
              <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1">
                Month
              </label>
              <select
                value={targetMonthId}
                onChange={(e) => setTargetMonthId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2]"
              >
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    Month {m.n} ({m.label})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Subject */}
            <div>
              <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1">
                Subject
              </label>
              <select
                value={targetSubjectKey}
                onChange={(e) => setTargetSubjectKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2]"
              >
                {subjects.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Paper (1st / 2nd / Custom) */}
            <div>
              <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1">
                Paper / Part
              </label>
              <input
                type="text"
                placeholder="e.g. 1st or 2nd"
                value={paper}
                onChange={(e) => setPaper(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2]"
              />
            </div>

            {/* Chapter Number */}
            <div>
              <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1">
                Chapter No.
              </label>
              <input
                type="text"
                placeholder="e.g. 1, 2, 3..."
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2]"
              />
            </div>
          </div>

          {/* Chapter Name */}
          <div>
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1">
              Chapter / Topic Name
            </label>
            <input
              type="text"
              placeholder="e.g. Thermodynamics, Vectors, Organic Chemistry..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e5e2da] dark:border-[#292b34]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#606470] dark:text-[#9aa0ae] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
            >
              {editingChapter ? 'Save Changes' : 'Add Chapter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
