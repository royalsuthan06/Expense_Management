import React, { useState, useEffect } from 'react';
import {
  HandCoins,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  UserCheck,
  ChevronDown,
  History,
  AlertCircle,
} from 'lucide-react';
import { dbService } from '../services/db';
import { Loan, LoanRepayment, formatIndianCurrency, rupeesToPaise } from '../types/finance';

export const LendingScreen: React.FC = () => {
  const [dbState, setDbState] = useState(dbService.getState());
  const [activeTab, setActiveTab] = useState<'lent' | 'borrowed'>('lent');

  // Modals
  const [addLoanModalOpen, setAddLoanModalOpen] = useState(false);
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // New Loan Form State
  const [personName, setPersonName] = useState('');
  const [principalInput, setPrincipalInput] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [loanAccountId, setLoanAccountId] = useState(
    dbState.accounts.find((a) => !a.isArchived)?.id || 'acc_cash'
  );
  const [loanNote, setLoanNote] = useState('');

  // Repayment Form State
  const [repayAmountInput, setRepayAmountInput] = useState('');
  const [repayAccountId, setRepayAccountId] = useState(
    dbState.accounts.find((a) => !a.isArchived)?.id || 'acc_cash'
  );
  const [repayPaymentMethod, setRepayPaymentMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer'>('UPI');
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repayTime, setRepayTime] = useState('12:00');
  const [repayNote, setRepayNote] = useState('');
  const [repayError, setRepayError] = useState<string | null>(null);

  useEffect(() => {
    return dbService.subscribe(() => {
      setDbState({ ...dbService.getState() });
    });
  }, []);

  const loans = dbState.loans.filter((l) => l.type === activeTab);

  // Metrics
  const totalPrincipal = loans.reduce((acc, l) => acc + l.principalPaise, 0);
  const totalRepaid = loans.reduce((acc, l) => acc + l.repaidPaise, 0);
  const totalOutstanding = Math.max(0, totalPrincipal - totalRepaid);

  const handleOpenRepayModal = (loan: Loan) => {
    setSelectedLoan(loan);
    const outstandingRupees = (loan.principalPaise - loan.repaidPaise) / 100;
    setRepayAmountInput(outstandingRupees.toString());
    setRepayError(null);
    setRepayModalOpen(true);
  };

  const handleOpenHistoryModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setHistoryModalOpen(true);
  };

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(principalInput);
    if (isNaN(principal) || principal <= 0 || !personName.trim()) return;

    dbService.addLoan({
      type: activeTab,
      personName: personName.trim(),
      principalPaise: rupeesToPaise(principal),
      date: loanDate,
      expectedDate: expectedDate || undefined,
      accountId: loanAccountId,
      note: loanNote.trim() || undefined,
    });

    setPersonName('');
    setPrincipalInput('');
    setLoanNote('');
    setAddLoanModalOpen(false);
  };

  const handleSubmitRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const amount = parseFloat(repayAmountInput);
    if (isNaN(amount) || amount <= 0) {
      setRepayError('Enter a valid repayment amount greater than 0');
      return;
    }

    const amountPaise = rupeesToPaise(amount);
    const outstanding = selectedLoan.principalPaise - selectedLoan.repaidPaise;
    if (amountPaise > outstanding) {
      setRepayError(`Repayment cannot exceed the outstanding balance of ${formatIndianCurrency(outstanding)}`);
      return;
    }

    try {
      dbService.addRepayment({
        loanId: selectedLoan.id,
        amountPaise,
        date: repayDate,
        time: repayTime,
        accountId: repayAccountId,
        paymentMethod: repayPaymentMethod,
        note: repayNote.trim() || undefined,
      });
      setRepayModalOpen(false);
    } catch (err: any) {
      setRepayError(err.message || 'Failed to record repayment');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-slate-100">
      {/* Top Segmented Tab (Lent vs Borrowed) */}
      <div className="sticky top-0 z-10 border-b border-slate-800/80 bg-[#0b0f19]/90 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('lent')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'lent'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Money Lent (Receivable)
            </button>
            <button
              onClick={() => setActiveTab('borrowed')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'borrowed'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Borrowed (Payable)
            </button>
          </div>

          <button
            onClick={() => setAddLoanModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-5">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block mb-0.5">
              Total {activeTab === 'lent' ? 'Lent' : 'Borrowed'}
            </span>
            <span className="text-sm font-bold text-slate-200 tabular-nums">
              {formatIndianCurrency(totalPrincipal)}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block mb-0.5">
              Total Repaid
            </span>
            <span className="text-sm font-bold text-emerald-400 tabular-nums">
              {formatIndianCurrency(totalRepaid)}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block mb-0.5">
              Outstanding
            </span>
            <span className="text-sm font-bold text-amber-400 tabular-nums">
              {formatIndianCurrency(totalOutstanding)}
            </span>
          </div>
        </div>

        {/* Loan Ledger List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Lending Records ({loans.length})
            </span>
          </div>

          {loans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center text-slate-500">
              <HandCoins className="h-8 w-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs">No {activeTab === 'lent' ? 'lent' : 'borrowed'} money records yet.</p>
              <button
                onClick={() => setAddLoanModalOpen(true)}
                className="mt-3 text-xs font-semibold text-teal-400 hover:text-teal-300"
              >
                + Add {activeTab === 'lent' ? 'loan to friend' : 'borrowed record'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => {
                const outstanding = loan.principalPaise - loan.repaidPaise;
                const percentRepaid = Math.round((loan.repaidPaise / loan.principalPaise) * 100);
                const isFullyRepaid = loan.status === 'fully_repaid';

                const repayments = dbState.loanRepayments.filter((r) => r.loanId === loan.id);

                return (
                  <div
                    key={loan.id}
                    className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{loan.personName}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isFullyRepaid
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : loan.status === 'partially_repaid'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {isFullyRepaid ? 'Settled' : loan.status === 'partially_repaid' ? 'Partially Repaid' : 'Pending'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                          <span>Given: {loan.date}</span>
                          {loan.expectedDate && (
                            <>
                              <span>·</span>
                              <span>Due: {loan.expectedDate}</span>
                            </>
                          )}
                        </div>
                        {loan.note && (
                          <div className="text-[11px] text-slate-300 italic mt-0.5">"{loan.note}"</div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Outstanding</div>
                        <div className="text-base font-extrabold text-amber-400 tabular-nums">
                          {formatIndianCurrency(outstanding)}
                        </div>
                        <div className="text-[10px] text-slate-500 tabular-nums">
                          Principal: {formatIndianCurrency(loan.principalPaise)}
                        </div>
                      </div>
                    </div>

                    {/* Repayment Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all"
                          style={{ width: `${percentRepaid}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Repaid: {formatIndianCurrency(loan.repaidPaise)} ({percentRepaid}%)</span>
                        {repayments.length > 0 && (
                          <button
                            onClick={() => handleOpenHistoryModal(loan)}
                            className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium"
                          >
                            <History className="h-3 w-3" />
                            <span>{repayments.length} installment(s)</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {!isFullyRepaid && (
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                        <button
                          onClick={() => handleOpenRepayModal(loan)}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Record Repayment</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Loan Modal */}
      {addLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#111827] border border-slate-800 text-slate-100 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white">
                Add {activeTab === 'lent' ? 'Money Lent to Friend' : 'Borrowed Record'}
              </span>
              <button onClick={() => setAddLoanModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Person's Name</label>
                <input
                  type="text"
                  placeholder="e.g. Siddharth, Priya"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Principal Amount (₹)</label>
                <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 px-3 py-2">
                  <span className="text-teal-400 font-bold mr-1">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="0"
                    value={principalInput}
                    onChange={(e) => setPrincipalInput(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Date Given</label>
                  <input
                    type="date"
                    value={loanDate}
                    onChange={(e) => setLoanDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Disbursed From Account</label>
                <select
                  value={loanAccountId}
                  onChange={(e) => setLoanAccountId(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {dbState.accounts.filter((a) => !a.isArchived).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Note / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Travel tickets, Emergency"
                  value={loanNote}
                  onChange={(e) => setLoanNote(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddLoanModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md shadow-teal-500/20"
                >
                  Save Loan Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Repayment Modal */}
      {repayModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#111827] border border-slate-800 text-slate-100 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
              <div>
                <span className="font-bold text-sm text-white block">Record Repayment</span>
                <span className="text-xs text-slate-400">
                  From: {selectedLoan.personName} · Outstanding: {formatIndianCurrency(selectedLoan.principalPaise - selectedLoan.repaidPaise)}
                </span>
              </div>
              <button onClick={() => setRepayModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {repayError && (
              <div className="mb-3 flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{repayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRepayment} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Repayment Amount (₹)</label>
                <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 px-3 py-2">
                  <span className="text-emerald-400 font-bold mr-1">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={repayAmountInput}
                    onChange={(e) => setRepayAmountInput(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Deposit into Account</label>
                <select
                  value={repayAccountId}
                  onChange={(e) => setRepayAccountId(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {dbState.accounts.filter((a) => !a.isArchived).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    value={repayDate}
                    onChange={(e) => setRepayDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Payment Method</label>
                  <select
                    value={repayPaymentMethod}
                    onChange={(e) => setRepayPaymentMethod(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2 py-1.5 text-xs text-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via GPay installment"
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRepayModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repayment History Modal */}
      {historyModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#111827] border border-slate-800 text-slate-100 p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
              <div>
                <span className="font-bold text-sm text-white block">Repayment History</span>
                <span className="text-xs text-slate-400">{selectedLoan.personName}</span>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              {dbState.loanRepayments.filter((r) => r.loanId === selectedLoan.id).map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-emerald-400 tabular-nums">
                      +{formatIndianCurrency(r.amountPaise)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {r.date} · {r.paymentMethod}
                    </div>
                    {r.note && <div className="text-[11px] text-slate-300 italic mt-0.5">{r.note}</div>}
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
