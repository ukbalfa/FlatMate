'use server';

import { getAdminApp } from '../../lib/firebase-admin';
import admin from 'firebase-admin';
import { DEFAULT_CURRENCY } from '../../lib/utils';

interface NotificationPayload {
  memberIds: string[];
  senderName: string;
  amount: number;
  category: string;
}

export async function createSplitNotifications({
  memberIds,
  senderName,
  amount,
  category,
}: NotificationPayload): Promise<void> {
  getAdminApp();
  const db = admin.firestore();
  const batch = db.batch();

  memberIds.forEach((userId) => {
    const ref = db.collection('notifications').doc();
    batch.set(ref, {
      userId,
      title: 'New Shared Expense',
      message: `${senderName} added a ${amount.toLocaleString()} ${DEFAULT_CURRENCY} expense for ${category}.`,
      type: 'expense',
      read: false,
      link: '/dashboard/expenses',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}
