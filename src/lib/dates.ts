import {
  addDays,
  format,
  isAfter,
  isBefore,
  isSunday,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";
import { fr } from "date-fns/locale";

export function todayKey(now = new Date()) {
  return format(now, "yyyy-MM-dd");
}

export function toKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function fromKey(key: string) {
  return parseISO(`${key}T12:00:00`);
}

export function formatDayLong(key: string) {
  return format(fromKey(key), "EEEE d MMMM", { locale: fr });
}

export function formatDayShort(key: string) {
  return format(fromKey(key), "EEE d", { locale: fr });
}

export function formatWeekRange(weekStart: string) {
  const start = fromKey(weekStart);
  const end = addDays(start, 6);
  return `${format(start, "d MMM", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`;
}

export function currentWeekStart(now = new Date()) {
  return toKey(startOfWeek(now, { weekStartsOn: 1 }));
}

export function isTodaySunday(now = new Date()) {
  return isSunday(now);
}

export function keysBetween(startKey: string, endKey: string) {
  const keys: string[] = [];
  let cursor = fromKey(startKey);
  const end = fromKey(endKey);
  while (!isAfter(startOfDay(cursor), startOfDay(end))) {
    keys.push(toKey(cursor));
    cursor = addDays(cursor, 1);
  }
  return keys;
}

export function pastKeys(days: number, now = new Date()) {
  const end = subDays(now, 1);
  const start = subDays(now, days);
  return keysBetween(toKey(start), toKey(end));
}

export function lastNKeysIncludingToday(n: number, now = new Date()) {
  const start = subDays(now, n - 1);
  return keysBetween(toKey(start), toKey(now));
}

export function hourOfDay(now = new Date()) {
  return now.getHours();
}

export function isOnOrAfter(a: string, b: string) {
  return a === b || isAfter(fromKey(a), fromKey(b));
}

export function isOnOrBefore(a: string, b: string) {
  return a === b || isBefore(fromKey(a), fromKey(b));
}
