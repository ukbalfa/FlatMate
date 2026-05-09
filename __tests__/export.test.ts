/* eslint-disable @typescript-eslint/no-explicit-any */
import { exportExpensesToCSV, generateYearlySummary } from '../lib/export';

describe('export utilities', () => {
  describe('generateYearlySummary', () => {
    const sampleExpenses = [
      { id: '1', amount: 500, category: 'Rent', paidBy: 'Alice', date: '2025-01-15' },
      { id: '2', amount: 100, category: 'Food', paidBy: 'Bob', date: '2025-01-20' },
      { id: '3', amount: 200, category: 'Food', paidBy: 'Alice', date: '2025-03-05' },
      { id: '4', amount: 300, category: 'Utilities', paidBy: 'Bob', date: '2025-03-10' },
      { id: '5', amount: 1000, category: 'Rent', paidBy: 'Alice', date: '2024-12-01' },
    ];

    it('returns 12 months', () => {
      const summary = generateYearlySummary(sampleExpenses, 2025);
      expect(summary).toHaveLength(12);
    });

    it('calculates correct total for months with expenses', () => {
      const summary = generateYearlySummary(sampleExpenses, 2025);
      expect(summary[0].month).toBe('January');
      expect(summary[0].total).toBe(600);
    });

    it('calculates correct total for months without expenses', () => {
      const summary = generateYearlySummary(sampleExpenses, 2025);
      expect(summary[1].month).toBe('February');
      expect(summary[1].total).toBe(0);
    });

    it('groups expenses by category', () => {
      const summary = generateYearlySummary(sampleExpenses, 2025);
      expect(summary[2].byCategory['Food']).toBe(200);
      expect(summary[2].byCategory['Utilities']).toBe(300);
    });

    it('excludes expenses from different years', () => {
      const summary = generateYearlySummary(sampleExpenses, 2025);
      const total = summary.reduce((sum, m) => sum + m.total, 0);
      expect(total).toBe(1100);
    });

    it('handles empty expense array', () => {
      const summary = generateYearlySummary([], 2025);
      expect(summary).toHaveLength(12);
      expect(summary.every((m) => m.total === 0)).toBe(true);
    });

    it('uses correct month names in order', () => {
      const summary = generateYearlySummary(sampleExpenses, 2025);
      expect(summary.map((m) => m.month)).toEqual([
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]);
    });

    it('handles expenses with non-numeric amounts', () => {
      const expensesWithBadData = [
        { id: '1', amount: 'invalid' as unknown as number, category: 'Rent', paidBy: 'Alice', date: '2025-05-01' },
        { id: '2', amount: 200, category: 'Food', paidBy: 'Bob', date: '2025-05-01' },
      ];
      const summary = generateYearlySummary(expensesWithBadData as any, 2025);
      expect(summary[4].total).toBe(200);
    });
  });

  describe('exportExpensesToCSV', () => {
    beforeEach(() => {
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => null);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => null);
      global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
      global.URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('triggers a download when called with expenses', () => {
      const mockLink = {
        click: jest.fn(),
        setAttribute: jest.fn(),
        style: {},
      } as unknown as HTMLAnchorElement;
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      const expenses = [
        { id: '1', amount: 100, category: 'Rent', paidBy: 'Alice', date: '2025-06-01' },
      ];
      exportExpensesToCSV(expenses);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('generates CSV with correct headers and data', () => {
      let capturedContent = '';
      const OriginalBlob = global.Blob;
      global.Blob = class MockBlob {
        constructor(content: string[]) {
          capturedContent = content[0];
        }
      } as any;
      const mockLink = { click: jest.fn(), setAttribute: jest.fn(), style: {} } as unknown as HTMLAnchorElement;
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      const expenses = [
        { id: '1', amount: 500, category: 'Food', paidBy: 'Bob', date: '2025-06-01', note: 'Lunch' },
      ];
      exportExpensesToCSV(expenses);

      expect(capturedContent).toContain('Date,Category,Amount,Paid By,Note');
      expect(capturedContent).toContain('2025-06-01,Food,500,Bob,Lunch');

      global.Blob = OriginalBlob;
    });

    it('escapes values containing commas', () => {
      let capturedContent = '';
      const OriginalBlob = global.Blob;
      global.Blob = class MockBlob {
        constructor(content: string[]) {
          capturedContent = content[0];
        }
      } as any;
      const mockLink = { click: jest.fn(), setAttribute: jest.fn(), style: {} } as unknown as HTMLAnchorElement;
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      const expenses = [
        { id: '1', amount: 100, category: 'Utilities, Water', paidBy: 'Alice', date: '2025-06-01' },
      ];
      exportExpensesToCSV(expenses);

      expect(capturedContent).toContain('"Utilities, Water"');

      global.Blob = OriginalBlob;
    });

    it('escapes values containing double quotes', () => {
      let capturedContent = '';
      const OriginalBlob = global.Blob;
      global.Blob = class MockBlob {
        constructor(content: string[]) {
          capturedContent = content[0];
        }
      } as any;
      const mockLink = { click: jest.fn(), setAttribute: jest.fn(), style: {} } as unknown as HTMLAnchorElement;
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      const expenses = [
        { id: '1', amount: 100, category: 'Rent', paidBy: 'Alice', date: '2025-06-01', note: 'Said "ok"' },
      ];
      exportExpensesToCSV(expenses);

      expect(capturedContent).toContain('"Said ""ok"""');

      global.Blob = OriginalBlob;
    });

    it('uses default filename when not provided', () => {
      const mockLink = { click: jest.fn(), setAttribute: jest.fn(), style: {} } as unknown as HTMLAnchorElement;
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      const expenses = [
        { id: '1', amount: 100, category: 'Rent', paidBy: 'Alice', date: '2025-06-01' },
      ];
      exportExpensesToCSV(expenses);

      const downloadCall = mockLink.setAttribute.mock.calls.find(
        (call) => call[0] === 'download'
      );
      expect(downloadCall[1]).toMatch(/^flatmate-expenses-\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('uses custom filename when provided', () => {
      const mockLink = { click: jest.fn(), setAttribute: jest.fn(), style: {} } as unknown as HTMLAnchorElement;
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      const expenses = [
        { id: '1', amount: 100, category: 'Rent', paidBy: 'Alice', date: '2025-06-01' },
      ];
      exportExpensesToCSV(expenses, 'custom-export.csv');

      const downloadCall = mockLink.setAttribute.mock.calls.find(
        (call) => call[0] === 'download'
      );
      expect(downloadCall[1]).toBe('custom-export.csv');
    });

    it('sorts expenses by date descending', () => {
      let capturedContent = '';
      const OriginalBlob = global.Blob;
      global.Blob = class MockBlob {
        constructor(content: string[]) {
          capturedContent = content[0];
        }
      } as any;
      const mockLink = { click: jest.fn(), setAttribute: jest.fn(), style: {} } as unknown as HTMLAnchorElement;
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      const expenses = [
        { id: '1', amount: 100, category: 'Food', paidBy: 'Bob', date: '2025-03-01' },
        { id: '2', amount: 200, category: 'Rent', paidBy: 'Alice', date: '2025-06-01' },
      ];
      exportExpensesToCSV(expenses);

      const rentIndex = capturedContent.indexOf('Rent');
      const foodIndex = capturedContent.indexOf('Food');
      expect(rentIndex).toBeLessThan(foodIndex);

      global.Blob = OriginalBlob;
    });
  });
});
