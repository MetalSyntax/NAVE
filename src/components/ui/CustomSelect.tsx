import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function CustomSelect({ value, onChange, options, placeholder, className }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface uppercase font-bold text-left flex items-center justify-between transition-colors gap-2"
      >
        <span className="truncate flex-1">{selected?.label ?? placeholder ?? ''}</span>
        <ChevronDown className={`w-4 h-4 text-surface-variant flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-surface-container rounded-2xl shadow-elevation-3 border border-outline-variant/20 overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wide flex items-center justify-between gap-3 hover:bg-surface-high transition-colors ${
                  opt.value === value ? 'text-primary bg-primary/5' : 'text-on-surface'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {opt.value === value && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
