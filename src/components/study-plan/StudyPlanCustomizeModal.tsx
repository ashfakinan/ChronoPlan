import React, { useState, useEffect } from 'react';
import { X, Settings, Plus, Trash2 } from 'lucide-react';
import { StudyPlanConfig, StudySubject, StudyMonth } from './types';

interface StudyPlanCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StudyPlanConfig;
  onSave: (
    newTitle: string,
    newSubtitle: string,
    newSubjects: StudySubject[],
    newMonths: StudyMonth[]
  ) => void;
}

export function StudyPlanCustomizeModal({
  isOpen,
  onClose,
  config,
  onSave,
}: StudyPlanCustomizeModalProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [months, setMonths] = useState<StudyMonth[]>([]);

  // New subject inline input
  const [newSubLabel, setNewSubLabel] = useState('');
  const [newSubColor, setNewSubColor] = useState('#3B82F6');

  useEffect(() => {
    if (config) {
      setTitle(config.title);
      setSubtitle(config.subtitle);
      setSubjects([...config.subjects]);
      setMonths([...config.months]);
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleAddSubject = () => {
    if (!newSubLabel.trim()) return;
    const key = newSubLabel.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || `sub_${Date.now()}`;
    const newSub: StudySubject = {
      key,
      label: newSubLabel.trim(),
      color: newSubColor,
    };
    setSubjects((prev) => [...prev, newSub]);
    setNewSubLabel('');
  };

  const handleRemoveSubject = (key: string) => {
    if (subjects.length <= 1) {
      alert('You must keep at least one subject.');
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.key !== key));
  };

  const handleAddMonth = () => {
    const nextN = months.length + 1;
    const newMonth: StudyMonth = {
      id: `m${nextN}_${Date.now()}`,
      n: nextN,
      label: `Month ${nextN}`,
      subjectsData: {},
    };
    setMonths((prev) => [...prev, newMonth]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(title, subtitle, subjects, months);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-sm text-[#1f2126] dark:text-[#eceef2]">
              Customize Study Plan Settings
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Plan Title & Subtitle */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1">
                Plan Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-1">
                Plan Subtitle / Description
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2]"
              />
            </div>
          </div>

          {/* Subjects Management */}
          <div className="pt-2 border-t border-[#e5e2da] dark:border-[#292b34]">
            <label className="block text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] mb-2">
              Subjects ({subjects.length})
            </label>
            <div className="space-y-2 mb-3">
              {subjects.map((sub) => (
                <div
                  key={sub.key}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#f8f6f1] dark:bg-[#20222a] border border-[#e5e2da] dark:border-[#292b34]"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={sub.color}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setSubjects((prev) =>
                          prev.map((s) => (s.key === sub.key ? { ...s, color: newColor } : s))
                        );
                      }}
                      className="w-6 h-6 rounded-md border-0 cursor-pointer bg-transparent"
                    />
                    <span className="text-xs font-semibold text-[#1f2126] dark:text-[#eceef2]">
                      {sub.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub.key)}
                    className="p-1 text-[#8c909c] hover:text-red-600 rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subject row */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newSubColor}
                onChange={(e) => setNewSubColor(e.target.value)}
                className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                placeholder="New subject name..."
                value={newSubLabel}
                onChange={(e) => setNewSubLabel(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl text-[#1f2126] dark:text-[#eceef2]"
              />
              <button
                type="button"
                onClick={handleAddSubject}
                className="px-3 py-1.5 text-xs font-semibold bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Months Count & Add Month */}
          <div className="pt-2 border-t border-[#e5e2da] dark:border-[#292b34] flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#1f2126] dark:text-[#eceef2]">
                Total Duration
              </div>
              <div className="text-[11px] text-[#8c909c]">
                Currently configured with {months.length} months
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddMonth}
              className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl hover:bg-blue-100 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Next Month</span>
            </button>
          </div>

          {/* Action buttons */}
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
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
