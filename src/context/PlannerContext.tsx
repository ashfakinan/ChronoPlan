import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { PlannerContextType } from './planner/types';
import { usePlannerDataSync } from './planner/usePlannerDataSync';
import { usePlannerOperations } from './planner/usePlannerOperations';
import { usePlannerMorningReport } from './planner/usePlannerMorningReport';

export type { PlannerContextType } from './planner/types';

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, updateUserPreferences } = useAuth();

  // 1. Data synchronization & offline persistence
  const {
    planners,
    setPlanners,
    activePlannerId,
    setActivePlannerId,
    subjects,
    setSubjects,
    tasks,
    setTasks,
    notes,
    setNotes,
    schedules,
    setSchedules,
    todos,
    setTodos,
    isSyncing,
  } = usePlannerDataSync(currentUser);

  // 2. Active planner object
  const activePlanner = useMemo(() => {
    if (!planners.length) return null;
    const found = planners.find((p) => p.id === activePlannerId);
    return found || planners[0];
  }, [planners, activePlannerId]);

  // 3. CRUD and batch operations
  const operations = usePlannerOperations({
    currentUser,
    planners,
    setPlanners,
    activePlannerId,
    setActivePlannerId,
    subjects,
    setSubjects,
    tasks,
    setTasks,
    notes,
    setNotes,
    schedules,
    setSchedules,
    todos,
    setTodos,
  });

  // 4. Daily morning report, stats & auto-rollover
  const morningReport = usePlannerMorningReport({
    currentUser,
    tasks,
    setTasks,
    todos,
    updateTask: operations.updateTask,
    updateTodo: operations.updateTodo,
    updateUserPreferences,
  });

  const value: PlannerContextType = {
    planners,
    activePlanner,
    activePlannerId,
    setActivePlannerId,
    subjects,
    tasks,
    notes,
    schedules,
    todos,
    isSyncing,
    ...operations,
    ...morningReport,
  };

  return (
    <PlannerContext.Provider value={value}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
}
