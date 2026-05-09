"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import {
  Trash2,
  Repeat,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Download,
  PieChart,
  BarChart2,
} from "lucide-react";
import { Spinner } from "../../components/Spinner";
import { SkeletonList } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import ConfirmModal from "../../components/ConfirmModal";
import { toast } from "sonner";
import { useAuth } from "../../../context/AuthContext";
import { useI18n } from "../../../context/I18nContext";
import { logError } from "../../../lib/errorLogger";
import { ExpenseCard } from "./components/ExpenseCard";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { BudgetTracker } from "./components/BudgetTracker";
import { ReceiptUpload } from "./components/ReceiptUpload";
import { SplitExpenseModal } from "./components/SplitExpenseModal";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  paidBy: string;
  date: string;
  note?: string;
  receiptUrl?: string;
  isRecurring?: boolean;
  splitWith?: Array<{ id: string; name: string; avatar: string }>;
  recurrencePattern?: "monthly" | "weekly" | "yearly";
  recurrenceEndDate?: string;
  parentExpenseId?: string;
}

interface RecurringExpense {
  id: string;
  amount: number;
  category: string;
  paidBy: string;
  startDate: string;
  endDate?: string;
  pattern: "monthly" | "weekly" | "yearly";
  note?: string;
  createdAt: string;
  nextDueDate: string;
}

const CATEGORIES = [
  { name: "Rent", color: "#F97316" },
  { name: "Groceries", color: "#3B82F6" },
  { name: "Utilities", color: "#F59E0B" },
  { name: "Internet", color: "#8B5CF6" },
  { name: "Misc", color: "#6B7280" },
];

function getCategoryColor(category: string) {
  return CATEGORIES.find((c) => c.name === category)?.color || "#6B7280";
}

function getMonth(date: string) {
  return date.slice(0, 7);
}

