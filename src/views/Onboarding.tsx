import React, { useState } from 'react';
import { Bike, User, Gauge, CheckCircle2, ChevronRight, ArrowRight, Fuel, MapPin, Wrench } from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import { Spinner } from '../components/ui/Spinner';
import { VENEZUELA_MOTORCYCLES } from '../data/venezuelaMotorcycles';
import { add, update, getById, SettingsData, UserData, DEFAULT_SERVICE_SCHEDULES } from '../db/database';

const FUEL_COLORS = ['bg-error', 'bg-orange-400', 'bg-secondary', 'bg-primary/70', 'bg-primary'];
const FUEL_HEIGHTS = ['h-5', 'h-7', 'h-9', 'h-11', 'h-14'];
const FUEL_LABELS: Record<number, string> = { 1: 'Crítico', 2: 'Bajo', 3: 'Medio', 4: 'Alto', 5: 'Lleno' };

const MOTO_TYPES = [
  { id: 'urban',  emoji: '🏙',  label: 'Urbana / Utilitaria',  sub: '50 – 125 cc',  kmL: 42, tank: 5.5 },
  { id: 'mid',    emoji: '🛣',  label: 'Mediana / Trabajo',     sub: '150 – 250 cc', kmL: 28, tank: 11 },
  { id: 'sport',  emoji: '⚡',  label: 'Deportiva / Potente',   sub: '300 cc o más', kmL: 18, tank: 15 },
  { id: 'manual', emoji: '✏️', label: 'Sé el dato exacto',     sub: null,           kmL: null, tank: null },
] as const;

type MotoTypeId = typeof MOTO_TYPES[number]['id'];

const STEPS = ['welcome', 'profile', 'vehicle', 'status', 'done'] as const;
type Step = typeof STEPS[number];
const STEP_INDEX: Record<Step, number> = { welcome: 0, profile: 1, vehicle: 2, status: 3, done: 4 };

const inputCls = "w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface uppercase font-bold transition-colors";
const labelCls = "font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase block mb-1";

interface OnboardingProps {
  onComplete: (initialTab?: string) => void;
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
  const [motoType, setMotoType] = useState<MotoTypeId | null>(null);
  const [efficiency, setEfficiency] = useState('35');
  const [tankCapacity, setTankCapacity] = useState('');
  const [oilIntervalInput, setOilIntervalInput] = useState('3000');

  const selectedBrand = VENEZUELA_MOTORCYCLES.find(b => b.brand === brand);
  const currentIndex = STEP_INDEX[step];
  const totalSteps = STEPS.length - 1;

  const goNext = (target: Step) => setStep(target);

  const handleSelectMotoType = (id: MotoTypeId) => {
    setMotoType(id);
    const preset = MOTO_TYPES.find(t => t.id === id);
    if (preset?.kmL) setEfficiency(String(preset.kmL));
    if (preset?.tank) setTankCapacity(String(preset.tank));
  };

  const handleFinish = async (initialTab?: string) => {
    setIsSaving(true);
    try {
      const vehicleId = Date.now();
      const now = new Date().toISOString();
      const odoNum = parseInt(odo) || 0;

      const oilIntervalNum = parseInt(oilIntervalInput) || 3000;

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
        kilometrajeProximoServicio: odoNum + oilIntervalNum,
        fechaUltimoServicio: now,
        fechaProximoServicio: now,
        aseguradora: '',
        numeroPoliza: '',
        vigenciaSeguro: now,
        categoria: selectedBrand?.category || 'PASEO',
        identificadorUnidad: alias.trim() || (brand ? `${brand} ${year}` : 'Mi moto'),
        capacidadTanque: parseFloat(tankCapacity) || undefined,
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
        oilInterval: parseInt(oilIntervalInput) || 3000,
        initialized: true,
        onboardingComplete: true,
        activeVehicleId: vehicleId,
      });

