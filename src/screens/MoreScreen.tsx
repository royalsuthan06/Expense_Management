import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Tags,
  BarChart3,
  Database,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  ChevronRight,
  Fingerprint,
  Lock,
  Smartphone,
  ExternalLink,
  Code2,
  AlertTriangle,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import { dbService } from '../services/db';
import { PaymentMethod, formatIndianCurrency } from '../types/finance';
import { AccountsView } from './AccountsView';
import { CategoriesView } from './CategoriesView';
import { ReportsView } from './ReportsView';
import { FlutterProjectView } from './FlutterProjectView';

export const MoreScreen: React.FC = () => {
  const [dbState, setDbState] = useState(dbService.getState());
  const [activeSubView, setActiveSubView] = useState<
    'none' | 'accounts' | 'categories' | 'reports' | 'flutter'
  >('none');

  // Modals & Statuses
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [restoreConfirmData, setRestoreConfirmData] = useState<{
    fileString: string;
    preview: { transactions: number; accounts: number; categories: number };
  } | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState(dbState.settings.appLockPin || '1234');

  useEffect(() => {
    return dbService.subscribe(() => {
      setDbState({ ...dbService.getState() });
    });
  }, []);

  if (activeSubView === 'accounts') {
    return <AccountsView onBack={() => setActiveSubView('none')} />;
  }
  if (activeSubView === 'categories') {
    return <CategoriesView onBack={() => setActiveSubView('none')} />;
  }
  if (activeSubView === 'reports') {
    return <ReportsView onBack={() => setActiveSubView('none')} />;
  }
  if (activeSubView === 'flutter') {
    return <FlutterProjectView onBack={() => setActiveSubView('none')} />;
  }

  // Backup SQLite DB handler
  const handleExportDatabase = () => {
    try {
      const { filename, jsonContent, sqliteContent } = dbService.exportBackup();

      // Trigger file download
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupNotice(
        `Exported SQLite backup "${filename}". You can upload this file directly to Google Drive or Android Documents!`
      );
      setTimeout(() => setBackupNotice(null), 7000);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    }
  };

  // Export CSV handler
  const handleExportCSV = () => {
    try {
      const csvContent = dbService.exportTransactionsCSV();
      const todayStr = new Date().toISOString().split('T')[0];
      const filename = `dhantrack_transactions_${todayStr}.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupNotice(`Exported transactions to "${filename}"!`);
      setTimeout(() => setBackupNotice(null), 5000);
    } catch (e: any) {
      alert(`CSV Export failed: ${e.message}`);
    }
  };

  // File picker for restoring database
  const handleFileRestorePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        if (parsed.app === 'DhanTrack_Personal_Finance') {
          setRestoreConfirmData({
            fileString: content,
            preview: {
              transactions: parsed.data.transactions.length,
              accounts: parsed.data.accounts.length,
              categories: parsed.data.categories.length,
            },
          });
        } else {
          alert('Invalid DhanTrack backup file structure.');
        }
      } catch (err) {
        alert('Could not parse the selected backup file. Ensure it is a valid .db/.json backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  const handleConfirmRestore = () => {
    if (!restoreConfirmData) return;
    const res = dbService.validateAndRestoreBackup(restoreConfirmData.fileString);
    if (res.success) {
      setBackupNotice(`Database restored successfully (${res.recordCounts?.transactions} records)!`);
      setTimeout(() => setBackupNotice(null), 5000);
    } else {
      alert(res.message);
    }
    setRestoreConfirmData(null);
  };

  const handleToggleLock = () => {
    dbService.updateSettings({ appLockEnabled: !dbState.settings.appLockEnabled });
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length === 4) {
      dbService.updateSettings({ appLockPin: pinInput });
      setSecurityModalOpen(false);
      setBackupNotice('4-digit PIN updated successfully!');
      setTimeout(() => setBackupNotice(null), 4000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-slate-100">
      {/* Top Header */}
      <div className="sticky top-0 z-10 border-b border-slate-800/80 bg-[#0b0f19]/90 px-5 py-3 backdrop-blur-md">
        <h2 className="text-sm font-bold text-white">Settings & Preferences</h2>
      </div>

      {backupNotice && (
        <div className="mx-5 mt-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 p-3.5 text-xs text-teal-300 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{backupNotice}</p>
        </div>
      )}

      <div className="px-5 pt-4 space-y-6">
        {/* Hub Navigation Section */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2 px-1">
            Financial Management
          </span>
          <div className="rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
            <button
              onClick={() => setActiveSubView('accounts')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Accounts & Balances</span>
                  <span className="text-[11px] text-slate-400">
                    {dbState.accounts.length} accounts · Cash, Bank, Savings
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>

            <button
              onClick={() => setActiveSubView('categories')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Tags className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Categories</span>
                  <span className="text-[11px] text-slate-400">
                    {dbState.categories.length} custom categories with icons
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>

            <button
              onClick={() => setActiveSubView('reports')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Reports & Analytics</span>
                  <span className="text-[11px] text-slate-400">
                    Net cash flow, spending breakdown & metrics
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>

            {/* Flutter Codebase Shortcut */}
            <button
              onClick={() => setActiveSubView('flutter')}
              className="w-full flex items-center justify-between p-3.5 bg-teal-500/5 hover:bg-teal-500/10 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                  <Code2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white block">Flutter Android Codebase</span>
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded font-semibold">
                      Complete Code
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Browse Drift SQLite Dart files & Download ZIP
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-teal-400" />
            </button>
          </div>
        </div>

        {/* Security & Screen Lock */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2 px-1">
            Security & Screen Lock
          </span>
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">App Lock</span>
                  <span className="text-[11px] text-slate-400">
                    Fingerprint & 4-digit PIN authentication
                  </span>
                </div>
              </div>

              <button
                onClick={handleToggleLock}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  dbState.settings.appLockEnabled ? 'bg-teal-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    dbState.settings.appLockEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {dbState.settings.appLockEnabled && (
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Current PIN: ••••</span>
                <button
                  onClick={() => setSecurityModalOpen(true)}
                  className="text-teal-400 hover:text-teal-300 font-medium"
                >
                  Change PIN
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Backup & Restore to Google Drive */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2 px-1">
            Data Management & Offline Backups
          </span>
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4">
            <div className="flex items-start gap-2.5">
              <Cloud className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block">Google Drive & SQLite Backup</span>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                  Your data stays strictly offline. Export a full SQLite snapshot (.db) and save it to Google Drive or local storage.
                </p>
                {dbState.settings.lastBackupDate && (
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Last backup: {dbState.settings.lastBackupDate.replace('T', ' ').slice(0, 19)}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExportDatabase}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-teal-400" />
                <span>Export SQLite (.db)</span>
              </button>

              <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 cursor-pointer transition-colors">
                <Upload className="h-3.5 w-3.5 text-amber-400" />
                <span>Restore Backup</span>
                <input
                  type="file"
                  accept=".db,.sqlite,.json"
                  onChange={handleFileRestorePicker}
                  className="hidden"
                />
              </label>
            </div>

            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-950 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export Transactions to CSV</span>
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2 px-1">
            Preferences
          </span>
          <div className="rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800/80">
            <div className="p-3.5 flex items-center justify-between text-xs">
              <span className="text-slate-300">Default Payment Method</span>
              <select
                value={dbState.settings.defaultPaymentMethod}
                onChange={(e) =>
                  dbService.updateSettings({ defaultPaymentMethod: e.target.value as PaymentMethod })
                }
                className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white focus:outline-none"
              >
                {['UPI', 'Cash', 'Bank Transfer', 'Debit/Credit Card', 'Other'].map((pm) => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>

            <div className="p-3.5 flex items-center justify-between text-xs">
              <span className="text-slate-300">Currency</span>
              <span className="font-bold text-teal-400 font-mono">₹ Indian Rupee (INR)</span>
            </div>

            <div className="p-3.5 flex items-center justify-between text-xs">
              <span className="text-slate-300">Budget Month Starts On</span>
              <span className="text-slate-400 font-medium">1st of the month</span>
            </div>
          </div>
        </div>

        {/* Danger Zone: Reset Data */}
        <div className="pt-2">
          <button
            onClick={() => setResetConfirmOpen(true)}
            className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Reset Sample Data / Clear All</span>
          </button>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {restoreConfirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#111827] border border-slate-800 p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold text-sm text-white">Confirm Database Restore</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Restoring this backup will replace current local transactions with data from the backup file:
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <div>• Transactions: <span className="font-bold text-white">{restoreConfirmData.preview.transactions}</span></div>
              <div>• Accounts: <span className="font-bold text-white">{restoreConfirmData.preview.accounts}</span></div>
              <div>• Categories: <span className="font-bold text-white">{restoreConfirmData.preview.categories}</span></div>
            </div>
            <p className="text-[11px] text-slate-400">
              A safety snapshot of your existing data will be retained in local storage before applying changes.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRestoreConfirmData(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-md shadow-teal-500/20"
              >
                Restore Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#111827] border border-slate-800 p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold text-sm text-white">Reset Application Data?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will re-initialize the SQLite database with default starter categories and sample accounts. It is recommended to export a backup first.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  dbService.resetAllData();
                  setResetConfirmOpen(false);
                  setBackupNotice('Database reset to initial sample state.');
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/30"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change PIN Modal */}
      {securityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs rounded-3xl bg-[#111827] border border-slate-800 p-6 space-y-4 text-slate-100 shadow-2xl">
            <span className="font-bold text-sm text-white block">Set 4-Digit Lock PIN</span>
            <form onSubmit={handleSavePin} className="space-y-4">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                autoFocus
                placeholder="1234"
                className="w-full text-center text-2xl font-bold tracking-widest bg-slate-900 border border-slate-800 rounded-xl py-2 text-white focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSecurityModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length !== 4}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 disabled:opacity-40"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
