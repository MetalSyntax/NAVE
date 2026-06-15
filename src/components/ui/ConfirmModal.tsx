import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-low rounded-2xl w-full max-w-md p-6 space-y-6 shadow-elevation-3 border border-outline-variant/30 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-headline text-lg font-black uppercase text-on-surface">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-high transition-colors"
          >
            <X className="w-4 h-4 text-surface-variant" />
          </button>
        </div>

        <p className="text-sm text-surface-variant font-medium leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-surface-high hover:bg-surface-low text-on-surface rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 bg-error text-on-error hover:bg-error/90 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
