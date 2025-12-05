

import React, { useState, useRef, useEffect } from 'react';
import { Transaction, Account, Category, TransactionType, Currency, SavingsGoal, AIParsedResult, Language } from '../types';
import { X, Sparkles, ArrowRight, Check, AlertCircle, Camera, Image as ImageIcon, Trash2, Target, PiggyBank, ChevronDown, Mic } from 'lucide-react';
import { parseTransactionWithGemini, parseReceiptWithGemini } from '../services/geminiService';
import { formatCurrency } from '../constants';
import { TRANSLATIONS } from '../translations';

interface MagicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onSaveGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'status'>) => void;
  onDepositGoal: (goalId: string, accountId: string, amount: number) => void;
  accounts: Account[];
  categories: Category[];
  currencies: Currency[];
  goals: SavingsGoal[];
  language: Language;
}

// Helper to compress/resize image
const resizeImage = (file: File, maxDimension: number = 1024, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height *= maxDimension / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
        }
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const MagicModal: React.FC<MagicModalProps> = ({ 
  isOpen, 
  onClose, 
  onSaveTransaction, 
  onSaveGoal, 
  onDepositGoal,
  accounts, 
  categories, 
  currencies, 
  goals,
  language
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [parsedData, setParsedData] = useState<AIParsedResult | null>(null);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Image State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const t = (key: keyof typeof TRANSLATIONS['TH']) => TRANSLATIONS[language][key] || key;

  useEffect(() => {
    if (parsedData) {
        validateData(parsedData);
    } else {
        setValidationError(null);
    }
  }, [parsedData]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic type check
      if (!file.type.startsWith('image/')) {
        setError(t('imgErrorType'));
        return;
      }
      
      setIsCompressing(true);
      setError('');

      try {
          // Compress image to max 1024px width/height and 70% quality
          const compressedBase64 = await resizeImage(file, 1024, 0.7);
          setSelectedImage(compressedBase64);
      } catch (err) {
          console.error("Compression error:", err);
          setError(t('imgErrorType')); // Generic error fallback
      } finally {
          setIsCompressing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (galleryInputRef.current) galleryInputRef.current.value = '';
      }
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError(t('voiceNotSupported'));
      return;
    }
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'TH' ? 'th-TH' : language === 'LA' ? 'lo-LA' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setError('');

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev ? prev + ' ' + transcript : transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
          setError('Microphone access denied');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && !selectedImage) return;
    
    setIsLoading(true);
    setError('');
    setParsedData(null);

    try {
      let result: AIParsedResult | null = null;
      if (selectedImage) {
        result = await parseReceiptWithGemini(selectedImage, accounts, categories, currencies);
      } else {
        result = await parseTransactionWithGemini(inputText, accounts, categories, currencies, goals);
      }

      if (result) {
        if (result.action === 'INVALID_IMAGE') {
            setError(t('invalidImageError'));
            setParsedData(null);
            setSelectedImage(null);
        } else {
            // Sanity check: verify accountId exists in our list, if not, clear it
            if (result.accountId && !accounts.find(a => a.id === result.accountId)) {
                result.accountId = undefined;
            }
            // Sanity check: verify categoryId exists
            if (result.categoryId && !categories.find(c => c.id === result.categoryId)) {
                result.categoryId = undefined;
            }
            setParsedData(result);
        }
      } else {
        setError(t('aiError'));
      }
    } catch (e: any) {
      console.error("Magic processing error:", e);
      let errorMsg = t('connectionError');
      const msg = e.message || '';
      
      if (msg.includes('429')) {
          errorMsg = language === 'TH' ? 'ใช้งานเกิน limit กรุณารอสักครู่' : 'Too many requests. Please wait.';
      } else if (msg.includes('SAFETY') || msg.includes('blocked')) {
          errorMsg = language === 'TH' ? 'เนื้อหาถูกบล็อกโดยระบบความปลอดภัย' : 'Content blocked by safety settings.';
      } else if (msg.includes('JSON')) {
          errorMsg = language === 'TH' ? 'AI ตอบกลับผิดพลาด (JSON Error)' : 'AI returned invalid format.';
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof AIParsedResult, value: any) => {
      setParsedData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const validateData = (data: AIParsedResult) => {
      if (data.action === 'TRANSACTION') {
          if (!data.amount) return setValidationError(`${t('amount')}?`);
          if (!data.categoryId) return setValidationError(`${t('category')}?`);
          if (!data.accountId) return setValidationError(`${t('account')}?`);
      } else if (data.action === 'CREATE_GOAL') {
          if (!data.goalName) return setValidationError(`${t('goalName')}?`);
          if (!data.targetAmount) return setValidationError(`${t('targetAmount')}?`);
      } else if (data.action === 'DEPOSIT_GOAL') {
          if (!data.amount) return setValidationError(`${t('amount')}?`);
          if (!data.goalId) return setValidationError(`${t('toGoal')}?`);
          if (!data.accountId) return setValidationError(`${t('sourceAccount')}?`);
      }
      setValidationError(null);
  };

  const handleConfirm = () => {
    if (!parsedData || validationError) return;

    if (parsedData.action === 'TRANSACTION') {
        if (parsedData.amount && parsedData.accountId && parsedData.categoryId && parsedData.type) {
            onSaveTransaction({
                amount: parsedData.amount,
                accountId: parsedData.accountId,
                categoryId: parsedData.categoryId,
                type: parsedData.type as TransactionType,
                date: parsedData.date || new Date().toISOString().split('T')[0],
                note: parsedData.note || '',
            });
        }
    } else if (parsedData.action === 'CREATE_GOAL') {
        if (parsedData.goalName && parsedData.targetAmount) {
            onSaveGoal({
                name: parsedData.goalName,
                targetAmount: parsedData.targetAmount,
                deadline: parsedData.deadline,
                icon: 'Target',
                color: 'bg-indigo-500'
            });
        }
    } else if (parsedData.action === 'DEPOSIT_GOAL') {
        if (parsedData.goalId && parsedData.accountId && parsedData.amount) {
            onDepositGoal(parsedData.goalId, parsedData.accountId, parsedData.amount);
        }
    }
    
    handleClose();
  };

  const handleClose = () => {
    setInputText('');
    setParsedData(null);
    setError('');
    setValidationError(null);
    setSelectedImage(null);
    onClose();
  };

  const getCurrency = (accId?: string) => {
    const acc = accounts.find(a => a.id === accId);
    return currencies.find(c => c.code === acc?.currencyCode);
  };

  // Helper for rendering editable Select
  const RenderSelect = ({ 
    value, 
    onChange, 
    options, 
    placeholder, 
    hasError 
  }: { 
    value?: string, 
    onChange: (val: string) => void, 
    options: {id: string, name: string}[], 
    placeholder: string,
    hasError: boolean
  }) => (
    <div className="relative w-full">
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full p-2 pr-8 rounded-lg appearance-none font-bold text-slate-800 border-2 transition-colors cursor-pointer ${
                hasError && !value 
                ? 'border-red-400 focus:border-red-500 bg-red-50 text-red-500' 
                : 'bg-white border-transparent hover:border-slate-200 focus:border-indigo-500'
            }`}
        >
            <option value="" disabled className="text-slate-400">{placeholder}</option>
            {options.map(opt => (
                <option key={opt.id} value={opt.id} className="text-slate-800">{opt.name}</option>
            ))}
        </select>
        <ChevronDown size={16} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${hasError && !value ? 'text-red-400' : 'text-slate-400'}`} />
    </div>
  );

  const renderResultPreview = () => {
      if (!parsedData) return null;

      if (parsedData.action === 'TRANSACTION') {
          return (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <span className="text-slate-500 text-sm">{t('amount')}</span>
                    <span className={`font-bold text-xl ${parsedData.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {parsedData.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(parsedData.amount || 0, getCurrency(parsedData.accountId))}
                    </span>
                </div>
                
                <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 text-sm whitespace-nowrap">{t('category')}</span>
                    <RenderSelect 
                        value={parsedData.categoryId}
                        onChange={(val) => updateField('categoryId', val)}
                        options={categories.filter(c => c.type === parsedData.type)}
                        placeholder={t('category')}
                        hasError={!parsedData.categoryId}
                    />
                </div>
                
                <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 text-sm whitespace-nowrap">{t('account')}</span>
                    <RenderSelect 
                        value={parsedData.accountId}
                        onChange={(val) => updateField('accountId', val)}
                        options={accounts}
                        placeholder={t('account')}
                        hasError={!parsedData.accountId}
                    />
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">{t('date')}</span>
                    <span className="font-bold text-slate-800">{parsedData.date}</span>
                </div>
                {parsedData.note && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">{t('note')}</span>
                        <span className="font-medium text-slate-700 max-w-[150px] truncate">{parsedData.note}</span>
                    </div>
                )}
            </div>
          );
      } else if (parsedData.action === 'CREATE_GOAL') {
          return (
            <div className="bg-indigo-50 rounded-xl p-4 space-y-3 border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                    <Target className="text-indigo-600" size={20} />
                    <span className="font-bold text-indigo-900">{t('createGoalTitle')}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-indigo-200">
                    <span className="text-slate-500 text-sm">{t('goalName')}</span>
                    <input 
                        value={parsedData.goalName || ''}
                        onChange={(e) => updateField('goalName', e.target.value)}
                        className="font-bold text-xl text-slate-800 bg-transparent text-right focus:outline-none border-b border-dashed border-indigo-300 w-2/3"
                        placeholder={t('goalName')}
                    />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">{t('targetAmount')}</span>
                    <span className="font-bold text-slate-800">{formatCurrency(parsedData.targetAmount || 0)}</span>
                </div>
                {parsedData.deadline && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">{t('deadline')}</span>
                        <span className="font-bold text-slate-800">{parsedData.deadline}</span>
                    </div>
                )}
            </div>
          );
      } else if (parsedData.action === 'DEPOSIT_GOAL') {
          return (
            <div className="bg-green-50 rounded-xl p-4 space-y-3 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="text-green-600" size={20} />
                    <span className="font-bold text-green-900">{t('depositToGoal')}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-green-200">
                    <span className="text-slate-500 text-sm">{t('amount')}</span>
                    <span className="font-bold text-xl text-green-700">+{formatCurrency(parsedData.amount || 0, getCurrency(parsedData.accountId))}</span>
                </div>
                
                <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 text-sm whitespace-nowrap">{t('toGoal')}</span>
                    <RenderSelect 
                        value={parsedData.goalId}
                        onChange={(val) => updateField('goalId', val)}
                        options={goals}
                        placeholder={t('toGoal')}
                        hasError={!parsedData.goalId}
                    />
                </div>
                
                <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 text-sm whitespace-nowrap">{t('sourceAccount')}</span>
                    <RenderSelect 
                        value={parsedData.accountId}
                        onChange={(val) => updateField('accountId', val)}
                        options={accounts}
                        placeholder={t('sourceAccount')}
                        hasError={!parsedData.accountId}
                    />
                </div>
            </div>
          );
      }
      return null;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="text-yellow-300" />
                        {t('magicAdd')}
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">
                        {t('magicDesc')}
                    </p>
                </div>
                <button onClick={handleClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>
        </div>

        <div className="p-6">
            {!parsedData ? (
                <>
                    {/* Image Preview */}
                    {selectedImage ? (
                      <div className="mb-4 relative rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={selectedImage} alt="Receipt Preview" className="w-full max-h-48 object-cover" />
                        <button 
                          onClick={() => setSelectedImage(null)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : isCompressing ? (
                        <div className="mb-4 h-32 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400 border border-slate-100">
                             <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                             <span className="text-xs font-bold">Compressing...</span>
                        </div>
                    ) : (
                      <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder={t('magicPlaceholder')}
                          className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-700 text-sm leading-relaxed"
                      />
                    )}
                    
                    {/* Action Bar */}
                    <div className="flex gap-3 mt-3">
                        <button
                            onClick={startListening}
                            disabled={isCompressing || isListening}
                            className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50 ${
                                isListening 
                                ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                           <Mic size={20} className={isListening ? 'animate-bounce' : ''} />
                           <span>{isListening ? t('listening') : t('voiceInput')}</span>
                        </button>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isCompressing}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50"
                        >
                           <Camera size={20} />
                           <span>{t('scanReceipt')}</span>
                        </button>
                        
                        <button
                            onClick={() => galleryInputRef.current?.click()}
                            disabled={isCompressing}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50"
                        >
                           <ImageIcon size={20} />
                           <span>{t('selectImage')}</span>
                        </button>

                        {/* Hidden Inputs */}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileChange}
                        />
                        <input 
                          type="file" 
                          ref={galleryInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                    </div>
                    
                    {error && (
                        <div className="mt-3 flex items-center gap-2 text-red-500 text-xs bg-red-50 p-3 rounded-xl animate-fade-in">
                            <AlertCircle size={14} className="flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        onClick={handleAnalyze}
                        disabled={(!inputText.trim() && !selectedImage) || isLoading || isCompressing || isListening}
                        className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                        {isLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                {t('analyzing')}
                            </>
                        ) : (
                            <>
                                {t('analyze')} <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </>
            ) : (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">{t('verify')}</h3>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{t('verifyDesc')}</span>
                    </div>
                    
                    {renderResultPreview()}

                    {/* Validation Error Message */}
                    {validationError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 animate-pulse">
                            <AlertCircle size={18} />
                            <span className="text-xs font-bold">{validationError}</span>
                        </div>
                    )}

                    <div className="flex gap-3 mt-6">
                        <button 
                            onClick={() => {
                              setParsedData(null);
                              if (selectedImage) setSelectedImage(null);
                              setValidationError(null);
                            }}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            {t('restart')}
                        </button>
                        <button 
                            onClick={handleConfirm}
                            disabled={!!validationError}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                                validationError 
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                            }`}
                        >
                            <Check size={18} />
                            {t('confirm')}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MagicModal;