

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum AccountType {
  CASH = 'CASH',
  BANK = 'BANK',
  CREDIT = 'CREDIT',
  LOAN = 'LOAN',
  OTHER = 'OTHER',
}

export enum Frequency {
  NEVER = 'NEVER',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Exchange rate relative to base currency (1 Unit of Currency = X Units of Base)
  isBase: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  currencyCode: string;
  lowBalanceThreshold?: number; // Notify if balance falls below this
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  note?: string;
  linkedGoalId?: string; // ID of the goal if this transaction was a deposit
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  color: string;
}

export interface RecurringTransaction {
  id: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  note?: string;
  frequency: Frequency;
  nextDueDate: string;
}

export interface Notification {
  id: string;
  type: 'LOW_BALANCE' | 'UPCOMING_RECURRING' | 'GOAL_REACHED' | 'DEBT_PAID';
  title: string;
  message: string;
  date: string; // ISO String
  severity: 'WARNING' | 'INFO' | 'SUCCESS';
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  deadline?: string; // ISO Date String YYYY-MM-DD
  status: 'ACTIVE' | 'COMPLETED';
  linkedAccountId?: string; // NEW: Links this goal to a Debt Account
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  icon: string;
  color: string;
  dueDate?: string;
  status: 'ACTIVE' | 'PAID';
}

export type ViewState = 'DASHBOARD' | 'ACCOUNTS' | 'STATS' | 'AI_INSIGHT' | 'GOALS' | 'HISTORY';

export type AIActionType = 'TRANSACTION' | 'CREATE_GOAL' | 'DEPOSIT_GOAL' | 'INVALID_IMAGE';

export interface AIParsedResult {
  action: AIActionType;
  // Transaction Fields
  amount?: number;
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  date?: string;
  note?: string;
  // Goal Fields
  goalName?: string;
  targetAmount?: number;
  deadline?: string;
  goalId?: string; // For deposit
}

export type Language = 'TH' | 'LA' | 'EN';