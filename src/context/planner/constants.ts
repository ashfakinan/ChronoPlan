import {
  Planner,
  PlannerTask,
  Subject,
  ImportantNote,
  FixedSchedule,
  DailyTodo,
} from '../../types';
import { getTodayISO, addDays } from '../../utils/dateUtils';

export const DEFAULT_DAY_PARTS: string[] = ['Morning', 'Afternoon', 'Evening', 'Night', 'Self Study'];

export const DEFAULT_SUBJECTS: { name: string; color: string }[] = [
  { name: 'Physics', color: '#3B82F6' },
  { name: 'Chemistry', color: '#10B981' },
  { name: 'Mathematics', color: '#8B5CF6' },
  { name: 'English Literature', color: '#EC4899' },
  { name: 'Coding & Projects', color: '#F59E0B' },
];

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function createGuestSeedData() {
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

  return {
    planners: [starterPlanner],
    subjects: seedSubjects,
    tasks: starterTasks,
    notes: starterNotes,
    schedules: starterSchedules,
    todos: starterTodos,
  };
}
