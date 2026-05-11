import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { RecurringExpense } from './types';

export async function generateMissingRecurringExpenses(flatId: string) {
  if (!flatId) return [];

  const q = query(collection(db, 'recurringExpenses'), where('flatId', '==', flatId));
  const snapshot = await getDocs(q);

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date(todayStr);

  const BATCH_LIMIT = 500;
  let batch = writeBatch(db);
  let operationCount = 0;
  const results: { recurringId: string; generated: number }[] = [];

  for (const expenseDoc of snapshot.docs) {
    const data = expenseDoc.data() as RecurringExpense;
    const recurringId = expenseDoc.id;

    // Use lastGeneratedDate, or fallback to startDate
    const baseDateStr = data.lastGeneratedDate || data.startDate;
    if (!baseDateStr) continue;

    // Skip if already up to date (last generated today or in the future)
    if (baseDateStr >= todayStr) {
      continue;
    }

    const currentDate = new Date(baseDateStr);
    const nextDates: string[] = [];
    const maxEntries = 365;

    // Advance to the first missed date
    advanceDate(currentDate, data.pattern);

    const endDate = data.endDate ? new Date(data.endDate) : null;

    while (currentDate <= today && nextDates.length < maxEntries) {
      if (endDate && currentDate > endDate) break;

      nextDates.push(currentDate.toISOString().slice(0, 10));
      advanceDate(currentDate, data.pattern);
    }

    if (nextDates.length > 0) {
      for (const d of nextDates) {
        const newExpenseRef = doc(collection(db, 'expenses'));
        batch.set(newExpenseRef, {
          flatId,
          amount: data.amount,
          category: data.category,
          paidBy: data.paidBy,
          date: d,
          note: data.note ? `${data.note} (Recurring)` : (data.description || 'Recurring expense'),
          isRecurring: true,
          recurrencePattern: data.pattern,
          recurrenceEndDate: data.endDate || null,
          parentExpenseId: recurringId
        });
        operationCount++;
      }

      batch.update(expenseDoc.ref, { lastGeneratedDate: todayStr });
      operationCount++;

      results.push({ recurringId, generated: nextDates.length });

      if (operationCount >= BATCH_LIMIT) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return results;
}

function advanceDate(date: Date, pattern: 'daily' | 'weekly' | 'monthly' | 'yearly') {
  if (pattern === 'daily') {
    date.setDate(date.getDate() + 1);
  } else if (pattern === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else if (pattern === 'monthly') {
    const currentDay = date.getDate();
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const maxDayInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    const targetDay = Math.min(currentDay, maxDayInNextMonth);
    date.setMonth(date.getMonth() + 1);
    date.setDate(targetDay);
  } else if (pattern === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
}
