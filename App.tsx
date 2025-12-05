
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Wallet, PieChart, Sparkles, Plus, TrendingUp, TrendingDown, Trash2, Landmark, AlertTriangle, Settings, ArrowRight, Pencil, CalendarClock, Bell, Target, Filter, ArrowLeft, Search, Coins, CreditCard, LogOut, History, Menu, X, ChevronRight, Home as HomeIcon, Briefcase, PiggyBank, ShoppingCart, Utensils, Zap, Car, HeartPulse, Coffee, Gift, Home, Plane, Smartphone, Gamepad, Music, Book, Wrench, LucideIcon } from 'lucide-react';
import { Account, Transaction, ViewState, AccountType, TransactionType, Category, Currency, Frequency, RecurringTransaction, Notification, SavingsGoal, Language } from './types';
import { DEFAULT_ACCOUNTS, DEFAULT_CURRENCIES, formatCurrency, EXPENSE_CATEGORIES, INCOME_CATEGORIES, ACCOUNT_COLORS, AVAILABLE_ICONS } from './constants';
import { TRANSLATIONS } from './translations';
import AccountModal from './components/AccountModal';
import TransactionModal from './components/TransactionModal';
import CategoryModal from './components/CategoryModal';
import MagicModal from './components/MagicModal';
import SettingsModal from './components/SettingsModal';
import ConfirmModal from './components/ConfirmModal';
import RecurringListModal from './components/RecurringListModal';
import NotificationModal from './components/NotificationModal';
import GoalModal from './components/GoalModal';
import DepositGoalModal from './components/DepositGoalModal';

// Services
import { getFinancialAdvice } from './services/geminiService';
import {
  subscribeToUserData,
  saveUserDataToCloud,
  AppData
} from './services/firebase';

// Charts
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Icon Map
const iconMap: Record<string, LucideIcon> = {
  Wallet, Briefcase, PiggyBank, ShoppingCart, Utensils, Zap, Car, HeartPulse, Coffee,
  Gift, Home, Plane, Smartphone, Gamepad, Music, Book, Wrench, CreditCard, Target, Landmark, Coins
};

