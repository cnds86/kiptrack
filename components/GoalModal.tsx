
import React, { useState, useEffect } from 'react';
import { SavingsGoal, Currency, Language } from '../types';
import { ACCOUNT_COLORS, AVAILABLE_ICONS } from '../constants';
import { X, Target, Calendar } from 'lucide-react';
import { LucideIcon, Wallet, Briefcase, PiggyBank, ShoppingCart, Utensils, Zap, Car, HeartPulse, Coffee, Gift, Home, Plane, Smartphone, Gamepad, Music, Book, Wrench } from 'lucide-react';
import { TRANSLATIONS } from '../translations';

const iconMap: Record<string, LucideIcon> = {
  Wallet, Briefcase, PiggyBank, ShoppingCart, Utensils, Zap, Car, HeartPulse, Coffee,
  Gift, Home, Plane, Smartphone, Gamepad, Music, Book, Wrench
};

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'status'>) => void;
  currencies: Currency[];
  language: Language;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onSave, currencies, language }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('Target');

  const t = (key: keyof typeof TRANSLATIONS['TH']) => TRANSLATIONS[language][key] || key;

  // Set default currency when modal opens
  useEffect(() => {
    if (isOpen && currencies.length > 0) {
        // Default to base currency or first available
        const defaultCurr = currencies.find(c => c.isBase) || currencies[0];
        setCurrencyCode(defaultCurr.code);
    }
  }, [isOpen, currencies]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) return;
    if (Number(targetAmount) <= 0) return;

    // Convert amount to Base Currency before saving
    const selectedCurrency = currencies.find(c => c.code === currencyCode);
    const rate = selectedCurrency ? selectedCurrency.rate : 1;
    // Formula: Amount in Base = Amount in Selected * Rate
    const finalAmount = Number(targetAmount) * rate;

    onSave({
      name: name.trim(),
      targetAmount: finalAmount,
      deadline: deadline || undefined,
      color: selectedColor,
      icon: selectedIcon,
    });
    
    // Reset form
    setName('');
    setTargetAmount('');
    setDeadline('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-xl animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800">{t('createGoalTitle')}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{t('goalName')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              placeholder={language === 'EN' ? "e.g. New iPhone, Japan Trip" : "เช่น ซื้อไอโฟน, เที่ยวญี่ปุ่น"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{t('targetAmount')}</label>
            <div className="flex gap-2">
                <input
                type="number"
                required
                min="0.01"
                step="any"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-xl font-bold text-indigo-600"
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
             <label className="block text-sm font-medium text-slate-600 mb-1">{t('deadline')}</label>
             <div className="relative">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                 <input
                   type="date"
                   value={deadline}
                   onChange={(e) => setDeadline(e.target.value)}
                   className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                 />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">{t('category')}</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
               {['Target', ...AVAILABLE_ICONS].map((iconName) => {
                 const Icon = iconName === 'Target' ? Target : (iconMap[iconName] || Target);
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
              {ACCOUNT_COLORS.slice(0, 8).map((color) => (
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
            disabled={!name.trim() || Number(targetAmount) <= 0}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-transform active:scale-95 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('createGoal')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;
