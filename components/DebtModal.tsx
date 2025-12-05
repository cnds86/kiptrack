
import React, { useState, useEffect } from 'react';
import { Debt, Currency, Language } from '../types';
import { ACCOUNT_COLORS, AVAILABLE_ICONS } from '../constants';
import { X, CreditCard, Calendar } from 'lucide-react';
import { LucideIcon, Wallet, Briefcase, PiggyBank, ShoppingCart, Utensils, Zap, Car, HeartPulse, Coffee, Gift, Home, Plane, Smartphone, Gamepad, Music, Book, Wrench, Target } from 'lucide-react';
import { TRANSLATIONS } from '../translations';

const iconMap: Record<string, LucideIcon> = {
  Wallet, Briefcase, PiggyBank, ShoppingCart, Utensils, Zap, Car, HeartPulse, Coffee,
  Gift, Home, Plane, Smartphone, Gamepad, Music, Book, Wrench, CreditCard, Target
};

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: Omit<Debt, 'id' | 'remainingAmount' | 'status'>) => void;
  currencies: Currency[];
  language: Language;
}

const DebtModal: React.FC<DebtModalProps> = ({ isOpen, onClose, onSave, currencies, language }) => {
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[16]); // Default to Red-ish
  const [selectedIcon, setSelectedIcon] = useState('CreditCard');

  const t = (key: keyof typeof TRANSLATIONS['TH']) => TRANSLATIONS[language][key] || key;

  useEffect(() => {
    if (isOpen && currencies.length > 0) {
        const defaultCurr = currencies.find(c => c.isBase) || currencies[0];
        setCurrencyCode(defaultCurr.code);
    }
  }, [isOpen, currencies]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    if (Number(totalAmount) <= 0) return;

    // Convert amount to Base Currency
    const selectedCurrency = currencies.find(c => c.code === currencyCode);
    const rate = selectedCurrency ? selectedCurrency.rate : 1;
    const finalAmount = Number(totalAmount) * rate;

    onSave({
      name: name.trim(),
      totalAmount: finalAmount,
      dueDate: dueDate || undefined,
      color: selectedColor,
      icon: selectedIcon,
    });
    
    // Reset
    setName('');
    setTotalAmount('');
    setDueDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-xl animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-slate-800">{t('createDebt')}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{t('debtName')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              placeholder={language === 'EN' ? "e.g. Credit Card, Car Loan" : "เช่น บัตรเครดิต, ผ่อนรถ"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{t('totalDebt')}</label>
            <div className="flex gap-2">
                <input
                type="number"
                required
                min="0.01"
                step="any"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-xl font-bold text-red-600"
                placeholder="0"
                />
                <select
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="w-28 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-700"
                >
                    {currencies.map(c => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                </select>
            </div>
            {currencyCode && (
                 <p className="text-[10px] text-slate-400 mt-1 text-right">
                    {currencies.find(c => c.code === currencyCode)?.name}
                 </p>
            )}
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-600 mb-1">{t('dueDate')}</label>
             <div className="relative">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                 <input
                   type="date"
                   value={dueDate}
                   onChange={(e) => setDueDate(e.target.value)}
                   className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                 />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">{t('category')}</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
               {['CreditCard', ...AVAILABLE_ICONS].map((iconName) => {
                 const Icon = iconName === 'CreditCard' ? CreditCard : (iconMap[iconName] || CreditCard);
                 return (
                   <button
                     key={iconName}
                     type="button"
                     onClick={() => setSelectedIcon(iconName)}
                     className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                       selectedIcon === iconName 
                         ? 'bg-slate-800 text-white shadow-md' 
                         : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                     }`}
                   >
                     <Icon size={20} />
                   </button>
                 );
               })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">{t('color')}</label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full ${color} ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || Number(totalAmount) <= 0}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-red-700 transition-transform active:scale-95 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('createDebt')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DebtModal;
