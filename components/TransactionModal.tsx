import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Account, Category, Currency, Frequency, Language } from '../types';
import { X, Check, Plus, Repeat, Calendar, ArrowRight, Search } from 'lucide-react';
import { LucideIcon, Wallet, Briefcase, PiggyBank, ShoppingCart, Utensils, Zap, Car, HeartPulse, Coffee, Gift, Home, Plane, Smartphone, Gamepad, Music, Book, Wrench } from 'lucide-react';
import { TRANSLATIONS } from '../translations';

const iconMap: Record<string, LucideIcon> = {
  Wallet, Briefcase, PiggyBank, ShoppingCart, Utensils, Zap, Car, HeartPulse, Coffee,
  Gift, Home, Plane, Smartphone, Gamepad, Music, Book, Wrench
};

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>, recurringFrequency?: Frequency) => void;
  accounts: Account[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  currencies: Currency[];
  onOpenAddCategory: (type: TransactionType) => void;
  initialData?: Transaction | null;
  language: Language;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accounts,
  incomeCategories,
  expenseCategories,
  currencies,
  onOpenAddCategory,
  initialData,
  language
}) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>(accounts[0]?.id || '');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>(Frequency.MONTHLY);

  // Get symbol of selected account
  const currentAccount = accounts.find(a => a.id === selectedAccount);
  const currentSymbol = currencies.find(c => c.code === currentAccount?.currencyCode)?.symbol || '₭';

  const t = (key: keyof typeof TRANSLATIONS['TH']) => TRANSLATIONS[language][key] || key;

  // Helper to get local YYYY-MM-DD
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setAmount(initialData.amount.toString());
        setType(initialData.type);
        setSelectedCategory(initialData.categoryId);
        setSelectedAccount(initialData.accountId);
        setDate(initialData.date);
        setNote(initialData.note || '');
        // Editing existing transactions generally doesn't set up new recurring rules by default
        setIsRecurring(false);
        setFrequency(Frequency.MONTHLY);
      } else {
        // Reset fields for new transaction
        setAmount('');
        setNote('');
        // Use local date string instead of ISO (UTC) to ensure correct "today"
        setDate(getLocalDateString());
        setIsRecurring(false);
        setFrequency(Frequency.MONTHLY);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const categories = type === TransactionType.INCOME ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedCategory || !selectedAccount) return;

    // Validation
    const numericAmount = Number(amount);
    if (numericAmount <= 0) {
      return; // Prevent negative or zero amounts
    }

    onSave({
      accountId: selectedAccount,
      type,
      amount: numericAmount,
      categoryId: selectedCategory,
      date,
      note,
    }, isRecurring ? frequency : undefined);

    if (!initialData) {
      setAmount('');
      setNote('');
    }
    onClose();
  };

  const handleAddCategoryClick = () => {
    onOpenAddCategory(type);
  };

  const getNextDueDate = () => {
    if (!date) return '';
    // Ensure date parsing doesn't shift due to timezone when displaying
    const [y, m, d] = date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    if (frequency === Frequency.DAILY) dateObj.setDate(dateObj.getDate() + 1);
    if (frequency === Frequency.WEEKLY) dateObj.setDate(dateObj.getDate() + 7);
    if (frequency === Frequency.MONTHLY) dateObj.setMonth(dateObj.getMonth() + 1);
    if (frequency === Frequency.YEARLY) dateObj.setFullYear(dateObj.getFullYear() + 1);

    return dateObj.toLocaleDateString(language === 'TH' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md h-[90vh] sm:h-auto overflow-y-auto shadow-2xl animate-slide-up flex flex-col">

        <div className="p-6 pb-2 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">{initialData ? t('editTransaction') : t('recordTransaction')}</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6 flex-1">

          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button
              type="button"
              onClick={() => { setType(TransactionType.EXPENSE); setSelectedCategory(''); }}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${type === TransactionType.EXPENSE ? 'bg-red-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {t('expense')}
            </button>
            <button
              type="button"
              onClick={() => { setType(TransactionType.INCOME); setSelectedCategory(''); }}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${type === TransactionType.INCOME ? 'bg-green-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {t('income')}
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('amount')} ({currentSymbol})</label>
            <div className="relative">
              <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-bold ${type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                }`}>{currentSymbol}</span>
              <input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                required
                value={amount}
                onKeyDown={(e) => {
                  if (['-', '+', 'e', 'E'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) >= 0) {
                    setAmount(val);
                  }
                }}
                className={`w-full text-4xl font-bold bg-transparent border-b-2 focus:outline-none placeholder-slate-300 pl-10 ${type === TransactionType.INCOME ? 'text-green-600 border-green-200 focus:border-green-500' : 'text-red-600 border-red-200 focus:border-red-500'
                  }`}
                placeholder="0"
                autoFocus
              />
            </div>
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('accounts')}</label>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {accounts.map((acc) => {
                const accCurrency = currencies.find(c => c.code === acc.currencyCode);
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccount(acc.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl border transition-all flex flex-col items-start ${selectedAccount === acc.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-600'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    <span>{acc.name}</span>
                    <span className="text-[10px] opacity-70">{accCurrency?.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categories Grid */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{t('category')}</label>
              {/* Search Input */}
              <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('search')}
                  className="pl-7 pr-3 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-32 transition-all focus:w-40"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              <button
                type="button"
                onClick={handleAddCategoryClick}
                className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
              >
                <Plus size={20} />
                <span className="text-[10px] font-bold mt-1">Add</span>
              </button>

              {categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((cat) => {
                const Icon = iconMap[cat.icon] || Wallet;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all relative ${isSelected
                        ? 'bg-slate-800 text-white shadow-lg scale-105 z-10'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                  >
                    <div className={`${isSelected ? 'text-white' : ''} ${!isSelected ? '' : ''}`}>
                      <Icon size={24} color={isSelected ? 'white' : cat.color} />
                    </div>
                    <span className="text-[10px] font-bold mt-1 truncate w-full px-1">{cat.name}</span>
                    {isSelected && <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full"></div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('date')}</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-700"
              />
            </div>
            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('note')}</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-700"
                placeholder=""
              />
            </div>
          </div>

          {/* Recurring Option */}
          {!initialData && (
            <div className={`rounded-xl border transition-all duration-300 ${isRecurring ? 'bg-indigo-50 border-indigo-200 p-4' : 'bg-white border-slate-100 p-0'}`}>
              <div className={`flex items-center justify-between ${isRecurring ? 'mb-3' : 'p-3 bg-slate-50 rounded-xl'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isRecurring ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                    <Repeat size={18} />
                  </div>
                  <div>
                    <span className={`block font-bold text-sm ${isRecurring ? 'text-indigo-900' : 'text-slate-600'}`}>
                      {t('recurring')}
                    </span>
                    {!isRecurring && <span className="text-[10px] text-slate-400">Recurring bills (e.g. Rent, Netflix)</span>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isRecurring ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
              </div>

              {isRecurring && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Frequency</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {[Frequency.MONTHLY, Frequency.YEARLY, Frequency.WEEKLY, Frequency.DAILY].map(freq => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setFrequency(freq)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${frequency === freq
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-white text-slate-600 border-indigo-100 hover:bg-indigo-50'
                          }`}
                      >
                        {freq === Frequency.DAILY && t('everyDay')}
                        {freq === Frequency.WEEKLY && t('everyWeek')}
                        {freq === Frequency.MONTHLY && t('everyMonth')}
                        {freq === Frequency.YEARLY && t('everyYear')}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex items-start gap-2 text-indigo-600 bg-white/50 p-2 rounded-lg border border-indigo-100">
                    <Calendar size={14} className="mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <span className="opacity-70">Next auto-record:</span>
                      <div className="font-bold flex items-center gap-1 mt-0.5">
                        {getNextDueDate()} <ArrowRight size={10} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition-transform active:scale-95"
          >
            <div className="flex items-center justify-center gap-2">
              <Check size={20} />
              <span>{t('saveTransaction')}</span>
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;