import React, { useState } from 'react';
import { Bike, User, Gauge, CheckCircle2, ChevronRight, ArrowRight, Fuel, MapPin, Star } from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import { Spinner } from '../components/ui/Spinner';
import { VENEZUELA_MOTORCYCLES } from '../data/venezuelaMotorcycles';
import { add, update, getById, SettingsData, UserData, DEFAULT_SERVICE_SCHEDULES } from '../db/database';

const FUEL_COLORS = ['bg-error', 'bg-orange-400', 'bg-secondary', 'bg-primary/70', 'bg-primary'];
const FUEL_HEIGHTS = ['h-5', 'h-7', 'h-9', 'h-11', 'h-14'];
const FUEL_LABELS: Record<number, string> = { 1: 'Crítico', 2: 'Bajo', 3: 'Medio', 4: 'Alto', 5: 'Lleno' };

const STEPS = ['welcome', 'profile', 'vehicle', 'status', 'done'] as const;
type Step = typeof STEPS[number];

const STEP_INDEX: Record<Step, number> = { welcome: 0, profile: 1, vehicle: 2, status: 3, done: 4 };

const inputCls = "w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface uppercase font-bold transition-colors";
const labelCls = "font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase block mb-1";

interface OnboardingProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [isSaving, setIsSaving] = useState(false);

  // Step 2 — perfil
  const [name, setName] = useState('');

  // Step 3 — vehículo
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [plate, setPlate] = useState('');
  const [alias, setAlias] = useState('');

  // Step 4 — estado
  const [odo, setOdo] = useState('');
  const [fuelLevel, setFuelLevel] = useState(3);
  const [efficiency, setEfficiency] = useState('35');

  const selectedBrand = VENEZUELA_MOTORCYCLES.find(b => b.brand === brand);
  const currentIndex = STEP_INDEX[step];
  const totalSteps = STEPS.length - 1; // welcome doesn't count in progress

  const goNext = (target: Step) => setStep(target);

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const vehicleId = Date.now();
      const now = new Date().toISOString();
      const odoNum = parseInt(odo) || 0;

      await update('vehicle', {
        id: vehicleId,
        marca: brand || 'NUEVA',
        modelo: model || 'UNIDAD',
        anio: parseInt(year) || new Date().getFullYear(),
        color: '',
        placa: plate.toUpperCase(),
        vin: '',
        tipoCombustible: 'gasoline',
        nivelGasolina: fuelLevel,
        rendimientoKmL: parseFloat(efficiency) || 35,
        kilometrajeActual: odoNum,
        kilometrajeUltimoServicio: 0,
        kilometrajeProximoServicio: odoNum + 3000,
        fechaUltimoServicio: now,
        fechaProximoServicio: now,
        aseguradora: '',
        numeroPoliza: '',
        vigenciaSeguro: now,
        categoria: selectedBrand?.category || 'PASEO',
        identificadorUnidad: alias.toUpperCase() || 'MOTO_01',
        creadoEn: now,
        actualizadoEn: now,
      });

      for (const tpl of DEFAULT_SERVICE_SCHEDULES) {
        await add('serviceSchedules', { ...tpl, vehicleId });
      }

      if (name.trim()) {
        const currentUser = await getById<UserData>('user', 1);
        await update('user', { ...(currentUser ?? { id: 1, email: '' }), id: 1, name: name.trim() });
      }

      const currentSettings = await getById<SettingsData>('settings', 1);
      await update('settings', {
        ...(currentSettings ?? { id: 1, oilInterval: 3000, language: 'es', theme: 'dark' as const, distanceUnits: 'km' }),
        id: 1,
        initialized: true,
        onboardingComplete: true,
        activeVehicleId: vehicleId,
      });

      onComplete();
    } catch (err) {
      console.error('Onboarding save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Renders ──────────────────────────────────────────────────────────────

  const renderProgress = () => (
    <div className="w-full px-6 pt-6 pb-2">
      <div className="flex items-center gap-2 mb-1">
        {STEPS.slice(1).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i < currentIndex ? 'bg-primary' : i === currentIndex - 1 ? 'bg-primary' : 'bg-surface-high'
            }`}
          />
        ))}
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-surface-variant text-right">
        {currentIndex}/{totalSteps}
      </p>
    </div>
  );

  // Step 1 — Bienvenida
  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 z-[90] bg-surface flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
        <div className="max-w-sm w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Bike className="w-12 h-12 text-primary" />
            </div>
          </div>

          <div>
            <h1 className="font-headline text-6xl font-black uppercase tracking-tighter italic text-primary">NAVE</h1>
            <p className="text-surface-variant font-bold uppercase tracking-widest text-[11px] mt-2">
              Navegación del Vehículo
            </p>
          </div>

          <div className="text-left space-y-3">
            {[
              { icon: MapPin,       text: 'Registra tus rutas y recorridos' },
              { icon: Gauge,        text: 'Controla combustible y kilometraje' },
              { icon: Star,         text: 'Gestiona el mantenimiento preventivo' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-bold uppercase tracking-wide text-on-surface">{text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => goNext('profile')}
            className="w-full bg-primary text-on-primary py-4 font-headline font-black uppercase tracking-widest hover:bg-primary/90 transition-all rounded-full shadow-elevation-2 flex items-center justify-center gap-2"
          >
            Comenzar
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Step 2 — Perfil
  if (step === 'profile') {
    return (
      <div className="fixed inset-0 z-[90] bg-surface flex flex-col animate-in slide-in-from-right duration-300">
        {renderProgress()}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-sm mx-auto space-y-8">
            <div className="flex justify-center pt-4">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center">
                <User className="w-10 h-10 text-secondary" />
              </div>
            </div>
            <div>
              <h2 className="font-headline text-3xl font-black uppercase tracking-tighter italic">¿Cómo te llamamos?</h2>
              <p className="text-surface-variant text-sm mt-1">Tu nombre de piloto en NAVE</p>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Nombre del Piloto</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputCls}
                type="text"
                placeholder="PILOTO_01"
                autoFocus
              />
            </div>
          </div>
        </div>
        <StepNav onSkip={() => goNext('vehicle')} onNext={() => goNext('vehicle')} />
      </div>
    );
  }

  // Step 3 — Vehículo
  if (step === 'vehicle') {
    return (
      <div className="fixed inset-0 z-[90] bg-surface flex flex-col animate-in slide-in-from-right duration-300">
        {renderProgress()}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-sm mx-auto space-y-5">
            <div className="flex items-center gap-3 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bike className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-headline text-2xl font-black uppercase tracking-tighter italic">Tu moto</h2>
                <p className="text-surface-variant text-sm">Cuéntanos sobre tu unidad</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Marca</label>
              <CustomSelect
                value={brand}
                onChange={v => { setBrand(v); setModel(''); }}
                placeholder="Selecciona una marca…"
                options={VENEZUELA_MOTORCYCLES.map(b => ({ value: b.brand, label: b.brand }))}
              />
            </div>

            {selectedBrand && selectedBrand.models.length > 0 && (
              <div className="space-y-1">
                <label className={labelCls}>Modelo</label>
                <CustomSelect
                  value={model}
                  onChange={setModel}
                  placeholder="Selecciona un modelo…"
                  options={selectedBrand.models.map(m => ({ value: m, label: m }))}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Año</label>
                <input value={year} onChange={e => setYear(e.target.value)} type="number" min="1970" max="2100" className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Placa</label>
                <input value={plate} onChange={e => setPlate(e.target.value)} type="text" placeholder="ABC-123" className={inputCls} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Alias / Identificador</label>
              <input value={alias} onChange={e => setAlias(e.target.value)} type="text" placeholder="MI_MOTO" className={inputCls} />
            </div>
          </div>
        </div>
        <StepNav onSkip={() => goNext('status')} onNext={() => goNext('status')} />
      </div>
    );
  }

  // Step 4 — Estado actual
  if (step === 'status') {
    return (
      <div className="fixed inset-0 z-[90] bg-surface flex flex-col animate-in slide-in-from-right duration-300">
        {renderProgress()}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-sm mx-auto space-y-6">
            <div className="flex items-center gap-3 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Gauge className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <h2 className="font-headline text-2xl font-black uppercase tracking-tighter italic">Estado actual</h2>
                <p className="text-surface-variant text-sm">Puedes ajustarlo después</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Kilometraje actual (km)</label>
              <input value={odo} onChange={e => setOdo(e.target.value)} type="number" min="0" placeholder="0" className={inputCls} />
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Rendimiento (km/L)</label>
              <input value={efficiency} onChange={e => setEfficiency(e.target.value)} type="number" min="1" step="0.5" className={inputCls} />
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase flex justify-between">
                Nivel de Gasolina
                <span className={`font-black ${fuelLevel <= 1 ? 'text-error' : fuelLevel <= 2 ? 'text-secondary' : 'text-primary'}`}>
                  {fuelLevel}/5 — {FUEL_LABELS[fuelLevel]}
                </span>
              </label>
              <div className="flex items-end gap-2 bg-surface-container rounded-xl p-3">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFuelLevel(level)}
                    className={`flex-1 rounded-md transition-all duration-200 active:scale-95 ${FUEL_HEIGHTS[level - 1]} ${
                      level <= fuelLevel ? FUEL_COLORS[level - 1] : 'bg-surface-high opacity-40'
                    }`}
                  />
                ))}
                <Fuel className={`w-5 h-5 ml-1 mb-0.5 flex-shrink-0 ${fuelLevel <= 1 ? 'text-error' : 'text-primary'}`} />
              </div>
            </div>
          </div>
        </div>
        <StepNav onSkip={() => goNext('done')} onNext={() => goNext('done')} />
      </div>
    );
  }

  // Step 5 — Listo
  return (
    <div className="fixed inset-0 z-[90] bg-surface flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="max-w-sm w-full space-y-8">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="font-headline text-4xl font-black uppercase tracking-tighter italic text-primary">
            {name.trim() ? `¡Listo, ${name.trim().split(' ')[0]}!` : '¡Todo listo!'}
          </h2>
          <p className="text-surface-variant text-sm mt-2">Tu perfil en NAVE está configurado</p>
        </div>

        {(brand || odo) && (
          <div className="bg-surface-container rounded-2xl p-5 shadow-elevation-1 space-y-3">
            {brand && (
              <div className="flex items-center gap-3">
                <Bike className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-surface-variant">Unidad</p>
                  <p className="font-headline font-black text-sm uppercase truncate">{brand} {model}</p>
                </div>
              </div>
            )}
            {odo && (
              <div className="flex items-center gap-3">
                <Gauge className="w-4 h-4 text-secondary flex-shrink-0" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-surface-variant">Kilometraje</p>
                  <p className="font-headline font-black text-sm uppercase">{parseInt(odo).toLocaleString()} KM</p>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleFinish}
          disabled={isSaving}
          className="w-full bg-primary text-on-primary py-4 font-headline font-black uppercase tracking-widest hover:bg-primary/90 transition-all rounded-full shadow-elevation-2 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSaving ? <Spinner className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          {isSaving ? 'Guardando…' : 'Entrar a NAVE'}
        </button>
      </div>
    </div>
  );
}

// ── Sub-componente: botones de navegación ─────────────────────────────────

function StepNav({ onSkip, onNext }: { onSkip: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-t border-outline-variant/20 bg-surface">
      <button
        type="button"
        onClick={onSkip}
        className="text-surface-variant font-bold uppercase tracking-wider text-[11px] hover:text-on-surface transition-colors"
      >
        Saltar
      </button>
      <button
        type="button"
        onClick={onNext}
        className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full font-headline font-black uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors"
      >
        Continuar
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
