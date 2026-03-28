import React from 'react';
import { Save, Trash2, ArrowRight } from 'lucide-react';

export function LogsScreen() {
  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Hero Telemetry Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container p-8 border-l-4 border-secondary space-y-2">
          <p className="font-label text-secondary text-[10px] font-bold tracking-[0.1rem] uppercase">TOTAL DISTANCE</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-5xl font-black tracking-tighter">12,482</span>
            <span className="font-headline text-xl text-surface-variant font-medium uppercase">KM</span>
          </div>
        </div>
        <div className="bg-surface-container p-8 border-l-4 border-primary space-y-2">
          <p className="font-label text-primary text-[10px] font-bold tracking-[0.1rem] uppercase">LAST FUEL ECONOMY</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-5xl font-black tracking-tighter">5.2</span>
            <span className="font-headline text-xl text-surface-variant font-medium uppercase">L/100KM</span>
          </div>
        </div>
      </section>

      {/* Log Entry Form */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-[2px] w-12 bg-primary"></div>
          <h2 className="font-headline text-2xl font-black uppercase tracking-tight">LOG NEW ENTRY</h2>
        </div>
        <form className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-surface-low p-8 shadow-2xl" onSubmit={(e) => e.preventDefault()}>
          <div className="md:col-span-7 space-y-2">
            <label className="font-label text-secondary text-[10px] font-bold tracking-[0.1rem] uppercase">CURRENT ODOMETER (KM)</label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300"></div>
              <input className="w-full bg-surface-high border-none p-4 font-headline text-3xl font-bold focus:ring-0 focus:outline-none placeholder:text-surface-variant text-white" placeholder="000000" type="number" />
            </div>
          </div>
          <div className="md:col-span-5 space-y-2">
            <label className="font-label text-secondary text-[10px] font-bold tracking-[0.1rem] uppercase">FUEL ADDED (LITERS)</label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300"></div>
              <input className="w-full bg-surface-high border-none p-4 font-headline text-3xl font-bold focus:ring-0 focus:outline-none placeholder:text-surface-variant text-white" placeholder="00.00" step="0.01" type="number" />
            </div>
          </div>
          <div className="md:col-span-12 space-y-2">
            <label className="font-label text-surface-variant text-[10px] font-bold tracking-[0.1rem] uppercase">ADDITIONAL NOTES / FUEL GRADE</label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300"></div>
              <input className="w-full bg-surface-high border-none p-4 font-body text-sm focus:ring-0 focus:outline-none placeholder:text-surface-variant/50 text-white" placeholder="e.g. 98 Octane, Full Tank" type="text" />
            </div>
          </div>
          <div className="md:col-span-12 pt-4">
            <button className="w-full md:w-auto bg-primary-container text-white font-headline font-black text-lg py-5 px-12 uppercase tracking-widest active:scale-95 transition-all hover:bg-primary duration-150 flex items-center justify-center gap-3" type="button">
              <Save className="w-6 h-6" />
              SAVE LOG ENTRY
            </button>
          </div>
        </form>
      </section>

      {/* Entry History */}
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-4">
            <div className="h-[2px] w-12 bg-secondary"></div>
            <h2 className="font-headline text-2xl font-black uppercase tracking-tight">RECENT HISTORY</h2>
          </div>
          <p className="font-label text-surface-variant text-[10px] font-bold tracking-widest uppercase">LAST 5 ENTRIES</p>
        </div>
        <div className="flex flex-col">
          {[
            { date: 'OCT 24, 2023', odo: '12,482 KM', fuel: '14.2 L', eff: '5.1', bg: 'bg-surface-lowest' },
            { date: 'OCT 18, 2023', odo: '12,210 KM', fuel: '12.8 L', eff: '5.3', bg: 'bg-surface-low' },
            { date: 'OCT 12, 2023', odo: '11,945 KM', fuel: '15.1 L', eff: '5.2', bg: 'bg-surface-lowest' },
          ].map((log, i) => (
            <div key={i} className={`group flex flex-col md:flex-row md:items-center justify-between p-6 ${log.bg} hover:bg-surface-high transition-colors duration-200 border-l-2 border-transparent hover:border-primary`}>
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="font-label text-surface-variant text-[10px] font-bold uppercase">DATE</span>
                  <span className="font-headline font-bold text-lg">{log.date}</span>
                </div>
                <div className="h-8 w-[1px] bg-surface-variant/30 hidden md:block"></div>
                <div className="flex flex-col">
                  <span className="font-label text-surface-variant text-[10px] font-bold uppercase">ODOMETER</span>
                  <span className="font-headline font-bold text-lg">{log.odo}</span>
                </div>
              </div>
              <div className="flex items-center gap-8 mt-4 md:mt-0">
                <div className="flex flex-col items-end">
                  <span className="font-label text-secondary text-[10px] font-bold uppercase">FUEL</span>
                  <span className="font-headline font-black text-xl text-secondary">{log.fuel}</span>
                </div>
                <div className="bg-surface-high px-4 py-2 text-right">
                  <span className="font-label text-primary text-[10px] font-bold uppercase block">EFFICIENCY</span>
                  <span className="font-headline font-bold">{log.eff} <span className="text-[10px]">L/100</span></span>
                </div>
                <button className="text-surface-variant hover:text-error transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full py-4 font-label text-surface-variant text-[10px] font-bold tracking-[0.2rem] uppercase hover:text-primary transition-colors flex items-center justify-center gap-2 group">
          VIEW FULL ARCHIVE
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </section>
    </div>
  );
}
