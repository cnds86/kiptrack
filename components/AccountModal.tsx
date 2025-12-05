
import React, { useState, useEffect } from 'react';
import { Account, AccountType, Currency, Language } from '../types';
import { ACCOUNT_COLORS } from '../constants';
import { X, Check, Wallet, Landmark, CreditCard, Coins, Info } from 'lucide-react';
import { TRANSLATIONS } from '../translations';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Omit<Account, 'id'>) => void;
  currencies: Currency[];
  language: Language;
  initialData?: Account | null;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onSave, currencies, language, initialData }) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<AccountType>(AccountType.CASH);
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[5]);
  const [currencyCode, setCurrencyCode] = useState(currencies[0]?.code || 'LAK');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('');

  const t = (key: keyof typeof TRANSLATIONS['TH']) => TRANSLATIONS[language][key] || key;

  // Check if the selected type is a debt type
  const isDebtType = type === AccountType.CREDIT || type === AccountType.LOAN;

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setName(initialData.name);
            // If it's a debt account, show absolute value to be user friendly
            const showBalance = (initialData.type === AccountType.CREDIT || initialData.type === AccountType.LOAN) 
                                ? Math.abs(initialData.balance) 
                                : initialData.balance;
            setBalance(showBalance.toString());
            setType(initialData.type);
            setSelectedColor(initialData.color);
            setCurrencyCode(initialData.currencyCode);
            setLowBalanceThreshold(initialData.lowBalanceThreshold?.toString() || '');
        } else {
            setName('');
            setBalance('');
            setType(AccountType.CASH);
            setSelectedColor(ACCOUNT_COLORS[5]);
            setCurrencyCode(currencies[0]?.code || 'LAK');
            setLowBalanceThreshold('');
        }
    }
  }, [isOpen, initialData, currencies]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // For debt accounts, store balance as negative
    let finalBalance = Number(balance);
    if (isDebtType) {
        finalBalance = -Math.abs(finalBalance);
    }

    onSave({
      name: name.trim(),
      type,
      balance: finalBalance,
      color: selectedColor,
      currencyCode,
      lowBalanceThreshold: lowBalanceThreshold ? Number(lowBalanceThreshold) : undefined
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-xl animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{initialData ? t('editAccount') : t('addAccount')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Account Type Selection */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: AccountType.CASH, icon: Wallet, label: t('cash') },
              { id: AccountType.BANK, icon: Landmark, label: t('bank') },
              { id: AccountType.CREDIT, icon: CreditCard, label: 'Credit' },
              { id: AccountType.LOAN, icon: Coins, label: 'Loan' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                   setType(item.id);
                   // Reset color if switching to debt/loan for better default visual
                   if (item.id === AccountType.CREDIT || item.id === AccountType.LOAN) {
                       setSelectedColor(ACCOUNT_COLORS[0]); // Red
                   }
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  type === item.id 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <item.icon size={24} className="mb-1" />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{t('accountName')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              placeholder={language === 'EN' ? "e.g. Wallet, KBank" : "เช่น กระเป๋าตังค์, KBank"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
                {isDebtType ? (language === 'TH' ? 'ยอดหนี้คงเหลือ' : language === 'LA' ? 'ຍອດໜີ້ຄົງເຫຼືອ' : 'Current Debt Amount') : t('initialBalance')}
            </label>
            <div className="flex gap-2">
                <input
                type="number"
                required
                step="any"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className={`flex-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 bg-slate-50 text-xl font-bold ${isDebtType ? 'text-red-500 focus:ring-red-500' : 'text-slate-800 focus:ring-indigo-500'}`}
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
            {isDebtType && (
                 <div className="mt-2 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                     <Info size={14} className="mt-0.5 flex-shrink-0" />
                     <span>
                        {language === 'TH' 
                            ? 'ระบบจะสร้าง "เป้าหมายการปลดหนี้" ให้โดยอัตโนมัติเมื่อคุณสร้างบัญชีหนี้สินนี้' 
                            : language === 'LA'
                            ? 'ລະບົບຈະສ້າງ "ເປົ້າໝາຍການປົດໜີ້" ໃຫ້ໂດຍອັດຕະໂນມັດເມື່ອທ່ານສ້າງບັນຊີໜີ້ສິນນີ້'
                            : 'A "Debt Repayment Goal" will be automatically created for this account.'}
                     </span>
                 </div>
            )}
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
          
          {!isDebtType && (
            <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">{t('lowBalance')}</label>
                 <div className="relative">
                    <input
                    type="number"
                    step="any"
                    value={lowBalanceThreshold}
                    onChange={(e) => setLowBalanceThreshold(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    placeholder={t('lowBalanceDesc')}
                    />
                 </div>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-4 text-white rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${isDebtType ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            <Check size={20} />
            {initialData ? t('updateAccount') : t('createAccount')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountModal;
