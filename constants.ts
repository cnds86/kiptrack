

import { Account, AccountType, Category, TransactionType, Currency } from './types';
import { Wallet, Landmark, PiggyBank, Briefcase, ShoppingCart, Utensils, Zap, Car, HeartPulse, Coffee, CreditCard, Target, Gift, Home, Plane, Smartphone, Gamepad, Music, Book, Wrench } from 'lucide-react';

export const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', rate: 1, isBase: true },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', rate: 680, isBase: false },
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 22000, isBase: false },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc_1',
    name: 'เงินสด (Cash)',
    type: AccountType.CASH,
    balance: 0,
    color: 'bg-green-500',
    currencyCode: 'LAK',
  },
  {
    id: 'acc_2',
    name: 'ธนาคาร (Bank)',
    type: AccountType.BANK,
    balance: 0,
    color: 'bg-blue-500',
    currencyCode: 'LAK',
  },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'inc_1', name: 'เงินเดือน', icon: 'Briefcase', type: TransactionType.INCOME, color: '#10b981' },
  { id: 'inc_2', name: 'โบนัส', icon: 'PiggyBank', type: TransactionType.INCOME, color: '#34d399' },
  { id: 'inc_3', name: 'อื่นๆ', icon: 'Wallet', type: TransactionType.INCOME, color: '#6ee7b7' },
];

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'exp_1', name: 'อาหาร', icon: 'Utensils', type: TransactionType.EXPENSE, color: '#f87171' },
  { id: 'exp_2', name: 'เดินทาง', icon: 'Car', type: TransactionType.EXPENSE, color: '#fbbf24' },
  { id: 'exp_3', name: 'ซื้อของ', icon: 'ShoppingCart', type: TransactionType.EXPENSE, color: '#60a5fa' },
  { id: 'exp_4', name: 'ค่าน้ำ/ไฟ', icon: 'Zap', type: TransactionType.EXPENSE, color: '#a78bfa' },
  { id: 'exp_5', name: 'สุขภาพ', icon: 'HeartPulse', type: TransactionType.EXPENSE, color: '#f472b6' },
  { id: 'exp_6', name: 'สังสรรค์', icon: 'Coffee', type: TransactionType.EXPENSE, color: '#fb923c' },
  { id: 'exp_savings', name: 'เงินออม', icon: 'PiggyBank', type: TransactionType.EXPENSE, color: '#0ea5e9' },
  { id: 'exp_debt', name: 'ชำระหนี้', icon: 'CreditCard', type: TransactionType.EXPENSE, color: '#f43f5e' },
];

export const formatCurrency = (amount: number, currency?: Currency): string => {
  if (!currency) return `₭ ${amount.toLocaleString('en-US')}`;
  return `${currency.symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const ACCOUNT_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

export const AVAILABLE_ICONS = [
  'Wallet', 'Briefcase', 'PiggyBank', 'ShoppingCart', 'Utensils', 
  'Zap', 'Car', 'HeartPulse', 'Coffee', 'Gift', 'Home', 'Plane', 
  'Smartphone', 'Gamepad', 'Music', 'Book', 'Wrench', 'CreditCard', 'Target'
];
