interface Expense {
  id: string;
  amount: number;
  category: string;
  paidBy: string;
  date: string;
  note?: string;
}

export function exportExpensesToCSV(expenses: Expense[], filename?: string): void {
  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const headers = ['Date', 'Category', 'Amount', 'Paid By', 'Note'];

  const rows = sorted.map((expense) => [
    expense.date,
    expense.category,
    expense.amount.toString(),
    expense.paidBy,
    expense.note || '',
  ]);

  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    filename || `flatmate-expenses-${new Date().toISOString().slice(0, 10)}.csv`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateYearlySummary(
  expenses: Expense[],
  year: number
): { month: string; total: number; byCategory: Record<string, number> }[] {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return months.map((month, index) => {
    const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
    const monthExpenses = expenses.filter((e) => e.date.startsWith(monthKey));
    
    const total = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    
    const byCategory: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + (Number(e.amount) || 0);
    });

    return { month, total, byCategory };
  });
}
