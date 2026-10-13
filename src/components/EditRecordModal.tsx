import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod, rupeesToPaise, paiseToRupees } from '../types/finance';
import { dbService } from '../services/db';
import { CategoryIcon } from './CategoryIcon';

interface EditRecordModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  const db = dbService.getState();
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amountInput, setAmountInput] = useState<string>(paiseToRupees(transaction.amountPaise).toString());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(transaction.categoryId);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(transaction.accountId);
  const [toAccountId, setToAccountId] = useState<string>(transaction.toAccountId || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transaction.paymentMethod);
  const [date, setDate] = useState<string>(transaction.date);
  const [time, setTime] = useState<string>(transaction.time);
  const [note, setNote] = useState<string>(transaction.note || '');
  const [error, setError] = useState<string | null>(null);

  const activeCategories = db.categories.filter((c) =>
    !c.isHidden && (type === 'income' ? c.type === 'income' : c.type === 'expense')
  );
  const activeAccounts = db.accounts.filter((a) => !a.isArchived);

  const paymentMethods: PaymentMethod[] = [
    'UPI', 'Cash', 'Bank Transfer', 'Debit/Credit Card', 'Other', 'Not Specified'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amountInput);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than ₹0');
      return;
    }

    if (type === 'transfer' && selectedAccountId === toAccountId) {
      setError('From Account and To Account must be different');
      return;
    }

    const amountPaise = rupeesToPaise(num);
    const dateTimestamp = new Date(`${date}T${time}:00`).getTime();

    dbService.updateTransaction(transaction.id, {
      type,
      amountPaise,
      categoryId: (type === 'expense' || type === 'income') ? selectedCategoryId : undefined,
      accountId: selectedAccountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      paymentMethod,
      date,
      time,
      timestamp: isNaN(dateTimestamp) ? Date.now() : dateTimestamp,
      note: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#111827] border border-slate-800 text-slate-100 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <span className="font-semibold text-base text-white">Edit Record</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setSelectedCategoryId(db.categories.find((c) => c.type === 'expense')?.id);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setSelectedCategoryId(db.categories.find((c) => c.type === 'income')?.id);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                type === 'transfer' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-slate-400'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Amount Field */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 text-center">
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              Amount (₹)
            </label>
            <div className="flex items-center justify-center gap-1">
              <span className="text-3xl font-bold text-teal-400">₹</span>
              <input
                type="number"
                step="any"
                min="0.01"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-48 bg-transparent text-center text-3xl font-bold text-white focus:outline-none tabular-nums"
              />
            </div>
          </div>

          {/* Categories Grid (if not transfer) */}
          {(type === 'expense' || type === 'income') && (
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">Category</label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1">
                {activeCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-white"
                        style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} size={16} />
                      </div>
                      <span className="text-[11px] font-medium truncate w-full">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accounts */}
          {type === 'transfer' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">From Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                >
                  {activeAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">To Account</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                >
                  {activeAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Account</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
              >
                {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">Payment Method</label>
            <div className="flex flex-wrap gap-1.5">
              {paymentMethods.map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    paymentMethod === pm
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">Note</label>
            <input
              type="text"
              placeholder="Add remark..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Update Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
