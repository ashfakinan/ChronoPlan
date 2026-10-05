export function formatDateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(isoStr: string): Date {
  const [year, month, day] = isoStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getTodayISO(): string {
  return formatDateToISO(new Date());
}

export function getYesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateToISO(d);
}

export function getTomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateToISO(d);
}

export function addDays(isoStr: string, days: number): string {
  const d = parseISODate(isoStr);
  d.setDate(d.getDate() + days);
  return formatDateToISO(d);
}

export function formatDisplayDate(isoStr: string): string {
  if (!isoStr) return '';
  const d = parseISODate(isoStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullDate(isoStr: string): string {
  if (!isoStr) return '';
  const d = parseISODate(isoStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(isoStr: string): string {
  if (!isoStr) return '';
  const d = parseISODate(isoStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getWeekdayName(isoStr: string): string {
  if (!isoStr) return '';
  const d = parseISODate(isoStr);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getDaysInRange(startDateStr: string, endDateStr: string): string[] {
  const result: string[] = [];
  const current = parseISODate(startDateStr);
  const end = parseISODate(endDateStr);

  // Guard against inverted dates or absurd loops (> 120 days)
  let count = 0;
  while (current <= end && count < 120) {
    result.push(formatDateToISO(current));
    current.setDate(current.getDate() + 1);
    count++;
  }
  return result;
}

export function isToday(isoStr: string): boolean {
  return isoStr === getTodayISO();
}

export function isPastDate(isoStr: string): boolean {
  return isoStr < getTodayISO();
}

export function getMonthDaysGrid(year: number, monthIndex: number): { date: string; isCurrentMonth: boolean }[] {
  const days: { date: string; isCurrentMonth: boolean }[] = [];
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday

  // Days from previous month
  const prevMonthEnd = new Date(year, monthIndex, 0);
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, monthIndex - 1, prevMonthEnd.getDate() - i);
    days.push({ date: formatDateToISO(d), isCurrentMonth: false });
  }

  // Days in current month
  const currentMonthEnd = new Date(year, monthIndex + 1, 0);
  for (let i = 1; i <= currentMonthEnd.getDate(); i++) {
    const d = new Date(year, monthIndex, i);
    days.push({ date: formatDateToISO(d), isCurrentMonth: true });
  }

  // Days from next month to complete standard 35 or 42 grid
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, monthIndex + 1, i);
    days.push({ date: formatDateToISO(d), isCurrentMonth: false });
  }

  return days;
}
