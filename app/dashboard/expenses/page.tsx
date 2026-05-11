"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { db, storage } from "../../../lib/firebase";
import {
   collection,
   addDoc,
   query,
   orderBy,
   onSnapshot,
   deleteDoc,
   doc,
   getDocs,
   getDoc,
   limit,
   serverTimestamp,
   where,
   writeBatch,
   updateDoc,
   setDoc,
 } from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  Download,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Spinner } from "../../components/Spinner";
import { SkeletonList } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { toast } from "sonner";
import { Avatar } from "../../components/Avatar";
import { useAuth } from "../../../context/AuthContext";
import { useI18n } from "../../../context/I18nContext";
import { logError } from "../../../lib/errorLogger";
import { syncRecurringItems } from '../../../lib/syncRecurring';
import type { Expense, RecurringExpense, SplitMember } from "../../../lib/types";
import { ExpenseCard } from "./components/ExpenseCard";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { BudgetTracker } from "./components/BudgetTracker";
import { ReceiptUpload } from "./components/ReceiptUpload";
import { SplitExpenseModal } from "./components/SplitExpenseModal";

const CATEGORIES = [
  { name: "Rent", color: "#F97316" },
  { name: "Groceries", color: "#3B82F6" },
  { name: "Utilities", color: "#F59E0B" },
  { name: "Internet", color: "#8B5CF6" },
  { name: "Misc", color: "#6B7280" },
];

const DEFAULT_BUDGET_LIMITS: Record<string, number> = {
  Rent: 500000,
  Groceries: 300000,
  Utilities: 200000,
  Internet: 150000,
  Misc: 100000,
};

function getMonth(date: string) {
  return date.slice(0, 7);
}