      onComplete(initialTab);
    } catch (err) {
      console.error('Onboarding save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Progress bar ──────────────────────────────────────────────────────────

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

  // ── Step 1 — Bienvenida ───────────────────────────────────────────────────

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
              Tu asistente de mantenimiento
            </p>
          </div>

          <div className="text-left space-y-3">
            {[
              { icon: MapPin,  text: 'Registra tus rutas y cargas de gasolina' },
              { icon: Gauge,   text: 'Sabe siempre cuánto rinde tu moto' },
              { icon: Wrench,  text: 'Nunca te olvides del próximo servicio' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-bold text-on-surface">{text}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => goNext('profile')}
              className="w-full bg-primary text-on-primary py-4 font-headline font-black uppercase tracking-widest hover:bg-primary/90 transition-all rounded-full shadow-elevation-2 flex items-center justify-center gap-2"
            >
              Comenzar
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-surface-variant text-[11px]">Solo toma 1 minuto · todo se puede ajustar después</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2 — Perfil ───────────────────────────────────────────────────────

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
              <p className="text-surface-variant text-sm mt-1">Así te saludaremos en la app</p>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Tu nombre</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputCls}
                type="text"
                placeholder="¿Cómo te llamamos?"
                autoFocus
              />
            </div>
          </div>
        </div>
        <StepNav onSkip={() => goNext('vehicle')} onNext={() => goNext('vehicle')} />
      </div>
    );
  }

  // ── Step 3 — Vehículo ─────────────────────────────────────────────────────

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
                <p className="text-surface-variant text-sm">Dinos con qué moto andas</p>
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
              <label className={labelCls}>Apodo de tu moto (opcional)</label>
              <input value={alias} onChange={e => setAlias(e.target.value)} type="text" placeholder="La roja, Trabajo…" className={inputCls} />
              <p className="text-[11px] text-surface-variant mt-1 leading-snug">Un nombre corto para identificarla fácilmente</p>
            </div>
          </div>
        </div>
        <StepNav onSkip={() => goNext('status')} onNext={() => goNext('status')} />
      </div>
    );
  }

  // ── Step 4 — Estado actual ────────────────────────────────────────────────

  if (step === 'status') {
    const isManual = motoType === 'manual';

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
                <p className="text-surface-variant text-sm">Todo se puede ajustar después</p>
              </div>
            </div>

            {/* KM del tablero */}
            <div className="space-y-1">
              <label className={labelCls}>¿Cuántos KM tiene tu moto?</label>
              <input value={odo} onChange={e => setOdo(e.target.value)} type="number" min="0" placeholder="0" className={inputCls} />
              <p className="text-[11px] text-surface-variant mt-1 leading-snug">El número del tablero. Si no lo sabes ahora, deja 0.</p>
            </div>

            {/* Selector visual de tipo de moto */}
            <div className="space-y-2">
              <label className={labelCls}>¿Qué tipo de moto es?</label>
              <div className="grid grid-cols-2 gap-2">
                {MOTO_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectMotoType(t.id)}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all duration-150 active:scale-95 ${
                      motoType === t.id
                        ? 'border-primary bg-primary/10'
                        : 'border-outline-variant/40 bg-surface-container hover:border-primary/40'
                    }`}
                  >
                    <span className="text-xl leading-none">{t.emoji}</span>
                    <span className="font-headline font-black text-xs uppercase tracking-tight text-on-surface leading-tight">{t.label}</span>
                    {t.sub && <span className="text-[10px] text-surface-variant font-bold">{t.sub}</span>}
                    {t.kmL && motoType === t.id && (
                      <span className="text-[10px] text-primary font-black uppercase tracking-wider mt-0.5">≈ {t.kmL} km/L</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-surface-variant leading-snug">Esto nos ayuda a estimar el consumo de tu moto</p>
            </div>

            {/* Campo manual — solo si elige "Sé el dato exacto" */}
            {isManual && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                <label className={labelCls}>¿Cuántos KM rinde por litro?</label>
                <input
                  value={efficiency}
                  onChange={e => setEfficiency(e.target.value)}
                  type="number"
                  min="1"
                  step="0.5"
                  className={inputCls}
                  autoFocus
                />
                <p className="text-[11px] text-surface-variant mt-1 leading-snug">Ej: 35 = recorre 35 km con 1 litro</p>
              </div>
            )}

            {/* Capacidad del tanque */}
            <div className="space-y-1 animate-in fade-in duration-300">
              <label className={labelCls}>¿Cuántos litros caben en el tanque? (sin la reserva)</label>
              <input
                value={tankCapacity}
                onChange={e => setTankCapacity(e.target.value)}
                type="number"
                min="1"
                step="0.5"
                placeholder={motoType && motoType !== 'manual' ? String(MOTO_TYPES.find(t => t.id === motoType)?.tank ?? '') : '10'}
                className={inputCls}
              />
              <p className="text-[11px] text-surface-variant mt-1 leading-snug">Lo dice el manual. Si no lo sabes, déjalo en blanco.</p>
            </div>

            {/* Intervalo de cambio de aceite */}
            <div className="space-y-1">
              <label className={labelCls}>¿Cada cuántos KM cambias el aceite?</label>
              <input
                value={oilIntervalInput}
                onChange={e => setOilIntervalInput(e.target.value)}
                type="number"
                min="500"
                step="500"
                placeholder="3000"
                className={inputCls}
              />
              <p className="text-[11px] text-surface-variant mt-1 leading-snug">Normalmente 2.000–4.000 km según la marca</p>
            </div>

            {/* Nivel de gasolina */}
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase flex justify-between">
                ¿Cómo está de gasolina?
                <span className={`font-black ${fuelLevel <= 1 ? 'text-error' : fuelLevel <= 2 ? 'text-secondary' : 'text-primary'}`}>
                  {FUEL_LABELS[fuelLevel]}
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

  // ── Step 5 — Listo ────────────────────────────────────────────────────────

  const firstName = name.trim().split(' ')[0];

  const quickStarts = [
    {
      icon: Fuel,
      title: 'Registrar gasolina',
      sub: 'Anota tu primera carga de combustible',
      tab: 'logs',
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      icon: Wrench,
      title: 'Ver mantenimiento',
      sub: 'Revisa qué servicios le tocan a tu moto',
      tab: 'maintenance',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Gauge,
      title: 'Explorar el resumen',
      sub: 'Mira el dashboard principal',
      tab: undefined,
      color: 'text-surface-variant',
      bg: 'bg-surface-high',
    },
  ];

  return (
    <div className="fixed inset-0 z-[90] bg-surface flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 overflow-y-auto">
      <div className="max-w-sm w-full space-y-7 py-8">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="font-headline text-4xl font-black uppercase tracking-tighter italic text-primary">
            {firstName ? `¡Listo, ${firstName}!` : '¡Todo listo!'}
          </h2>
          <p className="text-surface-variant text-sm mt-2">
            {brand
              ? `Tu ${brand}${model ? ` ${model}` : ''} está registrada en NAVE`
              : 'Tu moto está registrada en NAVE'}
          </p>
        </div>

        {/* Quick-start cards */}
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-widest text-surface-variant text-center mb-3">
            ¿Por dónde quieres empezar?
          </p>
          {quickStarts.map(({ icon: Icon, title, sub, tab, color, bg }) => (
            <button
              key={title}
              onClick={() => handleFinish(tab)}
              disabled={isSaving}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-container hover:bg-surface-high transition-colors disabled:opacity-60 text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-headline font-black text-sm uppercase tracking-tight text-on-surface">{title}</p>
                <p className="text-[11px] text-surface-variant leading-snug">{sub}</p>
              </div>
              {isSaving
                ? <Spinner className="w-4 h-4 flex-shrink-0" />
                : <ChevronRight className="w-4 h-4 text-surface-variant flex-shrink-0" />
              }
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-componente: botones de navegación ─────────────────────────────────

function StepNav({ onSkip, onNext }: { onSkip: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/20 bg-surface">
      <div className="flex flex-col items-start gap-0.5">
        <button
          type="button"
          onClick={onSkip}
          className="text-surface-variant font-bold uppercase tracking-wider text-[11px] hover:text-on-surface transition-colors"
        >
          Continuar sin esto
        </button>
        <span className="text-[10px] text-surface-variant/60 leading-none">podrás completarlo después</span>
      </div>
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
