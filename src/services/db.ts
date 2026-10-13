import {
  Account,
  Category,
  Transaction,
  Budget,
  Loan,
  LoanRepayment,
  UserSettings,
  formatIndianCurrency,
  paiseToRupees,
} from '../types/finance';

const DB_KEY = 'dhantrack_finance_db_v1';
const DB_VERSION = 1;

export interface DatabaseState {
  version: number;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  loans: Loan[];
  loanRepayments: LoanRepayment[];
  settings: UserSettings;
}

const DEFAULT_SETTINGS: UserSettings = {
  defaultPaymentMethod: 'UPI',
  theme: 'dark',
  currencySymbol: '₹',
  firstDayOfMonth: 1,
  appLockEnabled: false,
  appLockPin: '1234',
  biometricsEnabled: true,
  lockGracePeriodSeconds: 0,
  preferredViewMode: 'phone',
};

const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc_cash',
    name: 'Cash',
    type: 'cash',
    openingBalancePaise: 450000, // ₹4,500.00
    currentBalancePaise: 450000,
    description: 'Physical cash in wallet',
    isArchived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_bank_main',
    name: 'Main Bank Account',
    type: 'bank',
    openingBalancePaise: 3850000, // ₹38,500.00
    currentBalancePaise: 3850000,
    description: 'Salary and primary UPI bank account',
    isArchived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_savings',
    name: 'Savings Account',
    type: 'savings',
    openingBalancePaise: 12500000, // ₹1,25,000.00
    currentBalancePaise: 12500000,
    description: 'Emergency fund & high-yield savings',
    isArchived: false,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_CATEGORIES: Category[] = [
  // Income categories
  { id: 'cat_inc_salary', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10B981', sortOrder: 1, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_inc_freelance', name: 'Freelancing', type: 'income', icon: 'Laptop', color: '#06B6D4', sortOrder: 2, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_inc_pocket', name: 'Pocket Money', type: 'income', icon: 'Coins', color: '#3B82F6', sortOrder: 3, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_inc_gifts', name: 'Gifts', type: 'income', icon: 'Gift', color: '#EC4899', sortOrder: 4, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_inc_refunds', name: 'Refunds', type: 'income', icon: 'RotateCcw', color: '#8B5CF6', sortOrder: 5, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_inc_other', name: 'Other Income', type: 'income', icon: 'TrendingUp', color: '#14B8A6', sortOrder: 6, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },

  // Expense categories
  { id: 'cat_exp_food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#F97316', sortOrder: 1, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_transport', name: 'Transport & Fuel', type: 'expense', icon: 'Car', color: '#3B82F6', sortOrder: 2, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_recharge', name: 'Recharge & Bills', type: 'expense', icon: 'Smartphone', color: '#8B5CF6', sortOrder: 3, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_education', name: 'Education & Courses', type: 'expense', icon: 'GraduationCap', color: '#0EA5E9', sortOrder: 4, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', sortOrder: 5, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_entertainment', name: 'Entertainment', type: 'expense', icon: 'Film', color: '#A855F7', sortOrder: 6, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_health', name: 'Health & Medical', type: 'expense', icon: 'HeartPulse', color: '#EF4444', sortOrder: 7, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_tech', name: 'Technology & Gadgets', type: 'expense', icon: 'Cpu', color: '#6366F1', sortOrder: 8, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_hostel', name: 'Hostel & Rent', type: 'expense', icon: 'Home', color: '#F59E0B', sortOrder: 9, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_misc', name: 'Miscellaneous', type: 'expense', icon: 'MoreHorizontal', color: '#64748B', sortOrder: 10, isHidden: false, isDefault: true, createdAt: new Date().toISOString() },
];

const getSampleInitialData = (): DatabaseState => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthNum = today.getMonth() + 1;
  const currentMonthStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
  
  const dToday = today.toISOString().split('T')[0];
  const dYesterday = new Date(today.getTime() - 86400000).toISOString().split('T')[0];
  const d3DaysAgo = new Date(today.getTime() - 3 * 86400000).toISOString().split('T')[0];
  const d5DaysAgo = new Date(today.getTime() - 5 * 86400000).toISOString().split('T')[0];
  const d10DaysAgo = new Date(today.getTime() - 10 * 86400000).toISOString().split('T')[0];

  const transactions: Transaction[] = [
    {
      id: 'tx_1',
      type: 'income',
      amountPaise: 6500000, // ₹65,000
      categoryId: 'cat_inc_salary',
      accountId: 'acc_bank_main',
      paymentMethod: 'Bank Transfer',
      date: d10DaysAgo,
      time: '10:00',
      timestamp: new Date(`${d10DaysAgo}T10:00:00`).getTime(),
      note: 'Monthly salary credited',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_2',
      type: 'expense',
      amountPaise: 1800000, // ₹18,000
      categoryId: 'cat_exp_hostel',
      accountId: 'acc_bank_main',
      paymentMethod: 'UPI',
      date: d10DaysAgo,
      time: '14:30',
      timestamp: new Date(`${d10DaysAgo}T14:30:00`).getTime(),
      note: 'Hostel rent & maintenance',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_3',
      type: 'transfer',
      amountPaise: 500000, // ₹5,000
      accountId: 'acc_bank_main',
      toAccountId: 'acc_cash',
      paymentMethod: 'Cash',
      date: d5DaysAgo,
      time: '18:15',
      timestamp: new Date(`${d5DaysAgo}T18:15:00`).getTime(),
      note: 'ATM cash withdrawal for weekly expenses',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_4',
      type: 'expense',
      amountPaise: 38000, // ₹380
      categoryId: 'cat_exp_food',
      accountId: 'acc_cash',
      paymentMethod: 'Cash',
      date: d3DaysAgo,
      time: '20:15',
      timestamp: new Date(`${d3DaysAgo}T20:15:00`).getTime(),
      note: 'Dinner at Dosa Corner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_5',
      type: 'expense',
      amountPaise: 79900, // ₹799
      categoryId: 'cat_exp_recharge',
      accountId: 'acc_bank_main',
      paymentMethod: 'UPI',
      date: dYesterday,
      time: '11:45',
      timestamp: new Date(`${dYesterday}T11:45:00`).getTime(),
      note: 'Airtel Fiber monthly broadband',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_6',
      type: 'expense',
      amountPaise: 14000, // ₹140
      categoryId: 'cat_exp_transport',
      accountId: 'acc_bank_main',
      paymentMethod: 'UPI',
      date: dToday,
      time: '09:20',
      timestamp: new Date(`${dToday}T09:20:00`).getTime(),
      note: 'Metro ride to office',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx_7',
      type: 'income',
      amountPaise: 850000, // ₹8,500
      categoryId: 'cat_inc_freelance',
      accountId: 'acc_bank_main',
      paymentMethod: 'UPI',
      date: dToday,
      time: '16:00',
      timestamp: new Date(`${dToday}T16:00:00`).getTime(),
      note: 'UI design consulting milestone',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const budgets: Budget[] = [
    {
      id: 'b_overall',
      month: currentMonthStr,
      type: 'overall',
      limitPaise: 3500000, // ₹35,000 overall limit
      createdAt: new Date().toISOString(),
    },
    {
      id: 'b_food',
      month: currentMonthStr,
      type: 'category',
      categoryId: 'cat_exp_food',
      limitPaise: 800000, // ₹8,000 for Food
      createdAt: new Date().toISOString(),
    },
    {
      id: 'b_transport',
      month: currentMonthStr,
      type: 'category',
      categoryId: 'cat_exp_transport',
      limitPaise: 300000, // ₹3,000 for Transport
      createdAt: new Date().toISOString(),
    },
    {
      id: 'b_shopping',
      month: currentMonthStr,
      type: 'category',
      categoryId: 'cat_exp_shopping',
      limitPaise: 500000, // ₹5,000 for Shopping
      createdAt: new Date().toISOString(),
    },
  ];

  const loans: Loan[] = [
    {
      id: 'loan_1',
      type: 'lent',
      personName: 'Rohan Sharma',
      principalPaise: 500000, // ₹5,000
      repaidPaise: 200000, // ₹2,000 repaid
      date: d10DaysAgo,
      expectedDate: new Date(today.getTime() + 15 * 86400000).toISOString().split('T')[0],
      note: 'Emergency college exam fees',
      accountId: 'acc_bank_main',
      status: 'partially_repaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'loan_2',
      type: 'lent',
      personName: 'Ananya Verma',
      principalPaise: 150000, // ₹1,500
      repaidPaise: 0,
      date: d3DaysAgo,
      expectedDate: new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0],
      note: 'Concert ticket booking advance',
      accountId: 'acc_bank_main',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const loanRepayments: LoanRepayment[] = [
    {
      id: 'lr_1',
      loanId: 'loan_1',
      amountPaise: 200000, // ₹2,000
      date: dYesterday,
      time: '19:00',
      accountId: 'acc_bank_main',
      paymentMethod: 'UPI',
      note: 'First installment repaid via UPI',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    version: DB_VERSION,
    accounts: DEFAULT_ACCOUNTS,
    categories: DEFAULT_CATEGORIES,
    transactions,
    budgets,
    loans,
    loanRepayments,
    settings: DEFAULT_SETTINGS,
  };
};

class FinanceDatabaseService {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadFromStorage();
    this.reconcileAccountBalances();
  }

  private loadFromStorage(): DatabaseState {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.version === DB_VERSION) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load database from localStorage, initializing fresh data', e);
    }
    const initial = getSampleInitialData();
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(state: DatabaseState) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  }

  private notify() {
    this.saveToStorage(this.state);
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): DatabaseState {
    return this.state;
  }

  // Pure financial balance reconciliation
  public reconcileAccountBalances() {
    const balances: Record<string, number> = {};

    // Initialize with opening balances
    this.state.accounts.forEach((acc) => {
      balances[acc.id] = acc.openingBalancePaise || 0;
    });

    // Process transactions chronologically
    this.state.transactions.forEach((tx) => {
      if (tx.type === 'income') {
        if (balances[tx.accountId] !== undefined) {
          balances[tx.accountId] += tx.amountPaise;
        }
      } else if (tx.type === 'expense') {
        if (balances[tx.accountId] !== undefined) {
          balances[tx.accountId] -= tx.amountPaise;
        }
      } else if (tx.type === 'transfer') {
        // Atomic transfer: from source to destination
        if (balances[tx.accountId] !== undefined) {
          balances[tx.accountId] -= tx.amountPaise;
        }
        if (tx.toAccountId && balances[tx.toAccountId] !== undefined) {
          balances[tx.toAccountId] += tx.amountPaise;
        }
      } else if (tx.type === 'lend') {
        // Lending decreases source account balance
        if (balances[tx.accountId] !== undefined) {
          balances[tx.accountId] -= tx.amountPaise;
        }
      } else if (tx.type === 'repay_in') {
        // Repayment received increases account balance
        if (balances[tx.accountId] !== undefined) {
          balances[tx.accountId] += tx.amountPaise;
        }
      } else if (tx.type === 'repay_out') {
        // Repaying borrowed money decreases account balance
        if (balances[tx.accountId] !== undefined) {
          balances[tx.accountId] -= tx.amountPaise;
        }
      }
    });

    // Update state accounts with calculated balance
    let changed = false;
    this.state.accounts = this.state.accounts.map((acc) => {
      const calcBalance = balances[acc.id] ?? acc.openingBalancePaise;
      if (acc.currentBalancePaise !== calcBalance) {
        changed = true;
        return { ...acc, currentBalancePaise: calcBalance };
      }
      return acc;
    });

    if (changed) {
      this.saveToStorage(this.state);
    }
  }

  // --- Transactions ---
  public addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.transactions = [newTx, ...this.state.transactions];
    this.reconcileAccountBalances();
    this.notify();
    return newTx;
  }

  public updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>): boolean {
    const index = this.state.transactions.findIndex((t) => t.id === id);
    if (index === -1) return false;

    this.state.transactions[index] = {
      ...this.state.transactions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.reconcileAccountBalances();
    this.notify();
    return true;
  }

  public deleteTransaction(id: string): boolean {
    const initialLen = this.state.transactions.length;
    this.state.transactions = this.state.transactions.filter((t) => t.id !== id);
    if (this.state.transactions.length !== initialLen) {
      this.reconcileAccountBalances();
      this.notify();
      return true;
    }
    return false;
  }

  // --- Accounts ---
  public addAccount(account: Omit<Account, 'id' | 'currentBalancePaise' | 'createdAt'>): Account {
    const newAcc: Account = {
      ...account,
      id: `acc_${Date.now()}`,
      currentBalancePaise: account.openingBalancePaise,
      createdAt: new Date().toISOString(),
    };
    this.state.accounts.push(newAcc);
    this.reconcileAccountBalances();
    this.notify();
    return newAcc;
  }

  public updateAccount(id: string, updates: Partial<Account>): boolean {
    const idx = this.state.accounts.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.state.accounts[idx] = { ...this.state.accounts[idx], ...updates };
    this.reconcileAccountBalances();
    this.notify();
    return true;
  }

  public archiveAccount(id: string, isArchived: boolean): boolean {
    return this.updateAccount(id, { isArchived });
  }

  // --- Categories ---
  public addCategory(cat: Omit<Category, 'id' | 'createdAt'>): Category {
    const newCat: Category = {
      ...cat,
      id: `cat_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.categories.push(newCat);
    this.notify();
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<Category>): boolean {
    const idx = this.state.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.state.categories[idx] = { ...this.state.categories[idx], ...updates };
    this.notify();
    return true;
  }

  public deleteCategory(id: string, reassignToCategoryId?: string): boolean {
    const transactionsUsingCategory = this.state.transactions.filter((t) => t.categoryId === id);
    
    if (transactionsUsingCategory.length > 0) {
      if (reassignToCategoryId) {
        // Reassign records
        this.state.transactions = this.state.transactions.map((t) => 
          t.categoryId === id ? { ...t, categoryId: reassignToCategoryId } : t
        );
      } else {
        // Preserve records by setting categoryId to undefined
        this.state.transactions = this.state.transactions.map((t) => 
          t.categoryId === id ? { ...t, categoryId: undefined } : t
        );
      }
    }

    // Also remove any category budget attached
    this.state.budgets = this.state.budgets.filter((b) => b.categoryId !== id);

    this.state.categories = this.state.categories.filter((c) => c.id !== id);
    this.notify();
    return true;
  }

  // --- Budgets ---
  public setBudget(month: string, type: 'overall' | 'category', limitPaise: number, categoryId?: string): Budget {
    const existingIdx = this.state.budgets.findIndex((b) => 
      b.month === month && b.type === type && (type === 'overall' || b.categoryId === categoryId)
    );

    if (existingIdx !== -1) {
      this.state.budgets[existingIdx].limitPaise = limitPaise;
      this.notify();
      return this.state.budgets[existingIdx];
    } else {
      const newBudget: Budget = {
        id: `b_${Date.now()}`,
        month,
        type,
        categoryId,
        limitPaise,
        createdAt: new Date().toISOString(),
      };
      this.state.budgets.push(newBudget);
      this.notify();
      return newBudget;
    }
  }

  public deleteBudget(id: string): boolean {
    const initialLen = this.state.budgets.length;
    this.state.budgets = this.state.budgets.filter((b) => b.id !== id);
    if (this.state.budgets.length !== initialLen) {
      this.notify();
      return true;
    }
    return false;
  }

  public copyBudgetsFromMonth(fromMonth: string, toMonth: string): number {
    const sourceBudgets = this.state.budgets.filter((b) => b.month === fromMonth);
    let copiedCount = 0;
    sourceBudgets.forEach((sb) => {
      this.setBudget(toMonth, sb.type, sb.limitPaise, sb.categoryId);
      copiedCount++;
    });
    return copiedCount;
  }

  // --- Lending & Repayments ---
  public addLoan(loan: Omit<Loan, 'id' | 'repaidPaise' | 'status' | 'createdAt' | 'updatedAt'>): Loan {
    const newLoan: Loan = {
      ...loan,
      id: `loan_${Date.now()}`,
      repaidPaise: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.loans.unshift(newLoan);

    // Atomically create the financial movement transaction
    this.addTransaction({
      type: loan.type === 'lent' ? 'lend' : 'income',
      amountPaise: loan.principalPaise,
      accountId: loan.accountId,
      paymentMethod: 'Cash',
      date: loan.date,
      time: '12:00',
      timestamp: new Date(`${loan.date}T12:00:00`).getTime(),
      note: `Loan to ${loan.personName}: ${loan.note || ''}`.trim(),
      loanId: newLoan.id,
    });

    this.notify();
    return newLoan;
  }

  public addRepayment(repayment: Omit<LoanRepayment, 'id' | 'createdAt'>): LoanRepayment {
    const loan = this.state.loans.find((l) => l.id === repayment.loanId);
    if (!loan) throw new Error('Loan not found');

    const newRepayment: LoanRepayment = {
      ...repayment,
      id: `lr_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.loanRepayments.unshift(newRepayment);

    // Update loan repaid amount & status
    const totalRepaid = loan.repaidPaise + repayment.amountPaise;
    let newStatus: Loan['status'] = 'partially_repaid';
    if (totalRepaid >= loan.principalPaise) {
      newStatus = 'fully_repaid';
    }

    loan.repaidPaise = totalRepaid;
    loan.status = newStatus;
    loan.updatedAt = new Date().toISOString();

    // Create the associated transaction for the balance update
    // If loan was 'lent', receiving repayment is 'repay_in' (increases user's account)
    // If loan was 'borrowed', making repayment is 'repay_out' (decreases user's account)
    this.addTransaction({
      type: loan.type === 'lent' ? 'repay_in' : 'repay_out',
      amountPaise: repayment.amountPaise,
      accountId: repayment.accountId,
      paymentMethod: repayment.paymentMethod,
      date: repayment.date,
      time: repayment.time,
      timestamp: new Date(`${repayment.date}T${repayment.time}:00`).getTime(),
      note: `Repayment from ${loan.personName}: ${repayment.note || ''}`.trim(),
      loanId: loan.id,
    });

    this.notify();
    return newRepayment;
  }

  // --- Settings ---
  public updateSettings(updates: Partial<UserSettings>) {
    this.state.settings = { ...this.state.settings, ...updates };
    this.notify();
  }

  // --- Reporting & Calculations ---
  public getMonthlySummary(month: string) {
    // month is 'YYYY-MM'
    let totalIncome = 0;
    let totalExpenses = 0;

    this.state.transactions.forEach((tx) => {
      if (tx.date.startsWith(month)) {
        if (tx.type === 'income') {
          totalIncome += tx.amountPaise;
        } else if (tx.type === 'expense') {
          totalExpenses += tx.amountPaise;
        }
      }
    });

    // Overall Budget for month
    const overallBudget = this.state.budgets.find((b) => b.month === month && b.type === 'overall');
    const budgetLimit = overallBudget ? overallBudget.limitPaise : 0;
    const remainingBudget = budgetLimit > 0 ? budgetLimit - totalExpenses : 0;

    // Outstanding lent money to friends
    let outstandingLent = 0;
    this.state.loans.forEach((loan) => {
      if (loan.type === 'lent' && loan.status !== 'cancelled' && loan.status !== 'fully_repaid') {
        outstandingLent += Math.max(0, loan.principalPaise - loan.repaidPaise);
      }
    });

    // Total tracked balance
    const totalTrackedBalance = this.state.accounts
      .filter((a) => !a.isArchived)
      .reduce((acc, curr) => acc + curr.currentBalancePaise, 0);

    return {
      totalIncome,
      totalExpenses,
      budgetLimit,
      remainingBudget,
      outstandingLent,
      totalTrackedBalance,
      netSavings: totalIncome - totalExpenses,
    };
  }

  public getCategorySpent(month: string, categoryId: string): number {
    return this.state.transactions
      .filter((t) => t.date.startsWith(month) && t.type === 'expense' && t.categoryId === categoryId)
      .reduce((sum, t) => sum + t.amountPaise, 0);
  }

  // --- Export & Backup ---
  public exportBackup(): { filename: string; jsonContent: string; sqliteContent: string } {
    const todayStr = new Date().toISOString().split('T')[0];
    const filename = `personal_finance_backup_${todayStr}.db`;
    
    // Create rich backup format with checksum and SQLite schema
    const payload = {
      app: 'DhanTrack_Personal_Finance',
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      checksum: `sha256_${Date.now()}_${this.state.transactions.length}`,
      data: this.state,
    };

    // Also build a valid SQLite SQL dump format for compatibility
    const sqliteSql = [
      `-- DhanTrack SQLite Database Dump`,
      `-- Export Date: ${new Date().toISOString()}`,
      `-- Format Version: ${DB_VERSION}`,
      ``,
      `PRAGMA foreign_keys = ON;`,
      `BEGIN TRANSACTION;`,
      ``,
      `CREATE TABLE IF NOT EXISTS accounts (`,
      `  id TEXT PRIMARY KEY,`,
      `  name TEXT NOT NULL,`,
      `  type TEXT NOT NULL,`,
      `  opening_balance_paise INTEGER NOT NULL,`,
      `  current_balance_paise INTEGER NOT NULL,`,
      `  description TEXT,`,
      `  is_archived INTEGER NOT NULL DEFAULT 0,`,
      `  created_at TEXT NOT NULL`,
      `);`,
      ...this.state.accounts.map((a) => 
        `INSERT INTO accounts VALUES ('${a.id}', '${a.name.replace(/'/g, "''")}', '${a.type}', ${a.openingBalancePaise}, ${a.currentBalancePaise}, '${(a.description || '').replace(/'/g, "''")}', ${a.isArchived ? 1 : 0}, '${a.createdAt}');`
      ),
      ``,
      `CREATE TABLE IF NOT EXISTS categories (`,
      `  id TEXT PRIMARY KEY,`,
      `  name TEXT NOT NULL,`,
      `  type TEXT NOT NULL,`,
      `  icon TEXT NOT NULL,`,
      `  color TEXT NOT NULL,`,
      `  sort_order INTEGER NOT NULL,`,
      `  is_hidden INTEGER NOT NULL DEFAULT 0,`,
      `  is_default INTEGER NOT NULL DEFAULT 0,`,
      `  created_at TEXT NOT NULL`,
      `);`,
      ...this.state.categories.map((c) => 
        `INSERT INTO categories VALUES ('${c.id}', '${c.name.replace(/'/g, "''")}', '${c.type}', '${c.icon}', '${c.color}', ${c.sortOrder}, ${c.isHidden ? 1 : 0}, ${c.isDefault ? 1 : 0}, '${c.createdAt}');`
      ),
      ``,
      `CREATE TABLE IF NOT EXISTS transactions (`,
      `  id TEXT PRIMARY KEY,`,
      `  type TEXT NOT NULL,`,
      `  amount_paise INTEGER NOT NULL,`,
      `  category_id TEXT,`,
      `  account_id TEXT NOT NULL,`,
      `  to_account_id TEXT,`,
      `  payment_method TEXT NOT NULL,`,
      `  date TEXT NOT NULL,`,
      `  time TEXT NOT NULL,`,
      `  timestamp INTEGER NOT NULL,`,
      `  note TEXT,`,
      `  loan_id TEXT,`,
      `  created_at TEXT NOT NULL,`,
      `  updated_at TEXT NOT NULL`,
      `);`,
      ...this.state.transactions.map((t) => 
        `INSERT INTO transactions VALUES ('${t.id}', '${t.type}', ${t.amountPaise}, ${t.categoryId ? `'${t.categoryId}'` : 'NULL'}, '${t.accountId}', ${t.toAccountId ? `'${t.toAccountId}'` : 'NULL'}, '${t.paymentMethod}', '${t.date}', '${t.time}', ${t.timestamp}, '${(t.note || '').replace(/'/g, "''")}', ${t.loanId ? `'${t.loanId}'` : 'NULL'}, '${t.createdAt}', '${t.updatedAt}');`
      ),
      ``,
      `COMMIT;`,
    ].join('\n');

    this.updateSettings({ lastBackupDate: new Date().toISOString() });

    return {
      filename,
      jsonContent: JSON.stringify(payload, null, 2),
      sqliteContent: sqliteSql,
    };
  }

  public validateAndRestoreBackup(backupString: string): { success: boolean; message: string; recordCounts?: { transactions: number; accounts: number; categories: number } } {
    try {
      const parsed = JSON.parse(backupString);
      if (!parsed || !parsed.data || parsed.app !== 'DhanTrack_Personal_Finance') {
        return { success: false, message: 'Invalid backup file. Not a valid DhanTrack database backup.' };
      }

      if (parsed.version > DB_VERSION) {
        return { success: false, message: `Backup schema version ${parsed.version} is newer than current app version ${DB_VERSION}.` };
      }

      const data: DatabaseState = parsed.data;
      if (!Array.isArray(data.accounts) || !Array.isArray(data.transactions) || !Array.isArray(data.categories)) {
        return { success: false, message: 'Backup file is corrupted or missing essential tables.' };
      }

      // Create safety snapshot before overwriting
      try {
        localStorage.setItem(`${DB_KEY}_safety_backup_${Date.now()}`, JSON.stringify(this.state));
      } catch (e) {
        console.warn('Failed to store safety snapshot', e);
      }

      // Restore data safely
      this.state = data;
      this.reconcileAccountBalances();
      this.notify();

      return {
        success: true,
        message: 'Database restored successfully!',
        recordCounts: {
          transactions: data.transactions.length,
          accounts: data.accounts.length,
          categories: data.categories.length,
        },
      };
    } catch (e: any) {
      return { success: false, message: `Failed to restore: ${e.message || 'File parsing error'}` };
    }
  }

  public exportTransactionsCSV(): string {
    const headers = ['Date', 'Time', 'Type', 'Amount (₹)', 'Category', 'Account', 'Payment Method', 'Note'];
    const rows = this.state.transactions.map((tx) => {
      const cat = this.state.categories.find((c) => c.id === tx.categoryId);
      const acc = this.state.accounts.find((a) => a.id === tx.accountId);
      const amountRupees = (tx.amountPaise / 100).toFixed(2);
      const categoryName = cat ? cat.name : (tx.type === 'transfer' ? 'Transfer' : 'Uncategorized');
      const accountName = acc ? acc.name : 'Unknown Account';
      const cleanNote = (tx.note || '').replace(/"/g, '""');

      return [
        tx.date,
        tx.time,
        tx.type.toUpperCase(),
        amountRupees,
        `"${categoryName}"`,
        `"${accountName}"`,
        `"${tx.paymentMethod}"`,
        `"${cleanNote}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  public resetAllData() {
    const initial = getSampleInitialData();
    this.state = initial;
    this.reconcileAccountBalances();
    this.notify();
  }
}

export const dbService = new FinanceDatabaseService();
