
import React from 'react';
import { Notification } from '../types';
import { X, Bell, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, notifications }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end p-4 backdrop-blur-sm sm:items-start">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-slide-left mt-16 max-h-[80vh] flex flex-col overflow-hidden">
        
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800">การแจ้งเตือน ({notifications.length})</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-2 space-y-2 bg-slate-50/50 flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <CheckCircle2 size={48} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">ไม่มีการแจ้งเตือนใหม่</p>
              <p className="text-xs">ทุกอย่างเรียบร้อยดี!</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-3 rounded-xl border shadow-sm relative overflow-hidden flex gap-3 ${
                  notif.severity === 'WARNING' 
                    ? 'bg-red-50 border-red-100' 
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className={`mt-1 flex-shrink-0 ${notif.severity === 'WARNING' ? 'text-red-500' : 'text-indigo-500'}`}>
                   {notif.severity === 'WARNING' ? <AlertCircle size={20} /> : <Info size={20} />}
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${notif.severity === 'WARNING' ? 'text-red-800' : 'text-slate-800'}`}>
                    {notif.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2 text-right">
                    {new Date(notif.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
