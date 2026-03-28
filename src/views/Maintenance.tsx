import React from 'react';
import { History, SlidersHorizontal, CalendarClock } from 'lucide-react';

export function MaintenanceScreen() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero Telemetry Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-0 mb-20">
        <div className="md:col-span-8 bg-surface-lowest p-8 border-l-4 border-primary-container">
          <span className="font-label text-secondary text-[10px] font-bold tracking-[0.2em] uppercase mb-4 block">Engine Vitality Status</span>
          <h2 className="font-headline text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6">
            OIL LIFE <span className="text-primary-container">64%</span>
          </h2>
          <div className="h-2 w-full bg-surface-high relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-primary-container w-[64%]"></div>
          </div>
          <div className="mt-4 flex justify-between font-label text-[10px] text-tertiary uppercase font-bold tracking-widest">
            <span>Depleted</span>
            <span className="text-secondary">Optimal Performance Zone</span>
          </div>
        </div>
        <div className="md:col-span-4 bg-surface-container p-8 flex flex-col justify-end">
          <span className="font-label text-secondary text-[10px] font-bold tracking-[0.2em] uppercase mb-2 block">Next Service Point</span>
          <div className="font-headline text-4xl font-bold tracking-tighter italic">1,080 KM</div>
          <p className="text-tertiary text-xs mt-2 uppercase tracking-wide">Remaining until mandatory change</p>
        </div>
      </section>

      {/* Bento Layout for Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-low p-6 flex flex-col justify-between h-48">
          <div>
            <History className="text-secondary mb-4 w-6 h-6" />
            <h3 className="font-label text-[10px] font-bold tracking-[0.2em] text-tertiary uppercase">Last Recorded Change</h3>
          </div>
          <div>
            <div className="font-headline text-3xl font-bold tracking-tighter">OCT 24, 2023</div>
            <div className="font-headline text-xl text-primary font-medium">12,450 KM</div>
          </div>
        </div>
        <div className="bg-surface-high p-6 flex flex-col justify-between h-48 border-t-2 border-secondary/30">
          <div>
            <SlidersHorizontal className="text-secondary mb-4 w-6 h-6" />
            <h3 className="font-label text-[10px] font-bold tracking-[0.2em] text-tertiary uppercase">Configured Interval</h3>
          </div>
          <div className="flex items-end justify-between">
            <div className="font-headline text-5xl font-black tracking-tighter">3,000</div>
            <div className="font-label text-xs font-bold text-secondary mb-2 uppercase">KM</div>
          </div>
        </div>
        <div className="bg-surface-lowest p-6 flex flex-col justify-between h-48 border-r-4 border-primary">
          <div>
            <CalendarClock className="text-primary mb-4 w-6 h-6" />
            <h3 className="font-label text-[10px] font-bold tracking-[0.2em] text-tertiary uppercase">Predicted Due Date</h3>
          </div>
          <div>
            <div className="font-headline text-3xl font-bold tracking-tighter">FEB 12, 2024</div>
            <div className="font-headline text-xl text-secondary font-medium">15,450 KM</div>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-surface-container p-8">
        <div className="max-w-md">
          <h4 className="font-headline text-2xl font-bold uppercase tracking-tight mb-2">Mechanical Update</h4>
          <p className="text-on-surface-variant text-sm font-body leading-relaxed">Ensure all filters are replaced and torque specs are met before logging this maintenance cycle. This action is permanent in your logs.</p>
        </div>
        <button className="w-full md:w-auto px-10 py-5 bg-primary-container text-white font-headline font-black uppercase tracking-widest text-sm hover:bg-primary transition-all active:scale-95 duration-75">
          Mark Oil Change Complete
        </button>
      </div>

      {/* Odometer Style List */}
      <div className="mt-20">
        <h5 className="font-label text-[10px] font-bold tracking-[0.3em] text-secondary uppercase mb-8">Maintenance History Log</h5>
        <div className="space-y-2">
          {[
            { id: '04', title: 'Synthetic Grade Ultra', date: 'Aug 15, 2023', km: '9,450 KM', bg: 'bg-surface-low' },
            { id: '03', title: 'Standard Service', date: 'May 02, 2023', km: '6,450 KM', bg: 'bg-surface-high' },
            { id: '02', title: 'Break-in Service', date: 'Jan 20, 2023', km: '1,000 KM', bg: 'bg-surface-low' },
          ].map((log) => (
            <div key={log.id} className={`flex justify-between items-center p-6 ${log.bg}`}>
              <div className="flex items-center gap-6">
                <span className="font-headline text-lg font-bold text-tertiary">{log.id}</span>
                <div>
                  <div className="font-headline font-bold uppercase">{log.title}</div>
                  <div className="text-[10px] text-tertiary uppercase tracking-widest">{log.date}</div>
                </div>
              </div>
              <div className="font-headline font-bold text-xl">{log.km}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
