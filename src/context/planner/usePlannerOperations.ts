import React from 'react';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import {
  Planner,
  PlannerTask,
  Subject,
  ImportantNote,
  FixedSchedule,
  DailyTodo,
  NoteTag,
  Priority,
} from '../../types';
import { DEFAULT_DAY_PARTS, generateId } from './constants';
import { getTodayISO } from '../../utils/dateUtils';
import type { User } from 'firebase/auth';

interface UsePlannerOperationsParams {
  currentUser: User | null;
  planners: Planner[];
  setPlanners: React.Dispatch<React.SetStateAction<Planner[]>>;
  activePlannerId: string | null;
  setActivePlannerId: React.Dispatch<React.SetStateAction<string | null>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  tasks: PlannerTask[];
  setTasks: React.Dispatch<React.SetStateAction<PlannerTask[]>>;
  notes: ImportantNote[];
  setNotes: React.Dispatch<React.SetStateAction<ImportantNote[]>>;
  schedules: FixedSchedule[];
  setSchedules: React.Dispatch<React.SetStateAction<FixedSchedule[]>>;
  todos: DailyTodo[];
  setTodos: React.Dispatch<React.SetStateAction<DailyTodo[]>>;
}

export function usePlannerOperations({
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
}: UsePlannerOperationsParams) {
  // --- Planners CRUD ---
  const createPlanner = async (
    title: string,
    startDate: string,
    endDate: string,
    dayParts: string[] = DEFAULT_DAY_PARTS
  ): Promise<Planner> => {
    const id = generateId('plan');
    const userId = currentUser ? currentUser.uid : 'guest';
    const newPlanner: Planner = {
      id,
      userId,
      title: title.trim(),
      startDate,
      endDate,
      dayParts: dayParts.length > 0 ? dayParts : [...DEFAULT_DAY_PARTS],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      try {
        await setDoc(doc(db, 'planners', id), newPlanner);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `planners/${id}`);
      }
    } else {
      setPlanners((prev) => [...prev, newPlanner]);
    }
    setActivePlannerId(id);
    return newPlanner;
  };

  const updatePlanner = async (id: string, updates: Partial<Planner>) => {
    const cleanUpdates = { ...updates, updatedAt: new Date().toISOString() };
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'planners', id), cleanUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `planners/${id}`);
      }
    } else {
      setPlanners((prev) => prev.map((p) => (p.id === id ? { ...p, ...cleanUpdates } : p)));
    }
  };

  const deletePlanner = async (id: string) => {
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'planners', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `planners/${id}`);
      }
    } else {
      setPlanners((prev) => prev.filter((p) => p.id !== id));
      if (activePlannerId === id) {
        const remaining = planners.filter((p) => p.id !== id);
        setActivePlannerId(remaining.length ? remaining[0].id : null);
      }
    }
  };

  // --- Subjects CRUD ---
  const createSubject = async (name: string, color: string): Promise<Subject> => {
    const id = generateId('subj');
    const userId = currentUser ? currentUser.uid : 'guest';
    const newSubj: Subject = {
      id,
      userId,
      name: name.trim(),
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      try {
        await setDoc(doc(db, 'subjects', id), newSubj);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `subjects/${id}`);
      }
    } else {
      setSubjects((prev) => [...prev, newSubj]);
    }
    return newSubj;
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    const cleanUpdates = { ...updates, updatedAt: new Date().toISOString() };
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'subjects', id), cleanUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `subjects/${id}`);
      }
    } else {
      setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...cleanUpdates } : s)));
    }
  };

  const deleteSubject = async (id: string) => {
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'subjects', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `subjects/${id}`);
      }
    } else {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // --- Tasks CRUD ---
  const createTask = async (
    data: Omit<PlannerTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<PlannerTask> => {
    const id = generateId('task');
    const userId = currentUser ? currentUser.uid : 'guest';
    const newTask: PlannerTask = {
      ...data,
      id,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      try {
        await setDoc(doc(db, 'tasks', id), newTask);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `tasks/${id}`);
      }
    } else {
      setTasks((prev) => [...prev, newTask]);
    }
    return newTask;
  };

  const createBatchTasks = async (
    tasksData: Omit<PlannerTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<PlannerTask[]> => {
    if (!tasksData.length) return [];
    const userId = currentUser ? currentUser.uid : 'guest';
    const now = new Date().toISOString();
    const newTasks: PlannerTask[] = tasksData.map((data, index) => ({
      ...data,
      id: `${generateId('task')}_${index}`,
      userId,
      createdAt: now,
      updatedAt: now,
    }));

    if (currentUser) {
      try {
        const batchCreates = newTasks.map((t) => setDoc(doc(db, 'tasks', t.id), t));
        await Promise.all(batchCreates);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'tasks (batch)');
      }
    } else {
      setTasks((prev) => [...prev, ...newTasks]);
    }
    return newTasks;
  };

  const updateTask = async (id: string, updates: Partial<PlannerTask>) => {
    const cleanUpdates = { ...updates, updatedAt: new Date().toISOString() };
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'tasks', id), cleanUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${id}`);
      }
    } else {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...cleanUpdates } : t)));
    }
  };

  const deleteTask = async (id: string) => {
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`);
      }
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await updateTask(id, { isCompleted: !task.isCompleted });
  };

  const moveTask = async (
    taskId: string,
    targetDate: string,
    targetDayPart: string,
    targetTaskId?: string,
    position: 'before' | 'after' = 'after'
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const destTasks = tasks
      .filter((t) => t.date === targetDate && t.dayPart === targetDayPart && t.id !== taskId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    let insertIndex = destTasks.length;
    if (targetTaskId) {
      const idx = destTasks.findIndex((t) => t.id === targetTaskId);
      if (idx !== -1) {
        insertIndex = position === 'before' ? idx : idx + 1;
      }
    }

    const reorderedList = [...destTasks];
    reorderedList.splice(insertIndex, 0, {
      ...task,
      date: targetDate,
      dayPart: targetDayPart,
    });

    const updates: { id: string; date: string; dayPart: string; order: number }[] = reorderedList.map(
      (t, index) => ({
        id: t.id,
        date: t.date,
        dayPart: t.dayPart,
        order: index,
      })
    );

    if (currentUser) {
      try {
        const batchUpdates = updates.map((u) =>
          updateDoc(doc(db, 'tasks', u.id), {
            date: u.date,
            dayPart: u.dayPart,
            order: u.order,
            updatedAt: new Date().toISOString(),
          })
        );
        await Promise.all(batchUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
      }
    } else {
      setTasks((prev) =>
        prev.map((t) => {
          const matching = updates.find((u) => u.id === t.id);
          if (matching) {
            return {
              ...t,
              date: matching.date,
              dayPart: matching.dayPart,
              order: matching.order,
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        })
      );
    }
  };

  const batchMoveTasks = async (
    taskIds: string[],
    targetDate: string,
    targetDayPart: string
  ) => {
    if (!taskIds.length) return;

    const destTasks = tasks
      .filter((t) => t.date === targetDate && t.dayPart === targetDayPart && !taskIds.includes(t.id))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const movingTasks = tasks
      .filter((t) => taskIds.includes(t.id))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const reorderedList = [...destTasks, ...movingTasks].map((t, idx) => ({
      id: t.id,
      date: targetDate,
      dayPart: targetDayPart,
      order: idx,
    }));

    if (currentUser) {
      try {
        const batchUpdates = reorderedList
          .filter((u) => taskIds.includes(u.id))
          .map((u) =>
            updateDoc(doc(db, 'tasks', u.id), {
              date: u.date,
              dayPart: u.dayPart,
              order: u.order,
              updatedAt: new Date().toISOString(),
            })
          );
        await Promise.all(batchUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/batch`);
      }
    } else {
      setTasks((prev) =>
        prev.map((t) => {
          const match = reorderedList.find((u) => u.id === t.id);
          if (match && taskIds.includes(t.id)) {
            return {
              ...t,
              date: match.date,
              dayPart: match.dayPart,
              order: match.order,
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        })
      );
    }
  };

  const batchToggleComplete = async (taskIds: string[], isCompleted: boolean) => {
    if (!taskIds.length) return;
    const now = new Date().toISOString();
    if (currentUser) {
      try {
        const updates = taskIds.map((id) =>
          updateDoc(doc(db, 'tasks', id), { isCompleted, updatedAt: now })
        );
        await Promise.all(updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/batch`);
      }
    } else {
      setTasks((prev) =>
        prev.map((t) => (taskIds.includes(t.id) ? { ...t, isCompleted, updatedAt: now } : t))
      );
    }
  };

  const batchDeleteTasks = async (taskIds: string[]) => {
    if (!taskIds.length) return;
    if (currentUser) {
      try {
        const deletions = taskIds.map((id) => deleteDoc(doc(db, 'tasks', id)));
        await Promise.all(deletions);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tasks/batch`);
      }
    } else {
      setTasks((prev) => prev.filter((t) => !taskIds.includes(t.id)));
    }
  };

  const batchUpdateTasksSubject = async (taskIds: string[], subjectId: string) => {
    if (!taskIds.length) return;
    const now = new Date().toISOString();
    if (currentUser) {
      try {
        const batchUpdates = taskIds.map((id) =>
          updateDoc(doc(db, 'tasks', id), { subjectId, updatedAt: now })
        );
        await Promise.all(batchUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/batch-subject`);
      }
    } else {
      setTasks((prev) =>
        prev.map((t) => (taskIds.includes(t.id) ? { ...t, subjectId, updatedAt: now } : t))
      );
    }
  };

  // --- Notes CRUD ---
  const createNote = async (
    title: string,
    content: string,
    tag: NoteTag,
    date: string
  ): Promise<ImportantNote> => {
    const id = generateId('note');
    const userId = currentUser ? currentUser.uid : 'guest';
    const newNote: ImportantNote = {
      id,
      userId,
      title: title.trim(),
      content: content.trim(),
      tag,
      date,
      isDone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      try {
        await setDoc(doc(db, 'notes', id), newNote);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `notes/${id}`);
      }
    } else {
      setNotes((prev) => [...prev, newNote]);
    }
    return newNote;
  };

  const updateNote = async (id: string, updates: Partial<ImportantNote>) => {
    const cleanUpdates = { ...updates, updatedAt: new Date().toISOString() };
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'notes', id), cleanUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `notes/${id}`);
      }
    } else {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...cleanUpdates } : n)));
    }
  };

  const deleteNote = async (id: string) => {
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'notes', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `notes/${id}`);
      }
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const toggleNoteDone = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    await updateNote(id, { isDone: !note.isDone });
  };

  // --- Fixed Schedules CRUD ---
  const createSchedule = async (
    dayPart: string,
    text: string = '',
    timeRange: string = ''
  ): Promise<FixedSchedule> => {
    const id = generateId('sched');
    const userId = currentUser ? currentUser.uid : 'guest';
    const newSched: FixedSchedule = {
      id,
      userId,
      dayPart: dayPart.trim() || 'Fixed Plan',
      text: text.trim(),
      timeRange: timeRange.trim(),
      order: schedules.length,
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      try {
        await setDoc(doc(db, 'schedules', id), newSched);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `schedules/${id}`);
      }
    } else {
      setSchedules((prev) => [...prev, newSched]);
    }
    return newSched;
  };

  const updateSchedule = async (id: string, updates: Partial<FixedSchedule>) => {
    const cleanUpdates = { ...updates, updatedAt: new Date().toISOString() };
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'schedules', id), cleanUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `schedules/${id}`);
      }
    } else {
      setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...cleanUpdates } : s)));
    }
  };

  const renameSchedule = async (id: string, newDayPart: string) => {
    await updateSchedule(id, { dayPart: newDayPart.trim() });
  };

  const deleteSchedule = async (id: string) => {
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'schedules', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `schedules/${id}`);
      }
    } else {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const saveScheduleForDayPart = async (dayPart: string, text: string) => {
    const existing = schedules.find((s) => s.dayPart === dayPart);
    if (existing) {
      await updateSchedule(existing.id, { text });
    } else {
      await createSchedule(dayPart, text);
    }
  };

  // --- Daily To-Do List CRUD ---
  const createTodo = async (
    text: string,
    date: string = getTodayISO(),
    priority: Priority = 'medium',
    category?: string
  ): Promise<DailyTodo> => {
    const id = generateId('todo');
    const userId = currentUser ? currentUser.uid : 'guest';
    const newTodo: DailyTodo = {
      id,
      userId,
      text: text.trim(),
      date,
      isCompleted: false,
      priority,
      ...(category ? { category: category.trim() } : {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      try {
        await setDoc(doc(db, 'todos', id), newTodo);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `todos/${id}`);
      }
    } else {
      setTodos((prev) => [...prev, newTodo]);
    }
    return newTodo;
  };

  const toggleTodoComplete = async (id: string) => {
    const item = todos.find((t) => t.id === id);
    if (!item) return;
    await updateTodo(id, { isCompleted: !item.isCompleted });
  };

  const updateTodo = async (id: string, updates: Partial<DailyTodo>) => {
    const cleanUpdates = { ...updates, updatedAt: new Date().toISOString() };
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'todos', id), cleanUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `todos/${id}`);
      }
    } else {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...cleanUpdates } : t)));
    }
  };

  const deleteTodo = async (id: string) => {
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'todos', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `todos/${id}`);
      }
    } else {
      setTodos((prev) => prev.filter((t) => !todoIdFilter(t.id, id)));
    }
  };

  function todoIdFilter(itemId: string, targetId: string) {
    return itemId === targetId;
  }

  const batchDeleteTodos = async (todoIds: string[]) => {
    if (!todoIds.length) return;
    if (currentUser) {
      try {
        const deletions = todoIds.map((id) => deleteDoc(doc(db, 'todos', id)));
        await Promise.all(deletions);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `todos/batch`);
      }
    } else {
      setTodos((prev) => prev.filter((t) => !todoIds.includes(t.id)));
    }
  };

  const batchUpdateTodosCategory = async (todoIds: string[], category: string) => {
    if (!todoIds.length) return;
    const now = new Date().toISOString();
    if (currentUser) {
      try {
        const batchUpdates = todoIds.map((id) =>
          updateDoc(doc(db, 'todos', id), { category: category.trim(), updatedAt: now })
        );
        await Promise.all(batchUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `todos/batch-category`);
      }
    } else {
      setTodos((prev) =>
        prev.map((t) => (todoIds.includes(t.id) ? { ...t, category: category.trim(), updatedAt: now } : t))
      );
    }
  };

  const rolloverUnfinishedTodos = async (fromDate: string, toDate: string): Promise<number> => {
    const unfinished = todos.filter((t) => t.date === fromDate && !t.isCompleted);
    for (const item of unfinished) {
      await updateTodo(item.id, { date: toDate });
    }
    return unfinished.length;
  };

  return {
    createPlanner,
    updatePlanner,
    deletePlanner,
    createSubject,
    updateSubject,
    deleteSubject,
    createTask,
    createBatchTasks,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    moveTask,
    batchMoveTasks,
    batchToggleComplete,
    batchDeleteTasks,
    batchUpdateTasksSubject,
    createNote,
    updateNote,
    deleteNote,
    toggleNoteDone,
    createSchedule,
    updateSchedule,
    renameSchedule,
    deleteSchedule,
    saveScheduleForDayPart,
    createTodo,
    toggleTodoComplete,
    updateTodo,
    deleteTodo,
    batchDeleteTodos,
    batchUpdateTodosCategory,
    rolloverUnfinishedTodos,
  };
}
