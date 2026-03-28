import React from 'react';
import { TrendingUp, PlusCircle, Sun, Fuel, Droplet, ChevronRight } from 'lucide-react';

export function DashboardScreen() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Primary Metric: Mileage */}
        <section className="md:col-span-8 bg-surface-lowest p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>
          <label className="text-secondary font-label text-[10px] font-bold tracking-[0.15rem] uppercase mb-4 block">TOTAL DISTANCE</label>
          <div className="flex items-baseline gap-2">
            <span className="font-headline font-black text-7xl md:text-8xl tracking-tighter italic">12,482</span>
            <span className="font-headline font-bold text-2xl text-surface-variant">KM</span>
          </div>
          <div className="mt-8 flex gap-4">
            <div className="bg-surface-high px-4 py-2 flex items-center gap-2">
              <TrendingUp className="text-secondary w-4 h-4" />
              <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">+240 THIS WEEK</span>
            </div>
          </div>
        </section>

        {/* Quick Action: Quick Add */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <button className="flex-1 bg-primary-container hover:bg-primary text-white p-6 flex flex-col justify-between active:scale-95 transition-all duration-75">
            <PlusCircle className="w-10 h-10" />
            <span className="font-headline font-black text-2xl tracking-tighter text-left uppercase leading-none mt-4">QUICK<br/>ADD DATA</span>
          </button>
          <div className="bg-surface-container p-6">
            <label className="text-secondary font-label text-[10px] font-bold tracking-[0.15rem] uppercase mb-4 block">WEATHER STATUS</label>
            <div className="flex items-center justify-between">
              <span className="font-headline font-bold text-2xl uppercase">OPTIMAL</span>
              <Sun className="text-secondary w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <section className="md:col-span-6 bg-surface-low p-8 border-l-4 border-secondary">
          <div className="flex justify-between items-start mb-8">
            <div>
              <label className="text-secondary font-label text-[10px] font-bold tracking-[0.15rem] uppercase block">FUEL LEVEL</label>
              <span className="font-headline font-black text-5xl italic tracking-tighter">72<span className="text-2xl text-surface-variant">%</span></span>
            </div>
            <Fuel className="text-secondary w-10 h-10" />
          </div>
          {/* Precision Fuel Gauge */}
          <div className="w-full h-8 bg-surface-lowest flex gap-1 p-1">
            {[...Array(7)].map((_, i) => <div key={`f-${i}`} className="h-full bg-secondary w-[10%]"></div>)}
            {[...Array(3)].map((_, i) => <div key={`e-${i}`} className="h-full bg-surface-variant w-[10%]"></div>)}
          </div>
          <div className="mt-4 flex justify-between text-[10px] font-bold text-surface-variant tracking-tighter">
            <span>EMPTY</span>
            <span>FULL</span>
          </div>
        </section>

        <section className="md:col-span-6 bg-surface-low p-8 border-l-4 border-primary">
          <div className="flex justify-between items-start mb-8">
            <div>
              <label className="text-primary font-label text-[10px] font-bold tracking-[0.15rem] uppercase block">OIL SERVICE</label>
              <span className="font-headline font-black text-5xl italic tracking-tighter">1,218<span className="text-2xl text-surface-variant">KM</span></span>
              <p className="text-[10px] text-surface-variant font-bold tracking-widest mt-1">UNTIL NEXT CHANGE</p>
            </div>
            <Droplet className="text-primary w-10 h-10" />
          </div>
          {/* Precision Progress Gauge */}
          <div className="relative w-full h-2 bg-surface-lowest">
            <div className="absolute top-0 left-0 h-full bg-primary w-[85%]"></div>
          </div>
          <div className="mt-6 flex gap-4">
            <span className="bg-error-container/20 text-error text-[10px] font-black px-2 py-1 tracking-widest">STATUS: CRITICAL</span>
          </div>
        </section>

        {/* Technical Detail List */}
        <section className="md:col-span-12 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline font-black text-2xl tracking-tighter uppercase">RECENT TELEMETRY</h2>
            <button className="text-secondary font-label text-[10px] font-bold tracking-widest uppercase hover:underline">VIEW ALL LOGS</button>
          </div>
          <div className="flex flex-col gap-1">
            {[
              { id: '01', title: 'TIRE PRESSURE ADJUST', sub: 'GARAGE SERVICE • 2 DAYS AGO', bg: 'bg-surface-low', hover: 'hover:bg-surface-high' },
              { id: '02', title: 'FUEL REFILL - 12.5L', sub: 'SHELL STATION • 4 DAYS AGO', bg: 'bg-surface-high', hover: 'hover:bg-surface-container' },
              { id: '03', title: 'CHAIN LUBRICATION', sub: 'ROUTINE MAINT • 1 WEEK AGO', bg: 'bg-surface-low', hover: 'hover:bg-surface-high' },
            ].map((item) => (
              <div key={item.id} className={`${item.bg} p-6 flex justify-between items-center group ${item.hover} transition-colors cursor-pointer`}>
                <div className="flex items-center gap-6">
                  <span className="text-surface-variant font-headline font-bold text-xl">{item.id}</span>
                  <div>
                    <h3 className="font-headline font-bold text-lg uppercase">{item.title}</h3>
                    <p className="text-[10px] text-surface-variant font-bold uppercase tracking-widest">{item.sub}</p>
                  </div>
                </div>
                <ChevronRight className="text-surface-variant group-hover:text-secondary transition-colors" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
