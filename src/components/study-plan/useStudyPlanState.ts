import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StudyPlanConfig,
  ChapterState,
  StudyChapter,
  StudyMonth,
  StudySubject,
  SubjectProgress,
} from './types';
import {
  DEFAULT_CONFIG,
  PLAN_STORAGE_KEY,
  TRACKER_STORAGE_KEY,
  makeCh,
} from './constants';

export function useStudyPlanState() {
  const [config, setConfig] = useState<StudyPlanConfig>(() => {
    try {
      const saved = localStorage.getItem(PLAN_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  });

  const [trackerState, setTrackerState] = useState<Record<string, ChapterState>>(() => {
    try {
      const saved = localStorage.getItem(TRACKER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>(() => ({ m1: true }));
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(trackerState));
    } catch {
      // ignore
    }
  }, [trackerState]);

  const getCardKey = useCallback((monthNumber: number, subjectKey: string, index: number) => {
    return `m${monthNumber}_${subjectKey}_${index}`;
  }, []);

  const getChapterState = useCallback(
    (monthNumber: number, subjectKey: string, index: number): ChapterState => {
      const k = getCardKey(monthNumber, subjectKey, index);
      return trackerState[k] || { r: false, d: false };
    },
    [getCardKey, trackerState]
  );

  const toggleChapterStatus = useCallback(
    (monthNumber: number, subjectKey: string, index: number, field: 'r' | 'd') => {
      const k = getCardKey(monthNumber, subjectKey, index);
      setTrackerState((prev) => {
        const current = prev[k] || { r: false, d: false };
        return {
          ...prev,
          [k]: { ...current, [field]: !current[field] },
        };
      });
    },
    [getCardKey]
  );

  const toggleMonth = useCallback((monthId: string) => {
    setOpenMonths((prev) => ({
      ...prev,
      [monthId]: !prev[monthId],
    }));
  }, []);

  const expandAll = useCallback(() => {
    const all: Record<string, boolean> = {};
    config.months.forEach((m) => {
      all[m.id] = true;
    });
    setOpenMonths(all);
  }, [config.months]);

  const collapseAll = useCallback(() => {
    setOpenMonths({});
  }, []);

  const resetToDefaults = useCallback(() => {
    if (window.confirm('Reset study plan and chapter tracker back to original HSC defaults?')) {
      setConfig(DEFAULT_CONFIG);
      setTrackerState({});
      localStorage.removeItem(PLAN_STORAGE_KEY);
      localStorage.removeItem(TRACKER_STORAGE_KEY);
    }
  }, []);

  const exportPlanJSON = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ config, trackerState }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'chronoplan_study_plan.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [config, trackerState]);

  const importPlanJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.config && parsed.config.subjects && parsed.config.months) {
          setConfig(parsed.config);
          if (parsed.trackerState) setTrackerState(parsed.trackerState);
          alert('Study plan successfully imported!');
        } else {
          alert('Invalid plan JSON file format.');
        }
      } catch {
        alert('Failed to parse study plan JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // Chapter operations
  const addChapter = useCallback(
    (monthId: string, subjectKey: string, paper: string, number: string, name: string) => {
      const chapter = makeCh(paper.trim(), number.trim(), name.trim());
      setConfig((prev) => ({
        ...prev,
        months: prev.months.map((m) => {
          if (m.id !== monthId) return m;
          const currentData = m.subjectsData[subjectKey];
          const chaptersList: StudyChapter[] =
            Array.isArray(currentData) ? [...currentData, chapter] : [chapter];
          return {
            ...m,
            subjectsData: {
              ...m.subjectsData,
              [subjectKey]: chaptersList,
            },
          };
        }),
      }));
    },
    []
  );

  const updateChapter = useCallback(
    (
      oldMonthId: string,
      oldSubjectKey: string,
      chapterId: string,
      targetMonthId: string,
      targetSubjectKey: string,
      paper: string,
      number: string,
      name: string
    ) => {
      setConfig((prev) => {
        const nextMonths = prev.months.map((m) => {
          // If old month and old subject, remove or edit
          if (m.id === oldMonthId) {
            const currentList = Array.isArray(m.subjectsData[oldSubjectKey])
              ? [...(m.subjectsData[oldSubjectKey] as StudyChapter[])]
              : [];
            if (oldMonthId === targetMonthId && oldSubjectKey === targetSubjectKey) {
              // Edit in place
              const updated = currentList.map((ch) =>
                ch.id === chapterId
                  ? { ...ch, p: paper.trim(), c: number.trim(), name: name.trim(), title: name.trim() }
                  : ch
              );
              return {
                ...m,
                subjectsData: { ...m.subjectsData, [oldSubjectKey]: updated },
              };
            }
            // Removing from source
            const filtered = currentList.filter((ch) => ch.id !== chapterId);
            return {
              ...m,
              subjectsData: { ...m.subjectsData, [oldSubjectKey]: filtered },
            };
          }
          // If moved to target month
          if (m.id === targetMonthId && (oldMonthId !== targetMonthId || oldSubjectKey !== targetSubjectKey)) {
            const currentList = Array.isArray(m.subjectsData[targetSubjectKey])
              ? [...(m.subjectsData[targetSubjectKey] as StudyChapter[])]
              : [];
            const newChapter = {
              id: chapterId,
              p: paper.trim(),
              c: number.trim(),
              name: name.trim(),
              title: name.trim(),
            };
            return {
              ...m,
              subjectsData: { ...m.subjectsData, [targetSubjectKey]: [...currentList, newChapter] },
            };
          }
          return m;
        });
        return { ...prev, months: nextMonths };
      });
    },
    []
  );

  const deleteChapter = useCallback((monthId: string, subjectKey: string, chapterId: string) => {
    setConfig((prev) => ({
      ...prev,
      months: prev.months.map((m) => {
        if (m.id !== monthId) return m;
        const currentList = Array.isArray(m.subjectsData[subjectKey])
          ? (m.subjectsData[subjectKey] as StudyChapter[])
          : [];
        return {
          ...m,
          subjectsData: {
            ...m.subjectsData,
            [subjectKey]: currentList.filter((c) => c.id !== chapterId),
          },
        };
      }),
    }));
  }, []);

  const updateMonth = useCallback((monthId: string, newLabel: string) => {
    setConfig((prev) => ({
      ...prev,
      months: prev.months.map((m) => (m.id === monthId ? { ...m, label: newLabel.trim() } : m)),
    }));
  }, []);

  const deleteMonth = useCallback((monthId: string) => {
    if (window.confirm('Are you sure you want to delete this entire month?')) {
      setConfig((prev) => ({
        ...prev,
        months: prev.months.filter((m) => m.id !== monthId),
      }));
    }
  }, []);

  const saveCustomPlan = useCallback(
    (newTitle: string, newSubtitle: string, newSubjects: StudySubject[], newMonths: StudyMonth[]) => {
      setConfig({
        title: newTitle.trim(),
        subtitle: newSubtitle.trim(),
        subjects: newSubjects,
        months: newMonths,
      });
    },
    []
  );

  // Statistics calculation
  const stats = useMemo(() => {
    let totalChapters = 0;
    let completedChapters = 0;
    let routineChapters = 0;
    const bySubject: Record<string, SubjectProgress> = {};

    config.subjects.forEach((s) => {
      bySubject[s.key] = { total: 0, completed: 0, routine: 0, percentage: 0 };
    });

    config.months.forEach((m) => {
      config.subjects.forEach((s) => {
        const val = m.subjectsData[s.key];
        if (Array.isArray(val)) {
          val.forEach((_, idx) => {
            totalChapters++;
            bySubject[s.key].total++;
            const st = trackerState[getCardKey(m.n, s.key, idx)] || { r: false, d: false };
            if (st.d) {
              completedChapters++;
              bySubject[s.key].completed++;
            }
            if (st.r) {
              routineChapters++;
              bySubject[s.key].routine++;
            }
          });
        }
      });
    });

    config.subjects.forEach((s) => {
      const sub = bySubject[s.key];
      sub.percentage = sub.total > 0 ? Math.round((sub.completed / sub.total) * 100) : 0;
    });

    const overallPercentage =
      totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    return {
      totalChapters,
      completedChapters,
      routineChapters,
      overallPercentage,
      bySubject,
    };
  }, [config, trackerState, getCardKey]);

  return {
    config,
    trackerState,
    openMonths,
    selectedSubjectFilter,
    setSelectedSubjectFilter,
    searchQuery,
    setSearchQuery,
    stats,
    getChapterState,
    toggleChapterStatus,
    toggleMonth,
    expandAll,
    collapseAll,
    resetToDefaults,
    exportPlanJSON,
    importPlanJSON,
    addChapter,
    updateChapter,
    deleteChapter,
    updateMonth,
    deleteMonth,
    saveCustomPlan,
  };
}
