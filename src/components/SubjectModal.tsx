import React, { useState } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';

const PRESET_COLORS = [
  '#3B68A0', // Slate Blue
  '#3E7B62', // Sage Moss
  '#6E5A8E', // Heather Purple
  '#A86532', // Dusty Terracotta
  '#B84A4A', // Muted Crimson
  '#2E7979', // Deep Teal
  '#4A6B82', // Steel Blue
  '#8A6B3A', // Olive Bronze
  '#5C6B73', // Charcoal Slate
  '#9E5779', // Rosewood
];

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubjectModal({ isOpen, onClose }: SubjectModalProps) {
  const { subjects, createSubject, updateSubject, deleteSubject } = usePlanner();
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [customHex, setCustomHex] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalColor = customHex.trim() || color;
    if (editingId) {
      await updateSubject(editingId, { name: name.trim(), color: finalColor });
      setEditingId(null);
    } else {
      await createSubject(name, finalColor);
    }
    setName('');
    setCustomHex('');
  };

  const startEdit = (subj: { id: string; name: string; color: string }) => {
    setEditingId(subj.id);
    setName(subj.name);
    setColor(subj.color);
    setCustomHex(subj.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setCustomHex('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b]">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1f2126] dark:text-[#eceef2]">
              Manage Subjects
            </h3>
            <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
              Assign calm color codes to your courses or projects
            </p>
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Add / Edit Form */}
          <form onSubmit={handleCreate} className="space-y-3 bg-[#f8f6f1] dark:bg-[#15161a] p-3.5 rounded-xl border border-[#e5e2da] dark:border-[#292b34]">
            <div className="text-[11px] font-semibold text-[#8c909c] uppercase tracking-wider">
              {editingId ? 'Edit Subject' : 'Add Subject'}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1f2126] dark:text-[#eceef2] mb-1">
                Subject Name
              </label>
              <input
                type="text"
                placeholder="e.g. Physics, Chemistry, Literature"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-1 focus:ring-blue-500 min-h-[40px]"
              />
            </div>

            {/* Color selection */}
            <div>
              <label className="block text-xs font-medium text-[#1f2126] dark:text-[#eceef2] mb-1.5">
                Assign Color
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setColor(c);
                      setCustomHex('');
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 relative"
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  >
                    {color === c && !customHex && (
                      <Check className="w-4 h-4 text-white drop-shadow-xs stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customHex || color}
                  onChange={(e) => {
                    setColor(e.target.value);
                    setCustomHex(e.target.value);
                  }}
                  className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  placeholder="#HEX code"
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    if (e.target.value.startsWith('#') && e.target.value.length === 7) {
                      setColor(e.target.value);
                    }
                  }}
                  className="px-2.5 py-1 text-xs bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-md text-[#1f2126] dark:text-[#eceef2] w-28 uppercase font-mono min-h-[34px]"
                />
                <span className="text-[11px] text-[#8c909c]">custom</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-xs text-[#606470] dark:text-[#9aa0ae] rounded-lg min-h-[36px]"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 min-h-[36px]"
              >
                {editingId ? 'Save' : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Add
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Subjects list */}
          <div>
            <div className="text-[11px] font-semibold text-[#8c909c] uppercase tracking-wider mb-2">
              Current Subjects ({subjects.length})
            </div>
            {subjects.length === 0 ? (
              <p className="text-xs text-[#8c909c] text-center py-4">No subjects added.</p>
            ) : (
              <div className="space-y-1.5">
                {subjects.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34]"
                  >
                    <div
                      className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                      onClick={() => startEdit(s)}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-xs sm:text-sm font-medium text-[#1f2126] dark:text-[#eceef2] truncate">
                        {s.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="px-2 py-1 text-xs text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] rounded-md min-h-[36px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSubject(s.id)}
                        className="p-1.5 text-[#8c909c] hover:text-red-500 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Delete subject"
                        aria-label="Delete subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-[#1f2126] text-[#fdfcf9] hover:bg-[#343842] dark:bg-[#eceef2] dark:text-[#121317] dark:hover:bg-[#d8dbe2] rounded-xl transition-colors min-h-[40px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
