import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Save, Trash2, Edit3, X, Play, Flag, Fuel, Gauge, Clock, Route as RouteIcon, MapPin, Navigation, Map as MapIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO } from '../components/ui/SEO';
import { useLogs } from '../hooks/useLogs';
import { useRoutes } from '../hooks/useRoutes';
import { useVehicle } from '../hooks/useVehicle';
import { useSettings } from '../hooks/useSettings';
import { RouteEntry } from '../db/database';
import { Toast, useToast } from '../components/ui/Toast';
import { LoadingScreen, Spinner } from '../components/ui/Spinner';
import { ConfirmModal } from '../components/ui/ConfirmModal';

// Lazy load MapView (heavy asset)
const MapView = React.lazy(() => import('../components/ui/MapView').then(m => ({ default: m.MapView })));

function formatElapsed(fromIso: string, now: number): string {
  const ms = Math.max(0, now - new Date(fromIso).getTime());
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function LogsScreen({ initialTab = 'refills' }: { initialTab?: 'refills' | 'routes' } = {}) {
  const { t } = useTranslation(['seo', 'common', 'logs', 'routes']);
  const { logs, isLoading: logsLoading, addLog, updateLog, removeLog } = useLogs();
  const { routes, activeRoute, isLoading: routesLoading, startRoute, finishRoute, removeRoute } = useRoutes();
  const { vehicle, updateVehicle } = useVehicle();
  const { settings } = useSettings();
  const { toast, showToast, hideToast } = useToast();

  const [subTab, setSubTab] = useState<'refills' | 'routes'>(initialTab);

  useEffect(() => {
    setSubTab(initialTab);
  }, [initialTab]);

  // Fuel Logs States
  const [editingLog, setEditingLog] = useState<any>(null);
  const [registerMode, setRegisterMode] = useState<'odo' | 'distance'>('odo');
  const [odo, setOdo] = useState('');
  const [distance, setDistance] = useState('');
  const [fuel, setFuel] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteLogId, setConfirmDeleteLogId] = useState<number | null>(null);

  const [tipDismissed, setTipDismissed] = useState(() => {
    return localStorage.getItem('nave_tip_dismissed_refills') === 'true';
  });
  const [showHowTip, setShowHowTip] = useState(false);

  const showRefillsTip = useMemo(() => {
    if (tipDismissed) return false;
    if (logs.length > 0) return false;
    if (!vehicle || !vehicle.creadoEn) return false;
    const createdDate = new Date(vehicle.creadoEn).getTime();
    const diffDays = (Date.now() - createdDate) / (1000 * 60 * 60 * 24);
    return diffDays < 7;
  }, [logs.length, vehicle, tipDismissed]);

  const isOdoInitialized = useRef(false);

  // Pre-fill odo with latest log's odo
  useEffect(() => {
    if (logs && logs.length > 0 && !isOdoInitialized.current) {
      const sorted = [...logs].sort((a, b) => b.odo - a.odo);
      setOdo(String(sorted[0].odo));
      isOdoInitialized.current = true;
    }
  }, [logs]);

  const handleRegisterModeChange = (mode: 'odo' | 'distance') => {
    setRegisterMode(mode);
    if (mode === 'odo') {
      setDistance('');
      if (!odo && logs && logs.length > 0) {
        const sorted = [...logs].sort((a, b) => b.odo - a.odo);
        setOdo(String(sorted[0].odo));
      }
    } else {
      setOdo('');
    }
  };

  // Routes States
  const rendimiento = vehicle?.rendimientoKmL || 0;
  const [startOdo, setStartOdo] = useState('');
  const [startName, setStartName] = useState('');
  const [endOdo, setEndOdo] = useState('');
  const [endNotes, setEndNotes] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [tracking, setTracking] = useState(false);
  const [trackCount, setTrackCount] = useState(0);
  const trackRef = useRef<[number, number][]>([]);
  const watchIdRef = useRef<number | null>(null);
  const [mapRoute, setMapRoute] = useState<RouteEntry | null>(null);
  const [confirmDeleteRouteId, setConfirmDeleteRouteId] = useState<number | null>(null);

  const isLoading = logsLoading || routesLoading;

  // Pre-fill route start odometer
  useEffect(() => {
    if (!activeRoute && vehicle && !startOdo) {
      setStartOdo(String(vehicle.kilometrajeActual || ''));
    }
  }, [vehicle, activeRoute, startOdo]);

  // Live timer for active route
  useEffect(() => {
    if (!activeRoute) return;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [activeRoute]);

  // Geolocation watch cleanup
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const stopGps = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  };

  const toggleGps = () => {
    if (tracking) { stopGps(); return; }
    if (!('geolocation' in navigator)) { showToast(t('routes:gps_unsupported'), 'error'); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        trackRef.current.push([pos.coords.longitude, pos.coords.latitude]);
        setTrackCount(trackRef.current.length);
      },
      () => { showToast(t('routes:gps_denied'), 'error'); stopGps(); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    setTracking(true);
  };

  // Fuel Logs Submissions
  const handleSubmitFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!odo && !distance) { showToast(t('common:error_generic'), 'error'); return; }
    if (!fuel) { showToast(t('common:error_generic'), 'error'); return; }

    const odoNumRaw = parseFloat(odo);
    const fuelNum = parseFloat(fuel);
    const distNumRaw = parseFloat(distance);
    if (isNaN(fuelNum)) return;

    const sortedLogs = [...logs].sort((a, b) => b.odo - a.odo);
    const lastOdo = sortedLogs.length > 0 ? sortedLogs[0].odo : (vehicle?.kilometrajeActual || 0);

    let finalOdo = isNaN(odoNumRaw) ? 0 : odoNumRaw;
    let actualDist = 0;

    if (!isNaN(distNumRaw) && distNumRaw > 0) {
      actualDist = distNumRaw;
      if (finalOdo === 0) finalOdo = lastOdo + distNumRaw;
    } else if (finalOdo > 0 && lastOdo > 0) {
      actualDist = finalOdo - lastOdo;
    }

    let eff = 0;
    if (actualDist > 0 && fuelNum > 0) {
      eff = Math.round((fuelNum / actualDist) * 1000) / 10;
    }

    setIsSubmitting(true);
    try {
      await addLog({ date: new Date().toISOString(), odo: finalOdo, fuel: fuelNum, eff, notes: notes || 'N/A', distance: actualDist });
      if (vehicle && finalOdo > (vehicle.kilometrajeActual || 0)) {
        await updateVehicle({ ...vehicle, kilometrajeActual: finalOdo, actualizadoEn: new Date().toISOString() });
      }
      showToast(t('common:saved_success'), 'success');
      setOdo(String(finalOdo)); setDistance(''); setFuel(''); setNotes('');
    } catch {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    setIsSubmitting(true);
    try {
      await updateLog(editingLog);
      showToast(t('common:saved_success'), 'success');
      setEditingLog(null);
    } catch {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteLog = async () => {
    if (confirmDeleteLogId !== null) {
      try {
        await removeLog(confirmDeleteLogId);
        showToast(t('common:saved_success'), 'success');
      } catch {
        showToast(t('common:error_generic'), 'error');
      } finally {
        setConfirmDeleteLogId(null);
      }
    }
  };

  // Route Submissions
  const handleStartRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    const odoVal = parseFloat(startOdo);
    if (isNaN(odoVal)) { showToast(t('common:error_generic'), 'error'); return; }
    setIsSubmitting(true);
    try {
      await startRoute(odoVal, startName);
      showToast(t('routes:toast_started'), 'success');
      setStartName('');
    } catch {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoute) return;
    const odoVal = parseFloat(endOdo);
    if (isNaN(odoVal) || odoVal < activeRoute.odoStart) { showToast(t('routes:error_end_odo'), 'error'); return; }
    stopGps();
    const recordedTrack = trackRef.current.length > 1 ? [...trackRef.current] : undefined;
    setIsSubmitting(true);
    try {
      await finishRoute(odoVal, rendimiento, endNotes, recordedTrack);
      if (vehicle && odoVal > (vehicle.kilometrajeActual || 0)) {
        await updateVehicle({ ...vehicle, kilometrajeActual: odoVal, actualizadoEn: new Date().toISOString() });
      }
      showToast(t('routes:toast_finished'), 'success');
      setEndOdo(''); setEndNotes(''); setStartOdo('');
      trackRef.current = []; setTrackCount(0);
    } catch {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteRoute = async () => {
    if (confirmDeleteRouteId !== null) {
      try {
        await removeRoute(confirmDeleteRouteId);
        showToast(t('common:saved_success'), 'success');
      } catch {
        showToast(t('common:error_generic'), 'error');
      } finally {
        setConfirmDeleteRouteId(null);
      }
    }
  };

  // Stats Calculations
  const fuelStats = useMemo(() => {
    if (!logs || logs.length === 0) return { totalDist: 0, lastEff: 0 };
    const totalDist = logs.reduce((sum, log) => sum + (log.distance || 0), 0);
    const sorted = [...logs].sort((a, b) => b.odo - a.odo);
    return { totalDist, lastEff: sorted[0].eff };
  }, [logs]);

  const completedRoutes = useMemo(() => routes.filter(r => r.status === 'completed'), [routes]);

  const liveRoutePreview = useMemo(() => {
    if (!activeRoute) return null;
    const endVal = parseFloat(endOdo);
    if (isNaN(endVal) || endVal <= activeRoute.odoStart) return null;
    const dist = endVal - activeRoute.odoStart;
    const fuelUsed = rendimiento > 0 ? dist / rendimiento : 0;
    return { dist, fuelUsed };
  }, [endOdo, activeRoute, rendimiento]);

  if (isLoading && logs.length === 0 && routes.length === 0) return <LoadingScreen />;

  const inputCls = "w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface font-headline text-2xl font-bold transition-colors";
  const labelCls = "font-label text-secondary text-[10px] font-bold tracking-[0.1rem] uppercase";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <SEO 
        titleKey={subTab === 'refills' ? 'logs_title' : 'routes_title'} 
        descKey={subTab === 'refills' ? 'logs_desc' : 'routes_desc'} 
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Unified Tab Switcher */}
      <div className="flex bg-surface-container rounded-full p-1 max-w-md mx-auto">
        <button
          onClick={() => setSubTab('refills')}
          className={`flex-1 py-2.5 text-xs font-headline font-black uppercase tracking-wider rounded-full transition-all ${
            subTab === 'refills' ? 'bg-primary text-on-primary shadow-elevation-1' : 'text-surface-variant hover:text-on-surface'
          }`}
        >
          {t('logs:subtab_refills', { defaultValue: 'Cargas de Gasolina' })}
        </button>
        <button
          onClick={() => setSubTab('routes')}
          className={`flex-1 py-2.5 text-xs font-headline font-black uppercase tracking-wider rounded-full transition-all ${
            subTab === 'routes' ? 'bg-primary text-on-primary shadow-elevation-1' : 'text-surface-variant hover:text-on-surface'
          }`}
        >
          {t('logs:subtab_routes', { defaultValue: 'Rutas y Viajes' })}
        </button>
      </div>

      {subTab === 'refills' ? (
        <>
          {/* FUEL LOGS VIEW */}
          <section className={`grid gap-4 ${settings?.expertMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            <div className="bg-surface-container rounded-xl p-7 border-l-4 border-secondary space-y-2 shadow-elevation-1">
              <p className={labelCls}>{t('logs:hero_distance')}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-5xl font-black tracking-tighter">{fuelStats.totalDist.toLocaleString()}</span>
                <span className="font-headline text-xl text-surface-variant font-medium uppercase">KM</span>
              </div>
            </div>
            {settings?.expertMode && (
              <div className="bg-surface-container rounded-xl p-7 border-l-4 border-primary space-y-2 shadow-elevation-1">
                <p className="font-label text-primary text-[10px] font-bold tracking-[0.1rem] uppercase">{t('logs:hero_efficiency')}</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline text-5xl font-black tracking-tighter">{fuelStats.lastEff > 0 ? fuelStats.lastEff.toFixed(1) : '--'}</span>
                  <span className="font-headline text-xl text-surface-variant font-medium uppercase">L/100KM</span>
                </div>
              </div>
            )}
          </section>

          {showRefillsTip && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 space-y-3 shadow-elevation-1 animate-in slide-in-from-top duration-300">
              <h4 className="font-headline font-bold text-sm text-primary uppercase tracking-wide">
                {t('logs:tip_title')}
              </h4>
              <p className="font-body text-xs text-on-surface leading-relaxed">
                {t('logs:tip_desc')}
              </p>
              {showHowTip && (
                <p className="font-body text-xs text-primary bg-primary/5 border-l-2 border-primary p-3 rounded-r-lg animate-in fade-in duration-200">
                  {t('logs:tip_how_explanation')}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    localStorage.setItem('nave_tip_dismissed_refills', 'true');
                    setTipDismissed(true);
                  }}
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-headline font-black uppercase tracking-wider rounded-full hover:bg-primary/90 transition-all shadow-elevation-1"
                >
                  {t('logs:tip_btn_understand')}
                </button>
                <button
                  onClick={() => setShowHowTip(!showHowTip)}
                  className="px-4 py-2 bg-surface-container text-surface-variant text-xs font-headline font-black uppercase tracking-wider rounded-full hover:text-on-surface hover:bg-surface-high transition-all"
                >
                  {t('logs:tip_btn_how')}
                </button>
              </div>
            </div>
          )}

          <section className="space-y-5">
            <h2 className="font-headline text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <span className="w-6 h-[2px] bg-primary rounded-full"></span>
              {t('logs:form_title')}
            </h2>
            <form className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-surface-low rounded-xl p-7 shadow-elevation-1" onSubmit={handleSubmitFuel}>
              <div className="md:col-span-12 space-y-2">
                <span className="font-label text-secondary text-[10px] font-bold tracking-[0.1rem] uppercase">
                  {t('logs:register_mode_question', { defaultValue: '¿Cómo quieres registrar tu recorrido?' })}
                </span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => handleRegisterModeChange('odo')}
                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      registerMode === 'odo'
                        ? 'bg-primary/10 border-primary text-primary shadow-elevation-1'
                        : 'bg-surface-high border-outline-variant/30 text-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${registerMode === 'odo' ? 'border-primary' : 'border-surface-variant'}`}>
                      {registerMode === 'odo' && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </span>
                    <span className="font-body text-sm font-semibold">
                      {t('logs:register_mode_odo', { defaultValue: 'Escribo el kilometraje que marca el tablero' })}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegisterModeChange('distance')}
                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      registerMode === 'distance'
                        ? 'bg-primary/10 border-primary text-primary shadow-elevation-1'
                        : 'bg-surface-high border-outline-variant/30 text-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${registerMode === 'distance' ? 'border-primary' : 'border-surface-variant'}`}>
                      {registerMode === 'distance' && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </span>
                    <span className="font-body text-sm font-semibold">
                      {t('logs:register_mode_distance', { defaultValue: 'Sé cuántos km recorrí desde la última carga' })}
                    </span>
                  </button>
                </div>
              </div>

              {registerMode === 'odo' ? (
                <div className="md:col-span-8 space-y-1">
                  <label className={labelCls}>{t('logs:label_odo')}</label>
                  <input value={odo} onChange={(e) => setOdo(e.target.value)} className={inputCls} type="number" />
                  <p className="text-[11px] text-surface-variant mt-1 leading-snug">{t('logs:hint_odo')}</p>
                </div>
              ) : (
                <div className="md:col-span-8 space-y-1">
                  <label className={labelCls}>{t('logs:label_distance')}</label>
                  <input value={distance} onChange={(e) => setDistance(e.target.value)} className={inputCls} type="number" />
                  <p className="text-[11px] text-surface-variant mt-1 leading-snug">{t('logs:hint_distance')}</p>
                </div>
              )}
              <div className="md:col-span-4 space-y-1">
                <label className={labelCls}>{t('logs:label_fuel')} (L)</label>
                <input value={fuel} onChange={(e) => setFuel(e.target.value)} className={inputCls} step="0.01" type="number" required />
              </div>
              <div className="md:col-span-12 space-y-1">
                <label className="font-label text-surface-variant text-[10px] font-bold tracking-[0.1rem] uppercase">{t('logs:label_notes')}</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface font-body text-sm transition-colors"
                  type="text"
                />
              </div>
              <div className="md:col-span-12 pt-2">
                <button
                  disabled={isSubmitting}
                  className="w-full md:w-auto bg-primary text-on-primary font-headline font-black text-base py-4 px-10 uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 rounded-full shadow-elevation-1"
                  type="submit"
                >
                  {isSubmitting ? <Spinner className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {t('common:btn_save')}
                </button>
              </div>
            </form>
          </section>

          <section className="space-y-4">
            <h2 className="font-headline text-xl font-black uppercase tracking-tight">{t('logs:recent_history')}</h2>
            {logs.length === 0 && (
              <div className="bg-surface-lowest rounded-xl p-10 flex flex-col items-center justify-center border border-outline-variant/30 text-center">
                <p className="font-headline text-lg font-bold text-surface-variant uppercase">{t('common:empty_state')}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {logs.map((log, i) => (
                <div
                  key={log.id}
                  className={`group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl hover:bg-surface-high transition-colors ${i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface-low'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col">
                      <span className="font-label text-surface-variant text-[10px] font-bold uppercase">{t('logs:column_date')}</span>
                      <span className="font-headline font-bold text-base">
                        {new Date(log.date).toLocaleDateString().toUpperCase()}
                      </span>
                    </div>
                    <div className="h-7 w-px bg-outline-variant hidden md:block"></div>
                    <div className="flex flex-col">
                      <span className="font-label text-surface-variant text-[10px] font-bold uppercase">{t('logs:column_odo')}</span>
                      <span className="font-headline font-bold text-base">{log.odo.toLocaleString()} KM</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <div className="flex flex-col items-end">
                      <span className="font-label text-secondary text-[10px] font-bold uppercase">{t('logs:column_fuel')}</span>
                      <span className="font-headline font-black text-xl text-secondary">{log.fuel} L</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingLog(log)}
                        className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-surface-variant hover:text-primary hover:bg-surface-high transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteLogId(log.id!)}
                        className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* ROUTES / TRIPS VIEW */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container rounded-xl p-7 border-l-4 border-secondary space-y-2 shadow-elevation-1">
              <p className={labelCls}>{t('routes:hero_performance')}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-5xl font-black tracking-tighter">{rendimiento > 0 ? rendimiento : '--'}</span>
                <span className="font-headline text-xl text-surface-variant font-medium uppercase">KM/L</span>
              </div>
            </div>
            <div className="bg-surface-container rounded-xl p-7 border-l-4 border-primary space-y-2 shadow-elevation-1">
              <p className="font-label text-primary text-[10px] font-bold tracking-[0.1rem] uppercase">{t('routes:hero_count')}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-5xl font-black tracking-tighter">{completedRoutes.length}</span>
                <span className="font-headline text-xl text-surface-variant font-medium uppercase">{t('routes:hero_count_unit')}</span>
              </div>
            </div>
          </section>

          {activeRoute ? (
            <section className="space-y-5">
              <h2 className="font-headline text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></span>
                {t('routes:on_route')}
              </h2>
              <div className="bg-surface-low rounded-xl p-7 shadow-elevation-1 space-y-6">
                {activeRoute.name && (
                  <p className="font-headline text-lg font-bold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> {activeRoute.name}
                  </p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className={labelCls}>{t('routes:start_odo')}</span>
                    <span className="font-headline font-black text-2xl">{activeRoute.odoStart.toLocaleString()} <span className="text-sm text-surface-variant">KM</span></span>
                  </div>
                  <div className="flex flex-col">
                    <span className={labelCls}>{t('routes:departure')}</span>
                    <span className="font-headline font-black text-2xl">
                      {new Date(activeRoute.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className={labelCls}><Clock className="w-3 h-3 inline mr-1" />{t('routes:elapsed')}</span>
                    <span className="font-headline font-black text-2xl">{formatElapsed(activeRoute.startDate, now)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleGps}
                  className={`w-full flex items-center justify-center gap-3 py-3 rounded-full font-headline font-black text-sm uppercase tracking-widest transition-all ${
                    tracking ? 'bg-error-container/30 text-error animate-pulse' : 'bg-secondary-container text-on-secondary-container hover:bg-secondary'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  {tracking ? `${t('routes:gps_stop')} · ${t('routes:gps_points', { count: trackCount })}` : t('routes:gps_record')}
                </button>

                <form className="space-y-5 pt-2 border-t border-outline-variant/30" onSubmit={handleFinishRoute}>
                  <div className="space-y-1">
                    <label className={labelCls}>{t('routes:end_odo')}</label>
                    <input value={endOdo} onChange={e => setEndOdo(e.target.value)} className={inputCls} type="number" placeholder={String(activeRoute.odoStart)} required />
                  </div>

                  {liveRoutePreview && (
                    <div className="grid grid-cols-2 gap-4 bg-surface-container rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-secondary" />
                        <div>
                          <p className="font-label text-[10px] uppercase text-surface-variant">{t('routes:distance')}</p>
                          <p className="font-headline font-black text-lg">{liveRoutePreview.dist.toLocaleString()} KM</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Fuel className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-label text-[10px] uppercase text-surface-variant">{t('routes:fuel_used')}</p>
                          <p className="font-headline font-black text-lg">{rendimiento > 0 ? liveRoutePreview.fuelUsed.toFixed(2) : '--'} L</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-label text-surface-variant text-[10px] font-bold tracking-[0.1rem] uppercase">{t('routes:notes')}</label>
                    <input value={endNotes} onChange={e => setEndNotes(e.target.value)} className="w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface font-body text-sm transition-colors" type="text" />
                  </div>

                  <button disabled={isSubmitting} className="w-full bg-primary text-on-primary font-headline font-black text-base py-4 px-10 uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 rounded-full shadow-elevation-1" type="submit">
                    {isSubmitting ? <Spinner className="w-5 h-5" /> : <Flag className="w-5 h-5" />}
                    {t('routes:btn_finish')}
                  </button>
                </form>
              </div>
            </section>
          ) : (
            <section className="space-y-5">
              <h2 className="font-headline text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <span className="w-6 h-[2px] bg-primary rounded-full"></span>
                {t('routes:start_title')}
              </h2>
              <form className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-surface-low rounded-xl p-7 shadow-elevation-1" onSubmit={handleStartRoute}>
                <div className="md:col-span-5 space-y-1">
                  <label className={labelCls}>{t('routes:start_odo')}</label>
                  <input value={startOdo} onChange={e => setStartOdo(e.target.value)} className={inputCls} type="number" required />
                </div>
                <div className="md:col-span-7 space-y-1">
                  <label className="font-label text-surface-variant text-[10px] font-bold tracking-[0.1rem] uppercase">{t('routes:route_name')}</label>
                  <input value={startName} onChange={e => setStartName(e.target.value)} className="w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface font-body text-base transition-colors" type="text" placeholder={t('routes:route_name_ph')} />
                </div>
                <div className="md:col-span-12 pt-2">
                  <button disabled={isSubmitting} className="w-full md:w-auto bg-primary text-on-primary font-headline font-black text-base py-4 px-10 uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 rounded-full shadow-elevation-1" type="submit">
                    {isSubmitting ? <Spinner className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {t('routes:btn_start')}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="font-headline text-xl font-black uppercase tracking-tight">{t('routes:history')}</h2>
            {completedRoutes.length === 0 && (
              <div className="bg-surface-lowest rounded-xl p-10 flex flex-col items-center justify-center border border-outline-variant/30 text-center">
                <RouteIcon className="w-8 h-8 text-surface-variant mb-2" />
                <p className="font-headline text-lg font-bold text-surface-variant uppercase">{t('common:empty_state')}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {completedRoutes.map((r, i) => (
                <div key={r.id} className={`group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl hover:bg-surface-high transition-colors ${i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface-low'}`}>
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col">
                      <span className="font-label text-surface-variant text-[10px] font-bold uppercase">{t('routes:column_date')}</span>
                      <span className="font-headline font-bold text-base">
                        {new Date(r.startDate).toLocaleDateString().toUpperCase()}
                      </span>
                      {r.name && <span className="font-body text-xs text-surface-variant">{r.name}</span>}
                    </div>
                    <div className="h-7 w-px bg-outline-variant hidden md:block"></div>
                    <div className="flex flex-col">
                      <span className="font-label text-surface-variant text-[10px] font-bold uppercase">{t('routes:distance')}</span>
                      <span className="font-headline font-bold text-base">{(r.distance || 0).toLocaleString()} KM</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <div className="flex flex-col items-end">
                      <span className="font-label text-secondary text-[10px] font-bold uppercase">{t('routes:fuel_used')}</span>
                      <span className="font-headline font-black text-xl text-secondary">{(r.fuelUsed || 0).toFixed(2)} L</span>
                    </div>
                    {r.track && r.track.length > 1 && (
                      <button onClick={() => setMapRoute(r)} title={t('routes:view_map')} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-surface-variant hover:text-secondary hover:bg-surface-high transition-colors">
                        <MapIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setConfirmDeleteRouteId(r.id!)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-surface-variant hover:text-error hover:bg-error-container/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Fuel Log Edit Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-scrim animate-in fade-in duration-200">
          <div className="bg-surface-low rounded-xl w-full max-w-lg p-7 space-y-6 shadow-elevation-3">
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-xl font-black uppercase text-primary">{t('common:btn_edit')}</h3>
              <button
                onClick={() => setEditingLog(null)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-high transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="space-y-5" onSubmit={handleUpdateFuel}>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'odo', label: t('logs:label_odo'), parser: parseFloat },
                  { key: 'distance', label: t('logs:label_distance'), parser: parseFloat },
                  { key: 'fuel', label: t('logs:label_fuel'), parser: parseFloat, step: '0.01' },
                ].map(({ key, label, parser, step }: any) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-secondary">{label}</label>
                    <input
                      value={editingLog[key] || ''}
                      onChange={e => setEditingLog({...editingLog, [key]: parser(e.target.value)})}
                      className="w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-3 py-3 font-headline text-lg font-bold transition-colors"
                      type="number"
                      step={step}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-surface-variant">{t('logs:label_notes')}</label>
                <input
                  value={editingLog.notes}
                  onChange={e => setEditingLog({...editingLog, notes: e.target.value})}
                  className="w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 font-body text-sm transition-colors"
                  type="text"
                />
              </div>
              <button
                disabled={isSubmitting}
                className="w-full bg-primary text-on-primary py-4 font-headline font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-3 rounded-full shadow-elevation-1"
              >
                {isSubmitting ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {t('common:btn_save')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Map modal */}
      {mapRoute && mapRoute.track && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-scrim animate-in fade-in duration-200">
          <div className="bg-surface-low rounded-xl w-full max-w-2xl p-5 space-y-4 shadow-elevation-3">
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-lg font-black uppercase text-primary flex items-center gap-2">
                <MapIcon className="w-5 h-5" />
                {mapRoute.name || t('routes:map_title')}
              </h3>
              <button onClick={() => setMapRoute(null)} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-high transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <React.Suspense fallback={<div className="w-full h-[60vh] md:h-96 rounded-xl bg-surface-container flex items-center justify-center"><Spinner className="w-6 h-6" /></div>}>
              <MapView track={mapRoute.track} className="w-full h-[60vh] md:h-96 rounded-xl overflow-hidden" />
            </React.Suspense>
          </div>
        </div>
      )}

      {/* Confirm Delete Modals */}
      <ConfirmModal
        isOpen={confirmDeleteLogId !== null}
        title={t('logs:confirm_delete')}
        message={t('logs:confirm_delete')}
        onConfirm={handleConfirmDeleteLog}
        onCancel={() => setConfirmDeleteLogId(null)}
        confirmText={t('common:btn_delete')}
        cancelText={t('common:btn_cancel')}
      />

      <ConfirmModal
        isOpen={confirmDeleteRouteId !== null}
        title={t('routes:confirm_delete')}
        message={t('routes:confirm_delete')}
        onConfirm={handleConfirmDeleteRoute}
        onCancel={() => setConfirmDeleteRouteId(null)}
        confirmText={t('common:btn_delete')}
        cancelText={t('common:btn_cancel')}
      />
    </div>
  );
}
