import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-20 md:bottom-5 right-4 sm:right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {toasts.map((t) => {
        let bg = 'bg-slate-900 text-white border-slate-800';
        let Icon = Info;

        if (t.type === 'success') {
          bg = 'bg-emerald-700 text-white border-emerald-600';
          Icon = CheckCircle2;
        } else if (t.type === 'error') {
          bg = 'bg-rose-700 text-white border-rose-600';
          Icon = AlertCircle;
        }

        return (
          <div
            key={t.id}
            className={`${bg} p-3.5 rounded-2xl shadow-xl border text-xs font-semibold flex items-center justify-between pointer-events-auto transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-3`}
          >
            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.message}</span>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-white/70 hover:text-white p-0.5 rounded-lg transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
