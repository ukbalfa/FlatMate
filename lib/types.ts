// ============================================================
// Centralized TypeScript Types for FlatMate
// All shared interfaces are defined here and imported everywhere
// ============================================================

// ---------------------------------------------------------------------------
// User Profile (auth + Firestore users collection)
// ---------------------------------------------------------------------------
export interface UserProfile {
  uid: string;
  username: string;
  flatId?: string;
  name?: string;
  role?: "admin" | "roommate";
  color?: string;
  occupation?: string;
  phone?: string;
  telegram?: string;
  instagram?: string;
  joinedAt?: string;
}

// ---------------------------------------------------------------------------
// Roommate / User (used across dashboard pages for listing people)
// ---------------------------------------------------------------------------
export interface Roommate {
  id: string;
  username: string;
  name?: string;
  surname?: string;
  role: "admin" | "roommate";
  color: string;
  occupation?: string;
  phone?: string;
  telegram?: string;
  instagram?: string;
  joinedAt: string;
}

// ---------------------------------------------------------------------------
// Expense
// ---------------------------------------------------------------------------
export interface SplitMember {
  id: string;
  name: string;
  avatar: string;
}

export interface Expense {
  id: string;
  flatId?: string;
  amount: number;
  category: string;
  description?: string;
  paidBy: string;
  date: string;
  note?: string;
  receiptUrl?: string;
  isRecurring?: boolean;
  splitWith?: SplitMember[];
  recurrencePattern?: "monthly" | "weekly" | "yearly";
  recurrenceEndDate?: string;
  parentExpenseId?: string;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Recurring Expense
// ---------------------------------------------------------------------------
export interface RecurringExpense {
  id?: string;
  flatId: string;
  amount: number;
  currency?: string;
  description?: string;
  category: string;
  paidBy: string;
  startDate: string;
  endDate?: string | null;
  pattern: "daily" | "weekly" | "monthly" | "yearly";
  note?: string;
  createdAt: string;
  nextDueDate?: string;
  lastGeneratedDate?: string;
}

// ---------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------
export interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string;
  note?: string;
  status: "pending" | "completed";
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Cleaning Task
// ---------------------------------------------------------------------------
export interface CleaningTask {
  id: string;
  task: string;
  assignedTo: string;
  dayOfWeek: string;
  weekStart: string;
  done: boolean;
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------
export interface Task {
  id: string;
  text: string;
  done: boolean;
  assignedTo: string;
  dueDate: string;
  createdBy: string;
}

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "task" | "expense" | "cleaning" | "settlement" | "system";
  read: boolean;
  createdAt: string;
  link?: string;
  data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Flat document (for budget limits)
// ---------------------------------------------------------------------------
export interface Flat {
  id?: string;
  name?: string;
  budgets?: Record<string, number>;
  rentDueDay?: number;
  rentPaidThisMonth?: boolean;
  lastPaidMonth?: string;
}

// ---------------------------------------------------------------------------
// Activity Item (dashboard home page)
// ---------------------------------------------------------------------------
export interface ActivityItem {
  id: string;
  type: "expense" | "task" | "cleaning" | "settlement";
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  user?: string;
}

// ---------------------------------------------------------------------------
// Announcement (bulletin board)
// ---------------------------------------------------------------------------
export interface Announcement {
  id?: string;
  flatId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: unknown;
  isPinned?: boolean;
}