import { getMonday, formatTimeAgo } from '../lib/utils';

describe('utils', () => {
  describe('getMonday', () => {
    it('returns the Monday of the given week', () => {
      const wednesday = new Date(2025, 5, 4);
      const result = getMonday(wednesday);
      const monday = new Date(2025, 5, 2);
      expect(result).toBe(monday.toISOString().slice(0, 10));
    });

    it('returns the same date if it is already Monday', () => {
      const monday = new Date(2025, 5, 2);
      const result = getMonday(monday);
      expect(result).toBe(monday.toISOString().slice(0, 10));
    });

    it('handles Sunday correctly (previous Monday)', () => {
      const sunday = new Date(2025, 5, 1);
      const result = getMonday(sunday);
      const expected = new Date(2025, 4, 26);
      expect(result).toBe(expected.toISOString().slice(0, 10));
    });

    it('handles Saturday correctly', () => {
      const saturday = new Date(2025, 5, 7);
      const result = getMonday(saturday);
      const expected = new Date(2025, 5, 2);
      expect(result).toBe(expected.toISOString().slice(0, 10));
    });

    it('does not mutate the input date', () => {
      const input = new Date(2025, 5, 4);
      const originalTime = input.getTime();
      getMonday(input);
      expect(input.getTime()).toBe(originalTime);
    });

    it('returns YYYY-MM-DD format', () => {
      const date = new Date(2025, 0, 15);
      const result = getMonday(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('formatTimeAgo', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-06-04T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns "just now" for recent dates', () => {
      expect(formatTimeAgo(new Date())).toBe('just now');
    });

    it('returns minutes for recent past', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatTimeAgo(fiveMinAgo)).toBe('5m ago');
    });

    it('accepts ISO string input', () => {
      const iso = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatTimeAgo(iso)).toBe('2h ago');
    });

    it('returns days for dates older than 24 hours', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatTimeAgo(threeDaysAgo)).toBe('3d ago');
    });

    it('handles hours boundary correctly', () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      expect(formatTimeAgo(oneHourAgo)).toBe('1h ago');
    });

    it('handles minutes boundary correctly', () => {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      expect(formatTimeAgo(thirtyMinAgo)).toBe('30m ago');
    });

    it('handles dates in the future gracefully', () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000);
      const result = formatTimeAgo(futureDate);
      expect(result).toBe('just now');
    });
  });
});
