import { parseStayDate, eachStayDate, stayNights } from './date.util';

describe('parseStayDate', () => {
  it('anchors a plain calendar date at UTC midnight', () => {
    expect(parseStayDate('2026-08-01').toISOString()).toBe(
      '2026-08-01T00:00:00.000Z',
    );
  });

  it('recovers the calendar date an IST guest selected', () => {
    // What a browser at UTC+5:30 produces for local midnight on 1 August.
    expect(parseStayDate('2026-07-31T18:30:00.000Z').toISOString()).toBe(
      '2026-08-01T00:00:00.000Z',
    );
  });

  it('maps UTC midnight and IST local midnight to the same night', () => {
    const fromDateOnly = parseStayDate('2026-08-01');
    const fromIstMidnight = parseStayDate('2026-07-31T18:30:00.000Z');

    // The double-booking path: these two must key the same inventory row.
    expect(fromDateOnly.getTime()).toBe(fromIstMidnight.getTime());
  });

  it('strips a mid-day time component', () => {
    expect(parseStayDate('2026-08-01T09:15:00.000Z').toISOString()).toBe(
      '2026-08-01T00:00:00.000Z',
    );
  });

  it('rejects an unparseable value', () => {
    expect(() => parseStayDate('not-a-date')).toThrow('Invalid stay date');
  });
});

describe('eachStayDate', () => {
  it('is check-in inclusive and check-out exclusive', () => {
    const nights = eachStayDate(
      parseStayDate('2026-08-01'),
      parseStayDate('2026-08-04'),
    );

    expect(nights.map((d) => d.toISOString())).toEqual([
      '2026-08-01T00:00:00.000Z',
      '2026-08-02T00:00:00.000Z',
      '2026-08-03T00:00:00.000Z',
    ]);
  });

  it('returns no nights for a same-day range', () => {
    expect(
      eachStayDate(parseStayDate('2026-08-01'), parseStayDate('2026-08-01')),
    ).toHaveLength(0);
  });

  it('counts correctly across a month boundary', () => {
    expect(
      stayNights(parseStayDate('2026-08-30'), parseStayDate('2026-09-02')),
    ).toBe(3);
  });

  it('counts correctly across a DST transition', () => {
    // Stepping with local setDate() mis-counts here; UTC stepping does not.
    expect(
      stayNights(parseStayDate('2026-03-28'), parseStayDate('2026-03-31')),
    ).toBe(3);
  });
});
