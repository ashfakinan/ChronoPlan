import React, { useState, useEffect, useMemo, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import { PlannerTask, DailyTodo } from '../../types';
import { getTodayISO, getYesterdayISO } from '../../utils/dateUtils';
import type { User } from 'firebase/auth';

interface UsePlannerMorningReportParams {
  currentUser: User | null;
  tasks: PlannerTask[];
  setTasks: React.Dispatch<React.SetStateAction<PlannerTask[]>>;
  todos: DailyTodo[];
  updateTask: (id: string, updates: Partial<PlannerTask>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<DailyTodo>) => Promise<void>;
  updateUserPreferences: (prefs: { lastReportDismissedDate?: string }) => Promise<void>;
}

export function usePlannerMorningReport({
  currentUser,
  tasks,
  setTasks,
  todos,
  updateTask,
  updateTodo,
  updateUserPreferences,
}: UsePlannerMorningReportParams) {
  const [showMorningReport, setShowMorningReport] = useState<boolean>(false);
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<string | null>(null);
  const [autoRolloverNotice, setAutoRolloverNotice] = useState<{ count: number; date: string } | null>(null);

  const dismissAutoRolloverNotice = () => setAutoRolloverNotice(null);

  // Keep showMorningReport false by default on open (non-intrusive)
  useEffect(() => {
    setShowMorningReport(false);
  }, []);

  // Automatic rollover: If tasks of previous days are not finished,
  // move them to the next day (today) automatically
  const autoRolloverLockRef = useRef<boolean>(false);
  const autoRolloverProcessedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (tasks.length === 0 || autoRolloverLockRef.current) return;

    const today = getTodayISO();
    const unfinishedPastTasks = tasks.filter(
      (t) => t.date < today && !t.isCompleted && !autoRolloverProcessedRef.current.has(t.id)
    );

    if (unfinishedPastTasks.length === 0) return;

    autoRolloverLockRef.current = true;
    unfinishedPastTasks.forEach((t) => autoRolloverProcessedRef.current.add(t.id));

    const runAutoRollover = async () => {
      try {
        const now = new Date().toISOString();
        const updates = unfinishedPastTasks.map((t) => ({
          id: t.id,
          date: today,
          updatedAt: now,
        }));

        if (currentUser) {
          const promises = updates.map((u) =>
            updateDoc(doc(db, 'tasks', u.id), {
              date: u.date,
              updatedAt: u.updatedAt,
            })
          );
          await Promise.all(promises);
        } else {
          setTasks((prev) =>
            prev.map((t) => {
              const matched = updates.find((u) => u.id === t.id);
              return matched ? { ...t, date: matched.date, updatedAt: matched.updatedAt } : t;
            })
          );
        }

        setAutoRolloverNotice({
          count: updates.length,
          date: today,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'tasks/auto-rollover');
      } finally {
        autoRolloverLockRef.current = false;
      }
    };

    runAutoRollover();
  }, [tasks, currentUser, setTasks]);

  const dismissMorningReport = async () => {
    const today = getTodayISO();
    setShowMorningReport(false);
    if (currentUser) {
      await updateUserPreferences({ lastReportDismissedDate: today });
    } else {
      localStorage.setItem('cp_report_dismissed_date', today);
    }
  };

  const yesterdayStats = useMemo(() => {
    const yesterday = getYesterdayISO();
    const yTasks = tasks.filter((t) => t.date === yesterday);
    const completedTasks = yTasks.filter((t) => t.isCompleted);
    const remainingTasks = yTasks.filter((t) => !t.isCompleted);

    const yTodos = todos.filter((td) => td.date === yesterday);
    const completedTodos = yTodos.filter((td) => td.isCompleted);
    const remainingTodos = yTodos.filter((td) => !td.isCompleted);

    const totalCount = yTasks.length + yTodos.length;
    const completedCount = completedTasks.length + completedTodos.length;
    const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

    return {
      yesterdayDate: yesterday,
      completedTasks,
      remainingTasks,
      completedTodos,
      remainingTodos,
      totalCount,
      completedCount,
      rate,
    };
  }, [tasks, todos]);

  const rolloverYesterdayRemaining = async (): Promise<number> => {
    const today = getTodayISO();
    let count = 0;
    for (const task of yesterdayStats.remainingTasks) {
      await updateTask(task.id, { date: today });
      count++;
    }
    for (const todo of yesterdayStats.remainingTodos) {
      await updateTodo(todo.id, { date: today });
      count++;
    }
    return count;
  };

  return {
    showMorningReport,
    setShowMorningReport,
    dismissMorningReport,
    autoRolloverNotice,
    dismissAutoRolloverNotice,
    yesterdayStats,
    rolloverYesterdayRemaining,
    selectedDayForDetail,
    setSelectedDayForDetail,
  };
}
