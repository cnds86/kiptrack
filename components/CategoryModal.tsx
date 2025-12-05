
import React, { useState } from 'react';
import { Category, TransactionType } from '../types';
import { ACCOUNT_COLORS, AVAILABLE_ICONS } from '../constants';
import { X, Check, Wallet, Briefcase, PiggyBank, ShoppingCart, Utensils, Zap, Car, HeartPulse, Coffee, Gift, Home, Plane, Smartphone, Gamepad, Music, Book, Wrench, LucideIcon } from 'lucide-react';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Wallet, Briefcase, PiggyBank, ShoppingCart, Utensils, Zap, Car, HeartPulse, Coffee,
  Gift, Home, Plane, Smartphone, Gamepad, Music, Book, Wrench
};

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<Category, 'id'>) => void;
  type: TransactionType;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSave, type }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
      type,
    });
    
    // Reset
    setName('');
    setSelectedColor(ACCOUNT_COLORS[0]);
    setSelectedIcon(AVAILABLE_ICONS[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 shadow-xl animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            เพิ่มหมวดหมู่{type === TransactionType.INCOME ? 'รายรับ' : 'รายจ่าย'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">ชื่อหมวดหมู่</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              placeholder="เช่น ถูกหวย, ขายของเก่า"
              maxLength={20}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">สีสัญลักษณ์</label>
            <div className="flex flex-wrap gap-3">
              {ACCOUNT_COLORS.slice(0, 12).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full ${color} transition-transform ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">ไอคอน</label>
            <div className="grid grid-cols-6 gap-2">
              {AVAILABLE_ICONS.map((iconName) => {
                const Icon = iconMap[iconName] || Wallet;
                const isSelected = selectedIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-slate-800 text-white shadow-md scale-105' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={20} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4 border border-slate-100">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${selectedColor}`}>
                {(() => {
                    const Icon = iconMap[selectedIcon] || Wallet;
                    return <Icon size={24} />;
                })()}
             </div>
             <div>
                 <p className="text-xs text-slate-400 font-bold uppercase">ตัวอย่าง</p>
                 <p className="font-bold text-slate-800">{name || 'ชื่อหมวดหมู่'}</p>
             </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2">
                <Check size={20} />
                <span>บันทึกหมวดหมู่</span>
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
