import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  notify: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé à l\'intérieur de ToastProvider');
  return ctx;
}

const config: Record<ToastType, { icon: React.ElementType; accent: string; ring: string }> = {
  success: { icon: CheckCircle2, accent: 'text-emerald-500', ring: 'border-l-emerald-500' },
  error: { icon: AlertCircle, accent: 'text-rose-500', ring: 'border-l-rose-500' },
  info: { icon: Info, accent: 'text-[#16A34A]', ring: 'border-l-[#16A34A]' },
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), 4200);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 w-[min(92vw,360px)]"
        data-testid="toast-container"
      >
        {toasts.map((t) => {
          const C = config[t.type].icon;
          return (
            <div
              key={t.id}
              data-testid={`toast-${t.type}`}
              className={`animate-toastIn flex items-start gap-3 p-4 rounded-xl border border-l-4 ${config[t.type].ring} bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-900/10`}
            >
              <C className={`w-5 h-5 shrink-0 mt-0.5 ${config[t.type].accent}`} />
              <p className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                {t.message}
              </p>
              <button
                onClick={() => remove(t.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
