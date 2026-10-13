import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  Repeat,
  Archive,
  ArrowRight,
  X,
  Check,
  Building,
  Coins,
  PiggyBank,
  CircleDollarSign,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Account, AccountType, formatIndianCurrency, rupeesToPaise, paiseToRupees } from '../types/finance';

interface AccountsViewProps {
  onBack: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ onBack }) => {
  const [dbState, setDbState] = useState(dbService.getState());
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  // New Account State
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('bank');
  const [accOpeningRupees, setAccOpeningRupees] = useState('');
  const [accDesc, setAccDesc] = useState('');

  // Transfer State
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);

  useEffect(() => {
    return dbService.subscribe(() => {
      setDbState({ ...dbService.getState() });
    });
  }, []);

  const accounts = dbState.accounts;
  const activeAccounts = accounts.filter((a) => !a.isArchived);
  const totalBalance = activeAccounts.reduce((sum, a) => sum + a.currentBalancePaise, 0);

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'cash':
        return <Coins className="h-5 w-5 text-amber-400" />;
      case 'bank':
        return <Building className="h-5 w-5 text-teal-400" />;
      case 'savings':
        return <PiggyBank className="h-5 w-5 text-emerald-400" />;
      default:
        return <CircleDollarSign className="h-5 w-5 text-indigo-400" />;
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;

    const opening = parseFloat(accOpeningRupees) || 0;
    dbService.addAccount({
      name: accName.trim(),
      type: accType,
      openingBalancePaise: rupeesToPaise(opening),
      description: accDesc.trim() || undefined,
      isArchived: false,
    });

    setAccName('');
    setAccOpeningRupees('');
    setAccDesc('');
    setAddModalOpen(false);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError('Enter a valid transfer amount');
      return;
    }

    if (transferFrom === transferTo) {
      setTransferError('Source and Destination accounts must be different');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    dbService.addTransaction({
      type: 'transfer',
      amountPaise: rupeesToPaise(amount),
      accountId: transferFrom,
      toAccountId: transferTo,
      paymentMethod: 'Bank Transfer',
      date: dateStr,
      time: timeStr,
      timestamp: Date.now(),
      note: transferNote.trim() || 'Internal Account Transfer',
    });

    setTransferAmount('');
    setTransferNote('');
    setTransferError(null);
    setTransferModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-[#0b0f19]/90 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-bold text-white">Accounts & Balances</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeAccounts.length >= 2) {
                setTransferFrom(activeAccounts[0].id);
                setTransferTo(activeAccounts[1].id);
                setTransferModalOpen(true);
              }
            }}
            disabled={activeAccounts.length < 2}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 disabled:opacity-40 transition-colors"
          >
            <Repeat className="h-3.5 w-3.5" />
            <span>Transfer</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold hover:bg-teal-400 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-5">
        {/* Total Summary */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 font-medium block">Total Balance (Active Accounts)</span>
          <span className="text-3xl font-extrabold text-white tabular-nums tracking-tight mt-1 block">
            {formatIndianCurrency(totalBalance)}
          </span>
          <p className="text-[11px] text-slate-400 mt-2">
            Balances dynamically reconcile opening balances + transactions, excluding transfers from income/expense.
          </p>
        </div>

        {/* Account Cards */}
        <div className="space-y-3">
          {accounts.map((acc) => {
            return (
              <div
                key={acc.id}
                className={`p-4 rounded-2xl border transition-all ${
                  acc.isArchived
                    ? 'bg-slate-950/40 border-slate-800/40 opacity-60'
                    : 'bg-slate-900/80 border-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{acc.name}</span>
                        {acc.isArchived && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                            Archived
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">{acc.type} account</div>
                      {acc.description && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{acc.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-white tabular-nums">
                      {formatIndianCurrency(acc.currentBalancePaise)}
                    </div>
                    <div className="text-[10px] text-slate-500 tabular-nums">
                      Opening: {formatIndianCurrency(acc.openingBalancePaise)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    Created {acc.createdAt.split('T')[0]}
                  </span>
                  <button
                    onClick={() => dbService.archiveAccount(acc.id, !acc.isArchived)}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    <Archive className="h-3 w-3" />
                    <span>{acc.isArchived ? 'Restore' : 'Archive'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Account Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#111827] border border-slate-800 text-slate-100 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white">Create New Account</span>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, ICICI Salary, Wallet"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Account Type</label>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value as AccountType)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash / Wallet</option>
                  <option value="savings">Savings / Deposit</option>
                  <option value="other">Other Account</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Opening Balance (₹)</label>
                <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 px-3 py-2">
                  <span className="text-teal-400 font-bold mr-1">₹</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={accOpeningRupees}
                    onChange={(e) => setAccOpeningRupees(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Primary UPI and debit card account"
                  value={accDesc}
                  onChange={(e) => setAccDesc(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md shadow-teal-500/20"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#111827] border border-slate-800 text-slate-100 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white">Transfer Between Accounts</span>
              <button onClick={() => setTransferModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {transferError && (
              <div className="mb-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2 text-xs text-rose-300">
                {transferError}
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">From Account</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatIndianCurrency(a.currentBalancePaise)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">To Account</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatIndianCurrency(a.currentBalancePaise)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Transfer Amount (₹)</label>
                <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 px-3 py-2">
                  <span className="text-teal-400 font-bold mr-1">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="0"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ATM Cash withdrawal"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md shadow-teal-500/20"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
