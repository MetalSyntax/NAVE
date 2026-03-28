import React from 'react';
import { Bike } from 'lucide-react';

export function TopNav() {
  return (
    <>
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface shadow-[0_0_12px_rgba(255,180,168,0.04)]">
        <div className="flex items-center gap-3">
          <Bike className="text-primary w-6 h-6" />
          <h1 className="font-headline uppercase tracking-tighter font-black text-xl text-primary italic">PRO-PERFORMANCE</h1>
        </div>
        <div className="w-10 h-10 bg-surface-high flex items-center justify-center overflow-hidden border border-surface-variant">
          <img 
            alt="Profile Avatar" 
            className="w-full h-full object-cover" 
            src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop" 
          />
        </div>
      </header>
      <div className="fixed top-16 left-0 w-full bg-surface-container h-[2px] z-40 opacity-50"></div>
    </>
  );
}
