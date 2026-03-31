import React from 'react';

export function Spinner({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-primary ${className}`}></div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-48 w-full bg-surface-lowest">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="w-8 h-8" />
        <span className="font-label text-[10px] text-surface-variant font-bold tracking-widest uppercase">INITIALIZING DATA...</span>
      </div>
    </div>
  );
}
