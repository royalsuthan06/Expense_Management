import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Budget, Category, formatIndianCurrency, rupeesToPaise, paiseToRupees } from '../types/finance';
import { CategoryIcon } from '../components/CategoryIcon';

export const BudgetScreen: React.FC = () => {
  const [dbState, setDbState] = useState(dbService.getState());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetType, setBudgetType] = useState<'overall' | 'category'>('overall');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [limitInput, setLimitInput] = useState<string>('');
  const [copySuccessMsg, setCopySuccessMsg] = useState<string | null>(null);

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

  // Get previous month string
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const prevDate = new Date(yearNum, monthNum - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const currentBudgets = dbState.budgets.filter((b) => b.month === selectedMonth);
  const overallBudget = currentBudgets.find((b) => b.type === 'overall');
  const categoryBudgets = currentBudgets.filter((b) => b.type === 'category');

  // Overall calculations
  const totalMonthlyExpense = dbState.transactions
    .filter((tx) => tx.date.startsWith(selectedMonth) && tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amountPaise, 0);

  const overallSpent = totalMonthlyExpense;
  const overallLimit = overallBudget ? overallBudget.limitPaise : 0;
  const overallPercent = overallLimit > 0 ? Math.round((overallSpent / overallLimit) * 100) : 0;
  const overallRemaining = overallLimit > 0 ? overallLimit - overallSpent : 0;

  const handleCopyFromPrevious = () => {
    const copied = dbService.copyBudgetsFromMonth(prevMonthStr, selectedMonth);
    if (copied > 0) {
      setCopySuccessMsg(`Copied ${copied} budget(s) from previous month!`);
      setTimeout(() => setCopySuccessMsg(null), 3000);
    } else {
      setCopySuccessMsg('No budgets found in previous month to copy.');
      setTimeout(() => setCopySuccessMsg(null), 3000);
    }
  };

  const openCreateModal = (type: 'overall' | 'category') => {
    setEditingBudget(null);
    setBudgetType(type);
    setLimitInput('');
    const availableCategory = dbState.categories.find(
      (c) => c.type === 'expense' && !c.isHidden && !categoryBudgets.some((b) => b.categoryId === c.id)
    );
    setSelectedCategoryId(availableCategory?.id || '');
    setModalOpen(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setBudgetType(budget.type);
    setLimitInput(paiseToRupees(budget.limitPaise).toString());
    setSelectedCategoryId(budget.categoryId || '');
    setModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(limitInput);
    if (isNaN(num) || num <= 0) return;

    const limitPaise = rupeesToPaise(num);
    dbService.setBudget(
      selectedMonth,
      budgetType,
      limitPaise,
      budgetType === 'category' ? selectedCategoryId : undefined
    );
    setModalOpen(false);
  };

  const handleDeleteBudget = (id: string) => {
    dbService.deleteBudget(id);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-slate-100">
      {/* Top Month Selector */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-[#0b0f19]/90 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-white px-2">{monthName}</span>
          <button
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handleCopyFromPrevious}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          title="Copy from previous month"
        >
          <Copy className="h-3.5 w-3.5 text-teal-400" />
          <span>Copy Past</span>
        </button>
      </div>

      {copySuccessMsg && (
        <div className="mx-5 mt-3 rounded-xl bg-teal-500/10 border border-teal-500/30 px-3.5 py-2 text-xs text-teal-300">
          {copySuccessMsg}
        </div>
      )}

      <div className="px-5 pt-4 space-y-6">
        {/* Overall Monthly Budget Card */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Overall Spending Limit
            </span>
            {overallBudget ? (
              <button
                onClick={() => openEditModal(overallBudget)}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium"
              >
                Edit Limit
              </button>
            ) : (
              <button
                onClick={() => openCreateModal('overall')}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Set Overall Limit</span>
              </button>
            )}
          </div>

          {overallBudget ? (
            <div className="rounded-3xl bg-slate-900 border border-slate-800/90 p-5 shadow-lg space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-slate-400">Total Spent this Month</div>
                  <div className="text-2xl font-bold text-white tabular-nums mt-0.5">
                    {formatIndianCurrency(overallSpent)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Monthly Cap</div>
                  <div className="text-base font-semibold text-slate-200 tabular-nums mt-0.5">
                    {formatIndianCurrency(overallLimit)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      overallPercent > 100
                        ? 'bg-rose-500'
                        : overallPercent >= 80
                        ? 'bg-amber-500'
                        : 'bg-teal-400'
                    }`}
                    style={{ width: `${Math.min(100, overallPercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-medium">
                  <span
                    className={
                      overallPercent > 100
                        ? 'text-rose-400'
                        : overallPercent >= 80
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }
                  >
                    {overallPercent}% used
                  </span>
                  <span className={overallRemaining < 0 ? 'text-rose-400' : 'text-slate-300'}>
                    {overallRemaining < 0
                      ? `Exceeded by ${formatIndianCurrency(Math.abs(overallRemaining))}`
                      : `${formatIndianCurrency(overallRemaining)} left`}
                  </span>
                </div>
              </div>

              {/* Warning banners */}
              {overallPercent > 100 && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>You have exceeded your total monthly spending budget!</span>
                </div>
              )}
              {overallPercent >= 80 && overallPercent <= 100 && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>Warning: You have used {overallPercent}% of your monthly budget.</span>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => openCreateModal('overall')}
              className="rounded-3xl border border-dashed border-slate-800 p-6 text-center cursor-pointer hover:border-teal-500/40 transition-colors"
            >
              <PieChart className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No overall budget set for {monthName}.</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal-400">
                <Plus className="h-3.5 w-3.5" />
                <span>Create Overall Budget</span>
              </span>
            </div>
          )}
        </div>

        {/* Category Budgets Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Category Budgets ({categoryBudgets.length})
            </span>
            <button
              onClick={() => openCreateModal('category')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Category Budget</span>
            </button>
          </div>

          {categoryBudgets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500 text-xs">
              No category-specific budgets set for this month.
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBudgets.map((b) => {
                const cat = dbState.categories.find((c) => c.id === b.categoryId);
                const catSpent = b.categoryId ? dbService.getCategorySpent(selectedMonth, b.categoryId) : 0;
                const percent = b.limitPaise > 0 ? Math.round((catSpent / b.limitPaise) * 100) : 0;
                const remaining = b.limitPaise - catSpent;
                const isOver = percent > 100;
                const isNear = percent >= 80 && percent <= 100;

                return (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: cat ? `${cat.color}20` : '#1e293b',
                            color: cat ? cat.color : '#94a3b8',
                          }}
                        >
                          <CategoryIcon name={cat?.icon || 'Folder'} size={16} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{cat?.name || 'Category'}</span>
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            {formatIndianCurrency(catSpent)} of {formatIndianCurrency(b.limitPaise)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(b)}
                          className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white flex items-center justify-center"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(b.id)}
                          className="h-7 w-7 rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-teal-400'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-medium">
                        <span className={isOver ? 'text-rose-400' : isNear ? 'text-amber-400' : 'text-slate-400'}>
                          {percent}%
                        </span>
                        <span className={remaining < 0 ? 'text-rose-400' : 'text-slate-400'}>
                          {remaining < 0
                            ? `Over by ${formatIndianCurrency(Math.abs(remaining))}`
                            : `${formatIndianCurrency(remaining)} left`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Budget Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#111827] border border-slate-800 text-slate-100 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </span>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              {!editingBudget && (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Budget Type</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setBudgetType('overall')}
                      className={`py-1.5 text-xs font-medium rounded-lg ${
                        budgetType === 'overall' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400'
                      }`}
                    >
                      Overall Cap
                    </button>
                    <button
                      type="button"
                      onClick={() => setBudgetType('category')}
                      className={`py-1.5 text-xs font-medium rounded-lg ${
                        budgetType === 'category' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400'
                      }`}
                    >
                      Category Cap
                    </button>
                  </div>
                </div>
              )}

              {budgetType === 'category' && (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Select Category</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    disabled={!!editingBudget}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {dbState.categories
                      .filter((c) => c.type === 'expense' && !c.isHidden)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Monthly Limit (₹)</label>
                <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 px-3 py-2">
                  <span className="text-teal-400 font-bold mr-1">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="e.g. 10000"
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    autoFocus
                    className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md shadow-teal-500/20"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
