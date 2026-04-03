import { format, parse, parseISO, setHours, setMinutes, startOfDay } from 'date-fns';

/** Внутрішній ключ дня для навігації (yyyy-MM-dd) */
export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateKey(key: string): Date {
  return parse(key, 'yyyy-MM-dd', new Date());
}

/** Відображення дати для користувача: дд/мм/рррр */
export function formatDisplayDate(isoOrTimestamp: string | Date): string {
  try {
    if (typeof isoOrTimestamp === 'string') {
      const t = isoOrTimestamp.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
        return format(parseDateKey(t), 'dd/MM/yyyy');
      }
    }
    const d =
      typeof isoOrTimestamp === 'string'
        ? parseISO(isoOrTimestamp)
        : isoOrTimestamp;
    if (Number.isNaN(d.getTime())) {
      const d2 = parse(
        isoOrTimestamp.toString().slice(0, 10),
        'yyyy-MM-dd',
        new Date(),
      );
      return format(d2, 'dd/MM/yyyy');
    }
    return format(d, 'dd/MM/yyyy');
  } catch {
    return String(isoOrTimestamp);
  }
}

export function calendarKeyToDisplay(yMdKey: string): string {
  try {
    return format(parseDateKey(yMdKey), 'dd/MM/yyyy');
  } catch {
    return yMdKey;
  }
}

/** Розбір дд/мм/рррр → ISO початку календарного дня (UTC-незалежно через локальну дату) */
export function parseDisplayDateToStartOfDayIso(input: string): string | null {
  const t = input.trim();
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10) - 1;
  const yyyy = parseInt(m[3], 10);
  const d = new Date(yyyy, mm, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm || d.getDate() !== dd) {
    return null;
  }
  return startOfDay(d).toISOString();
}

export function displayToCalendarKey(display: string): string | null {
  const t = display.trim();
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const dd = parseInt(m[1], 10);
  const mon = parseInt(m[2], 10) - 1;
  const yyyy = parseInt(m[3], 10);
  const d = new Date(yyyy, mon, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mon || d.getDate() !== dd) {
    return null;
  }
  return formatDateKey(d);
}

/** Початкова дата проєкту: дд/мм/рррр або сумісність зі старим ISO */
export function parseFlexibleStartDateToIso(raw: string): string | null {
  const dmy = parseDisplayDateToStartOfDayIso(raw.trim());
  if (dmy) return dmy;
  try {
    const d = parseISO(raw.trim());
    if (!Number.isNaN(d.getTime())) return startOfDay(d).toISOString();
  } catch {
    /* empty */
  }
  return null;
}

export function toTimeString(iso: string): string {
  try {
    return format(new Date(iso), 'HH:mm');
  } catch {
    return '09:00';
  }
}

export function combineDateAndTime(date: Date, hm: string): string {
  const parts = hm.trim().split(':');
  const h = Math.min(23, Math.max(0, parseInt(parts[0] ?? '0', 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(parts[1] ?? '0', 10) || 0));
  let d = startOfDay(date);
  d = setHours(d, h);
  d = setMinutes(d, m);
  return d.toISOString();
}
