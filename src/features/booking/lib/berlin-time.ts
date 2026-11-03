import { bookingConfig } from "@/content/booking";

/** A calendar day as "YYYY-MM-DD", with no time zone attached. */
export type PlainDate = string;

// h23 avoids the "24:00" midnight that some engines emit with hour12: false.
const wallClock = new Intl.DateTimeFormat("en-US", {
  timeZone: bookingConfig.timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Today's date and minutes since midnight on the club's wall clock. */
export function berlinNow(now: Date): { date: PlainDate; minutes: number } {
  const parts = Object.fromEntries(
    wallClock.formatToParts(now).map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** The calendar day on the visitor's own device clock. */
export function localDate(now: Date): PlainDate {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function toUtcMidnight(date: PlainDate): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y!, m! - 1, d!);
}

function fromUtc(ms: number): PlainDate {
  return new Date(ms).toISOString().slice(0, 10);
}

// Plain-date arithmetic in UTC, so a DST switch can never add or drop a day.
export function addDays(date: PlainDate, days: number): PlainDate {
  return fromUtc(toUtcMidnight(date) + days * 86_400_000);
}

/** `n` consecutive days starting with `today`. */
export function nextDays(today: PlainDate, n: number): PlainDate[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i));
}

/**
 * The booking window: today while a game still fits before closing, otherwise
 * from tomorrow, so a late-evening visit doesn't open on a day with nothing left.
 */
export function bookableDays(now: Date): PlainDate[] {
  const { date, minutes } = berlinNow(now);
  const lastStart =
    wallTimeToMinutes(bookingConfig.closesAt) - Math.min(...bookingConfig.durations);
  const first = minutes <= lastStart ? date : addDays(date, 1);
  return nextDays(first, bookingConfig.horizonDays);
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(date: PlainDate): number {
  return new Date(toUtcMidnight(date)).getUTCDay();
}

/**
 * A Date to hand to formatters for labelling a plain day. Noon UTC is the same
 * calendar day in Berlin all year, so formatting with that time zone never shifts it.
 */
export function toLabelDate(date: PlainDate): Date {
  return new Date(toUtcMidnight(date) + 12 * 3_600_000);
}

export function isRealCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return fromUtc(toUtcMidnight(value)) === value;
}

export function wallTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h! * 60 + m!;
}

export function minutesToWallTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
