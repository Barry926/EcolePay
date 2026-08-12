import { Timestamp } from 'firebase/firestore';

export type FirestoreDateLike = Timestamp | Date | string | number | { seconds?: number; nanoseconds?: number } | undefined | null;

export function toDate(value: FirestoreDateLike): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'object' && 'toDate' in value && typeof (value as Timestamp).toDate === 'function') {
    const date = (value as Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }

  if (typeof value === 'string') {
    const legacyRelative = value.match(/^(Aujourd'hui|Hier)[,\s]+(\d{1,2}):(\d{2})$/i);
    if (legacyRelative) {
      const date = new Date();
      if (legacyRelative[1].toLowerCase() === 'hier') date.setDate(date.getDate() - 1);
      date.setHours(Number(legacyRelative[2]), Number(legacyRelative[3]), 0, 0);
      return date;
    }
  }

  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatPaymentDate(value: FirestoreDateLike): string {
  const date = toDate(value);
  if (!date) return 'Date indisponible';

  return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function isWithinCurrentPeriod(value: FirestoreDateLike, period: "Aujourd'hui" | 'Cette semaine' | 'Ce mois' | 'Cette année'): boolean {
  const date = toDate(value);
  if (!date) return false;

  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === "Aujourd'hui") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  if (period === 'Cette semaine') {
    const day = now.getDay() || 7;
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  }

  if (period === 'Ce mois') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  if (period === 'Cette année') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  }

  return date >= start && date <= end;
}
