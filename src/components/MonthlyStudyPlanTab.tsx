import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  Plus,
  Settings,
  RotateCcw,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  ListTodo,
  X,
  Download,
  Upload,
} from 'lucide-react';

// Subject definition
export interface StudySubject {
  key: string;
  label: string;
  color: string;
}

// Chapter entry definition
export interface StudyChapter {
  id: string;
  p?: string; // Paper: e.g. "1st", "2nd", or custom label
  c?: number | string; // Chapter number or code
  name?: string; // Custom chapter name (e.g. "Thermodynamics", "Vectors")
  title?: string; // Optional detailed topic title / alias
}

// Helper to format chapter display name nicely
export const getChapterDisplayName = (ch: StudyChapter): { prefix: string; name: string; full: string } => {
  const parts: string[] = [];
  if (ch.p && ch.p.trim()) parts.push(ch.p.trim());
  if (ch.c !== undefined && ch.c !== null && String(ch.c).trim() !== '') {
    const cStr = String(ch.c).trim();
    if (/^(ch|chapter)/i.test(cStr)) {
      parts.push(cStr);
    } else {
      parts.push(`Ch${cStr}`);
    }
  }

  const prefix = parts.join(' · ');
  const chapterName = (ch.name || ch.title || '').trim();

  let full = '';
  if (prefix && chapterName) {
    full = `${prefix}: ${chapterName}`;
  } else if (chapterName) {
    full = chapterName;
  } else if (prefix) {
    full = prefix;
  } else {
    full = 'Chapter';
  }

  return { prefix, name: chapterName, full };
};

// Month plan data
export interface StudyMonth {
  id: string;
  n: number;
  label: string; // e.g. "October 2026"
  // Mapping subject key to array of chapters or "revision"
  subjectsData: Record<string, StudyChapter[] | 'revision'>;
}

// Plan configuration
export interface StudyPlanConfig {
  title: string;
  subtitle: string;
  subjects: StudySubject[];
  months: StudyMonth[];
}

// Default initial subjects matching the user HTML
const DEFAULT_SUBJECTS: StudySubject[] = [
  { key: 'phy', label: 'Physics', color: '#4f8ef7' },
  { key: 'chem', label: 'Chemistry', color: '#f7a24f' },
  { key: 'bio', label: 'Biology', color: '#4fcf8e' },
  { key: 'hm', label: 'Higher Math', color: '#c47bf7' },
];

// Helper to generate unique chapter IDs with name support
const makeCh = (p: string = '', c: number | string = '', name?: string): StudyChapter => ({
  id: `ch_${p || 'p'}_${c || 'c'}_${Math.random().toString(36).slice(2, 7)}`,
  p,
  c,
  name,
  title: name,
});

// Default 14-month data matching the user HTML exactly
const DEFAULT_MONTHS: StudyMonth[] = [
  {
    id: 'm1',
    n: 1,
    label: 'October 2026',
    subjectsData: {
      phy: [makeCh('1st', 1), makeCh('1st', 2)],
      chem: [makeCh('1st', 1)],
      bio: [makeCh('1st', 1), makeCh('1st', 2)],
      hm: [makeCh('1st', 1)],
    },
  },
  {
    id: 'm2',
    n: 2,
    label: 'November 2026',
    subjectsData: {
      phy: [makeCh('1st', 3)],
      chem: [makeCh('1st', 2)],
      bio: [makeCh('1st', 3), makeCh('2nd', 1)],
      hm: [makeCh('1st', 3), makeCh('1st', 7)],
    },
  },
  {
    id: 'm3',
    n: 3,
    label: 'December 2026',
    subjectsData: {
      phy: [makeCh('1st', 4), makeCh('1st', 5)],
      chem: [makeCh('1st', 3)],
      bio: [makeCh('1st', 4), makeCh('1st', 5), makeCh('1st', 7)],
      hm: [makeCh('1st', 8)],
    },
  },
  {
    id: 'm4',
    n: 4,
    label: 'January 2027',
    subjectsData: {
      phy: [makeCh('1st', 6)],
      chem: [makeCh('1st', 5)],
      bio: [makeCh('1st', 6), makeCh('1st', 8), makeCh('2nd', 2)],
      hm: [makeCh('1st', 9), makeCh('1st', 2)],
    },
  },
  {
    id: 'm5',
    n: 5,
    label: 'February 2027',
    subjectsData: {
      phy: [makeCh('1st', 7), makeCh('1st', 8)],
      chem: [makeCh('1st', 4)],
      bio: [makeCh('2nd', 3), makeCh('2nd', 4)],
      hm: [makeCh('1st', 4), makeCh('1st', 5)],
    },
  },
  {
    id: 'm6',
    n: 6,
    label: 'March 2027',
    subjectsData: {
      phy: [makeCh('1st', 9), makeCh('1st', 10)],
      chem: [makeCh('2nd', 1)],
      bio: [makeCh('2nd', 5), makeCh('2nd', 6)],
      hm: [makeCh('1st', 6), makeCh('1st', 10)],
    },
  },
  {
    id: 'm7',
    n: 7,
    label: 'April 2027',
    subjectsData: {
      phy: [makeCh('2nd', 1), makeCh('2nd', 2)],
      chem: [makeCh('2nd', 2)],
      bio: [makeCh('2nd', 7), makeCh('2nd', 8)],
      hm: [makeCh('2nd', 1), makeCh('2nd', 2)],
    },
  },
  {
    id: 'm8',
    n: 8,
    label: 'May 2027',
    subjectsData: {
      phy: [makeCh('2nd', 3), makeCh('2nd', 4)],
      chem: [makeCh('2nd', 3)],
      bio: [makeCh('2nd', 9), makeCh('2nd', 10)],
      hm: [makeCh('2nd', 3), makeCh('2nd', 4)],
    },
  },
  {
    id: 'm9',
    n: 9,
    label: 'June 2027',
    subjectsData: {
      phy: [makeCh('2nd', 5), makeCh('2nd', 6)],
      chem: [makeCh('2nd', 4)],
      bio: [makeCh('2nd', 11), makeCh('2nd', 12)],
      hm: [makeCh('2nd', 5), makeCh('2nd', 6)],
    },
  },
  {
    id: 'm10',
    n: 10,
    label: 'July 2027',
    subjectsData: {
      phy: [makeCh('2nd', 7), makeCh('2nd', 8)],
      chem: [makeCh('2nd', 5)],
      bio: 'revision',
      hm: [makeCh('2nd', 7), makeCh('2nd', 8)],
    },
  },
  {
    id: 'm11',
    n: 11,
    label: 'August 2027',
    subjectsData: {
      phy: [makeCh('2nd', 9), makeCh('2nd', 10)],
      chem: 'revision',
      bio: [makeCh('1st', 9), makeCh('1st', 10)],
      hm: [makeCh('2nd', 9), makeCh('2nd', 10)],
    },
  },
  {
    id: 'm12',
    n: 12,
    label: 'September 2027',
    subjectsData: {
      phy: 'revision',
      chem: 'revision',
      bio: [makeCh('1st', 11), makeCh('1st', 12)],
      hm: 'revision',
    },
  },
  {
    id: 'm13',
    n: 13,
    label: 'October 2027',
    subjectsData: {
      phy: 'revision',
      chem: 'revision',
      bio: 'revision',
      hm: 'revision',
    },
  },
  {
    id: 'm14',
    n: 14,
    label: 'November 2027',
    subjectsData: {
      phy: 'revision',
      chem: 'revision',
      bio: 'revision',
      hm: 'revision',
    },
  },
];

