import React from 'react';
import { BadgeCheck, Camera, Zap, Cpu, Gauge, Info } from 'lucide-react';

export function ProfileScreen() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero: Asymmetric Photo Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-0 mb-20 relative">
        <div className="lg:col-span-8 bg-surface-lowest relative aspect-[16/9] lg:aspect-auto lg:h-[500px] overflow-hidden group">
          <img 
            className="w-full h-full object-cover" 
            alt="Motorcycle" 
            src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60"></div>
          {/* Floating Technical Label */}
          <div className="absolute top-8 left-0 bg-primary-container px-4 py-1 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-white" />
            <span className="font-headline font-bold text-xs tracking-widest text-white uppercase">ACTIVE_UNIT_01</span>
          </div>
        </div>
        {/* Side Detail Overlay */}
        <div className="lg:col-span-4 bg-surface-high p-8 flex flex-col justify-between border-l-0 lg:border-l-4 border-primary">
          <div>
            <h2 className="font-headline text-5xl font-black leading-none mb-2 tracking-tighter text-white">DUCATI<br/><span className="text-primary">PANIGALE V4</span></h2>
            <p className="font-label text-secondary text-sm font-bold tracking-[0.2em] mb-8">SUPERSPORT SERIES // 2024</p>
            <div className="space-y-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase mb-1">Status</span>
                <span className="font-headline text-xl text-secondary">READY TO RACE</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase mb-1">Last Log</span>
                <span className="font-headline text-xl">12 OCT 2023</span>
              </div>
            </div>
          </div>
          <div className="mt-12 lg:mt-0">
            <button className="w-full bg-secondary-container hover:bg-secondary transition-colors py-4 px-6 flex items-center justify-between group active:scale-[0.98] duration-75">
              <span className="font-headline font-black text-white group-hover:text-surface-lowest uppercase tracking-tight">Change Photo</span>
              <Camera className="text-white group-hover:text-surface-lowest w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Technical Specs Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        <div className="bg-surface-lowest p-6 border-l-2 border-primary-container flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">Performance</span>
            <Zap className="text-primary w-6 h-6" />
          </div>
          <div>
            <div className="font-headline text-4xl font-black text-white italic">214 <span className="text-xs font-normal not-italic text-on-surface-variant">HP</span></div>
            <div className="w-full h-1 bg-surface-high mt-4 overflow-hidden">
              <div className="h-full bg-primary-container w-[85%]"></div>
            </div>
          </div>
        </div>
        <div className="bg-surface-lowest p-6 border-l-2 border-secondary flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">Engine Block</span>
            <Cpu className="text-secondary w-6 h-6" />
          </div>
          <div>
            <div className="font-headline text-4xl font-black text-white italic">1103 <span className="text-xs font-normal not-italic text-on-surface-variant">CC</span></div>
            <p className="text-[10px] font-bold text-on-surface-variant tracking-widest mt-2 uppercase">Desmosedici Stradale 90° V4</p>
          </div>
        </div>
        <div className="bg-surface-lowest p-6 border-l-2 border-primary flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">Telemetry</span>
            <Gauge className="text-primary w-6 h-6" />
          </div>
          <div>
            <div className="font-headline text-4xl font-black text-white italic">4,280 <span className="text-xs font-normal not-italic text-on-surface-variant">KM</span></div>
            <p className="text-[10px] font-bold text-on-surface-variant tracking-widest mt-2 uppercase">Lifetime Distance</p>
          </div>
        </div>
      </section>

      {/* Profile Settings / Form Area */}
      <section className="bg-surface-low p-8 border-t-4 border-surface-high">
        <h3 className="font-headline text-2xl font-black mb-10 tracking-tight text-white uppercase flex items-center gap-3">
          <span className="w-8 h-[2px] bg-primary"></span> Machine Identity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {[
            { label: 'Manufacturer', val: 'DUCATI' },
            { label: 'Model Name', val: 'PANIGALE V4' },
            { label: 'Manufacturing Year', val: '2024' },
            { label: 'VIN / Chassis Number', val: 'ZDM1234567890BC' },
          ].map((field, i) => (
            <div key={i} className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{field.label}</label>
              <input 
                className="w-full bg-surface-high border-0 border-l-2 border-transparent focus:border-primary-container focus:outline-none focus:ring-0 font-headline text-lg font-bold text-white uppercase px-4 py-3" 
                type="text" 
                defaultValue={field.val} 
              />
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 text-on-surface-variant">
            <Info className="w-6 h-6" />
            <p className="text-xs font-medium max-w-xs uppercase tracking-tighter">Updating these fields will reset the technical calibration records for this unit.</p>
          </div>
          <button className="w-full md:w-auto bg-primary-container hover:bg-primary transition-all py-4 px-12 font-headline font-black text-white uppercase tracking-widest active:scale-95">
            Save Modifications
          </button>
        </div>
      </section>
    </div>
  );
}
