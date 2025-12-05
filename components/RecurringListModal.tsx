import React from 'react';
import { RecurringTransaction, Category, Account, Currency, TransactionType, Frequency } from '../types';
import { X, CalendarClock, Trash2, Wallet, LucideIcon, Briefcase, PiggyBank, ShoppingCart, Utensils, Zap, Car, HeartPulse, Coffee, Gift, Home, Plane, Smartphone, Gamepad, Music, Book, Wrench } from 'lucide-react';
import { formatCurrency } from '../constants';

// Reuse icon map
const iconMap: Record<string, LucideIcon> = {
  Wallet, Briefcase, PiggyBank, ShoppingCart, Utensils, Zap, Car, HeartPulse, Coffee,
  Gift, Home, Plane, Smartphone, Gamepad, Music, Book, Wrench
};

interface RecurringListModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringTransactions: RecurringTransaction[];
  onDelete: (id: string) => void;
  categories: Category[];
  accounts: Account[];
  currencies: Currency[];
}

const RecurringListModal: React.FC<RecurringListModalProps> = ({ 
    isOpen, 
    onClose, 
    recurringTransactions, 
    onDelete,
    categories,
    accounts,
    currencies 
}) => {
  if (!isOpen) return null;

  const getFrequencyLabel = (freq: Frequency) => {
      switch(freq) {
          case Frequency.DAILY: return 'ทุกวัน';
          case Frequency.WEEKLY: return 'ทุกสัปดาห์';
          case Frequency.MONTHLY: return 'ทุกเดือน';
          case Frequency.YEARLY: return 'ทุกปี';
          default: return '';
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md h-[80vh] flex flex-col shadow-2xl animate-slide-up">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
          <div className="flex items-center gap-2">
             <CalendarClock className="text-indigo-600" />
             <h2 className="text-xl font-bold text-slate-800">รายการที่ทำซ้ำ</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 bg-white shadow-sm">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
           {recurringTransactions.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                       <CalendarClock size={32} className="opacity-50" />
                   </div>
                   <p className="font-medium">ไม่มีรายการทำซ้ำ</p>
                   <p className="text-xs text-center max-w-[200px]">คุณสามารถสร้างรายการทำซ้ำได้ที่เมนู "จดรายการ" และเลือกตัวเลือก "ทำซ้ำรายการนี้"</p>
               </div>
           ) : (
               recurringTransactions.map(item => {
                   const category = categories.find(c => c.id === item.categoryId);
                   const account = accounts.find(a => a.id === item.accountId);
                   const currency = currencies.find(c => c.code === account?.currencyCode);
                   const Icon = category ? iconMap[category.icon] : Wallet;

                   return (
                       <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative group">
                           <div className="flex justify-between items-start mb-2">
                               <div className="flex items-center gap-3">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${category?.color || 'bg-slate-400'}`}>
                                       <Icon size={18} />
                                   </div>
                                   <div>
                                       <h4 className="font-bold text-slate-800 text-sm">{category?.name || 'Unknown'}</h4>
                                       <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                                                {getFrequencyLabel(item.frequency)}
                                            </span>
                                            <span className="text-xs text-slate-400">{account?.name}</span>
                                       </div>
                                   </div>
                               </div>
                               <button 
                                  onClick={() => onDelete(item.id)}
                                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                               >
                                   <Trash2 size={16} />
                               </button>
                           </div>
                           
                           <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-50">
                               <div className="text-xs text-slate-500">
                                   ครั้งถัดไป: <span className="font-bold text-slate-700">{item.nextDueDate}</span>
                               </div>
                               <div className={`font-bold text-lg ${item.type === TransactionType.INCOME ? 'text-green-600' : 'text-slate-800'}`}>
                                   {formatCurrency(item.amount, currency)}
                               </div>
                           </div>
                       </div>
                   );
               })
           )}
        </div>
      </div>
    </div>
  );
};

export default RecurringListModal;