export default function ExpensesPage() {
  const { t } = useI18n();
  const { userProfile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Rent");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<"monthly" | "weekly" | "yearly">(
    "monthly"
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [showRecurringSection, setShowRecurringSection] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingRecurring, setGeneratingRecurring] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [splitWith, setSplitWith] = useState<
    Array<{ id: string; name: string; avatar: string }>
  >([]);

  // Mock roommates data - replace with real data from context
  const roommates = [
    {
      id: "1",
      name: "Alice",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    {
      id: "2",
      name: "Bob",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
  ];

  const isAdmin = userProfile?.role === "admin";

  // Load expenses
  useEffect(() => {
    if (!userProfile?.flatId) return;
    
    const q = query(
      collection(db, "expenses"),
      orderBy("date", "desc"),
      limit(200)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setExpenses(data as Expense[]);
        setLoading(false);
      },
      (error) => {
        logError(error, "Expenses.load");
        toast.error(t("expenses.toast.loadFailed"));
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [userProfile?.flatId, t]);

  // Load recurring expenses
  const loadRecurringExpenses = async () => {
    try {
      const q = query(
        collection(db, "recurringExpenses"),
        orderBy("createdAt", "desc"),
        limit(200)
      );
      const snap = await getDocs(q);
      setRecurringExpenses(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as RecurringExpense[]
      );
    } catch (error) {
      logError(error, "Expenses.loadRecurring");
    }
  };

  useEffect(() => {
    loadRecurringExpenses();
  }, []);

  // Prepare data for analytics
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (11 - i));
    const monthStr = month.toISOString().slice(0, 7);
    const total = expenses
      .filter((e) => getMonth(e.date) === monthStr)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      month: month.toLocaleString("default", { month: "short" }),
      expenses: total,
    };
  });

  const categoryData = CATEGORIES.map((cat) => {
    const total = expenses
      .filter((e) => e.category === cat.name && getMonth(e.date) === selectedMonth)
      .reduce((sum, e) => sum + e.amount, 0);
    return { ...cat, value: total };
  });

  const budgetLimits = {
    Rent: 500000,
    Groceries: 300000,
    Utilities: 200000,
    Internet: 150000,
    Misc: 100000,
  };

  const filteredExpenses = expenses
    .filter((e) => getMonth(e.date) === selectedMonth)
    .filter((e) => filter === "All" || e.category === filter);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) return;
    
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    setSubmitting(true);
    
    try {
      let receiptUrl = "";
      if (receiptFile) {
        // In a real app, upload to Firebase Storage here
        // For now, we'll just use a placeholder
        receiptUrl = "https://via.placeholder.com/400x200?text=Receipt";
      }
      
      await addDoc(collection(db, "expenses"), {
        flatId: userProfile?.flatId || "",
        amount: parsedAmount,
        category,
        description,
        paidBy: userProfile?.username || "",
        date,
        note,
        receiptUrl,
        splitWith,
        isRecurring: false,
        createdAt: serverTimestamp(),
      });
      
      toast.success(t("expenses.toast.added"));
      
      // Reset form
      setAmount("");
      setDescription("");
      setCategory("Rent");
      setDate(new Date().toISOString().slice(0, 10));
      setNote("");
      setReceiptFile(null);
      setSplitWith([]);
    } catch (error) {
      logError(error, "Expenses.add");
      toast.error(t("expenses.toast.addFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "expenses", id));
      toast.success(t("expenses.toast.deleted"));
    } catch (error) {
      logError(error, "Expenses.delete");
      toast.error(t("expenses.toast.deleteFailed"));
    }
  };

  const handleUploadReceipt = async (file: File): Promise<string> => {
    // In a real app, upload to Firebase Storage
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("https://via.placeholder.com/400x200?text=Receipt");
      }, 1000);
    });
  };

  const handleSplit = (
    roommates: Array<{ id: string; name: string; avatar: string }>,
    amountPerPerson: number
  ) => {
    setSplitWith(roommates);
    // In a real app, you would calculate the split amounts here
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="font-display text-3xl font-bold">Expenses</h1>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard monthlyData={monthlyData} categoryData={categoryData} />

        {/* Budget Trackers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => {
            const spent = categoryData.find((c) => c.name === cat.name)?.value || 0;
            return (
              <BudgetTracker
                key={cat.name}
                category={cat.name}
                spent={spent}
                limit={budgetLimits[cat.name as keyof typeof budgetLimits]}
                color={cat.color}
              />
            );
          })}
        </div>

        {/* Add Expense Form */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="font-display text-xl mb-6">Add Expense</h2>
          
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-1">Amount (UZS)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-400 outline-none"
                  required
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/80 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-400 outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name} className="bg-[#121212]">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-400 outline-none"
                  placeholder="e.g., Groceries at Magnum"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-1">Notes</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-400 outline-none"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-1">Split With</label>
                <button
                  type="button"
                  onClick={() => setShowSplitModal(true)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-left text-white flex items-center justify-between"
                >
                  {splitWith.length > 0 ? (
                    <div className="flex -space-x-1">
                      {splitWith.map((user) => (
                        <img
                          key={user.id}
                          src={user.avatar}
                          alt={user.name}
                          className="w-6 h-6 rounded-full border-2 border-white"
                        />
                      ))}
                    </div>
                  ) : (
                    <span>Select roommates</span>
                  )}
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Receipt Upload */}
            <div className="mt-4">
              <label className="block text-sm text-white/80 mb-2">Receipt</label>
              <ReceiptUpload onUpload={handleUploadReceipt} />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 bg-amber-400 text-gray-900 py-3 rounded-lg font-medium hover:bg-amber-300 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Spinner />
                  Processing...
                </>
              ) : (
                "Add Expense"
              )}
            </button>
          </form>
        </div>

        {/* Expense List */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-xl">Recent Expenses</h2>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-amber-400 outline-none"
              >
                <option value="All" className="bg-[#121212]">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name} className="bg-[#121212]">
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-amber-400 outline-none"
              />
            </div>
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : filteredExpenses.length === 0 ? (
            <EmptyState
              emoji="💰"
              title="No expenses found"
              description={`No expenses for ${selectedMonth}. Add one above!`}
            />
          ) : (
            <AnimatePresence>
              {filteredExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onDelete={() => handleDelete(expense.id)}
                  isAdmin={isAdmin}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Split Expense Modal */}
        {showSplitModal && (
          <SplitExpenseModal
            roommates={roommates}
            onSplit={handleSplit}
            onClose={() => setShowSplitModal(false)}
            totalAmount={Number(amount) || 0}
          />
        )}
      </div>
    </div>
  );
}