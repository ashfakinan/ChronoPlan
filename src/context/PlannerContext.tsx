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
import {
  Planner,
  PlannerTask,
  Subject,
  ImportantNote,
  FixedSchedule,
  DailyTodo,
  NoteTag,
  Priority,
} from '../types';
import { getTodayISO, getYesterdayISO, addDays } from '../utils/dateUtils';

interface PlannerContextType {
  planners: Planner[];
  activePlanner: Planner | null;
  activePlannerId: string | null;
  setActivePlannerId: (id: string) => void;
  createPlanner: (title: string, startDate: string, endDate: string, dayParts?: string[]) => Promise<Planner>;
  updatePlanner: (id: string, updates: Partial<Planner>) => Promise<void>;
  deletePlanner: (id: string) => Promise<void>;

  subjects: Subject[];
  createSubject: (name: string, color: string) => Promise<Subject>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  tasks: PlannerTask[];
  createTask: (data: Omit<PlannerTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<PlannerTask>;
  createBatchTasks: (tasksData: Omit<PlannerTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]) => Promise<PlannerTask[]>;
  updateTask: (id: string, updates: Partial<PlannerTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  moveTask: (
    taskId: string,
    targetDate: string,
    targetDayPart: string,
    targetTaskId?: string,
    position?: 'before' | 'after'
  ) => Promise<void>;
  batchMoveTasks: (
    taskIds: string[],
    targetDate: string,
    targetDayPart: string
  ) => Promise<void>;
  batchToggleComplete: (taskIds: string[], isCompleted: boolean) => Promise<void>;
  batchDeleteTasks: (taskIds: string[]) => Promise<void>;

  notes: ImportantNote[];
  createNote: (title: string, content: string, tag: NoteTag, date: string) => Promise<ImportantNote>;
  updateNote: (id: string, updates: Partial<ImportantNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleNoteDone: (id: string) => Promise<void>;

  schedules: FixedSchedule[];
  saveScheduleForDayPart: (dayPart: string, text: string) => Promise<void>;
  createSchedule: (dayPart: string, text?: string, timeRange?: string) => Promise<FixedSchedule>;
  updateSchedule: (id: string, updates: Partial<FixedSchedule>) => Promise<void>;
  renameSchedule: (id: string, newDayPart: string) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  todos: DailyTodo[];
  createTodo: (text: string, date: string, priority?: Priority) => Promise<DailyTodo>;
  toggleTodoComplete: (id: string) => Promise<void>;
  updateTodo: (id: string, updates: Partial<DailyTodo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  rolloverUnfinishedTodos: (fromDate: string, toDate: string) => Promise<number>;

  showMorningReport: boolean;
  setShowMorningReport: (show: boolean) => void;
  dismissMorningReport: () => void;
  autoRolloverNotice: { count: number; date: string } | null;
  dismissAutoRolloverNotice: () => void;
  yesterdayStats: {
    yesterdayDate: string;
    completedTasks: PlannerTask[];
    remainingTasks: PlannerTask[];
    completedTodos: DailyTodo[];
    remainingTodos: DailyTodo[];
    totalCount: number;
    completedCount: number;
    rate: number;
  };
  rolloverYesterdayRemaining: () => Promise<number>;
  selectedDayForDetail: string | null;
  setSelectedDayForDetail: (date: string | null) => void;
  isSyncing: boolean;
}

const DEFAULT_DAY_PARTS = ['Morning', 'Afternoon', 'Evening', 'Night', 'Self Study'];

const DEFAULT_SUBJECTS = [
  { name: 'Physics', color: '#3B82F6' },
  { name: 'Chemistry', color: '#10B981' },
  { name: 'Mathematics', color: '#8B5CF6' },
  { name: 'English Literature', color: '#EC4899' },
  { name: 'Coding & Projects', color: '#F59E0B' },
];

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile, updateUserPreferences } = useAuth();

  const [planners, setPlanners] = useState<Planner[]>([]);
  const [activePlannerId, setActivePlannerId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [notes, setNotes] = useState<ImportantNote[]>([]);
  const [schedules, setSchedules] = useState<FixedSchedule[]>([]);
  const [todos, setTodos] = useState<DailyTodo[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [showMorningReport, setShowMorningReport] = useState<boolean>(false);
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<string | null>(null);
  const [autoRolloverNotice, setAutoRolloverNotice] = useState<{ count: number; date: string } | null>(null);

  const dismissAutoRolloverNotice = () => setAutoRolloverNotice(null);

  // Active planner object
  const activePlanner = useMemo(() => {
    if (!planners.length) return null;
    const found = planners.find((p) => p.id === activePlannerId);
    return found || planners[0];
  }, [planners, activePlannerId]);

  // Sync with Firestore when currentUser is available
  useEffect(() => {
    if (!currentUser) {
      // Local demo mode state initialization from localStorage or defaults
      const localPlanners = localStorage.getItem('cp_local_planners');
      const localSubjects = localStorage.getItem('cp_local_subjects');
      const localTasks = localStorage.getItem('cp_local_tasks');
      const localNotes = localStorage.getItem('cp_local_notes');
      const localSchedules = localStorage.getItem('cp_local_schedules');
      const localTodos = localStorage.getItem('cp_local_todos');

      if (localPlanners) {
        try {
          const parsed = JSON.parse(localPlanners);
          setPlanners(parsed);
          if (parsed.length) setActivePlannerId(parsed[0].id);
        } catch { /* ignore */ }
      } else {
        seedLocalDefaults();
      }

      if (localSubjects) try { setSubjects(JSON.parse(localSubjects)); } catch { /* ignore */ }
      if (localTasks) try { setTasks(JSON.parse(localTasks)); } catch { /* ignore */ }
      if (localNotes) try { setNotes(JSON.parse(localNotes)); } catch { /* ignore */ }
      if (localSchedules) try { setSchedules(JSON.parse(localSchedules)); } catch { /* ignore */ }
      if (localTodos) try { setTodos(JSON.parse(localTodos)); } catch { /* ignore */ }

      return;
    }

    setIsSyncing(true);
    const userId = currentUser.uid;

    // Listen to Planners
    const plannersQuery = query(collection(db, 'planners'), where('userId', '==', userId));
    const unsubPlanners = onSnapshot(
      plannersQuery,
      (snap) => {
        const list: Planner[] = [];
        snap.forEach((docSnap) => list.push(docSnap.data() as Planner));
        setPlanners(list);
        if (list.length > 0) {
          setActivePlannerId((prev) => (prev && list.some((p) => p.id === prev) ? prev : list[0].id));
        } else {
          // If no planners exist for this new user, bootstrap starter data
          bootstrapUserCloudData(userId);
        }
        setIsSyncing(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'planners')
    );

    // Listen to Subjects
    const subjectsQuery = query(collection(db, 'subjects'), where('userId', '==', userId));
    const unsubSubjects = onSnapshot(
      subjectsQuery,
      (snap) => {
        const list: Subject[] = [];
        snap.forEach((docSnap) => list.push(docSnap.data() as Subject));
        setSubjects(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'subjects')
    );

    // Listen to Tasks
    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
    const unsubTasks = onSnapshot(
      tasksQuery,
      (snap) => {
        const list: PlannerTask[] = [];
        snap.forEach((docSnap) => list.push(docSnap.data() as PlannerTask));
        setTasks(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'tasks')
    );

    // Listen to Notes
    const notesQuery = query(collection(db, 'notes'), where('userId', '==', userId));
    const unsubNotes = onSnapshot(
      notesQuery,
      (snap) => {
        const list: ImportantNote[] = [];
        snap.forEach((docSnap) => list.push(docSnap.data() as ImportantNote));
        setNotes(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notes')
    );

    // Listen to Schedules
    const schedulesQuery = query(collection(db, 'schedules'), where('userId', '==', userId));
    const unsubSchedules = onSnapshot(
      schedulesQuery,
      (snap) => {
        const list: FixedSchedule[] = [];
        snap.forEach((docSnap) => list.push(docSnap.data() as FixedSchedule));
        setSchedules(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'schedules')
    );

    // Listen to Daily Todos
    const todosQuery = query(collection(db, 'todos'), where('userId', '==', userId));
    const unsubTodos = onSnapshot(
      todosQuery,
      (snap) => {
        const list: DailyTodo[] = [];
        snap.forEach((docSnap) => list.push(docSnap.data() as DailyTodo));
        setTodos(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'todos')
    );

    return () => {
      unsubPlanners();
      unsubSubjects();
      unsubTasks();
      unsubNotes();
      unsubSchedules();
      unsubTodos();
    };
  }, [currentUser]);

  // Persist local state if offline or not logged in
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem('cp_local_planners', JSON.stringify(planners));
      localStorage.setItem('cp_local_subjects', JSON.stringify(subjects));
      localStorage.setItem('cp_local_tasks', JSON.stringify(tasks));
      localStorage.setItem('cp_local_notes', JSON.stringify(notes));
      localStorage.setItem('cp_local_schedules', JSON.stringify(schedules));
      localStorage.setItem('cp_local_todos', JSON.stringify(todos));
    }
  }, [currentUser, planners, subjects, tasks, notes, schedules, todos]);

  // Morning Report: Never popup automatically on open (annoying to user)
  useEffect(() => {
    // Keep showMorningReport false by default on open
    setShowMorningReport(false);
  }, []);

  // Automatic rollover: If tasks of previous days are not finished,
  // move them to the next day (today) automatically without user confirmation
  const autoRolloverLockRef = React.useRef<boolean>(false);
  const autoRolloverProcessedRef = React.useRef<Set<string>>(new Set());

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
  }, [tasks, currentUser]);

  const dismissMorningReport = async () => {
    const today = getTodayISO();
    setShowMorningReport(false);
    if (currentUser) {
      await updateUserPreferences({ lastReportDismissedDate: today });
    } else {
      localStorage.setItem('cp_report_dismissed_date', today);
    }
  };

  // Seed local defaults for guests
  function seedLocalDefaults() {
    const today = getTodayISO();
    const seedSubjects: Subject[] = DEFAULT_SUBJECTS.map((s) => ({
      id: generateId('subj'),
      userId: 'guest',
      name: s.name,
      color: s.color,
      createdAt: new Date().toISOString(),
    }));

    const starterPlanner: Planner = {
      id: generateId('plan'),
      userId: 'guest',
      title: 'Current Sprint & Exam Prep',
      startDate: today,
      endDate: addDays(today, 6),
      dayParts: [...DEFAULT_DAY_PARTS],
      createdAt: new Date().toISOString(),
    };

    const starterTasks: PlannerTask[] = [
      {
        id: generateId('task'),
        userId: 'guest',
        plannerId: starterPlanner.id,
        title: 'Quantum Mechanics Problem Set 4',
        date: today,
        dayPart: 'Morning',
        subjectId: seedSubjects[0].id,
        isCompleted: false,
        order: 0,
      },
      {
        id: generateId('task'),
        userId: 'guest',
        plannerId: starterPlanner.id,
        title: 'Organic Chemistry Synthesis Mechanisms',
        date: today,
        dayPart: 'Afternoon',
        subjectId: seedSubjects[1].id,
        isCompleted: true,
        order: 0,
      },
      {
        id: generateId('task'),
        userId: 'guest',
        plannerId: starterPlanner.id,
        title: 'Linear Algebra Eigenvalues Revision',
        date: today,
        dayPart: 'Self Study',
        subjectId: seedSubjects[2].id,
        isCompleted: false,
        order: 0,
      },
      {
        id: generateId('task'),
        userId: 'guest',
        plannerId: starterPlanner.id,
        title: 'Physics Lab Report Writeup',
        date: addDays(today, 1),
        dayPart: 'Morning',
        subjectId: seedSubjects[0].id,
        isCompleted: false,
        order: 0,
      },
      {
        id: generateId('task'),
        userId: 'guest',
        plannerId: starterPlanner.id,
        title: 'Literature Essay Draft Review',
        date: addDays(today, 2),
        dayPart: 'Evening',
        subjectId: seedSubjects[3].id,
        isCompleted: false,
        order: 0,
      },
    ];

    const starterNotes: ImportantNote[] = [
      {
        id: generateId('note'),
        userId: 'guest',
        title: 'Physics Midterm Exam',
        content: 'Chapters 1-7 in Halliday & Resnick. Formula sheet permitted.',
        tag: 'Exam',
        date: addDays(today, 3),
        isDone: false,
      },
      {
        id: generateId('note'),
        userId: 'guest',
        title: 'Research Project Proposal Due',
        content: 'Submit PDF to portal before 11:59 PM sharp.',
        tag: 'Deadline',
        date: addDays(today, 5),
        isDone: false,
      },
      {
        id: generateId('note'),
        userId: 'guest',
        title: 'Weekly Office Hours',
        content: 'Meet Dr. Stevens regarding question #12 on Assignment 3.',
        tag: 'Reminder',
        date: today,
        isDone: true,
      },
    ];

    const starterSchedules: FixedSchedule[] = [
      { id: generateId('sched'), userId: 'guest', dayPart: 'Morning', text: '07:30 Wakeup, Hydrate & Deep Focus Block' },
      { id: generateId('sched'), userId: 'guest', dayPart: 'Afternoon', text: '13:30 - 17:00 Lectures, Labs & Practical Work' },
      { id: generateId('sched'), userId: 'guest', dayPart: 'Evening', text: '18:00 Exercise, Dinner & Review' },
      { id: generateId('sched'), userId: 'guest', dayPart: 'Night', text: '21:30 Light Reading & Sleep Prep' },
      { id: generateId('sched'), userId: 'guest', dayPart: 'Self Study', text: 'Active Recall, Flashcards & Practice Tests' },
    ];

    const starterTodos: DailyTodo[] = [
      { id: generateId('todo'), userId: 'guest', text: 'Review Chapter 5 formulas for 30 minutes', date: today, isCompleted: false, priority: 'high' },
      { id: generateId('todo'), userId: 'guest', text: 'Email Professor for lab appointment', date: today, isCompleted: true, priority: 'medium' },
      { id: generateId('todo'), userId: 'guest', text: 'Prepare summary notes for study group', date: today, isCompleted: false, priority: 'low' },
    ];

    setPlanners([starterPlanner]);
    setActivePlannerId(starterPlanner.id);
    setSubjects(seedSubjects);
    setTasks(starterTasks);
    setNotes(starterNotes);
    setSchedules(starterSchedules);
    setTodos(starterTodos);
  }

  // Bootstrap initial user cloud data in Firestore
  async function bootstrapUserCloudData(userId: string) {
    const today = getTodayISO();

    // Create default subjects
    const newSubjects: Subject[] = [];
    for (const s of DEFAULT_SUBJECTS) {
      const subjId = generateId('subj');
      const newSubj: Subject = {
        id: subjId,
        userId,
        name: s.name,
        color: s.color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'subjects', subjId), newSubj);
      newSubjects.push(newSubj);
    }

    // Create starter planner (7 days)
    const planId = generateId('plan');
    const newPlanner: Planner = {
      id: planId,
      userId,
      title: 'Current Sprint & Exam Prep',
      startDate: today,
      endDate: addDays(today, 6),
      dayParts: [...DEFAULT_DAY_PARTS],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'planners', planId), newPlanner);

    // Create starter tasks
    const starterTasks = [
      {
        title: 'Quantum Mechanics Problem Set 4',
        date: today,
        dayPart: 'Morning',
        subjectId: newSubjects[0].id,
      },
      {
        title: 'Organic Chemistry Synthesis Mechanisms',
        date: today,
        dayPart: 'Afternoon',
        subjectId: newSubjects[1].id,
      },
      {
        title: 'Linear Algebra Eigenvalues Revision',
        date: today,
        dayPart: 'Self Study',
        subjectId: newSubjects[2].id,
      },
    ];

    for (const t of starterTasks) {
      const taskId = generateId('task');
      await setDoc(doc(db, 'tasks', taskId), {
        id: taskId,
        userId,
        plannerId: planId,
        title: t.title,
        date: t.date,
        dayPart: t.dayPart,
        subjectId: t.subjectId,
        isCompleted: false,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Create starter note
    const noteId = generateId('note');
    await setDoc(doc(db, 'notes', noteId), {
      id: noteId,
      userId,
      title: 'Midterm Exam Schedule',
      content: 'Physics & Chemistry exams approaching this week.',
      tag: 'Exam',
      date: addDays(today, 4),
      isDone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create default schedules
    const routines = [
      { dayPart: 'Morning', text: '07:30 Wakeup, Hydrate & Deep Focus Block' },
      { dayPart: 'Afternoon', text: '13:30 - 17:00 Lectures, Labs & Practical Work' },
      { dayPart: 'Evening', text: '18:00 Exercise, Dinner & Review' },
      { dayPart: 'Night', text: '21:30 Light Reading & Sleep Prep' },
      { dayPart: 'Self Study', text: 'Active Recall, Flashcards & Practice Tests' },
    ];
    for (const r of routines) {
      const schedId = generateId('sched');
      await setDoc(doc(db, 'schedules', schedId), {
        id: schedId,
        userId,
        dayPart: r.dayPart,
        text: r.text,
        updatedAt: new Date().toISOString(),
      });
    }

    // Create starter daily todo
    const todoId = generateId('todo');
    await setDoc(doc(db, 'todos', todoId), {
      id: todoId,
      userId,
      text: 'Complete 3 practice questions for tomorrow',
      date: today,
      isCompleted: false,
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

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

    // Get all tasks in destination section, sorted by order
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

    // Insert task at target index
    const reorderedList = [...destTasks];
    reorderedList.splice(insertIndex, 0, {
      ...task,
      date: targetDate,
      dayPart: targetDayPart,
    });

    // Re-assign continuous order indices
    const updates: { id: string; date: string; dayPart: string; order: number }[] = reorderedList.map(
      (t, index) => ({
        id: t.id,
        date: t.date,
        dayPart: t.dayPart,
        order: index,
      })
    );

    // Apply updates
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

    // Get all tasks in destination section not in the moving list, sorted by order
    const destTasks = tasks
      .filter((t) => t.date === targetDate && t.dayPart === targetDayPart && !taskIds.includes(t.id))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Get the tasks being moved, maintaining their current relative order
    const movingTasks = tasks
      .filter((t) => taskIds.includes(t.id))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Append moving tasks to the destination
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
    priority: Priority = 'medium'
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
      setTodos((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const rolloverUnfinishedTodos = async (fromDate: string, toDate: string): Promise<number> => {
    const unfinished = todos.filter((t) => t.date === fromDate && !t.isCompleted);
    for (const item of unfinished) {
      await updateTodo(item.id, { date: toDate });
    }
    return unfinished.length;
  };

  // --- Morning Report / Daily Review Calculation ---
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
    // Rollover unfinished tasks to today
    for (const task of yesterdayStats.remainingTasks) {
      await updateTask(task.id, { date: today });
      count++;
    }
    // Rollover unfinished todos to today
    for (const todo of yesterdayStats.remainingTodos) {
      await updateTodo(todo.id, { date: today });
      count++;
    }
    return count;
  };

  return (
    <PlannerContext.Provider
      value={{
        planners,
        activePlanner,
        activePlannerId,
        setActivePlannerId,
        createPlanner,
        updatePlanner,
        deletePlanner,

        subjects,
        createSubject,
        updateSubject,
        deleteSubject,

        tasks,
        createTask,
        createBatchTasks,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        moveTask,
        batchMoveTasks,
        batchToggleComplete,
        batchDeleteTasks,

        notes,
        createNote,
        updateNote,
        deleteNote,
        toggleNoteDone,

        schedules,
        saveScheduleForDayPart,
        createSchedule,
        updateSchedule,
        renameSchedule,
        deleteSchedule,

        todos,
        createTodo,
        toggleTodoComplete,
        updateTodo,
        deleteTodo,
        rolloverUnfinishedTodos,

        showMorningReport,
        setShowMorningReport,
        dismissMorningReport,
        autoRolloverNotice,
        dismissAutoRolloverNotice,
        yesterdayStats,
        rolloverYesterdayRemaining,

        selectedDayForDetail,
        setSelectedDayForDetail,
        isSyncing,
      }}
    >
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
