import { format, parseISO, differenceInDays, addDays } from 'date-fns';

export function formatDate(date: Date | string, pattern = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern);
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
}

export function isRecent(date: Date | string, daysAgo = 7): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(new Date(), dateObj) <= daysAgo;
}

export function addBusinessDays(date: Date, days: number): Date {
  let result = new Date(date);
  let count = 0;

  while (count < days) {
    result = addDays(result, 1);
    const dayOfWeek = result.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }

  return result;
}

export function getTimestamp(): number {
  return Date.now();
}

export function getISOString(): string {
  return new Date().toISOString();
}