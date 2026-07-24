/**
 * Stay dates are calendar dates, not instants.
 *
 * A booking for "1 August" means the same night regardless of where the guest
 * is browsing from. Storing an offset timestamp broke that: an IST guest's
 * local midnight arrives as `2026-07-31T18:30:00Z`, so inventory rows were
 * keyed at 18:30Z and two guests in different timezones booking the same night
 * wrote to *different* rows — a genuine double-booking path.
 *
 * Everything here normalises to UTC midnight so one calendar night maps to
 * exactly one inventory row.
 */

/**
 * Offset used to recover the intended calendar date from a legacy full-ISO
 * timestamp. The platform operates solely in India (INR pricing, Andhra
 * Pradesh properties), so a datetime sent by a client is interpreted in IST.
 *
 * New clients send plain `YYYY-MM-DD` and never rely on this.
 */
const INDIA_UTC_OFFSET_MINUTES = 5 * 60 + 30;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalises a stay date to UTC midnight.
 *
 * Accepts either a plain calendar date (`2026-08-01`) — the preferred wire
 * format — or a full ISO timestamp, which is interpreted in IST to recover the
 * calendar date the guest actually selected.
 */
export const parseStayDate = (input: string | Date): Date => {
  if (input instanceof Date) {
    return floorToUtcDate(shiftToIndia(input));
  }

  const value = String(input).trim();

  if (DATE_ONLY_PATTERN.test(value)) {
    // Already a calendar date: anchor it directly at UTC midnight.
    return new Date(`${value}T00:00:00.000Z`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid stay date: ${value}`);
  }

  return floorToUtcDate(shiftToIndia(parsed));
};

/** Shifts an instant into IST so its calendar date can be read in UTC terms. */
const shiftToIndia = (date: Date): Date =>
  new Date(date.getTime() + INDIA_UTC_OFFSET_MINUTES * 60 * 1000);

/** Drops the time portion, leaving UTC midnight of the same calendar day. */
const floorToUtcDate = (date: Date): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

/**
 * Every night occupied by a stay: check-in inclusive, check-out exclusive.
 *
 * Steps in UTC rather than with `setDate`, which walks local calendar days and
 * mis-counts across a DST transition.
 */
export const eachStayDate = (checkIn: Date, checkOut: Date): Date[] => {
  const dates: Date[] = [];
  const start = floorToUtcDate(checkIn);
  const end = floorToUtcDate(checkOut);

  for (
    let cursor = start;
    cursor < end;
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  ) {
    dates.push(new Date(cursor));
  }

  return dates;
};

/** Number of nights between two stay dates. */
export const stayNights = (checkIn: Date, checkOut: Date): number =>
  eachStayDate(checkIn, checkOut).length;
