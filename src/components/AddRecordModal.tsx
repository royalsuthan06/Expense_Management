import React, { useState } from 'react';
import { X, ArrowRight, Calendar, Clock, CreditCard, Wallet, FileText, Check, Plus, AlertCircle } from 'lucide-react';
import { dbService } from '../services/db';
import { TransactionType, PaymentMethod, rupeesToPaise } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
}) => {
  const db = dbService.getState();
  const [isFullMode, setIsFullMode] = useState<boolean>(false);
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amountInput, setAmountInput] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(
    db.categories.find((c) => c.type === defaultType && !c.isHidden)?.id
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    db.accounts.find((a) => !a.isArchived)?.id || 'acc_cash'
  );
  const [toAccountId, setToAccountId] = useState<string>(
    db.accounts.find((a) => !a.isArchived && a.id !== selectedAccountId)?.id || ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(db.settings.defaultPaymentMethod);
  
  // Date & Time defaults to current local date and time
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>(currentTimeStr);
  const [note, setNote] = useState<string>('');
  const [personName, setPersonName] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeCategories = db.categories.filter((c) => 
    !c.isHidden && (type === 'income' ? c.type === 'income' : c.type === 'expense')
  );

  const activeAccounts = db.accounts.filter((a) => !a.isArchived);

  const paymentMethods: PaymentMethod[] = [
    'UPI', 'Cash', 'Bank Transfer', 'Debit/Credit Card', 'Other', 'Not Specified'
  ];

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setError(null);
    if (newType === 'income' || newType === 'expense') {
      const firstCat = db.categories.find((c) => c.type === newType && !c.isHidden);
      setSelectedCategoryId(firstCat?.id);
    }
  };

  const handleQuickAddChip = (addValue: number) => {
    const current = parseFloat(amountInput) || 0;
    setAmountInput((current + addValue).toString());
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const numAmount = parseFloat(amountInput);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter an amount greater than ₹0');
      return;
    }

    if (type === 'transfer' && selectedAccountId === toAccountId) {
      setError('Source and Destination accounts must be different');
      return;
    }

    if (type === 'lend' && !personName.trim()) {
      setError('Please enter the name of the person you are lending to');
      return;
    }

    setIsSubmitting(true);
    const amountPaise = rupeesToPaise(numAmount);
    const dateTimestamp = new Date(`${date}T${time}:00`).getTime();

    try {
      if (type === 'lend') {
        dbService.addLoan({
          type: 'lent',
          personName: personName.trim(),
          principalPaise: amountPaise,
          date,
          note: note.trim() || undefined,
          accountId: selectedAccountId,
        });
      } else {
        dbService.addTransaction({
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
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div 
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#111827] border border-slate-800 text-slate-100 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-white">
              {isFullMode ? 'Add New Record' : 'Quick Add Transaction'}
            </span>
            <span className="text-xs text-slate-400">· ₹ INR</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Container */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Transaction Type Selector */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('transfer')}
              className={`py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                type === 'transfer'
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Transfer
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('lend')}
              className={`py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                type === 'lend'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lend
            </button>
          </div>

          {/* Prominent Amount Input */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 text-center">
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              Amount (₹)
            </label>
            <div className="flex items-center justify-center gap-1">
              <span className="text-3xl font-bold text-teal-400">₹</span>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setError(null);
                }}
                autoFocus
                className="w-48 bg-transparent text-center text-3xl font-bold text-white placeholder-slate-600 focus:outline-none tabular-nums"
              />
            </div>

            {/* Quick Amount Helper Chips */}
            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
              {[50, 100, 500, 1000, 2000].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleQuickAddChip(chip)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60 transition-colors"
                >
                  +₹{chip}
                </button>
              ))}
            </div>
          </div>

          {/* Lending Person Field if Lend */}
          {type === 'lend' && (
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Lend to Person</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
              />
            </div>
          )}

          {/* Categories Grid (for Expense / Income) */}
          {(type === 'expense' || type === 'income') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-300">Category</label>
                <span className="text-[11px] text-slate-500">{activeCategories.length} available</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1">
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
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-white shadow-xs"
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

          {/* Accounts selection (Transfer requires from & to) */}
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

          {/* Full Mode Details (Payment method, date, time, note) */}
          {isFullMode ? (
            <div className="space-y-4 pt-2 border-t border-slate-800">
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

              {/* Date & Time Picker */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">Time</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Optional Note</label>
                <input
                  type="text"
                  placeholder="Add a remark or description..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsFullMode(true)}
                className="text-xs font-medium text-teal-400 hover:text-teal-300 underline decoration-teal-500/40 underline-offset-4"
              >
                + Customize Date, Time, Payment Method & Note
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 px-6 py-4 bg-[#0d131f] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700/60 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="flex-1 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-slate-950 text-xs font-bold transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>Save Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};
