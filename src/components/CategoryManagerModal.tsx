import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Tag, Palette } from 'lucide-react';
import { useMadness } from '../context/MadnessContext';
import { MadnessCategory } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Slate', hex: '#64748B' },
];

export function CategoryManagerModal({ isOpen, onClose }: CategoryManagerModalProps) {
  const { categories, addCategory, updateCategory, deleteCategory, tasks } = useMadness();

  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].hex);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setErrorMsg('Category name cannot be empty');
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('A category with this name already exists');
      return;
    }

    await addCategory(trimmed, selectedColor);
    setNewCatName('');
  };

  const handleStartEdit = (cat: MadnessCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const handleSaveEdit = async (catId: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    await updateCategory(catId, { name: trimmed, color: editColor });
    setEditingId(null);
  };

  const handleDelete = async (catId: string) => {
    await deleteCategory(catId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1f2126] dark:text-[#eceef2]">
                Manage Categories
              </h2>
              <p className="text-xs text-[#606470] dark:text-[#9aa0ae]">
                Create and customize categories for your Scattered Weekly tasks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Add New Category Form */}
          <form onSubmit={handleCreate} className="space-y-3 bg-[#f8f6f1] dark:bg-[#121317] p-4 rounded-xl border border-[#e5e2da] dark:border-[#292b34]">
            <h3 className="text-xs font-bold text-[#1f2126] dark:text-[#eceef2] uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Add New Category
            </h3>

            <div>
              <label className="block text-xs text-[#606470] dark:text-[#9aa0ae] mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="e.g. Side Hustle, Deep Work, House Chores"
                className="w-full px-3 py-2 text-sm bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] placeholder-[#8c909c] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              {errorMsg && <p className="text-xs text-rose-500 mt-1">{errorMsg}</p>}
            </div>

            {/* Color Palette Selector */}
            <div>
              <label className="block text-xs text-[#606470] dark:text-[#9aa0ae] mb-1.5 flex items-center gap-1">
                <Palette className="w-3 h-3" />
                Badge Color
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setSelectedColor(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center text-white ${
                      selectedColor === color.hex ? 'scale-115 ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#121317]' : 'hover:scale-105'
                    }`}
                    title={color.name}
                  >
                    {selectedColor === color.hex && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview & Add Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#606470] dark:text-[#9aa0ae]">Preview:</span>
                <span
                  style={{
                    backgroundColor: `${selectedColor}18`,
                    color: selectedColor,
                    borderColor: `${selectedColor}40`,
                  }}
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: selectedColor }}
                  />
                  {newCatName.trim() || 'New Category'}
                </span>
              </div>

              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </button>
            </div>
          </form>

          {/* Existing Categories List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-[#606470] dark:text-[#9aa0ae] uppercase tracking-wider">
                Existing Categories ({categories.length})
              </h3>
            </div>

            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-xs text-[#8c909c] text-center py-4">No categories created yet.</p>
              ) : (
                categories.map((cat) => {
                  const isEditing = editingId === cat.id;
                  const count = tasks.filter((t) => t.categoryId === cat.id).length;

                  if (isEditing) {
                    return (
                      <div
                        key={cat.id}
                        className="p-3 bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] rounded-xl space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-md text-[#1f2126] dark:text-[#eceef2]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-[#1f2126] dark:text-[#eceef2] rounded-md text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setEditColor(c.hex)}
                              style={{ backgroundColor: c.hex }}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${
                                editColor === c.hex ? 'scale-115 ring-2 ring-blue-500' : 'hover:scale-105'
                              }`}
                            >
                              {editColor === c.hex && <Check className="w-2.5 h-2.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2.5 bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-xl transition-colors hover:border-[#d4cfc5] dark:hover:border-[#383c48]"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs font-semibold text-[#1f2126] dark:text-[#eceef2]">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-[#8c909c] bg-[#f4f2ec] dark:bg-[#22242b] px-1.5 py-0.5 rounded-md">
                          {count} {count === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="p-1 text-[#606470] dark:text-[#9aa0ae] hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors"
                          title="Edit category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.id)}
                          className="p-1 text-[#606470] dark:text-[#9aa0ae] hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#f8f6f1] dark:bg-[#121317] border-t border-[#e5e2da] dark:border-[#292b34] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#fdfcf9] dark:bg-[#1a1b20] hover:bg-[#eeebe3] dark:hover:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] text-[#1f2126] dark:text-[#eceef2] rounded-lg text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
