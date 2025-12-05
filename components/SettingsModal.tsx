
import React, { useState, useRef } from 'react';
import { Currency, Language } from '../types';
import { X, Check, Trash2, Star, Plus, Download, Upload, Languages, Cloud, LogIn, LogOut, User } from 'lucide-react';
import { TRANSLATIONS } from '../translations';
import { loginWithGoogle, logout, isFirebaseReady } from '../services/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Currency[];
  onUpdateCurrencies: (currencies: Currency[]) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  language: Language;
  onSetLanguage: (lang: Language) => void;
  currentUser: FirebaseUser | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currencies, 
  onUpdateCurrencies,
  onExportData,
  onImportData,
  language,
  onSetLanguage,
  currentUser
}) => {
  const [editingCurrency, setEditingCurrency] = useState<Partial<Currency> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const t = (key: keyof typeof TRANSLATIONS['TH']) => TRANSLATIONS[language][key] || key;
  const baseCurrency = currencies.find(c => c.isBase) || currencies[0];

  const handleSetBase = (code: string) => {
    const updated = currencies.map(c => ({
      ...c,
      isBase: c.code === code,
    }));
    onUpdateCurrencies(updated);
  };

  const handleSaveCurrency = () => {
    if (!editingCurrency || !editingCurrency.code || !editingCurrency.symbol) return;
    
    if (!isAdding && !editingCurrency.isBase && (Number(editingCurrency.rate) <= 0)) return;
    if (isAdding && (Number(editingCurrency.rate) <= 0)) return;

    if (isAdding) {
      onUpdateCurrencies([...currencies, { ...editingCurrency, rate: Number(editingCurrency.rate) || 0, isBase: false } as Currency]);
    } else {
      onUpdateCurrencies(currencies.map(c => c.code === editingCurrency.code ? { ...c, ...editingCurrency, rate: Number(editingCurrency.rate) } as Currency : c));
    }
    setEditingCurrency(null);
    setIsAdding(false);
  };

  const handleDeleteCurrency = (code: string) => {
    if (currencies.find(c => c.code === code)?.isBase) return;
    onUpdateCurrencies(currencies.filter(c => c.code !== code));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (window.confirm(t('restoreMsg'))) {
         onImportData(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogin = async () => {
      try {
          await loginWithGoogle();
      } catch (error) {
          alert('Login failed');
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{t('settings')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Cloud Sync Section */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
             <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <Cloud size={16} className="text-blue-500" />
                Cloud Sync (Firebase)
            </h3>
            
            {!currentUser ? (
                <div>
                     <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                        {language === 'TH' 
                            ? 'เข้าสู่ระบบเพื่อสำรองข้อมูลออนไลน์และใช้งานได้หลายเครื่อง' 
                            : 'Sign in to sync data across devices and backup online.'}
                     </p>
                     <button 
                        onClick={handleLogin}
                        className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2"
                     >
                         <LogIn size={18} />
                         Sign in with Google
                     </button>
                     {!isFirebaseReady() && (
                         <p className="text-[10px] text-red-400 mt-2 text-center">
                             *Config Required in services/firebase.ts
                         </p>
                     )}
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         {currentUser.photoURL ? (
                             <img src={currentUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                         ) : (
                             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                 {currentUser.email?.[0]?.toUpperCase()}
                             </div>
                         )}
                         <div>
                             <p className="font-bold text-slate-800 text-sm">{currentUser.displayName}</p>
                             <p className="text-xs text-slate-500">{currentUser.email}</p>
                         </div>
                    </div>
                    <button 
                        onClick={logout}
                        className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            )}
        </div>

        {/* Language Selector */}
        <div className="mb-6">
            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <Languages size={16} />
                {t('language')}
            </h3>
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={() => onSetLanguage('TH')}
                    className={`py-2 px-3 rounded-xl border font-bold text-sm transition-all ${language === 'TH' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                    ไทย
                </button>
                <button
                    onClick={() => onSetLanguage('LA')}
                    className={`py-2 px-3 rounded-xl border font-bold text-sm transition-all ${language === 'LA' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                    ລາວ
                </button>
                <button
                    onClick={() => onSetLanguage('EN')}
                    className={`py-2 px-3 rounded-xl border font-bold text-sm transition-all ${language === 'EN' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                    English
                </button>
            </div>
        </div>

        {/* Currency List */}
        <div className="mb-8">
            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">{t('currencySettings')}</h3>
            <div className="space-y-4 mb-4">
            {currencies.map(currency => (
                <div key={currency.code} className={`p-4 rounded-xl border ${currency.isBase ? 'border-indigo-200 bg-indigo-50' : 'border-slate-100 bg-white'} flex justify-between items-center`}>
                <div onClick={() => { setEditingCurrency(currency); setIsAdding(false); }} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{currency.code}</span>
                    <span className="text-sm text-slate-500">({currency.symbol})</span>
                    {currency.isBase && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{t('base')}</span>}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                    {currency.name}
                    {!currency.isBase && ` • Rate: ${currency.rate.toLocaleString()}`}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {!currency.isBase && (
                        <button 
                            onClick={() => handleSetBase(currency.code)}
                            className="p-2 text-slate-300 hover:text-yellow-500 transition-colors"
                            title="Set as Default"
                        >
                            <Star size={18} />
                        </button>
                    )}
                    {!currency.isBase && (
                        <button 
                            onClick={() => handleDeleteCurrency(currency.code)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
                </div>
            ))}
            
            {!isAdding && !editingCurrency && (
                <button 
                    onClick={() => { setIsAdding(true); setEditingCurrency({ code: '', name: '', symbol: '', rate: 0 }); }}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
                >
                    <Plus size={20} /> {t('addCurrency')}
                </button>
            )}
            </div>

            {/* Edit/Add Form */}
            {(editingCurrency) && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-slide-up">
                    <h3 className="font-bold text-slate-800 mb-3">{isAdding ? t('addCurrency') : 'Edit Currency'}</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-xs font-bold text-slate-400">Code</label>
                            <input 
                                value={editingCurrency.code} 
                                onChange={e => setEditingCurrency({...editingCurrency, code: e.target.value.toUpperCase()})}
                                className="w-full p-2 rounded-lg border border-slate-200 uppercase"
                                placeholder="USD"
                                disabled={!isAdding}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400">{t('symbol')}</label>
                            <input 
                                value={editingCurrency.symbol} 
                                onChange={e => setEditingCurrency({...editingCurrency, symbol: e.target.value})}
                                className="w-full p-2 rounded-lg border border-slate-200"
                                placeholder="$"
                            />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="text-xs font-bold text-slate-400">{t('name')}</label>
                        <input 
                            value={editingCurrency.name} 
                            onChange={e => setEditingCurrency({...editingCurrency, name: e.target.value})}
                            className="w-full p-2 rounded-lg border border-slate-200"
                            placeholder="US Dollar"
                        />
                    </div>
                    {!editingCurrency.isBase && (
                        <div className="mb-4">
                            <label className="text-xs font-bold text-slate-400">{t('rate')} (1 {editingCurrency.code} = ? {baseCurrency.code})</label>
                            <input 
                                type="number"
                                min="0.000001"
                                step="any"
                                value={editingCurrency.rate} 
                                onChange={e => setEditingCurrency({...editingCurrency, rate: Number(e.target.value)})}
                                className="w-full p-2 rounded-lg border border-slate-200"
                                placeholder="22000"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                                {Number(editingCurrency.rate) > 0 ? `1 ${editingCurrency.code} = ${editingCurrency.rate} ${baseCurrency.code}` : 'Rate must be > 0'}
                            </p>
                        </div>
                    )}
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setEditingCurrency(null); setIsAdding(false); }}
                            className="flex-1 py-2 bg-slate-200 text-slate-600 rounded-lg font-bold"
                        >
                            {t('cancel')}
                        </button>
                        <button 
                            onClick={handleSaveCurrency}
                            disabled={!editingCurrency.isBase && (Number(editingCurrency.rate) <= 0)}
                            className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('save')}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Data Backup/Restore Section */}
        <div className="pt-6 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">{t('dataManagement')}</h3>
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onExportData}
                    className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors group"
                >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
                        <Download size={20} />
                    </div>
                    <span className="font-bold text-indigo-800 text-sm">{t('backupData')}</span>
                    <span className="text-[10px] text-indigo-400">{t('export')}</span>
                </button>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors group"
                >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm text-slate-600 group-hover:scale-110 transition-transform">
                        <Upload size={20} />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{t('restoreData')}</span>
                    <span className="text-[10px] text-slate-400">{t('import')}</span>
                </button>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange}
            />
            
            <p className="text-[10px] text-slate-400 mt-4 text-center">
                *{t('restoreMsg')}
            </p>
        </div>

        {/* Main Save Button */}
        <div className="pt-6 mt-2">
            <button
                onClick={onClose}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
                <Check size={20} />
                {t('save')}
            </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
