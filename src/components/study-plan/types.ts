export interface StudySubject {
  key: string;
  label: string;
  color: string;
}

export interface StudyChapter {
  id: string;
  p?: string; // Paper: e.g. "1st", "2nd", or custom
  c?: number | string; // Chapter number or code
  name?: string; // Custom chapter name (e.g. "Thermodynamics", "Vectors")
  title?: string; // Optional detailed topic title / alias
}

export interface StudyMonth {
  id: string;
  n: number;
  label: string; // e.g. "October 2026"
  subjectsData: Record<string, StudyChapter[] | 'revision'>;
}

export interface StudyPlanConfig {
  title: string;
  subtitle: string;
  subjects: StudySubject[];
  months: StudyMonth[];
}

export interface ChapterState {
  r: boolean; // Added to Routine
  d: boolean; // Finished
}

export interface SubjectProgress {
  total: number;
  completed: number;
  routine: number;
  percentage: number;
}
