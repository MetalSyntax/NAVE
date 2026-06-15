import React from 'react';
import { Download, X, RefreshCw } from 'lucide-react';

interface UpdatePromptProps {
  onAccept: () => void;
  onDismiss: () => void;
}

export function UpdatePrompt({ onAccept, onDismiss }: UpdatePromptProps) {
  return (
    <div className="fixed bottom-24 left-4 right-4 z-[70] md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-surface-container rounded-2xl shadow-elevation-3 border border-outline-variant/30 p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <RefreshCw className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-headline font-black text-sm uppercase tracking-tight text-on-surface">
            Nueva versión disponible
          </p>
          <p className="text-[11px] text-surface-variant font-medium mt-0.5">
            Actualiza NAVE para obtener las últimas mejoras.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onAccept}
              className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              <Download className="w-3 h-3" />
              Actualizar
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider text-surface-variant hover:bg-surface-high transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="w-7 h-7 rounded-full flex items-center justify-center text-surface-variant hover:bg-surface-high transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
