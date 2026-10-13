export type TransactionType = 'expense' | 'income' | 'transfer' | 'lend' | 'repay_in' | 'repay_out';

export type PaymentMethod = 'UPI' | 'Cash' | 'Bank Transfer' | 'Debit/Credit Card' | 'Other' | 'Not Specified';

export type AccountType = 'cash' | 'bank' | 'savings' | 'other';

export type LoanType = 'lent' | 'borrowed';

export type LoanStatus = 'pending' | 'partially_repaid' | 'fully_repaid' | 'cancelled';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalancePaise: number; // Stored in integer paise (₹1 = 100 paise)
  currentBalancePaise: number;
  description?: string;
  isArchived: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  sortOrder: number;
  isHidden: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amountPaise: number; // positive integer in paise
  categoryId?: string;
  accountId: string; // source account
  toAccountId?: string; // destination account for transfer
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24-hour)
  timestamp: number; // epoch ms
  note?: string;
  loanId?: string; // linked loan if repay_in or repay_out or lend
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  type: 'overall' | 'category';
  categoryId?: string; // null for overall
  limitPaise: number;
  createdAt: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  amountPaise: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  accountId: string;
  paymentMethod: PaymentMethod;
  note?: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  type: LoanType; // 'lent' (money given) or 'borrowed' (money taken)
  personName: string;
  principalPaise: number;
  repaidPaise: number;
  date: string; // YYYY-MM-DD
  expectedDate?: string; // YYYY-MM-DD
  note?: string;
  accountId: string; // Account used to disburse or receive loan
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  defaultPaymentMethod: PaymentMethod;
  theme: 'dark' | 'light';
  currencySymbol: string;
  firstDayOfMonth: number;
  appLockEnabled: boolean;
  appLockPin: string;
  biometricsEnabled: boolean;
  lockGracePeriodSeconds: number; // 0 = immediate, 30, 60, 300
  lastBackupDate?: string;
  preferredViewMode: 'phone' | 'desktop';
}

// Helpers for Paise <-> Rupee conversions to guarantee zero floating point inaccuracy
export const paiseToRupees = (paise: number): number => {
  return paise / 100;
};

export const rupeesToPaise = (rupees: number | string): number => {
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
};

export const formatIndianCurrency = (paise: number, showSign = false): string => {
  const rupees = Math.abs(paise) / 100;
  const isNegative = paise < 0;

  // Format with Indian Numbering System (Lakhs & Crores)
  const parts = rupees.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian regex formatting: last 3 digits, then groups of 2
  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  const formatted = decimalPart === '00' ? integerPart : `${integerPart}.${decimalPart}`;
  
  if (isNegative) {
    return `-₹${formatted}`;
  }
  if (showSign && paise > 0) {
    return `+₹${formatted}`;
  }
  return `₹${formatted}`;
};
