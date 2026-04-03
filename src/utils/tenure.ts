import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  parseISO,
} from 'date-fns';

/** Тривалість від початку до «зараз» або до endIso (завершений проєкт) */
export function formatTenure(startIso: string, endIso?: string | null): string {
  try {
    const start = parseISO(startIso);
    const end = endIso ? parseISO(endIso) : new Date();
    const years = differenceInYears(end, start);
    const monthsTotal = differenceInMonths(end, start);
    const days = differenceInDays(end, start);
    if (years >= 1) {
      const m = monthsTotal - years * 12;
      return `${years} р. ${m} міс.`;
    }
    if (monthsTotal >= 1) return `${monthsTotal} міс.`;
    return `${Math.max(0, days)} дн.`;
  } catch {
    return '—';
  }
}
