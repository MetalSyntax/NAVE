import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    /* MD3 Snackbar */
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 px-4 py-3 shadow-elevation-3 animate-in slide-in-from-bottom-4 duration-300 rounded-xl min-w-[280px] max-w-sm ${
        type === 'success'
          ? 'bg-inverse-surface text-inverse-on-surface'
          : 'bg-error-container text-on-error-container'
      }`}
    >
      {type === 'success'
        ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-primary" />
        : <AlertCircle className="w-5 h-5 flex-shrink-0" />
      }
      <span className="font-body font-semibold text-sm flex-1">{message}</span>
      <button
        onClick={onClose}
        className="font-headline font-black text-xs uppercase tracking-widest text-primary hover:opacity-70 transition-opacity ml-2"
      >
        ✕
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType) => setToast({ message, type });
  const hideToast = () => setToast(null);

  return { toast, showToast, hideToast };
}
