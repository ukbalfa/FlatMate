"use client";

import { motion } from "framer-motion";
import { Trash2, Repeat, Paperclip, Pencil, Check, X } from "lucide-react";
import { Avatar } from "../../../components/Avatar";
import type { Expense, SplitMember } from "../../../../lib/types";

interface ExpenseCardProps {
   expense: Expense;
   onDelete: () => void;
    onEditRequest: () => void;
   onApprove: (expenseId: string) => void;
   onReject: (expenseId: string) => void;
   isAdmin: boolean;
 }

export const ExpenseCard = ({ expense, onDelete, onEditRequest, onApprove, onReject, isAdmin }: ExpenseCardProps) => (
   <motion.div
     layout
     initial={{ opacity: 0, y: 10 }}
     animate={{ opacity: 1, y: 0 }}
     exit={{ opacity: 0, y: -10 }}
     whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(249, 115, 22, 0.2)" }}
     className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4"
   >
     <div className="flex justify-between items-start mb-3">
       <div>
         <h3 className="font-display text-lg font-semibold text-white">
           {expense.description}
         </h3>
         <div className="flex items-center gap-2 mt-1">
           <span className="text-sm text-gray-300">
             {new Date(expense.date).toLocaleDateString()}
           </span>
           {expense.isRecurring && (
             <Repeat className="w-4 h-4 text-amber-400" />
           )}
           {expense.approvalStatus && (
             <>
               {expense.approvalStatus === "pending" && (
                 <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                   Pending
                 </span>
               )}
               {expense.approvalStatus === "approved" && (
                 <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                   Approved
                 </span>
               )}
               {expense.approvalStatus === "rejected" && (
                 <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                   Rejected
                 </span>
               )}
             </>
           )}
         </div>
       </div>
       <div className="text-right">
         <span className="font-mono font-bold text-amber-400 text-xl">
           {expense.amount.toLocaleString()}
         </span>
         <span className="text-xs text-gray-400 ml-1">UZS</span>
       </div>
     </div>

     {expense.receiptUrl && (
       <div className="mt-3 relative">
         {/* eslint-disable-next-line @next/next/no-img-element */}
         <img
           src={expense.receiptUrl}
           alt="Receipt"
           className="w-full h-32 object-cover rounded-lg"
         />
         <Paperclip className="absolute top-2 right-2 w-5 h-5 text-white/80" />
       </div>
     )}

     {expense.splitWith && expense.splitWith.length > 0 && (
       <div className="mt-3 flex -space-x-2">
         {expense.splitWith.map((user: SplitMember) => (
           <Avatar
             key={user.id}
             src={user.avatar}
             name={user.name}
             size={2}
             className="border-2 border-white/20"
           />
         ))}
       </div>
     )}

     {isAdmin && (
       <div className="mt-3 flex gap-2">
          <button
            onClick={onEditRequest}
            className="text-gray-400 hover:text-amber-400 transition-colors"
            aria-label="Edit expense"
          >
           <Pencil className="w-5 h-5" />
         </button>
         <button
           onClick={onDelete}
           className="text-gray-400 hover:text-red-400 transition-colors"
           aria-label="Delete expense"
         >
           <Trash2 className="w-5 h-5" />
         </button>
         {/* Only show approve/reject for pending expenses */}
         {expense.approvalStatus === "pending" && (
           <>
             <button
               onClick={() => onApprove(expense.id)}
               className="text-green-400 hover:text-green-300 transition-colors"
               aria-label="Approve expense"
             >
               <Check className="w-5 h-5" />
             </button>
             <button
               onClick={() => onReject(expense.id)}
               className="text-red-400 hover:text-red-300 transition-colors"
               aria-label="Reject expense"
             >
               <X className="w-5 h-5" />
             </button>
           </>
         )}
       </div>
     )}
   </motion.div>
 );