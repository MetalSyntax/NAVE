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
    <div className={`fixed bottom-4 right-4 z-10000 flex items-center gap-3 px-6 py-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 ${type === 'success' ? 'bg-primary-container text-white' : 'bg-error-container text-white'}`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
      <span className="font-headline font-bold text-sm tracking-widest uppercase">{message}</span>
    </div>
  );
}

// Helper hook
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType) => setToast({ message, type });
  const hideToast = () => setToast(null);

  return { toast, showToast, hideToast };
}