const App: React.FC = () => {
  // --- State Management ---
  const [language, setLanguage] = useState<Language>('TH');
  const t = (key: keyof typeof TRANSLATIONS['TH']) => TRANSLATIONS[language][key] || key;

  // Data State
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>(INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>(EXPENSE_CATEGORIES);
  const [currencies, setCurrencies] = useState<Currency[]>(DEFAULT_CURRENCIES);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // UI State
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Modals State
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Selection State for Modals
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [categoryTypeToAdd, setCategoryTypeToAdd] = useState<TransactionType>(TransactionType.EXPENSE);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState<'TRANSACTION' | 'ACCOUNT' | 'GOAL' | 'RECURRING'>('TRANSACTION');

  // Firebase State - Using fixed user ID (no login required)
  const FIXED_USER_ID = 'default_user';
  const [isCloudSyncing, setIsCloudSyncing] = useState(true); // Start syncing immediately

  // Refs for debounced cloud saving
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const hasLoadedFromCloudRef = useRef(false); // Prevent saving before initial load completes

  // --- Initialization & Persistence ---

  // 1. Cloud Data Listener (Always active - no login required)
  useEffect(() => {
    console.log('🚀 Starting Cloud Sync with fixed user ID:', FIXED_USER_ID);
    const unsubscribe = subscribeToUserData(FIXED_USER_ID, (data) => {
      // Skip updates triggered by our own save to prevent overwriting local state
      if (isSavingRef.current) {
        console.log('⏭️ Skipping listener update (saving in progress)');
        return;
      }

      if (data) {
        console.log('📥 Loaded data from cloud:', { transactionsCount: data.transactions?.length });
        setAccounts(data.accounts || DEFAULT_ACCOUNTS);
        setTransactions(data.transactions || []);
        setIncomeCategories(data.incomeCategories || INCOME_CATEGORIES);
        setExpenseCategories(data.expenseCategories || EXPENSE_CATEGORIES);
        setCurrencies(data.currencies || DEFAULT_CURRENCIES);
        setGoals(data.goals || []);
        setRecurringTransactions(data.recurringTransactions || []);
        setNotifications(data.notifications || []);
      } else {
        console.log('📥 No existing cloud data, using defaults');
      }
      hasLoadedFromCloudRef.current = true; // Mark as loaded, now safe to save
      setIsCloudSyncing(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. LocalStorage Saver (Backup only)
  useEffect(() => {
    const data: AppData = {
      accounts,
      transactions,
      incomeCategories,
      expenseCategories,
      currencies,
      goals,
      recurringTransactions,
      notifications
    };
    localStorage.setItem('kiptrack_data', JSON.stringify(data));
    localStorage.setItem('kiptrack_lang', language);
  }, [accounts, transactions, incomeCategories, expenseCategories, currencies, goals, recurringTransactions, notifications, language]);

  // 4. LocalStorage Loader Helper (Fallback)
  const loadFromLocalStorage = () => {
    const savedData = localStorage.getItem('kiptrack_data');
    const savedLang = localStorage.getItem('kiptrack_lang');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setAccounts(parsed.accounts || DEFAULT_ACCOUNTS);
        setTransactions(parsed.transactions || []);
        setIncomeCategories(parsed.incomeCategories || INCOME_CATEGORIES);
        setExpenseCategories(parsed.expenseCategories || EXPENSE_CATEGORIES);
        setCurrencies(parsed.currencies || DEFAULT_CURRENCIES);
        setGoals(parsed.goals || []);
        setRecurringTransactions(parsed.recurringTransactions || []);
        setNotifications(parsed.notifications || []);
      } catch (e) {
        console.error("Error loading local data", e);
      }
    }
    if (savedLang) setLanguage(savedLang as Language);
  };

  // 5. Cloud Saver (Debounced - Always active)
  useEffect(() => {
    // Don't save until we've loaded initial data from cloud
    if (!hasLoadedFromCloudRef.current) {
      console.log('⏳ Waiting for initial cloud load before saving...');
      return;
    }

    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce: wait 1000ms after last change before saving
    saveTimeoutRef.current = setTimeout(() => {
      isSavingRef.current = true;
      console.log('💾 Saving to cloud...');

      const data: AppData = {
        accounts,
        transactions,
        incomeCategories,
        expenseCategories,
        currencies,
        goals,
        recurringTransactions,
        notifications
      };
      saveUserDataToCloud(FIXED_USER_ID, data);

      // Reset the flag after a short delay to allow Firestore listener to settle
      setTimeout(() => {
        isSavingRef.current = false;
      }, 500);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [accounts, transactions, incomeCategories, expenseCategories, currencies, goals, recurringTransactions, notifications]);


  // --- Business Logic ---

  const baseCurrency = currencies.find(c => c.isBase) || currencies[0];

  // Process Recurring Transactions
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let newTransactions: Transaction[] = [];
    let updatedRecurring: RecurringTransaction[] = [];
    let hasChanges = false;

    recurringTransactions.forEach(rec => {
      if (rec.nextDueDate <= today) {
        hasChanges = true;
        // Create transaction
        const newTrans: Transaction = {
          id: Date.now().toString() + Math.random(),
          accountId: rec.accountId,
          type: rec.type,
          amount: rec.amount,
          categoryId: rec.categoryId,
          date: rec.nextDueDate,
          note: `Recurring: ${rec.note || ''}`
        };
        newTransactions.push(newTrans);

        // Calculate next date
        const nextDate = new Date(rec.nextDueDate);
        if (rec.frequency === Frequency.DAILY) nextDate.setDate(nextDate.getDate() + 1);
        if (rec.frequency === Frequency.WEEKLY) nextDate.setDate(nextDate.getDate() + 7);
        if (rec.frequency === Frequency.MONTHLY) nextDate.setMonth(nextDate.getMonth() + 1);
        if (rec.frequency === Frequency.YEARLY) nextDate.setFullYear(nextDate.getFullYear() + 1);

        updatedRecurring.push({
          ...rec,
          nextDueDate: nextDate.toISOString().split('T')[0]
        });

        setNotifications(prev => [{
          id: Date.now().toString(),
          type: 'UPCOMING_RECURRING',
          title: 'รายการอัตโนมัติ',
          message: `บันทึกรายการ ${rec.note || 'Recurring'} เรียบร้อยแล้ว`,
          date: new Date().toISOString(),
          severity: 'INFO'
        }, ...prev]);
      } else {
        updatedRecurring.push(rec);
      }
    });

    if (hasChanges) {
      setTransactions(prev => [...newTransactions, ...prev]);
      setRecurringTransactions(updatedRecurring);

      const accountUpdates = new Map<string, number>();
      newTransactions.forEach(t => {
        const current = accountUpdates.get(t.accountId) || 0;
        accountUpdates.set(t.accountId, current + (t.type === TransactionType.INCOME ? t.amount : -t.amount));
      });

      setAccounts(prev => prev.map(acc => {
        const change = accountUpdates.get(acc.id);
        return change ? { ...acc, balance: acc.balance + change } : acc;
      }));
    }
  }, [recurringTransactions]);

  // Check Low Balance
  useEffect(() => {
    accounts.forEach(acc => {
      if (acc.lowBalanceThreshold && acc.balance <= acc.lowBalanceThreshold) {
        const hasRecent = notifications.some(n =>
          n.type === 'LOW_BALANCE' &&
          n.message.includes(acc.name) &&
          new Date(n.date).getTime() > Date.now() - 86400000
        );

        if (!hasRecent) {
          setNotifications(prev => [{
            id: Date.now().toString(),
            type: 'LOW_BALANCE',
            title: t('lowBalance'),
            message: `${acc.name}: ${formatCurrency(acc.balance, currencies.find(c => c.code === acc.currencyCode))}`,
            date: new Date().toISOString(),
            severity: 'WARNING'
          }, ...prev]);
        }
      }
    });
  }, [accounts]);

  // CRUD Handlers
  const handleSaveTransaction = (data: Omit<Transaction, 'id'>, recurringFreq?: Frequency) => {
    if (editingTransaction) {
      // Edit existing
      const oldTrans = editingTransaction;
      const amountDiff = (data.type === TransactionType.INCOME ? data.amount : -data.amount) -
        (oldTrans.type === TransactionType.INCOME ? oldTrans.amount : -oldTrans.amount);

      if (oldTrans.accountId !== data.accountId) {
        setAccounts(prev => prev.map(acc => {
          if (acc.id === oldTrans.accountId) return { ...acc, balance: acc.balance - (oldTrans.type === TransactionType.INCOME ? oldTrans.amount : -oldTrans.amount) };
          if (acc.id === data.accountId) return { ...acc, balance: acc.balance + (data.type === TransactionType.INCOME ? data.amount : -data.amount) };
          return acc;
        }));
      } else {
        setAccounts(prev => prev.map(acc =>
          acc.id === data.accountId ? { ...acc, balance: acc.balance + amountDiff } : acc
        ));
      }

      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...data, id: t.id } : t));
      setEditingTransaction(null);
    } else {
      // Create New
      const newId = Date.now().toString();
      const newTrans: Transaction = { ...data, id: newId };
      setTransactions(prev => [newTrans, ...prev]);

      setAccounts(prev => prev.map(acc =>
        acc.id === data.accountId
          ? { ...acc, balance: acc.balance + (data.type === TransactionType.INCOME ? data.amount : -data.amount) }
          : acc
      ));

      if (recurringFreq) {
        const nextDate = new Date(data.date);
        if (recurringFreq === Frequency.DAILY) nextDate.setDate(nextDate.getDate() + 1);
        if (recurringFreq === Frequency.WEEKLY) nextDate.setDate(nextDate.getDate() + 7);
        if (recurringFreq === Frequency.MONTHLY) nextDate.setMonth(nextDate.getMonth() + 1);
        if (recurringFreq === Frequency.YEARLY) nextDate.setFullYear(nextDate.getFullYear() + 1);

        setRecurringTransactions(prev => [...prev, {
          id: Date.now().toString(),
          accountId: data.accountId,
          categoryId: data.categoryId,
          type: data.type,
          amount: data.amount,
          note: data.note,
          frequency: recurringFreq,
          nextDueDate: nextDate.toISOString().split('T')[0]
        }]);
      }
    }
  };

  const handleDelete = () => {
    if (!confirmDeleteId) return;

    if (confirmDeleteType === 'TRANSACTION') {
      const trans = transactions.find(t => t.id === confirmDeleteId);
      if (trans) {
        setAccounts(prev => prev.map(acc =>
          acc.id === trans.accountId
            ? { ...acc, balance: acc.balance - (trans.type === TransactionType.INCOME ? trans.amount : -trans.amount) }
            : acc
        ));
        setTransactions(prev => prev.filter(t => t.id !== confirmDeleteId));
      }
    } else if (confirmDeleteType === 'ACCOUNT') {
      setAccounts(prev => prev.filter(a => a.id !== confirmDeleteId));
      // Optionally remove transactions linked to this account
    } else if (confirmDeleteType === 'GOAL') {
      setGoals(prev => prev.filter(g => g.id !== confirmDeleteId));
    } else if (confirmDeleteType === 'RECURRING') {
      setRecurringTransactions(prev => prev.filter(r => r.id !== confirmDeleteId));
    }
    setConfirmDeleteId(null);
  };

  const handleSaveAccount = (data: Omit<Account, 'id'>) => {
    if (editingAccount) {
      setAccounts(prev => prev.map(a => a.id === editingAccount.id ? { ...data, id: a.id } : a));
      setEditingAccount(null);
    } else {
      const newAccountId = `acc_${Date.now()}`;
      setAccounts(prev => [...prev, { ...data, id: newAccountId }]);

      // Auto-create Goal for Debt
      if (data.type === AccountType.CREDIT || data.type === AccountType.LOAN) {
        const goalAmount = Math.abs(data.balance);
        const accCurrency = currencies.find(c => c.code === data.currencyCode);
        const rate = accCurrency ? accCurrency.rate : 1;
        const targetInBase = goalAmount * rate;

        const newGoal: SavingsGoal = {
          id: `goal_debt_${Date.now()}`,
          name: `${t('payDebt')}: ${data.name}`,
          targetAmount: targetInBase,
          currentAmount: 0,
          icon: 'CreditCard',
          color: data.color,
          status: 'ACTIVE',
          linkedAccountId: newAccountId
        };
        setGoals(prev => [...prev, newGoal]);
      }
    }
  };

  const handleSaveGoal = (data: Omit<SavingsGoal, 'id' | 'currentAmount' | 'status'>) => {
    setGoals(prev => [...prev, { ...data, id: `goal_${Date.now()}`, currentAmount: 0, status: 'ACTIVE' }]);
  };

  const handleDepositGoal = (goalId: string, accountId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId);
    const sourceAcc = accounts.find(a => a.id === accountId);

    if (!goal || !sourceAcc) return;

    // 1. Deduct from Source
    const sourceTrans: Transaction = {
      id: `dep_${Date.now()}`,
      accountId: sourceAcc.id,
      type: TransactionType.EXPENSE,
      amount: amount,
      categoryId: 'exp_savings',
      date: new Date().toISOString().split('T')[0],
      note: `${t('depositToGoal')}: ${goal.name}`,
      linkedGoalId: goal.id
    };

    setAccounts(prev => prev.map(acc =>
      acc.id === sourceAcc.id ? { ...acc, balance: acc.balance - amount } : acc
    ));
    setTransactions(prev => [sourceTrans, ...prev]);

    // 2. Add to Goal / Pay Debt
    const sourceCurrency = currencies.find(c => c.code === sourceAcc.currencyCode);
    const rate = sourceCurrency ? sourceCurrency.rate : 1;
    const amountInBase = amount * rate;

    if (goal.linkedAccountId) {
      // Debt Repayment
      const debtAcc = accounts.find(a => a.id === goal.linkedAccountId);
      if (debtAcc) {
        const debtCurrency = currencies.find(c => c.code === debtAcc.currencyCode);
        const debtRate = debtCurrency ? debtCurrency.rate : 1;
        const amountInDebtCurr = amountInBase / debtRate;

        setAccounts(prev => prev.map(acc =>
          acc.id === debtAcc.id ? { ...acc, balance: acc.balance + amountInDebtCurr } : acc
        ));

        const debtTrans: Transaction = {
          id: `repay_${Date.now()}`,
          accountId: debtAcc.id,
          type: TransactionType.INCOME, // Paying debt increases balance from negative towards zero
          amount: amountInDebtCurr,
          categoryId: 'inc_3',
          date: new Date().toISOString().split('T')[0],
          note: `${t('payDebt')} (${sourceAcc.name})`
        };
        setTransactions(prev => [debtTrans, ...prev]);

        // Update Goal progress visually (though debts are tracked by account balance)
        setGoals(prev => prev.map(g =>
          g.id === goalId ? { ...g, currentAmount: g.currentAmount + amountInBase } : g
        ));
      }
    } else {
      // Regular Goal
      setGoals(prev => prev.map(g =>
        g.id === goalId ? {
          ...g,
          currentAmount: g.currentAmount + amountInBase,
          status: (g.currentAmount + amountInBase >= g.targetAmount) ? 'COMPLETED' : 'ACTIVE'
        } : g
      ));
    }

    if (goal.currentAmount + amountInBase >= goal.targetAmount) {
      setNotifications(prev => [{
        id: Date.now().toString(),
        type: 'GOAL_REACHED',
        title: t('goalReached'),
        message: goal.name,
        date: new Date().toISOString(),
        severity: 'SUCCESS'
      }, ...prev]);
    }
  };

  const handleAskAI = async () => {
    setIsLoadingAi(true);
    const advice = await getFinancialAdvice(transactions, accounts, [...incomeCategories, ...expenseCategories], currencies, language);
    setAiAdvice(advice);
    setIsLoadingAi(false);
  };

  const exportData = () => {
    const data = { accounts, transactions, incomeCategories, expenseCategories, currencies, goals, recurringTransactions };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiptrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.accounts) setAccounts(data.accounts);
        if (data.transactions) setTransactions(data.transactions);
        if (data.incomeCategories) setIncomeCategories(data.incomeCategories);
        if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
        if (data.currencies) setCurrencies(data.currencies);
        if (data.goals) setGoals(data.goals);
        if (data.recurringTransactions) setRecurringTransactions(data.recurringTransactions);
        alert('Import successful!');
      } catch (err) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  // --- Render Helpers ---

  const calculateNetWorth = () => {
    return accounts.reduce((sum, acc) => {
      const currency = currencies.find(c => c.code === acc.currencyCode);
      const rate = currency ? currency.rate : 1;
      return sum + (acc.balance * rate);
    }, 0);
  };

  const getCategory = (id: string) => [...incomeCategories, ...expenseCategories].find(c => c.id === id);
  const getAccount = (id: string) => accounts.find(a => a.id === id);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => ({
      date,
      items: groups[date]
    }));
  }, [transactions]);


  // --- MAIN UI RENDER ---

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 md:pb-0 md:pl-64 lang-${language.toLowerCase()}`}>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white h-screen fixed left-0 top-0 border-r border-slate-200 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
            <Wallet size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">KipTrack</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'DASHBOARD', icon: LayoutDashboard, label: t('dashboard') },
            { id: 'ACCOUNTS', icon: Wallet, label: t('accounts') },
            { id: 'STATS', icon: PieChart, label: t('stats') },
            { id: 'GOALS', icon: Target, label: t('goals') },
            { id: 'HISTORY', icon: History, label: t('history') },
            { id: 'AI_INSIGHT', icon: Sparkles, label: t('aiAdvisor') },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${currentView === item.id
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Settings size={20} />
            {t('settings')}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-20 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Wallet size={18} />
          </div>
          <span className="font-bold text-lg text-slate-800">KipTrack</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsNotificationModalOpen(true)} className="p-2 text-slate-600 relative">
            <Bell size={24} />
            {notifications.length > 0 && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></div>}
          </button>
          <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 text-slate-600">
            <Settings size={24} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-6xl mx-auto">

        {/* DASHBOARD VIEW */}
        {currentView === 'DASHBOARD' && (
          <div className="space-y-6 animate-fade-in">
            {/* Net Worth Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="relative z-10">
                <p className="text-slate-400 font-medium mb-1">{t('totalNetWorth')}</p>
                <h2 className="text-4xl font-bold mb-6 tracking-tight">
                  {formatCurrency(calculateNetWorth(), baseCurrency)}
                </h2>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsTransModalOpen(true)}
                    className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                  >
                    <Plus size={20} /> {t('recordTransaction')}
                  </button>
                  <button
                    onClick={() => setIsMagicModalOpen(true)}
                    className="bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-400 transition-colors"
                  >
                    <Sparkles size={20} /> {t('magic')}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-2 text-green-600">
                  <div className="p-1.5 bg-green-100 rounded-lg"><TrendingUp size={16} /></div>
                  <span className="text-sm font-bold">{t('income')} ({t('month')})</span>
                </div>
                <p className="text-xl font-bold text-slate-800">
                  {formatCurrency(transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0), undefined)}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-2 text-red-500">
                  <div className="p-1.5 bg-red-100 rounded-lg"><TrendingDown size={16} /></div>
                  <span className="text-sm font-bold">{t('expense')} ({t('month')})</span>
                </div>
                <p className="text-xl font-bold text-slate-800">
                  {formatCurrency(transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0), undefined)}
                </p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-bold text-slate-800">{t('recentTransactions')}</h3>
                <button onClick={() => setCurrentView('HISTORY')} className="text-indigo-600 text-sm font-bold hover:underline">{t('seeAll')}</button>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 5).map(trans => {
                  const category = getCategory(trans.categoryId);
                  const account = getAccount(trans.accountId);
                  const accCurrency = currencies.find(c => c.code === account?.currencyCode);
                  const Icon = category ? iconMap[category.icon] : Wallet;

                  return (
                    <div key={trans.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${category?.color || 'bg-slate-400'}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{category?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{account?.name} • {new Date(trans.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`font-bold ${trans.type === TransactionType.INCOME ? 'text-green-600' : 'text-slate-800'}`}>
                        {trans.type === TransactionType.INCOME ? '+' : '-'}
                        {formatCurrency(trans.amount, accCurrency)}
                      </span>
                    </div>
                  );
                })}
                {transactions.length === 0 && (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 mb-3">{t('noTransactions')}</p>
                    <button onClick={() => setIsTransModalOpen(true)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-sm">
                      {t('startTracking')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNTS VIEW */}
        {currentView === 'ACCOUNTS' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">{t('accounts')}</h2>
              <button
                onClick={() => { setEditingAccount(null); setIsAccountModalOpen(true); }}
                className="p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-transform active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map(acc => {
                const currency = currencies.find(c => c.code === acc.currencyCode);
                const isDebt = acc.type === AccountType.CREDIT || acc.type === AccountType.LOAN;
                return (
                  <div key={acc.id} onClick={() => { setEditingAccount(acc); setIsAccountModalOpen(true); }} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden cursor-pointer group hover:border-indigo-200 transition-colors">
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-6 -mt-6 opacity-20 ${acc.color.replace('bg-', 'bg-')}`}></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${acc.color}`}>
                          {acc.type === AccountType.BANK ? <Landmark size={20} /> :
                            acc.type === AccountType.CREDIT ? <CreditCard size={20} /> :
                              acc.type === AccountType.LOAN ? <Coins size={20} /> : <Wallet size={20} />}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{acc.name}</h3>
                          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{acc.type}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteType('ACCOUNT'); setConfirmDeleteId(acc.id); }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <p className={`text-2xl font-bold ${isDebt ? 'text-red-600' : 'text-slate-800'}`}>
                        {formatCurrency(acc.balance, currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GOALS VIEW */}
        {currentView === 'GOALS' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">{t('goals')}</h2>
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-transform active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map(goal => {
                const Icon = iconMap[goal.icon] || Target;
                const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                const isDebtGoal = !!goal.linkedAccountId;

                return (
                  <div key={goal.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${goal.color}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{goal.name}</h3>
                          <p className="text-xs text-slate-500">{isDebtGoal ? t('debtPaid') : t('goalProgress')}: {progress.toFixed(0)}%</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setConfirmDeleteType('GOAL'); setConfirmDeleteId(goal.id); }}
                        className="text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold text-indigo-600">{formatCurrency(goal.currentAmount, baseCurrency)}</span>
                        <span className="text-slate-400">{formatCurrency(goal.targetAmount, baseCurrency)}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${isDebtGoal ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>

                    <button
                      onClick={() => { setSelectedGoal(goal); setIsDepositModalOpen(true); }}
                      disabled={goal.currentAmount >= goal.targetAmount}
                      className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                      {goal.currentAmount >= goal.targetAmount ? t('goalReached') : t('deposit')}
                    </button>
                  </div>
                );
              })}
              {goals.length === 0 && (
                <div className="col-span-full text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                  <Target size={48} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 mb-3">{t('noData')}</p>
                  <button onClick={() => setIsGoalModalOpen(true)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-sm">
                    {t('createGoal')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STATS VIEW - Simplified */}
        {currentView === 'STATS' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800">{t('stats')}</h2>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-700 mb-4">{t('expense')} ({t('category')})</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseCategories.map(cat => ({
                    name: cat.name,
                    amount: transactions.filter(t => t.type === TransactionType.EXPENSE && t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0)
                  })).filter(d => d.amount > 0)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY VIEW */}
        {currentView === 'HISTORY' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">{t('history')}</h2>
              <button onClick={() => setIsRecurringModalOpen(true)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                <CalendarClock size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {groupedTransactions.map(group => (
                <div key={group.date}>
                  <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    {new Date(group.date).toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </h3>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {group.items.map((trans, idx) => {
                      const category = getCategory(trans.categoryId);
                      const account = getAccount(trans.accountId);
                      const accCurrency = currencies.find(c => c.code === account?.currencyCode);
                      const Icon = category ? iconMap[category.icon] : Wallet;

                      return (
                        <div key={trans.id} onClick={() => { setEditingTransaction(trans); setIsTransModalOpen(true); }} className={`p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer ${idx !== group.items.length - 1 ? 'border-b border-slate-50' : ''}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${category?.color || 'bg-slate-400'}`}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{category?.name}</p>
                              <p className="text-xs text-slate-400">{trans.note || account?.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`block font-bold ${trans.type === TransactionType.INCOME ? 'text-green-600' : 'text-slate-800'}`}>
                              {trans.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(trans.amount, accCurrency)}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteType('TRANSACTION'); setConfirmDeleteId(trans.id); }}
                              className="text-xs text-red-300 hover:text-red-500"
                            >
                              {t('delete')}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI ADVISOR VIEW */}
        {currentView === 'AI_INSIGHT' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800">{t('aiAdvisor')}</h2>
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white relative overflow-hidden">
              <Sparkles className="absolute top-4 right-4 text-white/20 w-32 h-32" />
              <p className="text-indigo-100 mb-4 max-w-md">{t('aiAdvisorDesc')}</p>
              <button
                onClick={handleAskAI}
                disabled={isLoadingAi}
                className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-50 transition-colors disabled:opacity-70"
              >
                {isLoadingAi ? t('analyzing') : t('askAi')}
              </button>
            </div>

            {aiAdvice && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-slide-up">
                <div className="prose prose-slate max-w-none text-sm">
                  <div dangerouslySetInnerHTML={{ __html: aiAdvice.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 z-30 safe-area-pb">
        <div className="flex justify-around items-center">
          <button onClick={() => setCurrentView('DASHBOARD')} className={`flex flex-col items-center p-2 rounded-xl ${currentView === 'DASHBOARD' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-bold mt-1">{t('dashboard')}</span>
          </button>
          <button onClick={() => setCurrentView('ACCOUNTS')} className={`flex flex-col items-center p-2 rounded-xl ${currentView === 'ACCOUNTS' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <Wallet size={24} />
            <span className="text-[10px] font-bold mt-1">{t('accounts')}</span>
          </button>

          {/* Floating FAB */}
          <div className="relative -top-6">
            <button onClick={() => setIsTransModalOpen(true)} className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg shadow-slate-400 hover:scale-105 transition-transform">
              <Plus size={28} />
            </button>
          </div>

          <button onClick={() => setCurrentView('GOALS')} className={`flex flex-col items-center p-2 rounded-xl ${currentView === 'GOALS' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <Target size={24} />
            <span className="text-[10px] font-bold mt-1">{t('goals')}</span>
          </button>
          <button onClick={() => setCurrentView('HISTORY')} className={`flex flex-col items-center p-2 rounded-xl ${currentView === 'HISTORY' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <History size={24} />
            <span className="text-[10px] font-bold mt-1">{t('history')}</span>
          </button>
        </div>
      </nav>

      {/* --- MODALS --- */}

      <TransactionModal
        isOpen={isTransModalOpen}
        onClose={() => { setIsTransModalOpen(false); setEditingTransaction(null); }}
        onSave={handleSaveTransaction}
        accounts={accounts}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        currencies={currencies}
        onOpenAddCategory={(type) => { setCategoryTypeToAdd(type); setIsCategoryModalOpen(true); }}
        initialData={editingTransaction}
        language={language}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => { setIsAccountModalOpen(false); setEditingAccount(null); }}
        onSave={handleSaveAccount}
        currencies={currencies}
        language={language}
        initialData={editingAccount}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
        currencies={currencies}
        language={language}
      />

      <DepositGoalModal
        isOpen={isDepositModalOpen}
        onClose={() => { setIsDepositModalOpen(false); setSelectedGoal(null); }}
        goal={selectedGoal}
        accounts={accounts}
        currencies={currencies}
        onDeposit={handleDepositGoal}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={(newCat) => {
          if (newCat.type === TransactionType.INCOME) {
            setIncomeCategories(prev => [...prev, { ...newCat, id: `cat_${Date.now()}` }]);
          } else {
            setExpenseCategories(prev => [...prev, { ...newCat, id: `cat_${Date.now()}` }]);
          }
        }}
        type={categoryTypeToAdd}
      />

      <MagicModal
        isOpen={isMagicModalOpen}
        onClose={() => setIsMagicModalOpen(false)}
        onSaveTransaction={handleSaveTransaction}
        onSaveGoal={handleSaveGoal}
        onDepositGoal={handleDepositGoal}
        accounts={accounts}
        categories={[...incomeCategories, ...expenseCategories]}
        currencies={currencies}
        goals={goals}
        language={language}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currencies={currencies}
        onUpdateCurrencies={setCurrencies}
        onExportData={exportData}
        onImportData={importData}
        language={language}
        onSetLanguage={setLanguage}
      />

      <RecurringListModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        recurringTransactions={recurringTransactions}
        onDelete={(id) => { setConfirmDeleteType('RECURRING'); setConfirmDeleteId(id); }}
        categories={[...incomeCategories, ...expenseCategories]}
        accounts={accounts}
        currencies={currencies}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title={t('confirmDelete')}
        message={t('confirmDeleteMsg')}
      />

    </div>
  );
};

export default App;
