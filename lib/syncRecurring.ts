import { generateMissingRecurringExpenses } from './recurringExpensesEngine';
import { generateMissingRecurringTasks } from './recurringTasksEngine';

export async function syncRecurringItems(flatId: string) {
  if (!flatId) return { expenses: [], tasks: [] };

  const [expensesResult, tasksResult] = await Promise.allSettled([
    generateMissingRecurringExpenses(flatId),
    generateMissingRecurringTasks(flatId),
  ]);

  return {
    expenses: expensesResult.status === 'fulfilled' ? expensesResult.value : [],
    tasks: tasksResult.status === 'fulfilled' ? tasksResult.value : [],
  };
}
