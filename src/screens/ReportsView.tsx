import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Award,
  Zap,
} from 'lucide-react';
import { dbService } from '../services/db';
import { formatIndianCurrency, paiseToRupees } from '../types/finance';
import { CategoryIcon } from '../components/CategoryIcon';

interface ReportsViewProps {
  onBack: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onBack }) => {
  const [dbState, setDbState] = useState(dbService.getState());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

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

  const monthDate = new Date(`${selectedMonth}-01T00:00:00`);
  const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter transactions for this month
  const monthTransactions = useMemo(() => {
    return dbState.transactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [dbState, selectedMonth]);

  // Exclude transfers, lending, loan repayments from consumption expenses & income
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    let maxExpense = 0;
    let maxExpenseNote = '';
    const categoryCounts: { [catId: string]: number } = {};
    const categoryTotals: { [catId: string]: number } = {};
    const dayTotals: { [day: string]: number } = {};

    monthTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        income += tx.amountPaise;
      } else if (tx.type === 'expense') {
        expense += tx.amountPaise;
        if (tx.amountPaise > maxExpense) {
          maxExpense = tx.amountPaise;
          maxExpenseNote = tx.note || 'Expense';
        }

        if (tx.categoryId) {
          categoryCounts[tx.categoryId] = (categoryCounts[tx.categoryId] || 0) + 1;
          categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amountPaise;
        }

        const day = tx.date.split('-')[2];
        dayTotals[day] = (dayTotals[day] || 0) + tx.amountPaise;
      }
    });

    // Most used & highest spending category
    let mostUsedCatId = '';
    let maxCatUsage = 0;
    Object.entries(categoryCounts).forEach(([catId, count]) => {
      if (count > maxCatUsage) {
        maxCatUsage = count;
        mostUsedCatId = catId;
      }
    });

    let highestSpendingCatId = '';
    let maxCatSpending = 0;
    Object.entries(categoryTotals).forEach(([catId, total]) => {
      if (total > maxCatSpending) {
        maxCatSpending = total;
        highestSpendingCatId = catId;
      }
    });

    // Average daily spending (using days elapsed or total days in month)
    const daysInMonth = new Date(
      Number(selectedMonth.split('-')[0]),
      Number(selectedMonth.split('-')[1]),
      0
    ).getDate();
    const avgDailySpending = Math.round(expense / (daysInMonth || 30));

    // Category breakdown sorted descending
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([catId, amountPaise]) => {
        const cat = dbState.categories.find((c) => c.id === catId);
        const percent = expense > 0 ? Math.round((amountPaise / expense) * 100) : 0;
        return {
          catId,
          name: cat?.name || 'Other',
          color: cat?.color || '#94a3b8',
          icon: cat?.icon || 'Folder',
          amountPaise,
          percent,
        };
      })
      .sort((a, b) => b.amountPaise - a.amountPaise);

    return {
      income,
      expense,
      netCashFlow: income - expense,
      avgDailySpending,
      maxExpense,
      maxExpenseNote,
      mostUsedCategory: dbState.categories.find((c) => c.id === mostUsedCatId),
      highestSpendingCategory: dbState.categories.find((c) => c.id === highestSpendingCatId),
      highestCategoryAmount: maxCatSpending,
      categoryBreakdown,
      dayTotals,
    };
  }, [monthTransactions, dbState, selectedMonth]);

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-slate-100">
      {/* Top Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-[#0b0f19]/90 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-bold text-white">Reports & Analytics</h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            className="h-7 w-7 rounded-lg text-slate-400 hover:text-white flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-white px-1.5">{monthName}</span>
          <button
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            className="h-7 w-7 rounded-lg text-slate-400 hover:text-white flex items-center justify-center"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-6">
        {/* Net Cash Flow & Surplus Summary */}
        <div className="rounded-3xl bg-linear-to-br from-slate-900 via-[#131c2e] to-[#0d1624] p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Net Savings / Surplus</span>
              <div
                className={`text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight mt-0.5 ${
                  metrics.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {metrics.netCashFlow >= 0 ? '+' : ''}
                {formatIndianCurrency(metrics.netCashFlow)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Savings Rate</span>
              <div className="text-base font-bold text-teal-400 tabular-nums mt-0.5">
                {metrics.income > 0 ? `${Math.round((metrics.netCashFlow / metrics.income) * 100)}%` : '0%'}
              </div>
            </div>
          </div>

          {/* Income vs Expense Bar Ratio */}
          <div className="space-y-1.5 pt-1">
            <div className="h-3 w-full rounded-full bg-slate-800 flex overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{
                  width: `${metrics.income + metrics.expense > 0 ? (metrics.income / (metrics.income + metrics.expense)) * 100 : 50}%`,
                }}
              />
              <div
                className="bg-rose-500 h-full transition-all"
                style={{
                  width: `${metrics.income + metrics.expense > 0 ? (metrics.expense / (metrics.income + metrics.expense)) * 100 : 50}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="text-emerald-400 font-medium">
                Income: {formatIndianCurrency(metrics.income)}
              </span>
              <span className="text-rose-400 font-medium">
                Expense: {formatIndianCurrency(metrics.expense)}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Metric Chips */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block mb-1">Avg Daily Spend</span>
            <div className="text-base font-bold text-white tabular-nums">
              {formatIndianCurrency(metrics.avgDailySpending)} / day
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block mb-1">Single Largest Outflow</span>
            <div className="text-base font-bold text-rose-400 tabular-nums truncate">
              {metrics.maxExpense > 0 ? formatIndianCurrency(metrics.maxExpense) : '₹0'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block mb-1">Highest Spending Category</span>
            <div className="text-xs font-bold text-teal-300 truncate">
              {metrics.highestSpendingCategory?.name || 'None'}
            </div>
            {metrics.highestCategoryAmount > 0 && (
              <span className="text-[10px] text-slate-400 tabular-nums">
                {formatIndianCurrency(metrics.highestCategoryAmount)}
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block mb-1">Most Frequent Category</span>
            <div className="text-xs font-bold text-slate-200 truncate">
              {metrics.mostUsedCategory?.name || 'None'}
            </div>
            <span className="text-[10px] text-slate-400">By frequency of records</span>
          </div>
        </div>

        {/* Category-Wise Expense Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Expense Breakdown by Category
            </span>
            <span className="text-xs text-slate-500">
              {metrics.categoryBreakdown.length} categories active
            </span>
          </div>

          {metrics.categoryBreakdown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500 text-xs">
              No category expense records found for {monthName}.
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
              {metrics.categoryBreakdown.map((item) => (
                <div key={item.catId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}25`, color: item.color }}
                      >
                        <CategoryIcon name={item.icon} size={14} />
                      </div>
                      <span className="font-semibold text-slate-200">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2 tabular-nums">
                      <span className="font-bold text-white">
                        {formatIndianCurrency(item.amountPaise)}
                      </span>
                      <span className="text-slate-500 text-[11px] w-8 text-right">
                        {item.percent}%
                      </span>
                    </div>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
