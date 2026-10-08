const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_TRIP_DAYS = 90;

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Parses a YYYY-MM-DD string into a local Date, or null if invalid. */
export function parseISODate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** "Mon, Oct 7" */
export function formatDay(iso: string): string {
  const d = parseISODate(iso);
  if (!d) return iso;
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "Oct 7 – 12, 2026" or "Dec 28, 2026 – Jan 3, 2027" */
export function formatRange(startIso: string, endIso: string): string {
  const s = parseISODate(startIso);
  const e = parseISODate(endIso);
  if (!s || !e) return `${startIso} – ${endIso}`;
  if (s.getFullYear() !== e.getFullYear()) {
    return `${MONTHS[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()} – ${MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
  }
  if (s.getMonth() === e.getMonth()) {
    return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

/** Every date from start to end inclusive (capped so a typo can't create thousands of days). */
export function datesInRange(startIso: string, endIso: string): string[] {
  const start = parseISODate(startIso);
  const end = parseISODate(endIso);
  if (!start || !end || end < start) return [];
  const out: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end && out.length < MAX_TRIP_DAYS) {
    out.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = parseISODate(fromIso);
  const b = parseISODate(toIso);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function tripStatus(startIso: string, endIso: string): string {
  const today = todayISO();
  const untilStart = daysBetween(today, startIso);
  if (untilStart > 1) return `In ${untilStart} days`;
  if (untilStart === 1) return 'Tomorrow';
  if (daysBetween(today, endIso) >= 0) return 'Happening now';
  return 'Completed';
}

/** Accepts "9:30", "0930", "9", "21:05" and returns "09:30"-style 24h time, '' for blank, or null if invalid. */
export function normalizeTime(value: string): string | null {
  const v = value.trim();
  if (!v) return '';
  const m = /^(\d{1,2})(?::?(\d{2}))?$/.exec(v);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  return `${pad(h)}:${pad(min)}`;
}

/** "09:30" -> "9:30 AM" */
export function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${suffix}`;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  CAD: '$',
  USD: '$',
  AUD: '$',
  MXN: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

export const CURRENCIES = Object.keys(CURRENCY_SYMBOLS);

export function formatMoney(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '';
  const decimals = currency === 'JPY' ? 0 : 2;
  const [whole, frac] = Math.abs(amount).toFixed(decimals).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+$)/g, ',');
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${grouped}${frac ? `.${frac}` : ''}`;
}

/** Parses user-typed money like "1,250.50" or "$40". Returns null if not a valid non-negative number. */
export function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!cleaned || cleaned.split('.').length > 2) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}