const DEFAULT_CONFIG: StudyPlanConfig = {
  title: 'HSC 14-Month Syllabus Tracker',
  subtitle: 'October 2026 → November 2027',
  subjects: DEFAULT_SUBJECTS,
  months: DEFAULT_MONTHS,
};

const PLAN_STORAGE_KEY = 'hsc_study_plan_config_v1';
const TRACKER_STORAGE_KEY = 'hsc_tracker';

interface ChapterState {
  r: boolean; // Added to Routine
  d: boolean; // Finished
}

export function MonthlyStudyPlanTab() {
  // Plan Structure State (Customizable)
  const [config, setConfig] = useState<StudyPlanConfig>(() => {
    try {
      const saved = localStorage.getItem(PLAN_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_CONFIG;
  });

  // Chapter Status State: key -> { r: boolean, d: boolean }
  const [trackerState, setTrackerState] = useState<Record<string, ChapterState>>(() => {
    try {
      const saved = localStorage.getItem(TRACKER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  // Collapsed / Open state for months
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>(() => {
    // Open the first month by default
    return { m1: true };
  });

  // UI Filters & Search
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [chapterTargetMonth, setChapterTargetMonth] = useState<string>('m1');
  const [chapterTargetSubject, setChapterTargetSubject] = useState<string>('phy');
  const [newChapterName, setNewChapterName] = useState<string>('');
  const [newChapterPaper, setNewChapterPaper] = useState<string>('1st');
  const [newChapterNumber, setNewChapterNumber] = useState<string>('');

  // Rename & Edit Chapter state
  const [editingChapter, setEditingChapter] = useState<{
    monthId: string;
    subjectKey: string;
    chapter: StudyChapter;
  } | null>(null);
  const [editChapterName, setEditChapterName] = useState<string>('');
  const [editChapterPaper, setEditChapterPaper] = useState<string>('');
  const [editChapterNumber, setEditChapterNumber] = useState<string>('');
  const [editChapterMonthId, setEditChapterMonthId] = useState<string>('');
  const [editChapterSubjectKey, setEditChapterSubjectKey] = useState<string>('');

  // Editing Month Modal
  const [editingMonth, setEditingMonth] = useState<StudyMonth | null>(null);

  // Save config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  // Save trackerState to localStorage (backward-compatible with HTML tracker)
  useEffect(() => {
    try {
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(trackerState));
    } catch {
      // ignore
    }
  }, [trackerState]);

  // Key generator for tracker state
  const getCardKey = (monthNumber: number, subjectKey: string, index: number, chapterId: string) => {
    // We maintain the HTML key format m{month}_{subj}_{idx} for backward compatibility,
    // and fallback to chapter ID if dynamic
    return `m${monthNumber}_${subjectKey}_${index}`;
  };

  const getChapterState = (monthNumber: number, subjectKey: string, index: number, chapterId: string): ChapterState => {
    const k = getCardKey(monthNumber, subjectKey, index, chapterId);
    return trackerState[k] || { r: false, d: false };
  };

  const setChapterState = (
    monthNumber: number,
    subjectKey: string,
    index: number,
    chapterId: string,
    field: 'r' | 'd',
    value: boolean
  ) => {
    const k = getCardKey(monthNumber, subjectKey, index, chapterId);
    setTrackerState((prev) => {
      const current = prev[k] || { r: false, d: false };
      return {
        ...prev,
        [k]: { ...current, [field]: value },
      };
    });
  };

  // Toggle month accordion
  const toggleMonth = (monthId: string) => {
    setOpenMonths((prev) => ({
      ...prev,
      [monthId]: !prev[monthId],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    config.months.forEach((m) => {
      all[m.id] = true;
    });
    setOpenMonths(all);
  };

  const collapseAll = () => {
    setOpenMonths({});
  };

  // When searching, auto-expand months that have matching chapters
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase().trim();
    const matches: Record<string, boolean> = {};

    config.months.forEach((m) => {
      let monthHasMatch = m.label.toLowerCase().includes(query);
      if (!monthHasMatch) {
        config.subjects.forEach((s) => {
          const val = m.subjectsData[s.key];
          if (Array.isArray(val)) {
            val.forEach((ch) => {
              const { full } = getChapterDisplayName(ch);
              if (full.toLowerCase().includes(query)) {
                monthHasMatch = true;
              }
            });
          }
        });
      }
      if (monthHasMatch) {
        matches[m.id] = true;
      }
    });

    if (Object.keys(matches).length > 0) {
      setOpenMonths((prev) => ({ ...prev, ...matches }));
    }
  }, [searchQuery, config]);

  // Compute Overall Stats
  const stats = useMemo(() => {
    let totalChapters = 0;
    let totalRoutine = 0;
    let totalDone = 0;

    config.months.forEach((month) => {
      config.subjects.forEach((subj) => {
        const val = month.subjectsData[subj.key];
        if (Array.isArray(val)) {
          val.forEach((ch, idx) => {
            totalChapters++;
            const st = getChapterState(month.n, subj.key, idx, ch.id);
            if (st.r) totalRoutine++;
            if (st.d) totalDone++;
          });
        }
      });
    });

    const percent = totalChapters > 0 ? Math.round((totalDone / totalChapters) * 100) : 0;
    return { totalChapters, totalRoutine, totalDone, percent };
  }, [config, trackerState]);

  // Compute Month specific stats
  const getMonthStats = (month: StudyMonth) => {
    let mTotal = 0;
    let mDone = 0;

    config.subjects.forEach((subj) => {
      const val = month.subjectsData[subj.key];
      if (Array.isArray(val)) {
        val.forEach((ch, idx) => {
          mTotal++;
          const st = getChapterState(month.n, subj.key, idx, ch.id);
          if (st.d) mDone++;
        });
      }
    });

    const isAllDone = mTotal > 0 && mDone === mTotal;
    return { mTotal, mDone, isAllDone };
  };

  // Handlers for Customizing Plan
  const handleResetToDefault = () => {
    if (window.confirm('Reset this Monthly Study Plan back to the original default 14-month HSC syllabus? Any customized subjects or added months will be reset.')) {
      setConfig(DEFAULT_CONFIG);
      localStorage.removeItem(PLAN_STORAGE_KEY);
    }
  };

  const handleAddNewMonth = () => {
    const nextN = config.months.length + 1;
    const newMonth: StudyMonth = {
      id: `m${Date.now()}`,
      n: nextN,
      label: `Month ${nextN}`,
      subjectsData: config.subjects.reduce((acc, subj) => {
        acc[subj.key] = [];
        return acc;
      }, {} as Record<string, StudyChapter[] | 'revision'>),
    };
    setConfig((prev) => ({
      ...prev,
      months: [...prev.months, newMonth],
    }));
    setOpenMonths((prev) => ({ ...prev, [newMonth.id]: true }));
  };

  const handleDeleteMonth = (monthId: string) => {
    if (window.confirm('Are you sure you want to delete this month block?')) {
      setConfig((prev) => ({
        ...prev,
        months: prev.months.filter((m) => m.id !== monthId),
      }));
    }
  };

  const handleAddChapterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newChapterName.trim();
    const trimmedNum = newChapterNumber.trim();
    const trimmedPaper = newChapterPaper.trim();

    // User can add chapter with custom name, chapter number, or both
    if (!trimmedName && !trimmedNum) {
      alert('Please enter a Chapter Name or Chapter Number.');
      return;
    }

    const newCh = makeCh(
      trimmedPaper,
      trimmedNum,
      trimmedName
    );

    setConfig((prev) => {
      const updatedMonths = prev.months.map((m) => {
        if (m.id !== chapterTargetMonth) return m;

        const currentSubjData = m.subjectsData[chapterTargetSubject];
        const newChapters = Array.isArray(currentSubjData) ? [...currentSubjData, newCh] : [newCh];

        return {
          ...m,
          subjectsData: {
            ...m.subjectsData,
            [chapterTargetSubject]: newChapters,
          },
        };
      });

      return { ...prev, months: updatedMonths };
    });

    setNewChapterName('');
    setNewChapterNumber('');
    setIsAddChapterModalOpen(false);
  };

  const openRenameChapter = (monthId: string, subjectKey: string, chapter: StudyChapter) => {
    setEditingChapter({ monthId, subjectKey, chapter });
    setEditChapterName(chapter.name || chapter.title || '');
    setEditChapterPaper(chapter.p || '');
    setEditChapterNumber(chapter.c !== undefined && chapter.c !== null ? String(chapter.c) : '');
    setEditChapterMonthId(monthId);
    setEditChapterSubjectKey(subjectKey);
  };

  const handleSaveChapterRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapter) return;

    const trimmedName = editChapterName.trim();
    const trimmedPaper = editChapterPaper.trim();
    const trimmedNum = editChapterNumber.trim();

    if (!trimmedName && !trimmedNum) {
      alert('Please enter at least a Chapter Name or Chapter Number.');
      return;
    }

    const updatedChapter: StudyChapter = {
      ...editingChapter.chapter,
      name: trimmedName || undefined,
      title: trimmedName || undefined,
      p: trimmedPaper,
      c: trimmedNum,
    };

    const oldMonthId = editingChapter.monthId;
    const oldSubjectKey = editingChapter.subjectKey;
    const targetMonthId = editChapterMonthId;
    const targetSubjKey = editChapterSubjectKey;

    setConfig((prev) => {
      // If remaining in the same month & subject
      if (oldMonthId === targetMonthId && oldSubjectKey === targetSubjKey) {
        return {
          ...prev,
          months: prev.months.map((m) => {
            if (m.id !== oldMonthId) return m;
            const current = m.subjectsData[oldSubjectKey];
            if (!Array.isArray(current)) return m;
            return {
              ...m,
              subjectsData: {
                ...m.subjectsData,
                [oldSubjectKey]: current.map((c) =>
                  c.id === editingChapter.chapter.id ? updatedChapter : c
                ),
              },
            };
          }),
        };
      }

      // If moving across month or subject
      return {
        ...prev,
        months: prev.months.map((m) => {
          let updatedSubjData = { ...m.subjectsData };

          if (m.id === oldMonthId) {
            const oldList = updatedSubjData[oldSubjectKey];
            if (Array.isArray(oldList)) {
              updatedSubjData[oldSubjectKey] = oldList.filter(
                (c) => c.id !== editingChapter.chapter.id
              );
            }
          }

          if (m.id === targetMonthId) {
            const destList = updatedSubjData[targetSubjKey];
            if (Array.isArray(destList)) {
              updatedSubjData[targetSubjKey] = [...destList, updatedChapter];
            } else {
              updatedSubjData[targetSubjKey] = [updatedChapter];
            }
          }

          return {
            ...m,
            subjectsData: updatedSubjData,
          };
        }),
      };
    });

    setEditingChapter(null);
  };

  const handleDeleteChapter = (monthId: string, subjectKey: string, chapterId: string) => {
    if (window.confirm('Remove this chapter from the study plan?')) {
      setConfig((prev) => ({
        ...prev,
        months: prev.months.map((m) => {
          if (m.id !== monthId) return m;
          const current = m.subjectsData[subjectKey];
          if (!Array.isArray(current)) return m;
          return {
            ...m,
            subjectsData: {
              ...m.subjectsData,
              [subjectKey]: current.filter((c) => c.id !== chapterId),
            },
          };
        }),
      }));
    }
  };

  const handleToggleRevision = (monthId: string, subjectKey: string) => {
    setConfig((prev) => ({
      ...prev,
      months: prev.months.map((m) => {
        if (m.id !== monthId) return m;
        const current = m.subjectsData[subjectKey];
        const isRevision = current === 'revision';
        return {
          ...m,
          subjectsData: {
            ...m.subjectsData,
            [subjectKey]: isRevision ? [] : 'revision',
          },
        };
      }),
    }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f4f2ec] dark:bg-[#0f1117] text-[#1f2126] dark:text-[#e8eaf2] overflow-y-auto">
      {/* HEADER */}
      <header className="sticky top-0 z-20 bg-[#fdfcf9] dark:bg-[#181c26] border-b border-[#e5e2da] dark:border-[#2a3047] px-4 sm:px-6 py-4 shadow-xs">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#1f2126] dark:text-[#e8eaf2]">
                  {config.title}
                </h1>
              </div>
              <p className="text-xs text-[#606470] dark:text-[#7b82a0] mt-0.5">
                {config.subtitle}
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsAddChapterModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer min-h-[34px]"
                title="Add a new chapter to the plan"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chapter</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(true)}
                className="px-3 py-1.5 bg-[#f4f2ec] dark:bg-[#1f2535] hover:bg-[#eae7df] dark:hover:bg-[#2a3047] border border-[#e5e2da] dark:border-[#2a3047] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[34px]"
                title="Customize study plan, subjects, or months"
              >
                <Settings className="w-3.5 h-3.5 text-[#606470] dark:text-[#7b82a0]" />
                <span>Customize Plan</span>
              </button>

              <div className="flex items-center gap-1 border-l border-[#e5e2da] dark:border-[#2a3047] pl-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2 py-1 text-[11px] text-[#606470] dark:text-[#7b82a0] hover:text-[#1f2126] dark:hover:text-[#e8eaf2] hover:bg-[#f4f2ec] dark:hover:bg-[#1f2535] rounded-md transition-colors"
                >
                  Expand All
                </button>
                <span className="text-[#8c909c] text-xs">·</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2 py-1 text-[11px] text-[#606470] dark:text-[#7b82a0] hover:text-[#1f2126] dark:hover:text-[#e8eaf2] hover:bg-[#f4f2ec] dark:hover:bg-[#1f2535] rounded-md transition-colors"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>

          {/* Subject Legend & Status Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-[#f4f2ec] dark:border-[#1f2535]">
            <div className="flex items-center gap-3 flex-wrap">
              {config.subjects.map((subj) => (
                <div key={subj.key} className="flex items-center gap-1.5 text-[11px] font-medium text-[#606470] dark:text-[#7b82a0]">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: subj.color }}
                  />
                  <span>{subj.label}</span>
                </div>
              ))}
            </div>

            <div className="h-3 w-px bg-[#e5e2da] dark:bg-[#2a3047] hidden sm:block" />

            <div className="flex items-center gap-3 text-[11px] text-[#606470] dark:text-[#7b82a0] flex-wrap">
              <span className="flex items-center gap-1">
                <span className="px-1 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30 text-[10px]">
                  R
                </span>
                Added to Routine
              </span>
              <span className="flex items-center gap-1">
                <span className="px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 text-[10px]">
                  ✓
                </span>
                Finished
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* OVERALL STATS BAR */}
      <div className="bg-[#eae7df] dark:bg-[#1f2535] border-b border-[#e5e2da] dark:border-[#2a3047] px-4 sm:px-6 py-2.5 sticky top-[108px] sm:top-[94px] z-10 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#fdfcf9] dark:bg-[#181c26] border border-[#e5e2da] dark:border-[#2a3047] text-[#606470] dark:text-[#7b82a0]">
              Total Chapters: <strong className="text-[#1f2126] dark:text-[#e8eaf2]">{stats.totalChapters}</strong>
            </div>

            <div className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#fdfcf9] dark:bg-[#181c26] border border-blue-400/40 text-blue-600 dark:text-blue-400">
              In Routine: <strong>{stats.totalRoutine}</strong>
            </div>

            <div className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#fdfcf9] dark:bg-[#181c26] border border-emerald-400/40 text-emerald-600 dark:text-emerald-400">
              Finished: <strong>{stats.totalDone}</strong> ({stats.percent}%)
            </div>
          </div>

          {/* Search & Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c909c]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapter name..."
                className="pl-8 pr-7 py-1 bg-[#fdfcf9] dark:bg-[#181c26] border border-[#e5e2da] dark:border-[#2a3047] rounded-lg text-xs placeholder-[#8c909c] text-[#1f2126] dark:text-[#e8eaf2] focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-36 sm:w-48"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#e8eaf2]"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setSelectedSubjectFilter('all')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
                  selectedSubjectFilter === 'all'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-[#606470] dark:text-[#7b82a0] hover:text-[#1f2126] dark:hover:text-[#e8eaf2]'
                }`}
              >
                All
              </button>
              {config.subjects.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSelectedSubjectFilter(s.key)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    selectedSubjectFilter === s.key
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-[#606470] dark:text-[#7b82a0] hover:text-[#1f2126] dark:hover:text-[#e8eaf2]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span>{s.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-3 sm:p-6 max-w-4xl mx-auto w-full space-y-3.5 pb-20">
        {config.months.map((month) => {
          const { mTotal, mDone, isAllDone } = getMonthStats(month);
          const isOpen = !!openMonths[month.id];

          return (
            <div
              key={month.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isAllDone
                  ? 'border-emerald-600/40 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xs'
                  : 'border-[#e5e2da] dark:border-[#2a3047] bg-[#fdfcf9] dark:bg-[#181c26] shadow-2xs'
              }`}
            >
              {/* Month Header Accordion */}
              <div
                onClick={() => toggleMonth(month.id)}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer select-none transition-colors ${
                  isAllDone
                    ? 'bg-emerald-500/10 dark:bg-emerald-950/30'
                    : 'bg-[#f4f2ec] dark:bg-[#1f2535] hover:bg-[#eae7df] dark:hover:bg-[#252c3f]'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="text-[10px] font-bold tracking-wider uppercase text-[#8c909c] dark:text-[#7b82a0]">
                    Month {month.n}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[#1f2126] dark:text-[#e8eaf2] mt-0.5">
                    {month.label}
                  </div>

                  {/* Subject chapter chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {config.subjects.map((s) => {
                      const val = month.subjectsData[s.key];
                      if (!Array.isArray(val) || val.length === 0) return null;
                      return (
                        <span
                          key={s.key}
                          style={{
                            color: s.color,
                            borderColor: `${s.color}35`,
                            backgroundColor: `${s.color}12`,
                          }}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.label.split(' ')[0]}: {val.length}ch
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[#606470] dark:text-[#7b82a0]">
                      <strong className={isAllDone ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-[#1f2126] dark:text-[#e8eaf2]'}>
                        {mDone}
                      </strong>
                      /{mTotal} done
                    </span>
                    {isAllDone && (
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> All Complete
                      </div>
                    )}
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-[#8c909c] transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Month Body (Subject Sections & Chapters) */}
              {isOpen && (
                <div className="p-3 sm:p-4 space-y-3 border-t border-[#e5e2da] dark:border-[#2a3047] bg-[#fdfcf9] dark:bg-[#181c26] animate-in fade-in duration-150">
                  {config.subjects.map((subj) => {
                    // Filter check
                    if (selectedSubjectFilter !== 'all' && selectedSubjectFilter !== subj.key) {
                      return null;
                    }

                    const val = month.subjectsData[subj.key];
                    const isRevision = val === 'revision';
                    const chapters = Array.isArray(val) ? val : [];

                    return (
                      <div
                        key={subj.key}
                        style={{
                          borderLeftColor: subj.color,
                          backgroundColor: `${subj.color}08`,
                        }}
                        className="p-3 rounded-xl border-l-[3px] space-y-2 border border-[#e5e2da]/60 dark:border-[#2a3047]/60"
                      >
                        {/* Subject Header inside Month */}
                        <div className="flex items-center justify-between gap-2">
                          <div
                            style={{ color: subj.color }}
                            className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subj.color }} />
                            <span>{subj.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setChapterTargetMonth(month.id);
                                setChapterTargetSubject(subj.key);
                                setIsAddChapterModalOpen(true);
                              }}
                              className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                              title="Add chapter to this subject"
                            >
                              <Plus className="w-3 h-3" /> Add
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleRevision(month.id, subj.key)}
                              className="px-2 py-0.5 text-[10px] text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#e8eaf2] hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
                              title={isRevision ? 'Switch to chapter list' : 'Mark as revision month'}
                            >
                              {isRevision ? 'Use Chapters' : 'Mark Revision'}
                            </button>
                          </div>
                        </div>

                        {/* Chapters or Revision Badge */}
                        {isRevision ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-[#8c909c]/40 bg-black/5 dark:bg-white/5 text-xs text-[#7b82a0]">
                            <span>📋</span>
                            <span className="font-semibold">Revision Month</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {chapters.length === 0 ? (
                              <div className="text-xs text-[#8c909c] italic py-1">
                                No chapters scheduled for this subject this month.
                              </div>
                            ) : (
                              chapters.map((ch, idx) => {
                                const st = getChapterState(month.n, subj.key, idx, ch.id);
                                const { prefix, name, full } = getChapterDisplayName(ch);
                                const isSearchMatch =
                                  searchQuery.trim() !== '' &&
                                  (full.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    subj.label.toLowerCase().includes(searchQuery.toLowerCase()));

                                return (
                                  <div
                                    key={ch.id}
                                    className={`group/card relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all select-none shadow-2xs ${
                                      isSearchMatch
                                        ? 'ring-2 ring-amber-500 bg-amber-50/70 dark:bg-amber-950/40 border-amber-500'
                                        : st.d
                                        ? 'border-emerald-500/50 bg-emerald-500/15 dark:bg-emerald-950/40 text-[#8c909c]'
                                        : st.r
                                        ? 'border-blue-500/60 ring-1 ring-blue-500/40 bg-blue-50/60 dark:bg-blue-950/30'
                                        : 'border-[#e5e2da] dark:border-[#2a3047] bg-[#fdfcf9] dark:bg-[#181c26] hover:border-[#cfcbc2]'
                                    }`}
                                  >
                                    {/* Clickable Chapter Name to Rename */}
                                    <button
                                      type="button"
                                      onClick={() => openRenameChapter(month.id, subj.key, ch)}
                                      className="text-left font-medium text-[11px] hover:underline focus:outline-hidden cursor-pointer flex items-center gap-1 group/btn"
                                      title="Click to rename or edit chapter"
                                    >
                                      <span
                                        className={`whitespace-normal break-words max-w-[190px] sm:max-w-[280px] leading-tight ${
                                          st.d
                                            ? 'line-through text-[#8c909c]'
                                            : 'text-[#1f2126] dark:text-[#e8eaf2]'
                                        }`}
                                      >
                                        {prefix && (
                                          <span className="text-[10px] opacity-75 font-normal mr-1">
                                            {prefix}
                                            {name ? ':' : ''}
                                          </span>
                                        )}
                                        <span className={name ? 'font-semibold text-blue-700 dark:text-blue-300' : ''}>
                                          {name || prefix || 'Chapter'}
                                        </span>
                                      </span>
                                    </button>

                                    {/* Action Checkboxes & Buttons */}
                                    <div className="flex items-center gap-1 pl-1.5 border-l border-[#e5e2da] dark:border-[#2a3047]">
                                      {/* R = Added to Routine */}
                                      <label
                                        className="flex items-center gap-0.5 cursor-pointer text-[10px] font-bold text-[#606470] dark:text-[#7b82a0] hover:text-blue-600 px-0.5"
                                        title="Mark as Added to Routine"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={st.r}
                                          onChange={(e) =>
                                            setChapterState(month.n, subj.key, idx, ch.id, 'r', e.target.checked)
                                          }
                                          className="w-3 h-3 rounded text-blue-600 accent-blue-600 cursor-pointer"
                                        />
                                        <span>R</span>
                                      </label>

                                      {/* ✓ = Finished */}
                                      <label
                                        className="flex items-center gap-0.5 cursor-pointer text-[10px] font-bold text-[#606470] dark:text-[#7b82a0] hover:text-emerald-600 px-0.5"
                                        title="Mark as Finished"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={st.d}
                                          onChange={(e) =>
                                            setChapterState(month.n, subj.key, idx, ch.id, 'd', e.target.checked)
                                          }
                                          className="w-3 h-3 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                                        />
                                        <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                                      </label>

                                      {/* Rename Button (pencil) */}
                                      <button
                                        type="button"
                                        onClick={() => openRenameChapter(month.id, subj.key, ch)}
                                        className="p-1 text-[#8c909c] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
                                        title="Rename or edit chapter"
                                      >
                                        <Edit2 className="w-2.5 h-2.5" />
                                      </button>

                                      {/* Delete chapter button */}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteChapter(month.id, subj.key, ch.id)}
                                        className="p-1 text-[#8c909c] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                                        title="Delete chapter"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Another Month Button at bottom */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleAddNewMonth}
            className="px-4 py-2 border border-dashed border-[#e5e2da] dark:border-[#2a3047] hover:border-blue-500 dark:hover:border-blue-400 rounded-xl text-xs font-semibold text-[#606470] dark:text-[#7b82a0] hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Month (Month {config.months.length + 1})</span>
          </button>
        </div>
      </main>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: ADD CHAPTER MODAL                                                 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isAddChapterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#fdfcf9] dark:bg-[#181c26] text-[#1f2126] dark:text-[#e8eaf2] border border-[#e5e2da] dark:border-[#2a3047] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2da] dark:border-[#2a3047]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold">Add Chapter to Study Plan</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddChapterModalOpen(false)}
                className="p-1 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#e8eaf2] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddChapterSubmit} className="space-y-3.5 text-xs">
              {/* Select Month */}
              <div>
                <label className="block text-[11px] font-bold text-[#8c909c] uppercase mb-1">
                  Target Month:
                </label>
                <select
                  value={chapterTargetMonth}
                  onChange={(e) => setChapterTargetMonth(e.target.value)}
                  className="w-full p-2 bg-[#f4f2ec] dark:bg-[#1f2535] border border-[#e5e2da] dark:border-[#2a3047] rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                >
                  {config.months.map((m) => (
                    <option key={m.id} value={m.id}>
                      Month {m.n}: {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Subject */}
              <div>
                <label className="block text-[11px] font-bold text-[#8c909c] uppercase mb-1">
                  Subject:
                </label>
                <select
                  value={chapterTargetSubject}
                  onChange={(e) => setChapterTargetSubject(e.target.value)}
                  className="w-full p-2 bg-[#f4f2ec] dark:bg-[#1f2535] border border-[#e5e2da] dark:border-[#2a3047] rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                >
                  {config.subjects.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter Name (Primary Field) */}
              <div>
                <label className="block text-[11px] font-bold text-[#8c909c] uppercase mb-1">
                  Chapter Name / Topic: *
                </label>
                <input
                  type="text"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  placeholder="e.g. Vectors, Optics, Thermodynamics, Calculus..."
                  autoFocus
                  className="w-full p-2 bg-[#f4f2ec] dark:bg-[#1f2535] border border-[#e5e2da] dark:border-[#2a3047] rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <p className="text-[10px] text-[#8c909c] mt-0.5">
                  Name this chapter freely as you want.
                </p>
              </div>

              {/* Paper & Chapter Number (Optional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#8c909c] uppercase mb-1">
                    Paper / Part (Optional):
                  </label>
                  <input
                    type="text"
                    value={newChapterPaper}
                    onChange={(e) => setNewChapterPaper(e.target.value)}
                    placeholder="e.g. 1st or 2nd"
                    className="w-full p-2 bg-[#f4f2ec] dark:bg-[#1f2535] border border-[#e5e2da] dark:border-[#2a3047] rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8c909c] uppercase mb-1">
                    Chapter Number (Optional):
                  </label>
                  <input
                    type="text"
                    value={newChapterNumber}
                    onChange={(e) => setNewChapterNumber(e.target.value)}
                    placeholder="e.g. 1, 2, or 4"
                    className="w-full p-2 bg-[#f4f2ec] dark:bg-[#1f2535] border border-[#e5e2da] dark:border-[#2a3047] rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Live Preview */}
              {(() => {
                const previewSubject = config.subjects.find((s) => s.key === chapterTargetSubject);
                const { full } = getChapterDisplayName({
                  id: 'preview',
                  p: newChapterPaper,
                  c: newChapterNumber,
                  name: newChapterName,
                });
                return (
                  <div className="p-2.5 rounded-xl border border-dashed border-[#8c909c]/40 bg-black/5 dark:bg-white/5 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-[#8c909c]">
                      Live Card Preview:
                    </div>
                    <div
                      style={{
                        borderColor: previewSubject?.color,
                        color: previewSubject?.color,
                        backgroundColor: `${previewSubject?.color}15`,
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: previewSubject?.color }}
                      />
                      <span>{full || 'Enter chapter name or number above'}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e2da] dark:border-[#2a3047]">
                <button
                  type="button"
                  onClick={() => setIsAddChapterModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#e5e2da] dark:border-[#2a3047] hover:bg-black/5 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition-transform cursor-pointer"
                >
                  Add Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1.5: RENAME & EDIT CHAPTER MODAL                                     */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {editingChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#fdfcf9] dark:bg-[#181c26] text-[#1f2126] dark:text-[#e8eaf2] border border-[#e5e2da] dark:border-[#2a3047] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2da] dark:border-[#2a3047]">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold">Rename & Edit Chapter</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingChapter(null)}
                className="p-1 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#e8eaf2] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChapterRename} className="space-y-3.5 text-xs">
              {/* Chapter Name Input */}
              <div>
                <label className="block text-[11px] font-bold text-[#8c909c] uppercase mb-1">
                  Chapter Name / Topic:
                </label>
                <input
                  type="text"
                  value={editChapterName}
                  onChange={(e) => setEditChapterName(e.target.value)}
                  placeholder="e.g. Vectors, Optics, Thermodynamics, Calculus..."
                  autoFocus
                  className="w-full p-2 bg-[#f4f2ec] dark:bg-[#1f2535] border border-[#e5e2da] dark:border-[#2a3047] rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <p className="text-[10px] text-[#8c909c] mt-0.5">
                  Rename this chapter to whatever name you want.
                </p>
              </div>

              {/* Paper / Part & Chapter Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#8c909c] uppercase mb-1">
                    Paper / Part (Optional):
                  </label>
                  <input
                    type="text"
                    value={editChapterPaper}
                    onChange={(e) => setEditChapterPaper(e.target.value)}
                    placeholder="e.g. 1st or 2nd"
                    className="w-full p-2 bg-[#f4f2ec] dark:bg-[#1f2535] border border-[#e5e2da] dark:border-[#2a3047] rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8c909c] uppercase mb-1">
                    Chapter Number (Optional):
                  </label>
                  <input
                    type="text"
                    value={editChapterNumber}
                    onChange={(e) => setEditChapterNumber(e.target.value)}
                    placeholder="e.g. 1, 2, or 4"
                    className="w-full p-2 bg-[#f4f2ec] dark:bg-[#1f2535] border border-[#e5e2da] dark:border-[#2a3047] rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Reassign Month & Subject */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#8c909c] uppercase mb-1">
                    Subject:
                  </label>
                  <select
                    value={editChapterSubjectKey}
                    onChange={(e) => setEditChapterSubjectKey(e.target.value)}
                    className="w-full p-2 bg-[#f4f2ec] dark:bg-[#1f2535] border border-[#e5e2da] dark:border-[#2a3047] rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    {config.subjects.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8c909c] uppercase mb-1">
                    Month:
                  </label>
                  <select
                    value={editChapterMonthId}
                    onChange={(e) => setEditChapterMonthId(e.target.value)}
                    className="w-full p-2 bg-[#f4f2ec] dark:bg-[#1f2535] border border-[#e5e2da] dark:border-[#2a3047] rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    {config.months.map((m) => (
                      <option key={m.id} value={m.id}>
                        Month {m.n}: {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Preview */}
              {(() => {
                const targetSubj = config.subjects.find((s) => s.key === editChapterSubjectKey);
                const { full } = getChapterDisplayName({
                  id: editingChapter.chapter.id,
                  p: editChapterPaper,
                  c: editChapterNumber,
                  name: editChapterName,
                });
                return (
                  <div className="p-2.5 rounded-xl border border-dashed border-[#8c909c]/40 bg-black/5 dark:bg-white/5 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-[#8c909c]">
                      Live Card Preview:
                    </div>
                    <div
                      style={{
                        borderColor: targetSubj?.color,
                        color: targetSubj?.color,
                        backgroundColor: `${targetSubj?.color}15`,
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: targetSubj?.color }}
                      />
                      <span>{full || 'Enter chapter name or number above'}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-[#e5e2da] dark:border-[#2a3047]">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteChapter(
                      editingChapter.monthId,
                      editingChapter.subjectKey,
                      editingChapter.chapter.id
                    );
                    setEditingChapter(null);
                  }}
                  className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Chapter</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingChapter(null)}
                    className="px-3 py-1.5 rounded-xl border border-[#e5e2da] dark:border-[#2a3047] hover:bg-black/5 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition-transform cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: CUSTOMIZE STUDY PLAN MODAL                                        */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#fdfcf9] dark:bg-[#181c26] text-[#1f2126] dark:text-[#e8eaf2] border border-[#e5e2da] dark:border-[#2a3047] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2da] dark:border-[#2a3047]">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold">Customize Monthly Study Plan</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="p-1 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#e8eaf2] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plan Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#8c909c] uppercase tracking-wider">
                Plan Title & Subtitle
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#8c909c] mb-1">Title</label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2 bg-[#f4f2ec] dark:bg-[#1f2535] border border-[#e5e2da] dark:border-[#2a3047] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#8c909c] mb-1">Subtitle / Range</label>
                  <input
                    type="text"
                    value={config.subtitle}
                    onChange={(e) => setConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full p-2 bg-[#f4f2ec] dark:bg-[#1f2535] border border-[#e5e2da] dark:border-[#2a3047] rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Subjects Configuration */}
            <div className="space-y-3 pt-3 border-t border-[#e5e2da] dark:border-[#2a3047]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#8c909c] uppercase tracking-wider">
                  Manage Subjects ({config.subjects.length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const name = prompt('Enter new subject name:');
                    if (!name?.trim()) return;
                    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
                    const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                    setConfig((prev) => ({
                      ...prev,
                      subjects: [...prev.subjects, { key, label: name.trim(), color }],
                    }));
                  }}
                  className="px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Subject
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {config.subjects.map((subj, sIdx) => (
                  <div
                    key={subj.key}
                    className="flex items-center justify-between p-2 rounded-xl border border-[#e5e2da] dark:border-[#2a3047] bg-[#f4f2ec] dark:bg-[#1f2535] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={subj.color}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          setConfig((prev) => ({
                            ...prev,
                            subjects: prev.subjects.map((s, idx) =>
                              idx === sIdx ? { ...s, color: newColor } : s
                            ),
                          }));
                        }}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        title="Pick subject color"
                      />
                      <input
                        type="text"
                        value={subj.label}
                        onChange={(e) => {
                          const newLabel = e.target.value;
                          setConfig((prev) => ({
                            ...prev,
                            subjects: prev.subjects.map((s, idx) =>
                              idx === sIdx ? { ...s, label: newLabel } : s
                            ),
                          }));
                        }}
                        className="px-2 py-1 bg-transparent font-semibold border-b border-dashed border-[#8c909c] text-[#1f2126] dark:text-[#e8eaf2] text-xs focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#8c909c]">Key: {subj.key}</span>
                      {config.subjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete subject "${subj.label}"?`)) {
                              setConfig((prev) => ({
                                ...prev,
                                subjects: prev.subjects.filter((_, idx) => idx !== sIdx),
                              }));
                            }
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700 rounded-md"
                          title="Delete subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Months List & Reorder / Delete */}
            <div className="space-y-3 pt-3 border-t border-[#e5e2da] dark:border-[#2a3047]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#8c909c] uppercase tracking-wider">
                  Months in Plan ({config.months.length})
                </h4>
                <button
                  type="button"
                  onClick={handleAddNewMonth}
                  className="px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Month
                </button>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {config.months.map((m, mIdx) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-[#e5e2da] dark:border-[#2a3047] bg-[#f4f2ec] dark:bg-[#1f2535] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[11px] text-[#8c909c]">M{m.n}:</span>
                      <input
                        type="text"
                        value={m.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfig((prev) => ({
                            ...prev,
                            months: prev.months.map((item, idx) =>
                              idx === mIdx ? { ...item, label: val } : item
                            ),
                          }));
                        }}
                        className="px-1.5 py-0.5 bg-transparent font-medium text-xs border-b border-[#8c909c]/40 text-[#1f2126] dark:text-[#e8eaf2] focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteMonth(m.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 rounded-md"
                        title="Delete month"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reset / Backup Actions */}
            <div className="pt-3 border-t border-[#e5e2da] dark:border-[#2a3047] flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default 14-Month HSC Plan</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
