import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
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
} from '../../types';
import { DEFAULT_DAY_PARTS, DEFAULT_SUBJECTS, generateId, createGuestSeedData } from './constants';
import { getTodayISO, addDays } from '../../utils/dateUtils';
import type { User } from 'firebase/auth';

export function usePlannerDataSync(currentUser: User | null) {
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [activePlannerId, setActivePlannerId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [notes, setNotes] = useState<ImportantNote[]>([]);
  const [schedules, setSchedules] = useState<FixedSchedule[]>([]);
  const [todos, setTodos] = useState<DailyTodo[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Bootstrap initial user cloud data in Firestore
  async function bootstrapUserCloudData(userId: string) {
    const today = getTodayISO();

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

  // Sync with Firestore or load from localStorage
  useEffect(() => {
    if (!currentUser) {
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
        } catch {
          // fallback to seed
        }
      } else {
        const seed = createGuestSeedData();
        setPlanners(seed.planners);
        setActivePlannerId(seed.planners[0].id);
        setSubjects(seed.subjects);
        setTasks(seed.tasks);
        setNotes(seed.notes);
        setSchedules(seed.schedules);
        setTodos(seed.todos);
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
          bootstrapUserCloudData(userId);
        }
        setIsSyncing(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'planners')
    );

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

  // Persist local state if offline or guest
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

  return {
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
  };
}
