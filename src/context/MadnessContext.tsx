import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { useAuth } from './AuthContext';
import { MadnessCategory, MadnessDay, MadnessTask } from '../types';

interface MadnessContextType {
  days: MadnessDay[];
  categories: MadnessCategory[];
  tasks: MadnessTask[];
  isSyncing: boolean;

  // Day Operations
  addDay: (name?: string) => Promise<MadnessDay>;
  renameDay: (dayId: string, newName: string) => Promise<void>;
  deleteDay: (dayId: string) => Promise<void>;
  reorderDays: (newDays: MadnessDay[]) => Promise<void>;

  // Category Operations
  addCategory: (name: string, color: string) => Promise<MadnessCategory>;
  updateCategory: (categoryId: string, updates: Partial<MadnessCategory>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Task Operations
  addTask: (
    dayId: string,
    title: string,
    categoryId?: string,
    notes?: string,
    isContinued?: boolean,
    continuedGroupId?: string
  ) => Promise<MadnessTask>;
  addBatchTasks: (
    tasksToCreate: {
      dayId: string;
      title: string;
      categoryId?: string;
      notes?: string;
      isContinued?: boolean;
      continuedGroupId?: string;
    }[]
  ) => Promise<MadnessTask[]>;
  continueTaskAcrossDays: (
    taskId: string,
    targetDayIds: string[]
  ) => Promise<MadnessTask[]>;
  updateTask: (taskId: string, updates: Partial<MadnessTask>) => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  batchDeleteTasks: (taskIds: string[]) => Promise<void>;
  batchUpdateTasksCategory: (taskIds: string[], categoryId?: string) => Promise<void>;
  batchMoveTasksToDay: (taskIds: string[], targetDayId: string) => Promise<void>;
  moveTaskToDay: (taskId: string, targetDayId: string, targetOrder?: number) => Promise<void>;
  duplicateTask: (taskId: string) => Promise<void>;
  clearCompletedInDay: (dayId: string) => Promise<void>;
  moveIncompleteToDay: (fromDayId: string, toDayId: string) => Promise<void>;

  // Filtering & Stats
  filterCategoryId: string | null;
  setFilterCategoryId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalTasksCount: number;
  completedTasksCount: number;
  pendingTasksCount: number;
}

const DEFAULT_CATEGORIES: { name: string; color: string }[] = [
  { name: 'Work', color: '#3B82F6' },
  { name: 'Personal', color: '#10B981' },
  { name: 'Urgent', color: '#EF4444' },
  { name: 'Fitness', color: '#F59E0B' },
  { name: 'Study', color: '#8B5CF6' },
  { name: 'Errands', color: '#06B6D4' },
  { name: 'Creative', color: '#EC4899' },
];

const DEFAULT_DAYS = [
  'Day 1',
  'Day 2',
  'Day 3',
  'Day 4',
  'Day 5',
  'Day 6',
  'Day 7',
];

function generateId(prefix = 'madness'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const MadnessContext = createContext<MadnessContextType | undefined>(undefined);

export function MadnessProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  const [days, setDays] = useState<MadnessDay[]>([]);
  const [categories, setCategories] = useState<MadnessCategory[]>([]);
  const [tasks, setTasks] = useState<MadnessTask[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Initial load from localStorage or seed
  useEffect(() => {
    if (!currentUser) {
      const localDays = localStorage.getItem('cp_madness_days');
      const localCats = localStorage.getItem('cp_madness_categories');
      const localTasks = localStorage.getItem('cp_madness_tasks');

      if (localDays && localCats) {
        try {
          setDays(JSON.parse(localDays));
          setCategories(JSON.parse(localCats));
          setTasks(localTasks ? JSON.parse(localTasks) : []);
          return;
        } catch {
          // fallback to seed
        }
      }

      seedDefaults();
    }
  }, [currentUser]);

  function seedDefaults() {
    const seedCats: MadnessCategory[] = DEFAULT_CATEGORIES.map((c) => ({
      id: generateId('cat'),
      userId: 'guest',
      name: c.name,
      color: c.color,
      createdAt: new Date().toISOString(),
    }));

    const seedDaysList: MadnessDay[] = DEFAULT_DAYS.map((name, index) => ({
      id: generateId('day'),
      userId: 'guest',
      name,
      order: index,
    }));

    const seedTasksList: MadnessTask[] = [
      {
        id: generateId('mtask'),
        userId: 'guest',
        dayId: seedDaysList[0].id,
        title: 'Review weekly goals & brainstorm madness',
        categoryId: seedCats[0].id,
        isCompleted: false,
        order: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('mtask'),
        userId: 'guest',
        dayId: seedDaysList[0].id,
        title: 'Morning stretch & 20 min cardio',
        categoryId: seedCats[3].id,
        isCompleted: true,
        order: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('mtask'),
        userId: 'guest',
        dayId: seedDaysList[1].id,
        title: 'Complete project sprint deliverables',
        categoryId: seedCats[0].id,
        isCompleted: false,
        order: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('mtask'),
        userId: 'guest',
        dayId: seedDaysList[1].id,
        title: 'Buy groceries & household items',
        categoryId: seedCats[5].id,
        isCompleted: false,
        order: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('mtask'),
        userId: 'guest',
        dayId: seedDaysList[2].id,
        title: 'Read 2 chapters of system architecture',
        categoryId: seedCats[4].id,
        isCompleted: false,
        order: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('mtask'),
        userId: 'guest',
        dayId: seedDaysList[3].id,
        title: 'Pay electric bill & renew subscription',
        categoryId: seedCats[2].id,
        isCompleted: false,
        order: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('mtask'),
        userId: 'guest',
        dayId: seedDaysList[4].id,
        title: 'Sketch UI concepts for creative side project',
        categoryId: seedCats[6].id,
        isCompleted: false,
        order: 0,
        createdAt: new Date().toISOString(),
      },
    ];

    setDays(seedDaysList);
    setCategories(seedCats);
    setTasks(seedTasksList);

    localStorage.setItem('cp_madness_days', JSON.stringify(seedDaysList));
    localStorage.setItem('cp_madness_categories', JSON.stringify(seedCats));
    localStorage.setItem('cp_madness_tasks', JSON.stringify(seedTasksList));
  }

  // Sync to Firestore when user is signed in
  useEffect(() => {
    if (!currentUser) return;

    setIsSyncing(true);
    const uid = currentUser.uid;

    const daysQ = query(collection(db, 'madness_days'), where('userId', '==', uid));
    const catsQ = query(collection(db, 'madness_categories'), where('userId', '==', uid));
    const tasksQ = query(collection(db, 'madness_tasks'), where('userId', '==', uid));

    const unsubDays = onSnapshot(
      daysQ,
      (snapshot) => {
        const loaded: MadnessDay[] = [];
        snapshot.forEach((d) => loaded.push(d.data() as MadnessDay));
        loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        if (loaded.length === 0) {
          // Initialize user with defaults if empty
          DEFAULT_DAYS.forEach(async (name, index) => {
            const dayId = generateId('day');
            const dayDoc: MadnessDay = {
              id: dayId,
              userId: uid,
              name,
              order: index,
            };
            try {
              await setDoc(doc(db, 'madness_days', dayId), dayDoc);
            } catch (e) {
              handleFirestoreError(e, OperationType.CREATE, `madness_days/${dayId}`);
            }
          });
        } else {
          setDays(loaded);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'madness_days')
    );

    const unsubCats = onSnapshot(
      catsQ,
      (snapshot) => {
        const loaded: MadnessCategory[] = [];
        snapshot.forEach((d) => loaded.push(d.data() as MadnessCategory));
        if (loaded.length === 0) {
          DEFAULT_CATEGORIES.forEach(async (c) => {
            const catId = generateId('cat');
            const catDoc: MadnessCategory = {
              id: catId,
              userId: uid,
              name: c.name,
              color: c.color,
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(doc(db, 'madness_categories', catId), catDoc);
            } catch (e) {
              handleFirestoreError(e, OperationType.CREATE, `madness_categories/${catId}`);
            }
          });
        } else {
          setCategories(loaded);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'madness_categories')
    );

    const unsubTasks = onSnapshot(
      tasksQ,
      (snapshot) => {
        const loaded: MadnessTask[] = [];
        snapshot.forEach((d) => loaded.push(d.data() as MadnessTask));
        loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setTasks(loaded);
        setIsSyncing(false);
      },
      (err) => {
        setIsSyncing(false);
        handleFirestoreError(err, OperationType.LIST, 'madness_tasks');
      }
    );

    return () => {
      unsubDays();
      unsubCats();
      unsubTasks();
    };
  }, [currentUser]);

  // Persist local state for guests
  useEffect(() => {
    if (!currentUser && days.length > 0) {
      localStorage.setItem('cp_madness_days', JSON.stringify(days));
      localStorage.setItem('cp_madness_categories', JSON.stringify(categories));
      localStorage.setItem('cp_madness_tasks', JSON.stringify(tasks));
    }
  }, [currentUser, days, categories, tasks]);

  // --- Day Operations ---
  const addDay = async (name?: string): Promise<MadnessDay> => {
    const id = generateId('day');
    const userId = currentUser ? currentUser.uid : 'guest';
    const dayNumber = days.length + 1;
    const dayName = name?.trim() || `Day ${dayNumber}`;
    const newDay: MadnessDay = {
      id,
      userId,
      name: dayName,
      order: days.length,
    };

    // Optimistically update local state immediately
    setDays((prev) => [...prev, newDay]);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'madness_days', id), newDay);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `madness_days/${id}`);
      }
    }
    return newDay;
  };

  const renameDay = async (dayId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'madness_days', dayId), { name: trimmed });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `madness_days/${dayId}`);
      }
    } else {
      setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, name: trimmed } : d)));
    }
  };

  const deleteDay = async (dayId: string) => {
    if (days.length <= 1) return; // Keep at least one day
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'madness_days', dayId));
        // Also delete associated tasks
        const tasksToDelete = tasks.filter((t) => t.dayId === dayId);
        for (const t of tasksToDelete) {
          await deleteDoc(doc(db, 'madness_tasks', t.id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `madness_days/${dayId}`);
      }
    } else {
      setDays((prev) => prev.filter((d) => d.id !== dayId));
      setTasks((prev) => prev.filter((t) => t.dayId !== dayId));
    }
  };

  const reorderDays = async (newDays: MadnessDay[]) => {
    const updated = newDays.map((d, index) => ({ ...d, order: index }));
    setDays(updated);
    if (currentUser) {
      for (const d of updated) {
        try {
          await updateDoc(doc(db, 'madness_days', d.id), { order: d.order });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `madness_days/${d.id}`);
        }
      }
    }
  };

  // --- Category Operations ---
  const addCategory = async (name: string, color: string): Promise<MadnessCategory> => {
    const id = generateId('cat');
    const userId = currentUser ? currentUser.uid : 'guest';
    const newCat: MadnessCategory = {
      id,
      userId,
      name: name.trim(),
      color: color.trim() || '#3B82F6',
      createdAt: new Date().toISOString(),
    };

    if (currentUser) {
      try {
        await setDoc(doc(db, 'madness_categories', id), newCat);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `madness_categories/${id}`);
      }
    } else {
      setCategories((prev) => [...prev, newCat]);
    }
    return newCat;
  };

  const updateCategory = async (categoryId: string, updates: Partial<MadnessCategory>) => {
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'madness_categories', categoryId), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `madness_categories/${categoryId}`);
      }
    } else {
      setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, ...updates } : c)));
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'madness_categories', categoryId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `madness_categories/${categoryId}`);
      }
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      // Reset categoryId on tasks using it
      setTasks((prev) =>
        prev.map((t) => (t.categoryId === categoryId ? { ...t, categoryId: undefined } : t))
      );
    }
  };

  // --- Task Operations ---
  const addTask = async (
    dayId: string,
    title: string,
    categoryId?: string,
    notes?: string,
    isContinued?: boolean,
    continuedGroupId?: string
  ): Promise<MadnessTask> => {
    const id = generateId('mtask');
    const userId = currentUser ? currentUser.uid : 'guest';
    const dayTasks = tasks.filter((t) => t.dayId === dayId);
    const nowIso = new Date().toISOString();

    const cleanCat = categoryId && categoryId.trim() ? categoryId.trim() : undefined;
    const cleanNotes = notes && notes.trim() ? notes.trim() : undefined;

    const newTask: MadnessTask = {
      id,
      userId,
      dayId,
      title: title.trim(),
      categoryId: cleanCat,
      isCompleted: false,
      notes: cleanNotes,
      order: dayTasks.length,
      isContinued: isContinued || false,
      continuedGroupId: continuedGroupId || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Optimistically update local state immediately
    setTasks((prev) => [...prev, newTask]);

    if (currentUser) {
      // Build safe object for Firestore (NO undefined values)
      const firestoreDoc: Record<string, any> = {
        id,
        userId,
        dayId,
        title: title.trim(),
        isCompleted: false,
        order: dayTasks.length,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      if (cleanCat) {
        firestoreDoc.categoryId = cleanCat;
      }
      if (cleanNotes) {
        firestoreDoc.notes = cleanNotes;
      }
      if (isContinued) {
        firestoreDoc.isContinued = isContinued;
      }
      if (continuedGroupId) {
        firestoreDoc.continuedGroupId = continuedGroupId;
      }

      try {
        await setDoc(doc(db, 'madness_tasks', id), firestoreDoc);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `madness_tasks/${id}`);
      }
    }
    return newTask;
  };

  const addBatchTasks = async (
    tasksToCreate: {
      dayId: string;
      title: string;
      categoryId?: string;
      notes?: string;
      isContinued?: boolean;
      continuedGroupId?: string;
    }[]
  ): Promise<MadnessTask[]> => {
    if (tasksToCreate.length === 0) return [];

    const userId = currentUser ? currentUser.uid : 'guest';
    const nowIso = new Date().toISOString();
    const createdList: MadnessTask[] = [];

    // Group by dayId to track order correctly
    const dayCounts: Record<string, number> = {};

    tasksToCreate.forEach((item) => {
      const id = generateId('mtask');
      const currentDayTasksCount = tasks.filter((t) => t.dayId === item.dayId).length;
      const orderOffset = dayCounts[item.dayId] || 0;
      dayCounts[item.dayId] = orderOffset + 1;

      const cleanCat = item.categoryId && item.categoryId.trim() ? item.categoryId.trim() : undefined;
      const cleanNotes = item.notes && item.notes.trim() ? item.notes.trim() : undefined;

      const newTask: MadnessTask = {
        id,
        userId,
        dayId: item.dayId,
        title: item.title.trim(),
        categoryId: cleanCat,
        isCompleted: false,
        notes: cleanNotes,
        order: currentDayTasksCount + orderOffset,
        isContinued: item.isContinued || false,
        continuedGroupId: item.continuedGroupId || undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      createdList.push(newTask);
    });

    setTasks((prev) => [...prev, ...createdList]);

    if (currentUser) {
      for (const t of createdList) {
        const firestoreDoc: Record<string, any> = {
          id: t.id,
          userId: t.userId,
          dayId: t.dayId,
          title: t.title,
          isCompleted: false,
          order: t.order,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        if (t.categoryId) firestoreDoc.categoryId = t.categoryId;
        if (t.notes) firestoreDoc.notes = t.notes;
        if (t.isContinued) firestoreDoc.isContinued = t.isContinued;
        if (t.continuedGroupId) firestoreDoc.continuedGroupId = t.continuedGroupId;

        try {
          await setDoc(doc(db, 'madness_tasks', t.id), firestoreDoc);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `madness_tasks/${t.id}`);
        }
      }
    }

    return createdList;
  };

  const continueTaskAcrossDays = async (
    taskId: string,
    targetDayIds: string[]
  ): Promise<MadnessTask[]> => {
    const sourceTask = tasks.find((t) => t.id === taskId);
    if (!sourceTask || targetDayIds.length === 0) return [];

    const groupId = sourceTask.continuedGroupId || generateId('contgroup');

    // Update source task to be marked as continued with group id
    if (!sourceTask.isContinued || !sourceTask.continuedGroupId) {
      await updateTask(sourceTask.id, {
        isContinued: true,
        continuedGroupId: groupId,
      });
    }

    // Filter out source task's dayId so we don't create duplicate on same day
    const otherDayIds = targetDayIds.filter((dId) => dId !== sourceTask.dayId);
    if (otherDayIds.length === 0) return [];

    const itemsToCreate = otherDayIds.map((dayId) => ({
      dayId,
      title: sourceTask.title,
      categoryId: sourceTask.categoryId,
      notes: sourceTask.notes,
      isContinued: true,
      continuedGroupId: groupId,
    }));

    return await addBatchTasks(itemsToCreate);
  };

  const updateTask = async (taskId: string, updates: Partial<MadnessTask>) => {
    const nowIso = new Date().toISOString();
    const cleanUpdates: Record<string, any> = { updatedAt: nowIso };

    Object.entries(updates).forEach(([key, val]) => {
      if (val !== undefined) {
        cleanUpdates[key] = val;
      }
    });

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: nowIso } : t)));

    if (currentUser) {
      try {
        await updateDoc(doc(db, 'madness_tasks', taskId), cleanUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `madness_tasks/${taskId}`);
      }
    }
  };

  const toggleTaskComplete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    await updateTask(taskId, { isCompleted: !task.isCompleted });
  };

  const deleteTask = async (taskId: string) => {
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'madness_tasks', taskId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `madness_tasks/${taskId}`);
      }
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const batchDeleteTasks = async (taskIds: string[]) => {
    if (!taskIds.length) return;
    if (currentUser) {
      try {
        const deletions = taskIds.map((id) => deleteDoc(doc(db, 'madness_tasks', id)));
        await Promise.all(deletions);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `madness_tasks/batch`);
      }
    } else {
      setTasks((prev) => prev.filter((t) => !taskIds.includes(t.id)));
    }
  };

  const batchUpdateTasksCategory = async (taskIds: string[], categoryId?: string) => {
    if (!taskIds.length) return;
    const now = new Date().toISOString();
    if (currentUser) {
      try {
        const batchUpdates = taskIds.map((id) =>
          updateDoc(doc(db, 'madness_tasks', id), {
            categoryId: categoryId || null,
            updatedAt: now,
          })
        );
        await Promise.all(batchUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `madness_tasks/batch-category`);
      }
    } else {
      setTasks((prev) =>
        prev.map((t) =>
          taskIds.includes(t.id) ? { ...t, categoryId, updatedAt: now } : t
        )
      );
    }
  };

  const batchMoveTasksToDay = async (taskIds: string[], targetDayId: string) => {
    if (!taskIds.length) return;
    const now = new Date().toISOString();
    if (currentUser) {
      try {
        const batchUpdates = taskIds.map((id) =>
          updateDoc(doc(db, 'madness_tasks', id), {
            dayId: targetDayId,
            updatedAt: now,
          })
        );
        await Promise.all(batchUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `madness_tasks/batch-move`);
      }
    } else {
      setTasks((prev) =>
        prev.map((t) =>
          taskIds.includes(t.id) ? { ...t, dayId: targetDayId, updatedAt: now } : t
        )
      );
    }
  };

  const moveTaskToDay = async (
    taskId: string,
    targetDayId: string,
    targetOrder?: number
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const destTasks = tasks
      .filter((t) => t.dayId === targetDayId && t.id !== taskId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const insertIndex = targetOrder !== undefined ? targetOrder : destTasks.length;
    destTasks.splice(insertIndex, 0, { ...task, dayId: targetDayId });

    // Reorder destination tasks
    const reordered = destTasks.map((t, idx) => ({ ...t, order: idx }));

    if (currentUser) {
      for (const t of reordered) {
        try {
          await updateDoc(doc(db, 'madness_tasks', t.id), {
            dayId: targetDayId,
            order: t.order,
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `madness_tasks/${t.id}`);
        }
      }
    } else {
      setTasks((prev) => {
        const withoutMoved = prev.filter((t) => t.dayId !== targetDayId && t.id !== taskId);
        return [...withoutMoved, ...reordered];
      });
    }
  };

  const duplicateTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    await addTask(task.dayId, `${task.title} (Copy)`, task.categoryId, task.notes);
  };

  const clearCompletedInDay = async (dayId: string) => {
    const toDelete = tasks.filter((t) => t.dayId === dayId && t.isCompleted);
    for (const t of toDelete) {
      await deleteTask(t.id);
    }
  };

  const moveIncompleteToDay = async (fromDayId: string, toDayId: string) => {
    const incomplete = tasks.filter((t) => t.dayId === fromDayId && !t.isCompleted);
    for (const t of incomplete) {
      await moveTaskToDay(t.id, toDayId);
    }
  };

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
  const pendingTasksCount = totalTasksCount - completedTasksCount;

  return (
    <MadnessContext.Provider
      value={{
        days,
        categories,
        tasks,
        isSyncing,
        addDay,
        renameDay,
        deleteDay,
        reorderDays,
        addCategory,
        updateCategory,
        deleteCategory,
        addTask,
        addBatchTasks,
        continueTaskAcrossDays,
        updateTask,
        toggleTaskComplete,
        deleteTask,
        batchDeleteTasks,
        batchUpdateTasksCategory,
        batchMoveTasksToDay,
        moveTaskToDay,
        duplicateTask,
        clearCompletedInDay,
        moveIncompleteToDay,
        filterCategoryId,
        setFilterCategoryId,
        searchQuery,
        setSearchQuery,
        totalTasksCount,
        completedTasksCount,
        pendingTasksCount,
      }}
    >
      {children}
    </MadnessContext.Provider>
  );
}

export function useMadness() {
  const context = useContext(MadnessContext);
  if (!context) {
    throw new Error('useMadness must be used within a MadnessProvider');
  }
  return context;
}
