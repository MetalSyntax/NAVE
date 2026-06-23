import React, { useMemo, useEffect, useRef, useState } from 'react';
import { TrendingUp, PlusCircle, Droplet, BellRing, Bike, Route, Wrench, BookOpen, Fuel, ChevronRight, AlertTriangle, Check, X, Gauge } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO } from '../components/ui/SEO';
import { useLogs } from '../hooks/useLogs';
import { useMaintenance } from '../hooks/useMaintenance';
import { useServiceSchedules } from '../hooks/useServiceSchedules';
import { useNotifications } from '../hooks/useNotifications';
import { useVehicle } from '../hooks/useVehicle';
import { useRoutes } from '../hooks/useRoutes';
import { useManuals } from '../hooks/useManuals';
import { computeServiceAlerts } from '../utils/serviceAlerts';
import { Toast, useToast } from '../components/ui/Toast';
import { LoadingScreen } from '../components/ui/Spinner';

const FUEL_LEVEL_LABELS: Record<number, string> = {
  1: 'Crítica', 2: 'Baja', 3: 'Media', 4: 'Alta', 5: 'Llena',
};

export function DashboardScreen({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { t } = useTranslation(['seo', 'common', 'vehicle', 'dashboard', 'maintenance']);
  const { logs, addLog, isLoading: logsLoading } = useLogs();
  const { maintenanceLogs, settings, isLoading: maintLoading } = useMaintenance();
  const { schedules } = useServiceSchedules();
  const { vehicle, updateVehicle } = useVehicle();
  const { routes, addRoute } = useRoutes();
  const { manuals } = useManuals();
  const { sendNotification } = useNotifications();
  const { toast, showToast, hideToast } = useToast();
  const notifiedRef = useRef(false);

  // KM modal state (tablero)
  const [editingKm, setEditingKm] = useState(false);
  const [kmDraft, setKmDraft] = useState('');

  // Recorrido semanal modal state
  const [weekModalOpen, setWeekModalOpen] = useState(false);
  const [weekMode, setWeekMode] = useState<'km' | 'fuel'>('km');
  const [weekKm, setWeekKm] = useState('');

  // Fuel log form state (tarjeta gasolina)
  const [fuelFormOpen, setFuelFormOpen] = useState(false);
  const [fuelLitros, setFuelLitros] = useState('');
  const [fuelOdo, setFuelOdo] = useState('');
  const [fuelDate, setFuelDate] = useState('');

  const isLoading = logsLoading || maintLoading;
  const hasMaintenanceData = maintenanceLogs.length > 0;

  const stats = useMemo(() => {
    let totalDist = 0;
    let distThisWeek = 0;
    let oilRemaining = '--';
    let oilLifePercent = 100;
    let lastOilDate: Date | null = null;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Total: máximo entre odo de fuel logs y odoEnd de rutas completadas
    const maxLogOdo = logs.length > 0 ? Math.max(...logs.map(l => l.odo)) : 0;
    const maxRouteOdo = routes
      .filter(r => r.status === 'completed' && r.odoEnd)
      .reduce((max, r) => Math.max(max, r.odoEnd || 0), 0);
    totalDist = Math.max(maxLogOdo, maxRouteOdo);

    // Esta semana: diff de odo entre fuel logs
    if (logs.length > 0) {
      const recentLogs = logs.filter(l => new Date(l.date) >= oneWeekAgo).sort((a, b) => b.odo - a.odo);
      if (recentLogs.length > 0) {
        const prevLog = logs.filter(l => new Date(l.date) < oneWeekAgo).sort((a, b) => b.odo - a.odo)[0];
        distThisWeek = prevLog
          ? Math.max(0, recentLogs[0].odo - prevLog.odo)
          : Math.max(0, recentLogs[0].odo - recentLogs[recentLogs.length - 1].odo);
      }
    }

    // Esta semana: sumar distancia de rutas completadas (reactivo al borrar)
    distThisWeek += routes
      .filter(r => r.status === 'completed' && new Date(r.endDate || r.startDate) >= oneWeekAgo)
      .reduce((sum, r) => sum + (r.distance || 0), 0);

    if (maintenanceLogs && settings) {
      const sortedMaint = [...maintenanceLogs].sort((a, b) => b.km - a.km);
      const lastServiceKm = sortedMaint.length > 0 ? sortedMaint[0].km : 0;
      const kmSinceService = totalDist - lastServiceKm;
      const remainingKm = Math.max(0, settings.oilInterval - kmSinceService);
      oilRemaining = remainingKm.toLocaleString();
      oilLifePercent = Math.max(0, Math.min(100, 100 - (kmSinceService / settings.oilInterval) * 100));
    }

    if (maintenanceLogs.length > 0) {
      const sortedByDate = [...maintenanceLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      lastOilDate = new Date(sortedByDate[0].date);
    }

    return { totalDist, distThisWeek, oilRemaining, oilLifePercent, lastOilDate };
  }, [logs, maintenanceLogs, settings, routes]);

  const oilStatus = useMemo(() => {
    if (!hasMaintenanceData) {
      return { msg: t('dashboard:oil_no_data'), color: 'text-surface-variant', barColor: 'bg-surface-variant', urgency: 'none' as const };
    }
    if (stats.oilLifePercent >= 50) {
      return { msg: t('dashboard:oil_status_good', { km: stats.oilRemaining }), color: 'text-primary', barColor: 'bg-primary', urgency: 'good' as const };
    }
    if (stats.oilLifePercent >= 20) {
      return { msg: t('dashboard:oil_status_warn'), color: 'text-secondary', barColor: 'bg-secondary', urgency: 'warn' as const };
    }
    if (stats.oilLifePercent > 0) {
      return { msg: t('dashboard:oil_status_urgent'), color: 'text-error', barColor: 'bg-error', urgency: 'critical' as const };
    }
    return { msg: t('dashboard:oil_status_overdue'), color: 'text-error', barColor: 'bg-error', urgency: 'overdue' as const };
  }, [hasMaintenanceData, stats.oilLifePercent, stats.oilRemaining, t]);

  const fuelStats = useMemo(() => {
    if (!vehicle?.capacidadTanque) return null;
    const rendimiento = vehicle.rendimientoKmL > 0 ? vehicle.rendimientoKmL : 1;
    const odoNow = Math.max(stats.totalDist, vehicle.kilometrajeActual || 0);
    let litros: number;
    if (logs.length > 0) {
      // Use the most recent fuel log as baseline, subtract consumption since then
      const lastLog = [...logs].sort((a, b) => b.odo - a.odo)[0];
      const distSince = Math.max(0, odoNow - lastLog.odo);
      litros = Math.max(0, Math.round((lastLog.fuel - distSince / rendimiento) * 10) / 10);
    } else {
      litros = Math.round((vehicle.nivelGasolina / 5) * vehicle.capacidadTanque * 10) / 10;
    }
    const autoRestante = Math.round(litros * rendimiento);
    const autoTotal = Math.round(vehicle.capacidadTanque * rendimiento);
    const fuelPct = Math.min(100, (litros / vehicle.capacidadTanque) * 100);
    return { litros, autoRestante, autoTotal, fuelPct };
  }, [vehicle, logs, stats.totalDist]);

  const handleSaveKm = async () => {
    if (!vehicle) return;
    const km = parseInt(kmDraft);
    if (isNaN(km) || km < 0) return;
    await updateVehicle({ ...vehicle, kilometrajeActual: km, actualizadoEn: new Date().toISOString() });
    setEditingKm(false);
  };

  const openKmModal = () => {
    setKmDraft(String(vehicle?.kilometrajeActual ?? currentOdo));
    setEditingKm(true);
  };

  const handleAddFuelLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const litros = parseFloat(fuelLitros);
    const odo = parseInt(fuelOdo);
    if (isNaN(litros) || isNaN(odo)) return;
    await addLog({
      date: fuelDate,
      odo,
      fuel: litros,
      eff: vehicle?.rendimientoKmL ?? 0,
      notes: '',
    });
    setFuelFormOpen(false);
    setFuelLitros('');
    showToast(t('dashboard:fuel_refill'), 'success');
  };

  const handleAddWeekRide = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    if (weekMode === 'km') {
      const km = parseFloat(weekKm);
      if (isNaN(km) || km <= 0) return;
      const newOdo = currentOdo + km;
      await addRoute({
        status: 'completed',
        startDate: now,
        endDate: now,
        odoStart: currentOdo,
        odoEnd: newOdo,
        distance: km,
        rendimientoKmL: vehicle?.rendimientoKmL ?? 0,
        fuelUsed: vehicle?.rendimientoKmL ? Math.round((km / vehicle.rendimientoKmL) * 10) / 10 : 0,
      });
    } else {
      const litros = parseFloat(fuelLitros);
      const odo = parseInt(fuelOdo);
      if (isNaN(litros) || isNaN(odo)) return;
      await addLog({ date: fuelDate || today, odo, fuel: litros, eff: vehicle?.rendimientoKmL ?? 0, notes: '' });
    }
    setWeekModalOpen(false);
    setWeekKm('');
    setFuelLitros('');
    showToast(t('common:saved_success'), 'success');
  };

  const recentActivity = useMemo(() => {
    const l = logs.map(x => ({ id: `L-${x.id}`, title: `${t('dashboard:fuel_refill')} — ${x.fuel}L`, date: new Date(x.date), type: 'log' }));
    const m = maintenanceLogs.map(x => ({ id: `M-${x.id}`, title: x.type, date: new Date(x.date), type: 'maint' }));
    const r = routes
      .filter(x => x.status === 'completed')
      .map(x => ({ id: `R-${x.id}`, title: `${t('dashboard:summary_routes')} — ${(x.distance || 0).toLocaleString()} km`, date: new Date(x.endDate || x.startDate), type: 'route' }));
    return [...l, ...m, ...r]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
      .map((item, index) => ({
        id: `0${index + 1}`,
        title: item.title,
        sub: `${item.type === 'maint' ? t('dashboard:maint_label') : item.type === 'route' ? t('dashboard:summary_routes') : t('dashboard:telemetry_label')} · ${item.date.toLocaleDateString()}`,
        type: item.type,
      }));
  }, [logs, maintenanceLogs, routes, t]);

  const currentOdo = Math.max(stats.totalDist, vehicle?.kilometrajeActual || 0);
  const alerts = useMemo(() => computeServiceAlerts(schedules, currentOdo), [schedules, currentOdo]);
  const activeAlerts = useMemo(() => alerts.filter(a => a.level !== 'ok'), [alerts]);
  const svcLabel = (type: string) => t(`maintenance:svc_${type}`, { defaultValue: type });

  useEffect(() => {
    if (notifiedRef.current || activeAlerts.length === 0) return;
    notifiedRef.current = true;
    const top = activeAlerts[0];
    const detail = top.level === 'due'
      ? t('dashboard:alert_due')
      : t('dashboard:alert_in', { km: top.remaining.toLocaleString() });
    sendNotification(t('dashboard:alerts_title'), `${svcLabel(top.schedule.type)} — ${detail}`, 'service-alerts');
  }, [activeAlerts]);

  const BASE_LOG_KEY = `nave_base_log_v${vehicle?.id ?? 0}`;
  useEffect(() => {
    if (logsLoading || !vehicle || logs.length > 0) return;
    if (!vehicle.nivelGasolina || vehicle.nivelGasolina === 0) return;
    if (localStorage.getItem(BASE_LOG_KEY)) return;
    localStorage.setItem(BASE_LOG_KEY, '1');
    const liters = vehicle.capacidadTanque
      ? Math.round((vehicle.nivelGasolina / 5) * vehicle.capacidadTanque * 10) / 10
      : vehicle.nivelGasolina * 2;
    addLog({
      date: new Date().toISOString().split('T')[0],
      odo: vehicle.kilometrajeActual,
      fuel: liters,
      eff: vehicle.rendimientoKmL ?? 0,
      notes: 'Registro inicial',
    });
  }, [logsLoading, logs.length, vehicle]);

  const completedRoutes = useMemo(() => routes.filter(r => r.status === 'completed'), [routes]);
  const lastRoute = completedRoutes[0];
  const nextService = activeAlerts[0]?.nextKm ?? (vehicle?.kilometrajeProximoServicio || 0);

  if (isLoading && (!logs || logs.length === 0)) return <LoadingScreen />;

  const isOilCritical = oilStatus.urgency === 'critical' || oilStatus.urgency === 'overdue';
  const isOilWarn = oilStatus.urgency === 'warn';
  const fuelLabel = vehicle ? (FUEL_LEVEL_LABELS[vehicle.nivelGasolina] ?? `${vehicle.nivelGasolina}/5`) : null;

  const inputCls = 'w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-2 py-1.5 font-bold text-sm transition-colors';
  const labelCls = 'font-label text-[9px] font-extrabold text-secondary tracking-[0.15em] uppercase block';

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <SEO
        titleKey="home_title"
        descKey="home_desc"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'NAVE',
          operatingSystem: 'All',
          applicationCategory: 'AutomotiveApplication',
          offers: { '@type': 'Offer', price: '0.00', priceCurrency: 'USD' },
          description: t('seo:home_desc'),
        }}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* KM modal overlay */}
      {editingKm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setEditingKm(false)}
        >
          <div
            className="bg-surface-container rounded-xl p-6 w-full max-w-sm shadow-elevation-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-primary" />
                <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">
                  {t('dashboard:label_km_current')}
                </label>
              </div>
              <button
                onClick={() => setEditingKm(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-high hover:bg-surface-low transition-colors"
              >
                <X className="w-3.5 h-3.5 text-surface-variant" />
              </button>
            </div>
            <input
              type="number"
              value={kmDraft}
              onChange={e => setKmDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveKm(); if (e.key === 'Escape') setEditingKm(false); }}
              autoFocus
              min="0"
              placeholder="0"
              className="w-full bg-surface-high border-0 border-b-2 border-primary focus:outline-none px-3 py-2 text-on-surface font-bold text-3xl mb-2"
            />
            <p className="text-[11px] text-surface-variant mb-5 leading-snug">
              {t('dashboard:modal_km_hint')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSaveKm}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-full font-headline font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors"
              >
                <Check className="w-4 h-4" />
                {t('common:btn_save')}
              </button>
              <button
                onClick={() => setEditingKm(false)}
                className="w-10 h-10 rounded-full bg-surface-high flex items-center justify-center hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4 text-surface-variant" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recorrido semanal modal */}
      {weekModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setWeekModalOpen(false)}
        >
          <form
            className="bg-surface-container rounded-xl p-6 w-full max-w-sm shadow-elevation-3 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
            onSubmit={handleAddWeekRide}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-headline font-black text-base uppercase tracking-tight">
                {t('dashboard:modal_week_title')}
              </h3>
              <button
                type="button"
                onClick={() => setWeekModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-high hover:bg-surface-low transition-colors"
              >
                <X className="w-3.5 h-3.5 text-surface-variant" />
              </button>
            </div>
            <p className="text-[11px] text-surface-variant mb-5 leading-snug">
              {t('dashboard:modal_week_question')}
            </p>

            {/* Compact mode selector — 2 cards */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                type="button"
                onClick={() => setWeekMode('km')}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                  weekMode === 'km'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline-variant/40 bg-surface-low text-surface-variant hover:border-outline-variant'
                }`}
              >
                <Route className="w-5 h-5" />
                <span className="font-headline font-black text-xs uppercase tracking-wide">
                  {t('dashboard:modal_week_km')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setWeekMode('fuel')}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                  weekMode === 'fuel'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline-variant/40 bg-surface-low text-surface-variant hover:border-outline-variant'
                }`}
              >
                <Fuel className="w-5 h-5" />
                <span className="font-headline font-black text-xs uppercase tracking-wide">
                  {t('dashboard:modal_week_fuel')}
                </span>
              </button>
            </div>

            {/* Fields */}
            {weekMode === 'km' ? (
              <div className="mb-5 space-y-3">
                <div className="space-y-1">
                  <label className="font-label text-[9px] font-extrabold text-secondary tracking-[0.15em] uppercase block">
                    {t('dashboard:modal_week_km_label')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={weekKm}
                    onChange={e => setWeekKm(e.target.value)}
                    autoFocus
                    required
                    placeholder="0"
                    className="w-full bg-surface-high border-0 border-b-2 border-primary focus:outline-none px-3 py-2 text-on-surface font-bold text-3xl"
                  />
                </div>

                {/* Cálculos en vivo */}
                {(() => {
                  const km = parseFloat(weekKm) || 0;
                  const rendimiento = vehicle?.rendimientoKmL ?? 0;
                  if (km <= 0 || rendimiento <= 0) return null;
                  const litrosConsumidos = Math.round((km / rendimiento) * 10) / 10;
                  const litrosActuales = fuelStats?.litros ?? null;
                  const litrosDespues = litrosActuales !== null
                    ? Math.max(0, Math.round((litrosActuales - litrosConsumidos) * 10) / 10)
                    : null;
                  const autoDespues = litrosDespues !== null
                    ? Math.round(litrosDespues * rendimiento)
                    : null;
                  return (
                    <div className="bg-surface-low rounded-xl p-3 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="font-label text-[10px] font-bold text-surface-variant uppercase tracking-widest">
                          {t('dashboard:calc_fuel_consumed')}
                        </span>
                        <span className="font-headline font-black text-sm text-on-surface">
                          ≈ {litrosConsumidos} L
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-label text-[10px] font-bold text-surface-variant uppercase tracking-widest">
                          {t('dashboard:calc_efficiency')}
                        </span>
                        <span className="font-headline font-black text-sm text-primary">
                          {rendimiento} km/L
                        </span>
                      </div>
                      {autoDespues !== null && (
                        <div className={`flex items-center justify-between pt-1 border-t border-outline-variant/30`}>
                          <span className="font-label text-[10px] font-bold text-surface-variant uppercase tracking-widest">
                            {t('dashboard:calc_range_after')}
                          </span>
                          <span className={`font-headline font-black text-sm ${autoDespues < 30 ? 'text-error' : autoDespues < 80 ? 'text-secondary' : 'text-primary'}`}>
                            ≈ {autoDespues.toLocaleString()} km
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="space-y-1">
                  <label className="font-label text-[9px] font-extrabold text-secondary tracking-[0.15em] uppercase block">
                    {t('dashboard:label_fuel_liters')}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={fuelLitros}
                    onChange={e => setFuelLitros(e.target.value)}
                    required
                    autoFocus
                    placeholder="0"
                    className="w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-2 py-1.5 font-bold text-sm transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label text-[9px] font-extrabold text-secondary tracking-[0.15em] uppercase block">
                    {t('dashboard:label_fuel_odo')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fuelOdo}
                    onChange={e => setFuelOdo(e.target.value)}
                    required
                    className="w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-2 py-1.5 font-bold text-sm transition-colors"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="font-label text-[9px] font-extrabold text-secondary tracking-[0.15em] uppercase block">
                    {t('maintenance:date')}
                  </label>
                  <input
                    type="date"
                    value={fuelDate}
                    onChange={e => setFuelDate(e.target.value)}
                    required
                    className="w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-2 py-1.5 font-bold text-sm transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-full font-headline font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors"
              >
                <Check className="w-4 h-4" />
                {t('common:btn_save')}
              </button>
              <button
                type="button"
                onClick={() => setWeekModalOpen(false)}
                className="w-10 h-10 rounded-full bg-surface-high flex items-center justify-center hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4 text-surface-variant" />
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* ── Distancia total ─────────────────────────────────────────────── */}
        <section className="md:col-span-12 bg-surface-low rounded-xl p-8 relative overflow-hidden shadow-elevation-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-container rounded-l-xl" />
          <label className="text-secondary font-label text-[10px] font-bold tracking-[0.15rem] uppercase mb-4 block pl-3">
            {t('dashboard:label_total_distance')}
          </label>

          <div className="flex items-baseline gap-2 pl-3">
            <span className="font-headline font-black text-7xl md:text-8xl tracking-tighter italic">
              {currentOdo.toLocaleString()}
            </span>
            <span className="font-headline font-bold text-2xl text-surface-variant">KM</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 pl-3 items-center">
            {/* ESTA SEMANA — opens recorrido modal */}
            <button
              onClick={() => { setWeekMode('km'); setWeekKm(''); setFuelLitros(''); setFuelOdo(String(currentOdo)); setFuelDate(new Date().toISOString().split('T')[0]); setWeekModalOpen(true); }}
              className="bg-surface-container rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-surface-high transition-colors"
            >
              <TrendingUp className="text-secondary w-4 h-4" />
              <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                +{stats.distThisWeek.toLocaleString()} {t('dashboard:this_week')}
              </span>
            </button>
            {vehicle && (
              <button
                onClick={openKmModal}
                className="flex items-center gap-2 bg-surface-container rounded-xl px-4 py-2 hover:bg-surface-high transition-colors"
              >
                <Gauge className="text-primary w-4 h-4" />
                <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                  {t('dashboard:label_km_current')}: {vehicle.kilometrajeActual.toLocaleString()}
                </span>
              </button>
            )}
          </div>
        </section>

        {/* ── Estado del aceite ───────────────────────────────────────────── */}
        <section
          className={`md:col-span-12 rounded-xl p-8 shadow-elevation-1 transition-colors ${
            isOilCritical ? 'bg-error-container/20' : isOilWarn ? 'bg-secondary/5' : 'bg-surface-low'
          }`}
        >
          {hasMaintenanceData && (
            <div className="flex justify-between items-start mb-5">
              <div className="min-w-0 flex-1">
                <label className={`font-label text-[10px] font-bold tracking-[0.15rem] uppercase block mb-1 ${isOilCritical ? 'text-error' : 'text-primary'}`}>
                  {t('dashboard:oil_service')}
                </label>
                <span className="font-headline font-black text-5xl italic tracking-tighter">
                  {stats.oilRemaining}{' '}
                  <span className="text-2xl text-surface-variant">KM</span>
                </span>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isOilCritical ? 'bg-error/10' : isOilWarn ? 'bg-secondary/10' : 'bg-primary/10'
              }`}>
                {isOilCritical
                  ? <AlertTriangle className="text-error w-6 h-6" />
                  : <Droplet className={`${isOilWarn ? 'text-secondary' : 'text-primary'} w-6 h-6`} />
                }
              </div>
            </div>
          )}

          {hasMaintenanceData && (
            <>
              <div className="relative w-full h-2.5 bg-surface-container rounded-full overflow-hidden mb-2">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ${oilStatus.barColor}`}
                  style={{ width: `${stats.oilLifePercent}%` }}
                />
              </div>
              {settings?.expertMode && (
                <div className="flex justify-between text-[10px] text-surface-variant font-bold uppercase tracking-wide mb-3">
                  <span>0 km</span>
                  <span>{stats.oilLifePercent.toFixed(0)}%</span>
                </div>
              )}
            </>
          )}

          {hasMaintenanceData ? (
            <>
              <p className={`text-sm font-bold ${oilStatus.color}`}>{oilStatus.msg}</p>
              {stats.lastOilDate && (
                <p className="text-[11px] text-surface-variant font-bold mt-2 uppercase tracking-wider">
                  {t('dashboard:label_last_oil_date')}: {stats.lastOilDate.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 mt-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-headline font-black text-sm uppercase tracking-tight text-on-surface">
                  Anota tu primer cambio de aceite
                </p>
                <p className="text-[11px] text-surface-variant mt-0.5 leading-snug">
                  Así NAVE calcula cuándo toca el próximo
                </p>
              </div>
              <button
                onClick={() => setActiveTab('maintenance')}
                className="flex-shrink-0 bg-primary text-on-primary px-4 py-2 rounded-full font-headline font-black text-[11px] uppercase tracking-widest hover:bg-primary/90 transition-colors"
              >
                {t('dashboard:oil_no_data_cta')}
              </button>
            </div>
          )}
        </section>

        {/* ── Gasolina & Autonomía ────────────────────────────────────────── */}
        {vehicle && (
          <section className="md:col-span-12 bg-surface-low rounded-xl p-8 shadow-elevation-1">
            {/* Header con botón de registro */}
            <div className="flex flex-wrap items-center justify-between mb-5">
              <label className="font-label text-[10px] font-bold tracking-[0.15rem] uppercase text-secondary">
                {t('dashboard:label_fuel_card')}
              </label>
              <button
                onClick={() => {
                  if (!fuelFormOpen) {
                    setFuelOdo(String(vehicle.kilometrajeActual));
                    setFuelDate(new Date().toISOString().split('T')[0]);
                  }
                  setFuelFormOpen(!fuelFormOpen);
                }}
                className="mt-2 flex items-center gap-2 bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary px-4 py-2 rounded-full font-headline font-black text-xs uppercase tracking-widest transition-all"
              >
                <Fuel className="w-3.5 h-3.5" />
                {t('dashboard:btn_fuel_log')}
              </button>
            </div>

            {/* Inline fuel log form */}
            {fuelFormOpen && (
              <form
                onSubmit={handleAddFuelLog}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 mb-6 border-b border-outline-variant/30 animate-in slide-in-from-top-2 duration-200"
              >
                <div className="space-y-1">
                  <label className={labelCls}>{t('dashboard:label_fuel_liters')}</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={fuelLitros}
                    onChange={e => setFuelLitros(e.target.value)}
                    required
                    autoFocus
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>{t('dashboard:label_fuel_odo')}</label>
                  <input
                    type="number"
                    min="0"
                    value={fuelOdo}
                    onChange={e => setFuelOdo(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>{t('maintenance:date')}</label>
                  <input
                    type="date"
                    value={fuelDate}
                    onChange={e => setFuelDate(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFuelFormOpen(false)}
                    className="px-5 py-2 bg-surface-high rounded-full font-headline text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
                  >
                    {t('common:btn_cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary text-on-primary rounded-full font-headline font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors"
                  >
                    {t('common:btn_save')}
                  </button>
                </div>
              </form>
            )}

            {/* First-fuel CTA only when no logs AND vehicle has no fuel level set */}
            {logs.length === 0 && !fuelFormOpen && (!vehicle || !vehicle.nivelGasolina) && (
              <div className="mb-5 p-4 rounded-xl bg-surface-container border border-outline-variant/30">
                <p className="font-headline font-bold text-sm uppercase tracking-tight text-on-surface mb-1">
                  {t('dashboard:no_logs_title')}
                </p>
                <p className="text-[11px] text-surface-variant leading-snug mb-3">
                  {t('dashboard:no_logs_sub')}
                </p>
                <button
                  onClick={() => { setFuelOdo(String(vehicle.kilometrajeActual)); setFuelDate(new Date().toISOString().split('T')[0]); setFuelFormOpen(true); }}
                  className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2 rounded-full font-headline font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors"
                >
                  <Fuel className="w-3.5 h-3.5" />
                  {t('dashboard:no_logs_cta')}
                </button>
              </div>
            )}

            {/* Fuel stats */}
            {fuelStats ? (
              <>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-headline font-black text-5xl tracking-tighter italic">
                    {fuelStats.litros}
                  </span>
                  <span className="font-headline font-bold text-xl text-surface-variant">
                    L {t('dashboard:label_liters_left')}
                  </span>
                </div>
                <div className="relative w-full h-2.5 bg-surface-container rounded-full overflow-hidden my-3">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ${
                      vehicle.nivelGasolina <= 1 ? 'bg-error' : vehicle.nivelGasolina <= 2 ? 'bg-secondary' : 'bg-primary'
                    }`}
                    style={{ width: `${fuelStats.fuelPct}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <div className="bg-surface-container rounded-xl px-4 py-2 flex items-center gap-2">
                    <TrendingUp className="text-primary w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                      ≈ {fuelStats.autoRestante.toLocaleString()} km {t('dashboard:label_autonomy')}
                    </span>
                  </div>
                  <span className="text-[10px] text-surface-variant font-bold uppercase tracking-wider">
                    {t('dashboard:label_auto_total')}: {fuelStats.autoTotal.toLocaleString()} km
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-headline font-black text-2xl uppercase tracking-tight">
                    {fuelLabel ?? '--'}
                  </p>
                  <p className="text-[11px] text-surface-variant font-bold mt-1">
                    {vehicle.rendimientoKmL} km/L
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="text-[11px] font-headline font-black uppercase tracking-widest text-primary hover:underline"
                >
                  {t('dashboard:fuel_setup_cta')}
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── Resumen general ─────────────────────────────────────────────── */}
        <section className="md:col-span-12 mt-4">
          <h2 className="font-headline font-black text-xl tracking-tighter uppercase mb-4 flex items-center gap-3">
            <span className="w-6 h-[2px] bg-secondary rounded-full inline-block" />
            {t('dashboard:summary_title')}
            {activeAlerts.length > 0 && (
              <button
                onClick={() => setActiveTab('maintenance')}
                className="ml-auto flex items-center gap-1.5 bg-error/10 text-error px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-error/20 transition-colors"
              >
                <BellRing className="w-3 h-3" />
                {activeAlerts.length} pendiente{activeAlerts.length > 1 ? 's' : ''}
              </button>
            )}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            <button onClick={() => setActiveTab('profile')} className="text-left bg-surface-container rounded-xl p-5 shadow-elevation-1 hover:bg-surface-high transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <Bike className="w-5 h-5 text-primary" />
                <ChevronRight className="w-4 h-4 text-surface-variant group-hover:text-primary" />
              </div>
              <p className="font-label text-[9px] font-bold tracking-widest uppercase text-surface-variant mb-1">{t('dashboard:summary_vehicle')}</p>
              <p className="font-headline font-black text-base uppercase tracking-tight truncate">
                {vehicle ? `${vehicle.marca} ${vehicle.modelo}` : t('dashboard:summary_no_vehicle')}
              </p>
              {vehicle && fuelLabel && (
                <p className="text-[10px] text-surface-variant font-bold mt-1">
                  {fuelLabel} · {vehicle.rendimientoKmL} km/L
                </p>
              )}
            </button>

            <button onClick={() => setActiveTab('routes')} className="text-left bg-surface-container rounded-xl p-5 shadow-elevation-1 hover:bg-surface-high transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <Route className="w-5 h-5 text-secondary" />
                <ChevronRight className="w-4 h-4 text-surface-variant group-hover:text-primary" />
              </div>
              <p className="font-label text-[9px] font-bold tracking-widest uppercase text-surface-variant mb-1">{t('dashboard:summary_routes')}</p>
              <p className="font-headline font-black text-2xl tracking-tighter">{completedRoutes.length}</p>
              <p className="text-[10px] text-surface-variant font-bold mt-1">
                {lastRoute
                  ? `${t('dashboard:summary_last_route')}: ${(lastRoute.distance || 0).toLocaleString()} km`
                  : t('dashboard:summary_no_routes')}
              </p>
            </button>

            <button onClick={() => setActiveTab('maintenance')} className="text-left bg-surface-container rounded-xl p-5 shadow-elevation-1 hover:bg-surface-high transition-colors group relative overflow-hidden">
              {activeAlerts.length > 0 && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-error animate-pulse" />
              )}
              <div className="flex items-center justify-between mb-3">
                <Wrench className="w-5 h-5 text-primary" />
                <ChevronRight className="w-4 h-4 text-surface-variant group-hover:text-primary" />
              </div>
              <p className="font-label text-[9px] font-bold tracking-widest uppercase text-surface-variant mb-1">{t('dashboard:summary_maintenance')}</p>
              <p className="font-headline font-black text-2xl tracking-tighter">
                {nextService > 0 ? nextService.toLocaleString() : '--'}
                {nextService > 0 && <span className="text-sm text-surface-variant"> km</span>}
              </p>
              <p className={`text-[10px] font-bold mt-1 ${activeAlerts.length > 0 ? 'text-error' : 'text-primary'}`}>
                {activeAlerts.length > 0 ? t('dashboard:summary_service_due') : t('dashboard:summary_service_ok')}
              </p>
            </button>

            <button onClick={() => setActiveTab('manuals')} className="text-left bg-surface-container rounded-xl p-5 shadow-elevation-1 hover:bg-surface-high transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <BookOpen className="w-5 h-5 text-secondary" />
                <ChevronRight className="w-4 h-4 text-surface-variant group-hover:text-primary" />
              </div>
              <p className="font-label text-[9px] font-bold tracking-widest uppercase text-surface-variant mb-1">{t('dashboard:summary_manuals')}</p>
              <p className="font-headline font-black text-2xl tracking-tighter">{manuals.length}</p>
            </button>
          </div>
        </section>

        {/* ── Actividad reciente ────────────────────────────────────────── */}
        {recentActivity.length > 0 && (
          <section className="md:col-span-12 mt-4">
            <h2 className="font-headline font-black text-xl tracking-tighter uppercase mb-4 flex items-center gap-3">
              <span className="w-6 h-[2px] bg-primary rounded-full inline-block" />
              {t('dashboard:recent_telemetry')}
            </h2>
            <div className="flex flex-col gap-2">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container rounded-xl p-5 flex justify-between items-center hover:bg-surface-high transition-colors duration-150"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.type === 'maint' ? 'bg-primary/10' : item.type === 'route' ? 'bg-secondary/10' : 'bg-secondary/10'
                    }`}>
                      {item.type === 'maint'
                        ? <Wrench className="w-4 h-4 text-primary" />
                        : item.type === 'route'
                          ? <Route className="w-4 h-4 text-secondary" />
                          : <Fuel className="w-4 h-4 text-secondary" />
                      }
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-base uppercase">{item.title}</h3>
                      <p className="text-[10px] text-surface-variant font-bold uppercase tracking-widest">
                        {item.sub}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
