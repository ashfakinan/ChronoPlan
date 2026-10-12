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

export interface YesterdayStats {
  yesterdayDate: string;
  completedTasks: PlannerTask[];
  remainingTasks: PlannerTask[];
  completedTodos: DailyTodo[];
  remainingTodos: DailyTodo[];
  totalCount: number;
  completedCount: number;
  rate: number;
}

export interface PlannerContextType {
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
  batchUpdateTasksSubject: (taskIds: string[], subjectId: string) => Promise<void>;

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
  createTodo: (text: string, date?: string, priority?: Priority, category?: string) => Promise<DailyTodo>;
  toggleTodoComplete: (id: string) => Promise<void>;
  updateTodo: (id: string, updates: Partial<DailyTodo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  batchDeleteTodos: (todoIds: string[]) => Promise<void>;
  batchUpdateTodosCategory: (todoIds: string[], category: string) => Promise<void>;
  rolloverUnfinishedTodos: (fromDate: string, toDate: string) => Promise<number>;

  showMorningReport: boolean;
  setShowMorningReport: (show: boolean) => void;
  dismissMorningReport: () => void;
  autoRolloverNotice: { count: number; date: string } | null;
  dismissAutoRolloverNotice: () => void;
  yesterdayStats: YesterdayStats;
  rolloverYesterdayRemaining: () => Promise<number>;
  selectedDayForDetail: string | null;
  setSelectedDayForDetail: (date: string | null) => void;
  isSyncing: boolean;
}
