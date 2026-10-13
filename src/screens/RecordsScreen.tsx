import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Calendar,
  ArrowUpDown,
  X,
  Plus,
  Filter,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Transaction, TransactionType, PaymentMethod, formatIndianCurrency } from '../types/finance';
import { CategoryIcon } from '../components/CategoryIcon';

interface RecordsScreenProps {
  onOpenAddModal: () => void;
  onOpenTransactionDetails: (tx: Transaction) => void;
}

type DateRangeOption = 'all' | 'today' | 'this_week' | 'this_month' | 'prev_month' | 'this_year' | 'prev_year' | 'custom';
type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low';

export const RecordsScreen: React.FC<RecordsScreenProps> = ({
  onOpenAddModal,
  onOpenTransactionDetails,
}) => {
  const [dbState, setDbState] = useState(dbService.getState());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeOption>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    return dbService.subscribe(() => {
      setDbState({ ...dbService.getState() });
    });
  }, []);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return dbState.transactions.filter((tx) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const cat = dbState.categories.find((c) => c.id === tx.categoryId);
        const acc = dbState.accounts.find((a) => a.id === tx.accountId);
        const matchNote = tx.note?.toLowerCase().includes(query);
        const matchCategory = cat?.name.toLowerCase().includes(query);
        const matchAccount = acc?.name.toLowerCase().includes(query);
        const matchPayment = tx.paymentMethod.toLowerCase().includes(query);
        if (!matchNote && !matchCategory && !matchAccount && !matchPayment) {
          return false;
        }
      }

      // 2. Type Filter
      if (selectedType !== 'all') {
        if (selectedType === 'expense' && tx.type !== 'expense') return false;
        if (selectedType === 'income' && tx.type !== 'income') return false;
        if (selectedType === 'transfer' && tx.type !== 'transfer') return false;
        if (selectedType === 'lend' && (tx.type !== 'lend' && tx.type !== 'repay_in' && tx.type !== 'repay_out')) return false;
      }

      // 3. Category Filter
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) {
        return false;
      }

      // 4. Account Filter
      if (selectedAccount !== 'all' && tx.accountId !== selectedAccount && tx.toAccountId !== selectedAccount) {
        return false;
      }

      // 5. Payment Method
      if (selectedPaymentMethod !== 'all' && tx.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // 6. Date Range Filter
      const txDate = new Date(`${tx.date}T00:00:00`);
      if (dateRange === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        if (tx.date !== todayStr) return false;
      } else if (dateRange === 'this_week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
        if (txDate < oneWeekAgo) return false;
      } else if (dateRange === 'this_month') {
        const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        if (!tx.date.startsWith(monthStr)) return false;
      } else if (dateRange === 'prev_month') {
        const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
        if (!tx.date.startsWith(prevMonthStr)) return false;
      } else if (dateRange === 'this_year') {
        if (!tx.date.startsWith(`${currentYear}-`)) return false;
      } else if (dateRange === 'prev_year') {
        if (!tx.date.startsWith(`${currentYear - 1}-`)) return false;
      } else if (dateRange === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return b.timestamp - a.timestamp;
      if (sortBy === 'oldest') return a.timestamp - b.timestamp;
      if (sortBy === 'amount_high') return b.amountPaise - a.amountPaise;
      if (sortBy === 'amount_low') return a.amountPaise - b.amountPaise;
      return 0;
    });
  }, [
    dbState,
    searchQuery,
    selectedType,
    selectedCategory,
    selectedAccount,
    selectedPaymentMethod,
    dateRange,
    customStartDate,
    customEndDate,
    sortBy,
  ]);

  // Aggregate stats for filtered view
  const filteredStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') income += tx.amountPaise;
      if (tx.type === 'expense') expense += tx.amountPaise;
    });
    return { income, expense, count: filteredTransactions.length };
  }, [filteredTransactions]);

  // Group by Date for display
  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    filteredTransactions.forEach((tx) => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const activeFilterCount = (selectedType !== 'all' ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedAccount !== 'all' ? 1 : 0) +
    (selectedPaymentMethod !== 'all' ? 1 : 0) +
    (dateRange !== 'this_month' ? 1 : 0);

  const resetFilters = () => {
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedAccount('all');
    setSelectedPaymentMethod('all');
    setDateRange('this_month');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('newest');
    setSearchQuery('');
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-slate-100">
      {/* Top Search & Filter Bar */}
      <div className="sticky top-0 z-10 border-b border-slate-800/80 bg-[#0b0f19]/90 px-5 py-3 backdrop-blur-md space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search notes, category, account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'border-teal-500/50 bg-teal-500/10 text-teal-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-slate-950">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Type Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All' },
            { id: 'expense', label: 'Expense' },
            { id: 'income', label: 'Income' },
            { id: 'transfer', label: 'Transfer' },
            { id: 'lend', label: 'Lending' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedType === tab.id
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {showFilters && (
        <div className="border-b border-slate-800 bg-slate-950/80 px-5 py-4 space-y-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Filter & Sort Options</span>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-400 hover:text-rose-300 underline"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Date Range Selector */}
          <div>
            <label className="text-slate-400 block mb-1.5 font-medium">Date Range</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'this_month', label: 'This Month' },
                { id: 'prev_month', label: 'Prev Month' },
                { id: 'today', label: 'Today' },
                { id: 'this_week', label: 'This Week' },
                { id: 'this_year', label: 'This Year' },
                { id: 'prev_year', label: 'Prev Year' },
                { id: 'all', label: 'All Time' },
                { id: 'custom', label: 'Custom' },
              ].map((dr) => (
                <button
                  key={dr.id}
                  onClick={() => setDateRange(dr.id as DateRangeOption)}
                  className={`py-1.5 px-2 rounded-lg text-center border text-[11px] font-medium transition-colors ${
                    dateRange === dr.id
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {dr.label}
                </button>
              ))}
            </div>

            {dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-white"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-white"
                />
              </div>
            )}
          </div>

          {/* Category & Account Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1.5 font-medium">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">All Categories</option>
                {dbState.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'income' ? '🟢' : '🔴'} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1.5 font-medium">Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">All Accounts</option>
                {dbState.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Sorting */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1.5 font-medium">Payment Method</label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">All Payment Methods</option>
                {['UPI', 'Cash', 'Bank Transfer', 'Debit/Credit Card', 'Other'].map((pm) => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1.5 font-medium">Sort Order</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="newest">Newest to Oldest</option>
                <option value="oldest">Oldest to Newest</option>
                <option value="amount_high">Highest Amount First</option>
                <option value="amount_low">Lowest Amount First</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Filtered Summary Strip */}
      <div className="px-5 pt-3 pb-1">
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
          <span>{filteredStats.count} records</span>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-medium">
              +{formatIndianCurrency(filteredStats.income)}
            </span>
            <span className="text-rose-400 font-medium">
              -{formatIndianCurrency(filteredStats.expense)}
            </span>
          </div>
        </div>
      </div>

      {/* Grouped Records List */}
      <div className="px-5 pt-2 space-y-5">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
            <p className="text-xs">No records matched the selected criteria.</p>
            <button
              onClick={resetFilters}
              className="mt-3 text-xs font-semibold text-teal-400 hover:text-teal-300"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([date, txs]) => {
            // Compute day's subtotal
            const dayExpense = txs
              .filter((t) => t.type === 'expense')
              .reduce((s, t) => s + t.amountPaise, 0);

            return (
              <div key={date} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
                  <span>{date}</span>
                  {dayExpense > 0 && (
                    <span className="text-slate-500 tabular-nums">
                      Spent: {formatIndianCurrency(dayExpense)}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {txs.map((tx) => {
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
                            <CategoryIcon
                              name={category?.icon || (tx.type === 'transfer' ? 'Repeat' : 'Receipt')}
                              size={18}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-100 truncate">
                              {tx.note || category?.name || (tx.type === 'transfer' ? 'Account Transfer' : 'Transaction')}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <span>{tx.time}</span>
                              <span aria-hidden="true">·</span>
                              <span>{tx.paymentMethod}</span>
                              {category && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-slate-300">{category.name}</span>
                                </>
                              )}
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
