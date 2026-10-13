import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  HandCoins,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Repeat,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Transaction, formatIndianCurrency } from '../types/finance';
import { CategoryIcon } from '../components/CategoryIcon';

interface HomeScreenProps {
  onOpenAddModal: (defaultType?: 'expense' | 'income' | 'transfer' | 'lend') => void;
  onOpenTransactionDetails: (tx: Transaction) => void;
  onNavigateToRecords: () => void;
  onNavigateToBudget: () => void;
  onNavigateToLending: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenAddModal,
  onOpenTransactionDetails,
  onNavigateToRecords,
  onNavigateToBudget,
  onNavigateToLending,
}) => {
  const [dbState, setDbState] = useState(dbService.getState());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [hideBalance, setHideBalance] = useState<boolean>(false);

  useEffect(() => {
    return dbService.subscribe(() => {
      setDbState({ ...dbService.getState() });
    });
  }, []);

  const changeMonth = (delta: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const summary = dbService.getMonthlySummary(selectedMonth);

  // Format month for display (e.g. October 2026)
  const monthDate = new Date(`${selectedMonth}-01T00:00:00`);
  const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter recent transactions for selected month or overall recent
  const recentTransactions = dbState.transactions
    .filter((tx) => tx.date.startsWith(selectedMonth))
    .slice(0, 8);

  const budgetProgressPercent = summary.budgetLimit > 0
    ? Math.min(100, Math.round((summary.totalExpenses / summary.budgetLimit) * 100))
    : 0;

  const isBudgetWarning = budgetProgressPercent >= 80 && budgetProgressPercent < 100;
  const isBudgetExceeded = summary.budgetLimit > 0 && summary.totalExpenses > summary.budgetLimit;

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-slate-100">
      {/* Month Selector Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-[#0b0f19]/90 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-sm font-bold tracking-tight text-white px-2">
            {monthName}
          </span>

          <button
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => setHideBalance(!hideBalance)}
          aria-label="Toggle balance visibility"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className="px-5 pt-4 space-y-5">
        {/* Total Tracked Balance Hero Card */}
        <div className="rounded-3xl bg-linear-to-br from-slate-900 via-[#131c2e] to-[#0d1624] p-5 border border-slate-800/90 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium tracking-wide flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-teal-400" />
              Total Tracked Balance
            </span>
            <span className="text-[11px] text-teal-400 font-medium">All Active Accounts</span>
          </div>

          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white my-1 tabular-nums">
            {hideBalance ? '₹ ••••••' : formatIndianCurrency(summary.totalTrackedBalance)}
          </div>

          {/* Net Cash Flow this month */}
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-300">
            <span className="text-slate-400">Net Flow:</span>
            <span className={`font-semibold tabular-nums ${summary.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {hideBalance ? '••••' : formatIndianCurrency(summary.netSavings, true)}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Month to Date</span>
          </div>
        </div>

        {/* 4 Summary Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Income Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-3.5">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Monthly Income</span>
              <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-lg font-bold text-emerald-400 tabular-nums">
              {hideBalance ? '••••' : formatIndianCurrency(summary.totalIncome)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Earnings & Credits</div>
          </div>

          {/* Expenses Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-3.5">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Monthly Expense</span>
              <div className="h-6 w-6 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <TrendingDown className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-lg font-bold text-rose-400 tabular-nums">
              {hideBalance ? '••••' : formatIndianCurrency(summary.totalExpenses)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Direct Outflows</div>
          </div>

          {/* Remaining Budget Card */}
          <div
            onClick={onNavigateToBudget}
            className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-3.5 cursor-pointer hover:border-teal-500/40 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Budget Left</span>
              <div className="h-6 w-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <PiggyBank className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className={`text-lg font-bold tabular-nums ${isBudgetExceeded ? 'text-rose-400' : 'text-slate-100'}`}>
              {summary.budgetLimit === 0 ? 'Not Set' : hideBalance ? '••••' : formatIndianCurrency(summary.remainingBudget)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {summary.budgetLimit > 0 ? `${budgetProgressPercent}% used` : 'Tap to configure'}
            </div>
          </div>

          {/* Outstanding Lent Card */}
          <div
            onClick={onNavigateToLending}
            className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-3.5 cursor-pointer hover:border-amber-500/40 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Lent to Friends</span>
              <div className="h-6 w-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <HandCoins className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-lg font-bold text-amber-400 tabular-nums">
              {hideBalance ? '••••' : formatIndianCurrency(summary.outstandingLent)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Outstanding receivable</div>
          </div>
        </div>

        {/* Budget Progress Bar Alert */}
        {summary.budgetLimit > 0 && (
          <div
            onClick={onNavigateToBudget}
            className={`rounded-2xl p-4 border transition-colors cursor-pointer ${
              isBudgetExceeded
                ? 'bg-rose-500/10 border-rose-500/30'
                : isBudgetWarning
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-200">
                {isBudgetExceeded
                  ? 'Budget Exceeded!'
                  : isBudgetWarning
                  ? 'Spending Alert (Near Limit)'
                  : 'Monthly Budget Status'}
              </span>
              <span className="text-slate-400 tabular-nums font-medium">
                {formatIndianCurrency(summary.totalExpenses)} / {formatIndianCurrency(summary.budgetLimit)}
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isBudgetExceeded
                    ? 'bg-rose-500'
                    : isBudgetWarning
                    ? 'bg-amber-500'
                    : 'bg-teal-400'
                }`}
                style={{ width: `${Math.min(100, budgetProgressPercent)}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Action Shortcuts */}
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-2.5 uppercase tracking-wider">
            Quick Actions
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onOpenAddModal('expense')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-white transition-all active:scale-95"
            >
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-1.5">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-medium">Expense</span>
            </button>

            <button
              onClick={() => onOpenAddModal('income')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-all active:scale-95"
            >
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1.5">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-medium">Income</span>
            </button>

            <button
              onClick={() => onOpenAddModal('transfer')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-white transition-all active:scale-95"
            >
              <div className="h-9 w-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-1.5">
                <Repeat className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-medium">Transfer</span>
            </button>

            <button
              onClick={() => onOpenAddModal('lend')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white transition-all active:scale-95"
            >
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1.5">
                <HandCoins className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-medium">Lend</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white tracking-tight">Recent Activity</h2>
            <button
              onClick={onNavigateToRecords}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300"
            >
              View All ({dbState.transactions.length})
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
              <p className="text-xs">No transactions recorded for {monthName}.</p>
              <button
                onClick={() => onOpenAddModal('expense')}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add first transaction</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => {
                const category = dbState.categories.find((c) => c.id === tx.categoryId);
                const isIncome = tx.type === 'income' || tx.type === 'repay_in';
                const isExpense = tx.type === 'expense' || tx.type === 'lend' || tx.type === 'repay_out';

                return (
                  <div
                    key={tx.id}
                    onClick={() => onOpenTransactionDetails(tx)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: category ? `${category.color}20` : '#1e293b',
                          color: category ? category.color : '#94a3b8',
                        }}
                      >
                        <CategoryIcon name={category?.icon || (tx.type === 'transfer' ? 'Repeat' : 'Receipt')} size={18} />
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-100 truncate">
                          {tx.note || category?.name || (tx.type === 'transfer' ? 'Transfer' : 'Transaction')}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span>{tx.date}</span>
                          <span aria-hidden="true">·</span>
                          <span>{tx.paymentMethod}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div
                        className={`text-xs font-bold tabular-nums ${
                          isIncome ? 'text-emerald-400' : isExpense ? 'text-rose-400' : 'text-teal-400'
                        }`}
                      >
                        {isIncome ? '+' : isExpense ? '-' : ''}
                        {formatIndianCurrency(tx.amountPaise)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
