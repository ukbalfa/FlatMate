/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateMissingRecurringTasks } from '../lib/recurringTasksEngine';

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

describe('recurringTasksEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-04T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateMissingRecurringTasks', () => {
    it('returns empty array when flatId is empty', async () => {
      const result = await generateMissingRecurringTasks('');
      expect(result).toEqual([]);
    });

    it('returns empty array when no recurring tasks exist', async () => {
      mockGetDocs.mockResolvedValueOnce({ docs: [] } as any);
      const result = await generateMissingRecurringTasks('flat-123');
      expect(result).toEqual([]);
    });

    it('skips recurring tasks with no startDate or lastGeneratedDate', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'rec-task-1', data: () => ({ flatId: 'flat-123', text: 'Clean kitchen', assignedTo: 'Alice', pattern: 'weekly' }), ref: { id: 'rec-task-1' } },
        ],
      } as any);
      const result = await generateMissingRecurringTasks('flat-123');
      expect(result).toEqual([]);
    });

    it('skips recurring tasks already up to date', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-2',
          data: () => ({ flatId: 'flat-123', text: 'Clean kitchen', assignedTo: 'Alice', pattern: 'weekly', lastGeneratedDate: '2025-06-04', startDate: '2025-01-01' }),
          ref: { id: 'rec-task-2' },
        }],
      } as any);
      const result = await generateMissingRecurringTasks('flat-123');
      expect(result).toEqual([]);
    });

    it('generates missed entries for weekly pattern', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-3',
          data: () => ({ flatId: 'flat-123', text: 'Clean kitchen', assignedTo: 'Alice', priority: 'high', pattern: 'weekly', startDate: '2025-05-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-3' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringTasks('flat-123');
      expect(result).toHaveLength(1);
      expect(result[0].generated).toBe(4);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('generates missed entries for monthly pattern', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-4',
          data: () => ({ flatId: 'flat-123', text: 'Pay bills', assignedTo: 'Bob', priority: 'medium', pattern: 'monthly', startDate: '2025-01-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-4' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringTasks('flat-123');
      expect(result[0].generated).toBe(5);
    });

    it('generates entries for daily pattern', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-5',
          data: () => ({ flatId: 'flat-123', text: 'Water plants', assignedTo: 'Charlie', pattern: 'daily', startDate: '2025-06-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-5' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringTasks('flat-123');
      expect(result[0].generated).toBe(3);
    });

    it('respects endDate', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-6',
          data: () => ({ flatId: 'flat-123', text: 'Monthly task', assignedTo: 'Alice', pattern: 'monthly', startDate: '2025-01-01', endDate: '2025-03-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-6' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringTasks('flat-123');
      expect(result[0].generated).toBe(2);
    });

    it('limits generated entries to 365 per recurring task', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-7',
          data: () => ({ flatId: 'flat-123', text: 'Daily task', assignedTo: 'Alice', pattern: 'daily', startDate: '2020-01-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-7' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringTasks('flat-123');
      expect(result[0].generated).toBeLessThanOrEqual(365);
    });

    it('updates lastGeneratedDate after processing', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-8',
          data: () => ({ flatId: 'flat-123', text: 'Monthly task', assignedTo: 'Alice', pattern: 'monthly', startDate: '2025-01-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-8' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      await generateMissingRecurringTasks('flat-123');
      expect(mockBatch.update).toHaveBeenCalledWith({ id: 'rec-task-8' }, { lastGeneratedDate: '2025-06-04' });
    });

    it('sets correct fields on generated task', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-9',
          data: () => ({ flatId: 'flat-123', text: 'Clean kitchen', assignedTo: 'Alice', priority: 'high', pattern: 'weekly', startDate: '2025-01-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-9' },
        }],
      } as any);
      const mockDocRef = {};
      mockDoc.mockReturnValue(mockDocRef as any);

      await generateMissingRecurringTasks('flat-123');

      const setCall = mockBatch.set.mock.calls[0];
      expect(setCall[0]).toBe(mockDocRef);
      expect(setCall[1]).toMatchObject({
        flatId: 'flat-123',
        text: 'Clean kitchen',
        assignedTo: 'Alice',
        priority: 'high',
        dueDate: expect.any(String),
        createdBy: 'admin',
        done: false,
        isRecurring: true,
        recurrencePattern: 'weekly',
        parentTaskId: 'rec-task-9',
      });
    });

    it('handles yearly pattern correctly', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-10',
          data: () => ({ flatId: 'flat-123', text: 'Annual review', assignedTo: 'Alice', pattern: 'yearly', startDate: '2023-06-04', createdBy: 'admin' }),
          ref: { id: 'rec-task-10' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringTasks('flat-123');
      expect(result[0].generated).toBe(2);
    });
  });
});