export default function ExpensesPage() {
  const { t } = useI18n();
  const { userProfile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [_recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Rent");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitWith, setSplitWith] = useState<SplitMember[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<Record<string, number>>({});
  const [receiptUrl, setReceiptUrl] = useState("");
  const [limitCount, setLimitCount] = useState(50);
  const [syncingRecurring, setSyncingRecurring] = useState(false);

  // Load roommates who share this user's flat
  const [roommates, setRoommates] = useState<SplitMember[]>([]);

  useEffect(() => {
    if (!userProfile?.flatId) return;

    const fetchRoommates = async () => {
      try {
        const q = query(collection(db, "users"), where("flatId", "==", userProfile!.flatId));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => {
          const userData = doc.data();
          return {
            id: doc.id,
            name: userData.name || userData.username || "Unknown",
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || userData.username || "?")}&background=F97316&color=fff&size=150`,
          };
        });
        // Exclude current user from split list
        setRoommates(data.filter((r) => r.id !== userProfile!.uid));
      } catch (error) {
        logError(error, "Expenses.loadRoommates");
        toast.error(t("expenses.toast.loadRoommatesFailed"));
      }
    };

    fetchRoommates();
  }, [userProfile, t]);

  // Load budget limits from Firestore
  useEffect(() => {
    if (!userProfile?.flatId) return;

    const fetchBudgets = async () => {
      try {
        const docSnap = await getDocs(
          query(collection(db, "flats"), where("flatId", "==", userProfile!.flatId))
        );
        if (!docSnap.empty) {
          const firstDoc = docSnap.docs[0];
          if (firstDoc) {
            const flatData = firstDoc.data() as { budgets?: Record<string, number> };
            if (flatData.budgets) {
              setBudgetLimits(flatData.budgets);
              return;
            }
          }
        }
      } catch (error) {
        logError(error, "Expenses.loadBudgets");
        toast.error(t("expenses.toast.loadBudgetsFailed"));
      }
      // Fallback to defaults if no document or budgets field
      setBudgetLimits(DEFAULT_BUDGET_LIMITS);
    };

    fetchBudgets();
  }, [userProfile, t]);

  const isAdmin = userProfile?.role === "admin";

  // Load expenses
  useEffect(() => {
    if (!userProfile?.flatId) return;
    
    const q = query(
      collection(db, "expenses"),
      where("flatId", "==", userProfile?.flatId),
      orderBy("date", "desc"),
      limit(limitCount)
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
  }, [userProfile?.flatId, limitCount, t]);

  // Load recurring expenses
  const loadRecurringExpenses = async () => {
    try {
      const q = query(
        collection(db, "recurringExpenses"),
        where("flatId", "==", userProfile?.flatId),
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
    if (!userProfile?.flatId) return;
    loadRecurringExpenses();
    handleSyncRecurring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

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

const filteredExpenses = expenses
     .filter((e) => {
       // Filter by search term
       if (searchTerm.trim() !== '') {
         const searchLower = searchTerm.toLowerCase();
         const matchesSearch = e.description?.toLowerCase().includes(searchLower) || 
                             e.category.toLowerCase().includes(searchLower) ||
                             e.note?.toLowerCase().includes(searchLower);
         if (!matchesSearch) return false;
       }
       
       // Filter by date range
       if (dateFrom !== '' && dateTo !== '') {
         const expenseDate = e.date;
         if (expenseDate < dateFrom || expenseDate > dateTo) {
           return false;
         }
       }
       
       // Filter by month (for backward compatibility with existing UI)
       return getMonth(e.date) === selectedMonth;
     })
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
         approvalStatus: isAdmin ? "approved" : "pending", // Auto-approve for admins
         approvedBy: isAdmin ? userProfile?.uid : undefined,
         approvedAt: isAdmin ? new Date().toISOString() : undefined,
         createdAt: serverTimestamp(),
       });
       
       toast.success(t("expenses.toast.added"));
 
       // Notify split members about the shared expense
       if (splitWith.length > 0) {
         try {
           const batch = writeBatch(db);
           splitWith.forEach((member) => {
             const notifRef = doc(collection(db, "notifications"));
             batch.set(notifRef, {
               userId: member.id,
               title: "New Shared Expense",
               message: `${userProfile?.name || userProfile?.username} added a ${parsedAmount.toLocaleString()} UZS expense for ${category}.`,
               type: "expense",
               read: false,
               link: "/dashboard/expenses",
               createdAt: serverTimestamp(),
             });
           });
           await batch.commit();
         } catch (notifError) {
           logError(notifError, "Expenses.createNotifications");
         }
       }
 
       // Reset form
       setAmount("");
       setDescription("");
       setCategory("Rent");
       setDate(new Date().toISOString().slice(0, 10));
       setNote("");
       setReceiptUrl("");
       setSplitWith([]);
     } catch (error) {
       logError(error, "Expenses.add");
       toast.error(t("expenses.toast.addFailed"));
     } finally {
       setSubmitting(false);
     }
   };

   const handleEditExpense = async (updatedExpense: Expense) => {
     try {
       await updateDoc(doc(db, "expenses", updatedExpense.id), {
         ...updatedExpense,
         updatedAt: new Date().toISOString(),
       });
       toast.success(t("expenses.toast.updated"));
     } catch (error) {
       logError(error, "Expenses.edit");
       toast.error(t("expenses.toast.updateFailed"));
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

   const handleApproveExpense = async (id: string) => {
     try {
       const expenseRef = doc(db, "expenses", id);
       await updateDoc(expenseRef, {
         approvalStatus: "approved",
         approvedBy: userProfile?.uid,
         approvedAt: new Date().toISOString(),
       });
       toast.success(t("expenses.toast.expenseApproved"));
       
       // Notify the expense creator
       const expenseDoc = await getDoc(expenseRef);
       if (expenseDoc.exists()) {
         const expenseData = expenseDoc.data();
         const notifRef = doc(collection(db, "notifications"));
         await setDoc(notifRef, {
           userId: expenseData.paidBy, // Notify the person who paid
           title: "Expense Approved",
           message: `Your expense "${expenseData.description}" has been approved.`,
           type: "expense",
           read: false,
           link: "/dashboard/expenses",
           createdAt: serverTimestamp(),
         });
       }
     } catch (error) {
       logError(error, "Expenses.approve");
       toast.error(t("expenses.toast.approveFailed"));
     }
   };

   const handleRejectExpense = async (id: string) => {
     try {
       const expenseRef = doc(db, "expenses", id);
       await updateDoc(expenseRef, {
         approvalStatus: "rejected",
         approvedBy: userProfile?.uid,
         approvedAt: new Date().toISOString(),
       });
       toast.success(t("expenses.toast.expenseRejected"));
       
       // Notify the expense creator
       const expenseDoc = await getDoc(expenseRef);
       if (expenseDoc.exists()) {
         const expenseData = expenseDoc.data();
         const notifRef = doc(collection(db, "notifications"));
         await setDoc(notifRef, {
           userId: expenseData.paidBy, // Notify the person who paid
           title: "Expense Rejected",
           message: `Your expense "${expenseData.description}" has been rejected.`,
           type: "expense",
           read: false,
           link: "/dashboard/expenses",
           createdAt: serverTimestamp(),
         });
       }
     } catch (error) {
       logError(error, "Expenses.reject");
       toast.error(t("expenses.toast.rejectFailed"));
     }
   };

  const handleUploadReceipt = async (file: File): Promise<string> => {
    if (!userProfile?.flatId) {
      toast.error("Cannot upload receipt: no flat assigned");
      return "";
    }
    try {
      const fileRef = storageRef(
        storage,
        `receipts/${userProfile.flatId}/${Date.now()}_${file.name}`
      );
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      logError(error, "Expenses.uploadReceipt");
      toast.error("Failed to upload receipt");
      return "";
    }
  };

  const handleSplit = (roommates: SplitMember[]) => {
    setSplitWith(roommates);
  };

  const handleSyncRecurring = async () => {
    if (!userProfile?.flatId) return;
    setSyncingRecurring(true);
    try {
      await syncRecurringItems(userProfile.flatId);
      toast.success(t('expenses.toast.syncComplete'));
    } catch (error) {
      logError(error, 'Expenses.syncRecurring');
      toast.error(t('expenses.toast.syncFailed'));
    } finally {
      setSyncingRecurring(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="font-display text-3xl font-bold">Expenses</h1>
          <div className="flex gap-2">
            <button
              onClick={handleSyncRecurring}
              disabled={syncingRecurring}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              title="Sync recurring items"
            >
              <RefreshCw className={`w-5 h-5 ${syncingRecurring ? 'animate-spin' : ''}`} />
            </button>
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
                limit={budgetLimits[cat.name as keyof typeof budgetLimits] ?? DEFAULT_BUDGET_LIMITS[cat.name as keyof typeof DEFAULT_BUDGET_LIMITS] ?? 100000}
                color={cat.color}
              />
            );
          })}
        </div>

        {/* Add Expense Form */}
<div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
           <h2 className="font-display text-xl mb-6">{t('expenses.addExpenseTitle')}</h2>
           
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
                        <Avatar
                          key={user.id}
                          src={user.avatar}
                          name={user.name}
                          size={1.5}
                          className="border-2 border-white"
                        />
                      ))}
                    </div>
                  ) : (
                    <span>{t('expenses.selectRoommates')}</span>
                  )}
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Receipt Upload */}
            <div className="mt-4">
              <label className="block text-sm text-white/80 mb-2">Receipt</label>
              <ReceiptUpload onUpload={handleUploadReceipt} onFileURL={setReceiptUrl} />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 bg-amber-400 text-gray-900 py-3 rounded-lg font-medium hover:bg-amber-300 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Spinner />
                  {t('common.processing') || 'Processing...'}
                </>
              ) : (
                t('expenses.addExpense')
              )}
            </button>
          </form>
        </div>

        {/* Expense List */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-xl">{t('expenses.recentExpenses')}</h2>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-amber-400 outline-none"
              >
                <option value="All" className="bg-[#121212]">{t('expenses.allCategories')}</option>
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

          {/* Search and Date Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-400 outline-none"
                placeholder={t('expenses.searchPlaceholder')}
              />
            </div>
            <div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-400 outline-none"
              />
            </div>
            <div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-400 outline-none"
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
                   onEdit={(updatedExpense) => handleEditExpense(updatedExpense)}
                   onApprove={(expenseId) => handleApproveExpense(expenseId)}
                   onReject={(expenseId) => handleRejectExpense(expenseId)}
                   isAdmin={isAdmin}
                 />
               ))}
             </AnimatePresence>
           )}
          {!loading && expenses.length >= limitCount && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setLimitCount((prev) => prev + 50)}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition border border-white/10"
              >
                Load More
              </button>
            </div>
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