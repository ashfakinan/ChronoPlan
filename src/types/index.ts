export type DayPart = string;

export interface Subject {
  id: string;
  userId: string;
  name: string;
  color: string; // Hex color e.g. "#3B82F6"
  createdAt?: string;
  updatedAt?: string;
}

export interface PlannerTask {
  id: string;
  userId: string;
  plannerId: string;
  title: string;
  date: string; // YYYY-MM-DD
  dayPart: string;
  subjectId: string;
  isCompleted: boolean;
  order?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Planner {
  id: string;
  userId: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dayParts: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type NoteTag = 'Exam' | 'Deadline' | 'Reminder' | 'Goal' | 'Important' | 'General';

export interface ImportantNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  tag: NoteTag;
  date: string; // YYYY-MM-DD
  isDone: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FixedSchedule {
  id: string;
  userId: string;
  dayPart: string; // The schedule plan title / name (e.g. "Morning", "Workout Routine", "Deep Work")
  text: string;
  timeRange?: string; // Optional time range e.g. "07:00 - 08:30"
  order?: number;
  updatedAt?: string;
}

export type Priority = 'low' | 'medium' | 'high';

export interface DailyTodo {
  id: string;
  userId: string;
  text: string;
  date: string; // YYYY-MM-DD
  isCompleted: boolean;
  priority: Priority;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  theme?: 'light' | 'dark' | 'system';
  lastReportDismissedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ActiveTab = 'planner' | 'todos' | 'calendar' | 'analytics';
