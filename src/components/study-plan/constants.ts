import { StudyChapter, StudySubject, StudyMonth, StudyPlanConfig } from './types';

export const PLAN_STORAGE_KEY = 'hsc_study_plan_config_v1';
export const TRACKER_STORAGE_KEY = 'hsc_tracker';

export const makeCh = (p: string = '', c: number | string = '', name?: string): StudyChapter => ({
  id: `ch_${p || 'p'}_${c || 'c'}_${Math.random().toString(36).slice(2, 7)}`,
  p,
  c,
  name,
  title: name,
});

export const getChapterDisplayName = (ch: StudyChapter): { prefix: string; name: string; full: string } => {
  const parts: string[] = [];
  if (ch.p && ch.p.trim()) parts.push(ch.p.trim());
  if (ch.c !== undefined && ch.c !== null && String(ch.c).trim() !== '') {
    const cStr = String(ch.c).trim();
    if (/^(ch|chapter)/i.test(cStr)) {
      parts.push(cStr);
    } else {
      parts.push(`Ch${cStr}`);
    }
  }

  const prefix = parts.join(' · ');
  const chapterName = (ch.name || ch.title || '').trim();

  let full = '';
  if (prefix && chapterName) {
    full = `${prefix}: ${chapterName}`;
  } else if (chapterName) {
    full = chapterName;
  } else if (prefix) {
    full = prefix;
  } else {
    full = 'Chapter';
  }

  return { prefix, name: chapterName, full };
};

export const DEFAULT_SUBJECTS: StudySubject[] = [
  { key: 'phy', label: 'Physics', color: '#4f8ef7' },
  { key: 'chem', label: 'Chemistry', color: '#f7a24f' },
  { key: 'bio', label: 'Biology', color: '#4fcf8e' },
  { key: 'hm', label: 'Higher Math', color: '#c47bf7' },
];

export const DEFAULT_MONTHS: StudyMonth[] = [
  {
    id: 'm1',
    n: 1,
    label: 'October 2026',
    subjectsData: {
      phy: [makeCh('1st', 1), makeCh('1st', 2)],
      chem: [makeCh('1st', 1)],
      bio: [makeCh('1st', 1), makeCh('1st', 2)],
      hm: [makeCh('1st', 1)],
    },
  },
  {
    id: 'm2',
    n: 2,
    label: 'November 2026',
    subjectsData: {
      phy: [makeCh('1st', 3)],
      chem: [makeCh('1st', 2)],
      bio: [makeCh('1st', 3), makeCh('2nd', 1)],
      hm: [makeCh('1st', 3), makeCh('1st', 7)],
    },
  },
  {
    id: 'm3',
    n: 3,
    label: 'December 2026',
    subjectsData: {
      phy: [makeCh('1st', 4), makeCh('1st', 5)],
      chem: [makeCh('1st', 3)],
      bio: [makeCh('1st', 4), makeCh('1st', 5), makeCh('1st', 7)],
      hm: [makeCh('1st', 8)],
    },
  },
  {
    id: 'm4',
    n: 4,
    label: 'January 2027',
    subjectsData: {
      phy: [makeCh('1st', 6)],
      chem: [makeCh('1st', 5)],
      bio: [makeCh('1st', 6), makeCh('1st', 8), makeCh('2nd', 2)],
      hm: [makeCh('1st', 9), makeCh('1st', 2)],
    },
  },
  {
    id: 'm5',
    n: 5,
    label: 'February 2027',
    subjectsData: {
      phy: [makeCh('1st', 7), makeCh('1st', 8)],
      chem: [makeCh('1st', 4)],
      bio: [makeCh('2nd', 3), makeCh('2nd', 4)],
      hm: [makeCh('1st', 4), makeCh('1st', 5)],
    },
  },
  {
    id: 'm6',
    n: 6,
    label: 'March 2027',
    subjectsData: {
      phy: [makeCh('1st', 9), makeCh('1st', 10)],
      chem: [makeCh('2nd', 1)],
      bio: [makeCh('2nd', 5), makeCh('2nd', 6)],
      hm: [makeCh('1st', 6), makeCh('1st', 10)],
    },
  },
  {
    id: 'm7',
    n: 7,
    label: 'April 2027',
    subjectsData: {
      phy: [makeCh('2nd', 1), makeCh('2nd', 2)],
      chem: [makeCh('2nd', 2)],
      bio: [makeCh('2nd', 7), makeCh('2nd', 8)],
      hm: [makeCh('2nd', 1), makeCh('2nd', 2)],
    },
  },
  {
    id: 'm8',
    n: 8,
    label: 'May 2027',
    subjectsData: {
      phy: [makeCh('2nd', 3), makeCh('2nd', 4)],
      chem: [makeCh('2nd', 3)],
      bio: [makeCh('2nd', 9), makeCh('2nd', 10)],
      hm: [makeCh('2nd', 3), makeCh('2nd', 4)],
    },
  },
  {
    id: 'm9',
    n: 9,
    label: 'June 2027',
    subjectsData: {
      phy: [makeCh('2nd', 5), makeCh('2nd', 6)],
      chem: [makeCh('2nd', 4)],
      bio: [makeCh('2nd', 11), makeCh('2nd', 12)],
      hm: [makeCh('2nd', 5), makeCh('2nd', 6)],
    },
  },
  {
    id: 'm10',
    n: 10,
    label: 'July 2027',
    subjectsData: {
      phy: [makeCh('2nd', 7), makeCh('2nd', 8)],
      chem: [makeCh('2nd', 5)],
      bio: 'revision',
      hm: [makeCh('2nd', 7), makeCh('2nd', 8)],
    },
  },
  {
    id: 'm11',
    n: 11,
    label: 'August 2027',
    subjectsData: {
      phy: [makeCh('2nd', 9), makeCh('2nd', 10)],
      chem: 'revision',
      bio: [makeCh('1st', 9), makeCh('1st', 10)],
      hm: [makeCh('2nd', 9), makeCh('2nd', 10)],
    },
  },
  {
    id: 'm12',
    n: 12,
    label: 'September 2027',
    subjectsData: {
      phy: 'revision',
      chem: 'revision',
      bio: [makeCh('1st', 11), makeCh('1st', 12)],
      hm: 'revision',
    },
  },
  {
    id: 'm13',
    n: 13,
    label: 'October 2027',
    subjectsData: {
      phy: 'revision',
      chem: 'revision',
      bio: 'revision',
      hm: 'revision',
    },
  },
  {
    id: 'm14',
    n: 14,
    label: 'November 2027',
    subjectsData: {
      phy: 'revision',
      chem: 'revision',
      bio: 'revision',
      hm: 'revision',
    },
  },
];

export const DEFAULT_CONFIG: StudyPlanConfig = {
  title: 'HSC 14-Month Syllabus Tracker',
  subtitle: 'October 2026 → November 2027',
  subjects: DEFAULT_SUBJECTS,
  months: DEFAULT_MONTHS,
};
