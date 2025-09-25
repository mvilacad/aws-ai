export function formatISO(date: Date | string): string {
  return new Date(date).toISOString();
}

export function parseISO(dateString: string): Date {
  return new Date(dateString);
}

export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function differenceInDays(laterDate: Date, earlierDate: Date): number {
  const diffTime = laterDate.getTime() - earlierDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function differenceInHours(laterDate: Date, earlierDate: Date): number {
  const diffTime = laterDate.getTime() - earlierDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60));
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function formatRelative(date: Date, baseDate = new Date()): string {
  const diffMs = date.getTime() - baseDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffMins) < 1) return 'just now';
  if (Math.abs(diffMins) < 60) {
    return diffMins > 0
      ? `in ${diffMins} minutes`
      : `${Math.abs(diffMins)} minutes ago`;
  }
  if (Math.abs(diffHours) < 24) {
    return diffHours > 0
      ? `in ${diffHours} hours`
      : `${Math.abs(diffHours)} hours ago`;
  }
  if (Math.abs(diffDays) < 7) {
    return diffDays > 0
      ? `in ${diffDays} days`
      : `${Math.abs(diffDays)} days ago`;
  }

  return date.toLocaleDateString();
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}
