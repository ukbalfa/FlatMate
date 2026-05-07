/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateMissingRecurringExpenses } from '../lib/recurringExpensesEngine';

jest.mock('../lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  writeBatch: jest.fn(),
  doc: jest.fn(),
}));

import { getDocs, writeBatch, doc } from 'firebase/firestore';

const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;

describe('recurringExpensesEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-04T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateMissingRecurringExpenses', () => {
    it('returns empty array when flatId is empty', async () => {
      const result = await generateMissingRecurringExpenses('');
      expect(result).toEqual([]);
    });

    it('returns empty array when no recurring expenses exist', async () => {
      mockGetDocs.mockResolvedValueOnce({ docs: [] } as any);

      const result = await generateMissingRecurringExpenses('flat-123');

      expect(result).toEqual([]);
    });

    it('skips recurring expenses with no startDate or lastGeneratedDate', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'rec-1', data: () => ({ flatId: 'flat-123', amount: 100, category: 'Rent', paidBy: 'Alice', pattern: 'monthly' }), ref: { id: 'rec-1' } },
        ],
      } as any);

      const result = await generateMissingRecurringExpenses('flat-123');

      expect(result).toEqual([]);
    });

    it('skips recurring expenses already up to date', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'rec-1',
            data: () => ({
              flatId: 'flat-123',
              amount: 100,
              category: 'Rent',
              paidBy: 'Alice',
              pattern: 'monthly',
              lastGeneratedDate: '2025-06-04',
              startDate: '2025-01-01',
            }),
            ref: { id: 'rec-1' },
          },
        ],
      } as any);

      const result = await generateMissingRecurringExpenses('flat-123');

      expect(result).toEqual([]);
    });

    it('generates missed entries for monthly pattern', async () => {
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'rec-1',
            data: () => ({
              flatId: 'flat-123',
              amount: 1000,
              category: 'Rent',
              paidBy: 'Alice',
              pattern: 'monthly',
              startDate: '2025-01-01',
            }),
            ref: { id: 'rec-1' },
          },
        ],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringExpenses('flat-123');

      expect(result).toHaveLength(1);
      expect(result[0].recurringId).toBe('rec-1');
      expect(result[0].generated).toBeGreaterThan(0);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('generates missed entries for weekly pattern', async () => {
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'rec-2',
            data: () => ({
              flatId: 'flat-123',
              amount: 50,
              category: 'Groceries',
              paidBy: 'Bob',
              pattern: 'weekly',
              startDate: '2025-05-01',
            }),
            ref: { id: 'rec-2' },
          },
        ],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringExpenses('flat-123');

      expect(result).toHaveLength(1);
      expect(result[0].generated).toBeGreaterThan(0);
    });

    it('generates missed entries for daily pattern', async () => {
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'rec-3',
            data: () => ({
              flatId: 'flat-123',
              amount: 10,
              category: 'Coffee',
              paidBy: 'Charlie',
              pattern: 'daily',
              startDate: '2025-06-01',
            }),
            ref: { id: 'rec-3' },
          },
        ],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringExpenses('flat-123');

      expect(result).toHaveLength(1);
      expect(result[0].generated).toBe(3);
    });

    it('respects endDate for recurring expenses', async () => {
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'rec-4',
            data: () => ({
              flatId: 'flat-123',
              amount: 100,
              category: 'Rent',
              paidBy: 'Alice',
              pattern: 'monthly',
              startDate: '2025-01-01',
              endDate: '2025-03-01',
            }),
            ref: { id: 'rec-4' },
          },
        ],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringExpenses('flat-123');

      expect(result).toHaveLength(1);
      expect(result[0].generated).toBe(2);
    });

    it('limits generated entries to 365 per recurring expense', async () => {
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'rec-5',
            data: () => ({
              flatId: 'flat-123',
              amount: 5,
              category: 'Daily',
              paidBy: 'Alice',
              pattern: 'daily',
              startDate: '2020-01-01',
            }),
            ref: { id: 'rec-5' },
          },
        ],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringExpenses('flat-123');

      expect(result[0].generated).toBeLessThanOrEqual(365);
    });

    it('updates lastGeneratedDate after processing', async () => {
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'rec-6',
            data: () => ({
              flatId: 'flat-123',
              amount: 100,
              category: 'Rent',
              paidBy: 'Alice',
              pattern: 'monthly',
              startDate: '2025-01-01',
            }),
            ref: { id: 'rec-6' },
          },
        ],
      } as any);
      mockDoc.mockReturnValue({} as any);

      await generateMissingRecurringExpenses('flat-123');

      expect(mockBatch.update).toHaveBeenCalledWith(
        { id: 'rec-6' },
        { lastGeneratedDate: '2025-06-04' }
      );
    });

    it('sets correct fields on generated expense', async () => {
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'rec-7',
            data: () => ({
              flatId: 'flat-123',
              amount: 100,
              category: 'Rent',
              paidBy: 'Alice',
              pattern: 'monthly',
              note: 'Monthly rent payment',
              startDate: '2025-01-01',
            }),
            ref: { id: 'rec-7' },
          },
        ],
      } as any);
      const mockDocRef = {};
      mockDoc.mockReturnValue(mockDocRef as any);

      await generateMissingRecurringExpenses('flat-123');

      const setCall = mockBatch.set.mock.calls[0];
      expect(setCall[0]).toBe(mockDocRef);
      expect(setCall[1]).toMatchObject({
        flatId: 'flat-123',
        amount: 100,
        category: 'Rent',
        paidBy: 'Alice',
        isRecurring: true,
        recurrencePattern: 'monthly',
        parentExpenseId: 'rec-7',
      });
      expect(setCall[1].note).toContain('(Recurring)');
    });

    it('handles yearly pattern correctly', async () => {
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'rec-8',
            data: () => ({
              flatId: 'flat-123',
              amount: 5000,
              category: 'Insurance',
              paidBy: 'Alice',
              pattern: 'yearly',
              startDate: '2023-06-04',
            }),
            ref: { id: 'rec-8' },
          },
        ],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringExpenses('flat-123');

      expect(result).toHaveLength(1);
      expect(result[0].generated).toBe(2);
    });
  });
});
