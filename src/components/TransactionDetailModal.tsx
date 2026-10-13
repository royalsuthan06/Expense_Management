import React, { useState } from 'react';
import { X, Edit2, Trash2, Calendar, Clock, CreditCard, Wallet, FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import { Transaction, formatIndianCurrency, paiseToRupees } from '../types/finance';
import { dbService } from '../services/db';
import { CategoryIcon } from './CategoryIcon';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onEdit,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!transaction) return null;

  const db = dbService.getState();
  const category = db.categories.find((c) => c.id === transaction.categoryId);
  const account = db.accounts.find((a) => a.id === transaction.accountId);
  const toAccount = transaction.toAccountId ? db.accounts.find((a) => a.id === transaction.toAccountId) : null;

  const handleDelete = () => {
    dbService.deleteTransaction(transaction.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const isIncome = transaction.type === 'income' || transaction.type === 'repay_in';
  const isExpense = transaction.type === 'expense' || transaction.type === 'lend' || transaction.type === 'repay_out';
  const isTransfer = transaction.type === 'transfer';

  const typeLabel = {
    income: 'Income',
    expense: 'Expense',
    transfer: 'Account Transfer',
    lend: 'Money Lent',
    repay_in: 'Repayment Received',
    repay_out: 'Repayment Made',
  }[transaction.type];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#111827] border border-slate-800 text-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Transaction Details
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Main Amount & Category Highlight */}
          <div className="flex flex-col items-center text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-md"
              style={{
                backgroundColor: category ? `${category.color}20` : '#1e293b',
                color: category ? category.color : '#94a3b8',
              }}
            >
              <CategoryIcon name={category?.icon || (isTransfer ? 'Repeat' : 'Receipt')} size={26} />
            </div>

            <div className="text-xs font-medium text-slate-400 mb-1">{typeLabel}</div>
            
            <div
              className={`text-3xl font-extrabold tabular-nums tracking-tight ${
                isIncome ? 'text-emerald-400' : isExpense ? 'text-rose-400' : 'text-teal-400'
              }`}
            >
              {isIncome ? '+' : isExpense ? '-' : ''}
              {formatIndianCurrency(transaction.amountPaise)}
            </div>

            {category && (
              <span className="mt-2 text-sm font-semibold text-slate-200">
                {category.name}
              </span>
            )}
          </div>

          {/* Details list */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 divide-y divide-slate-800 text-xs">
            {/* Account / Transfer */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-400 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-slate-500" />
                <span>Account</span>
              </span>
              <span className="font-medium text-slate-200 flex items-center gap-1.5">
                {isTransfer ? (
                  <>
                    <span>{account?.name || 'Account'}</span>
                    <ArrowRight className="h-3 w-3 text-teal-400" />
                    <span>{toAccount?.name || 'Destination'}</span>
                  </>
                ) : (
                  account?.name || 'Main Account'
                )}
              </span>
            </div>

            {/* Payment Method */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-400 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                <span>Payment Method</span>
              </span>
              <span className="font-medium text-slate-200">{transaction.paymentMethod}</span>
            </div>

            {/* Date & Time */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-400 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span>Date & Time</span>
              </span>
              <span className="font-medium text-slate-200 tabular-nums">
                {transaction.date} · {transaction.time}
              </span>
            </div>

            {/* Note */}
            {transaction.note && (
              <div className="px-4 py-3">
                <span className="text-slate-400 flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span>Note</span>
                </span>
                <p className="text-slate-200 text-xs leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                  {transaction.note}
                </p>
              </div>
            )}
          </div>

          {/* Delete Confirmation Alert */}
          {showDeleteConfirm && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-300">Confirm Deletion</h4>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Deleting this record will automatically revert its effect on account balances, budgets, and monthly reports.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs rounded-lg text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-500 shadow-sm shadow-rose-600/30"
                >
                  Delete Record
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!showDeleteConfirm && (
          <div className="border-t border-slate-800 px-6 py-4 bg-[#0d131f] flex items-center justify-between gap-3">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(transaction);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Record</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
