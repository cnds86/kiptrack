
import React, { useState } from 'react';
import { SavingsGoal, Account, Currency } from '../types';
import { X, ArrowRight, PiggyBank, Wallet } from 'lucide-react';
import { formatCurrency } from '../constants';

interface DepositGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  accounts: Account[];
  currencies: Currency[];
  onDeposit: (goalId: string, accountId: string, amount: number) => void;
}

const DepositGoalModal: React.FC<DepositGoalModalProps> = ({ 
    isOpen, 
    onClose, 
    goal, 
    accounts, 
    currencies, 
    onDeposit 
}) => {
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  if (!isOpen || !goal) return null;

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountCurrency = currencies.find(c => c.code === selectedAccount?.currencyCode);
  const baseCurrency = currencies.find(c => c.isBase) || currencies[0];
  
  const rate = accountCurrency ? accountCurrency.rate : 1;
  const estimatedGoalIncrease = amount ? Number(amount) * rate : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedAccountId) return;
    
    const numAmount = Number(amount);
    
    // Validation
    if (numAmount <= 0) return;

    // Check balance
    if (selectedAccount && numAmount > selectedAccount.balance) {
        alert('ยอดเงินในบัญชีไม่เพียงพอ');
        return;
    }

    onDeposit(goal.id, selectedAccountId, numAmount);
    setAmount('');
    setSelectedAccountId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-up relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
        </button>

        <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full ${goal.color} flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-100 text-white`}>
                <PiggyBank size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">เติมเงินเข้าเป้าหมาย</h2>
            <p className="text-slate-500 text-sm mt-1">"{goal.name}"</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Amount Input */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase">จำนวนเงิน ({accountCurrency?.symbol || '₭'})</label>
                <input
                    type="number"
                    value={amount}
                    min="0.01"
                    step="any"
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-3xl font-bold text-center p-2 border-b-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-slate-800 placeholder-slate-200"
                    placeholder="0"
                    autoFocus
                />
            </div>

            {/* Account Selector */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                     <label className="text-xs font-bold text-slate-400 uppercase">ตัดเงินจากบัญชี <span className="text-red-500">*</span></label>
                     {!selectedAccountId && <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full animate-pulse">กรุณาเลือก</span>}
                </div>
                
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {accounts.map(acc => {
                        const curr = currencies.find(c => c.code === acc.currencyCode);
                        return (
                            <button
                                key={acc.id}
                                type="button"
                                onClick={() => setSelectedAccountId(acc.id)}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                    selectedAccountId === acc.id 
                                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${acc.color}`}></div>
                                    <span className="text-sm font-medium text-slate-700">{acc.name}</span>
                                </div>
                                <span className="text-xs font-bold text-slate-500">
                                    {formatCurrency(acc.balance, curr)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Conversion Preview */}
            {amount && selectedAccountId && (
                <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-sm animate-fade-in">
                    <span className="text-slate-500">ยอดเข้าเป้าหมาย:</span>
                    <span className="font-bold text-green-600">
                        +{formatCurrency(estimatedGoalIncrease, baseCurrency)}
                    </span>
                </div>
            )}

            <button
                type="submit"
                disabled={!amount || !selectedAccountId || Number(amount) <= 0}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none disabled:bg-slate-300 disabled:text-slate-500 flex items-center justify-center gap-2 mt-2 transition-all"
            >
                <Wallet size={18} />
                ยืนยันการออม
            </button>
        </form>
      </div>
    </div>
  );
};

export default DepositGoalModal;
