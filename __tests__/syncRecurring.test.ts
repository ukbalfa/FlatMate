jest.mock('../lib/recurringExpensesEngine', () => ({
  generateMissingRecurringExpenses: jest.fn(),
}));
jest.mock('../lib/recurringTasksEngine', () => ({
  generateMissingRecurringTasks: jest.fn(),
}));

import { syncRecurringItems } from '../lib/syncRecurring';
import { generateMissingRecurringExpenses } from '../lib/recurringExpensesEngine';
import { generateMissingRecurringTasks } from '../lib/recurringTasksEngine';

const mockSyncExpenses = generateMissingRecurringExpenses as jest.MockedFunction<typeof generateMissingRecurringExpenses>;
const mockSyncTasks = generateMissingRecurringTasks as jest.MockedFunction<typeof generateMissingRecurringTasks>;

describe('syncRecurringItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls both engines with the given flatId', async () => {
    mockSyncExpenses.mockResolvedValueOnce([{ recurringId: 'r1', generated: 3 }]);
    mockSyncTasks.mockResolvedValueOnce([{ recurringId: 'rt1', generated: 2 }]);

    const result = await syncRecurringItems('flat-123');

    expect(mockSyncExpenses).toHaveBeenCalledWith('flat-123');
    expect(mockSyncTasks).toHaveBeenCalledWith('flat-123');
    expect(result).toEqual({
      expenses: [{ recurringId: 'r1', generated: 3 }],
      tasks: [{ recurringId: 'rt1', generated: 2 }],
    });
  });

  it('returns empty results for empty flatId', async () => {
    const result = await syncRecurringItems('');
    expect(result).toEqual({ expenses: [], tasks: [] });
  });

  it('handles engine failure gracefully', async () => {
    mockSyncExpenses.mockRejectedValueOnce(new Error('Firestore error'));
    mockSyncTasks.mockResolvedValueOnce([{ recurringId: 'rt1', generated: 1 }]);

    const result = await syncRecurringItems('flat-123');
    expect(result).toEqual({ expenses: [], tasks: [{ recurringId: 'rt1', generated: 1 }] });
  });
});
