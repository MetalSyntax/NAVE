import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Flag, Trash2, Fuel, Gauge, Clock, Route as RouteIcon, MapPin, Navigation, Map as MapIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useRoutes } from '../hooks/useRoutes';
import { useVehicle } from '../hooks/useVehicle';
import { RouteEntry } from '../db/database';

// MapLibre es pesado (~1MB): se carga solo al abrir el mapa de una ruta.
const MapView = React.lazy(() => import('../components/ui/MapView').then(m => ({ default: m.MapView })));
import { Toast, useToast } from '../components/ui/Toast';
import { LoadingScreen, Spinner } from '../components/ui/Spinner';

function formatElapsed(fromIso: string, now: number): string {
  const ms = Math.max(0, now - new Date(fromIso).getTime());
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function RoutesScreen() {
  const { t } = useTranslation(['seo', 'common', 'routes']);
  const { routes, activeRoute, isLoading, startRoute, finishRoute, removeRoute } = useRoutes();
  const { vehicle, updateVehicle } = useVehicle();
  const { toast, showToast, hideToast } = useToast();

  const rendimiento = vehicle?.rendimientoKmL || 0;

  const [startOdo, setStartOdo] = useState('');
  const [startName, setStartName] = useState('');
  const [endOdo, setEndOdo] = useState('');
  const [endNotes, setEndNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // GPS tracking
  const [tracking, setTracking] = useState(false);
  const [trackCount, setTrackCount] = useState(0);
  const trackRef = useRef<[number, number][]>([]);
  const watchIdRef = useRef<number | null>(null);
  const [mapRoute, setMapRoute] = useState<RouteEntry | null>(null);

  // Live elapsed timer while a route is active
  useEffect(() => {
    if (!activeRoute) return;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [activeRoute]);

  // Pre-fill start odometer with the vehicle's current mileage
  useEffect(() => {
    if (!activeRoute && vehicle && !startOdo) {
      setStartOdo(String(vehicle.kilometrajeActual || ''));
    }
  }, [vehicle, activeRoute]);

  // Detener el watcher GPS al desmontar
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

  const completed = useMemo(() => routes.filter(r => r.status === 'completed'), [routes]);

  const livePreview = useMemo(() => {
    if (!activeRoute) return null;
    const end = parseFloat(endOdo);
    if (isNaN(end) || end <= activeRoute.odoStart) return null;
    const dist = end - activeRoute.odoStart;
    const fuel = rendimiento > 0 ? dist / rendimiento : 0;
    return { dist, fuel };
  }, [endOdo, activeRoute, rendimiento]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const odo = parseFloat(startOdo);
    if (isNaN(odo)) { showToast(t('common:error_generic'), 'error'); return; }
    setIsSubmitting(true);
    try {
      await startRoute(odo, startName);
      showToast(t('routes:toast_started'), 'success');
      setStartName('');
    } catch {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoute) return;
    const odo = parseFloat(endOdo);
    if (isNaN(odo) || odo < activeRoute.odoStart) { showToast(t('routes:error_end_odo'), 'error'); return; }
    stopGps();
    const recordedTrack = trackRef.current.length > 1 ? [...trackRef.current] : undefined;
    setIsSubmitting(true);
    try {
      await finishRoute(odo, rendimiento, endNotes, recordedTrack);
      // Keep the vehicle mileage in sync with the latest odometer reading
      if (vehicle && odo > (vehicle.kilometrajeActual || 0)) {
        await updateVehicle({ ...vehicle, kilometrajeActual: odo, actualizadoEn: new Date().toISOString() });
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

  const handleDelete = async (id: number) => {
    if (confirm(t('routes:confirm_delete'))) {
      try {
        await removeRoute(id);
        showToast(t('common:saved_success'), 'success');
      } catch {
        showToast(t('common:error_generic'), 'error');
      }
    }
  };

  if (isLoading && routes.length === 0) return <LoadingScreen />;

  const inputCls = "w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface font-headline text-2xl font-bold transition-colors";
  const labelCls = "font-label text-secondary text-[10px] font-bold tracking-[0.1rem] uppercase";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Helmet>
        <title>{t('seo:routes_title')}</title>
        <meta name="description" content={t('seo:routes_desc')} />
      </Helmet>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Performance hero (km/L) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container rounded-2xl p-7 border-l-4 border-secondary space-y-2 shadow-elevation-1">
          <p className={labelCls}>{t('routes:hero_performance')}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-5xl font-black tracking-tighter">{rendimiento > 0 ? rendimiento : '--'}</span>
            <span className="font-headline text-xl text-surface-variant font-medium uppercase">KM/L</span>
          </div>
        </div>
        <div className="bg-surface-container rounded-2xl p-7 border-l-4 border-primary space-y-2 shadow-elevation-1">
          <p className="font-label text-primary text-[10px] font-bold tracking-[0.1rem] uppercase">{t('routes:hero_count')}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-5xl font-black tracking-tighter">{completed.length}</span>
            <span className="font-headline text-xl text-surface-variant font-medium uppercase">{t('routes:hero_count_unit')}</span>
          </div>
        </div>
      </section>

      {/* Active route OR start CTA */}
      {activeRoute ? (
        <section className="space-y-5">
          <h2 className="font-headline text-xl font-black uppercase tracking-tight flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></span>
            {t('routes:on_route')}
          </h2>
          <div className="bg-surface-low rounded-2xl p-7 shadow-elevation-1 space-y-6">
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

            <form className="space-y-5 pt-2 border-t border-outline-variant/30" onSubmit={handleFinish}>
              <div className="space-y-1">
                <label className={labelCls}>{t('routes:end_odo')}</label>
                <input value={endOdo} onChange={e => setEndOdo(e.target.value)} className={inputCls} type="number" placeholder={String(activeRoute.odoStart)} required />
              </div>

              {livePreview && (
                <div className="grid grid-cols-2 gap-4 bg-surface-container rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-secondary" />
                    <div>
                      <p className="font-label text-[10px] uppercase text-surface-variant">{t('routes:distance')}</p>
                      <p className="font-headline font-black text-lg">{livePreview.dist.toLocaleString()} KM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-label text-[10px] uppercase text-surface-variant">{t('routes:fuel_used')}</p>
                      <p className="font-headline font-black text-lg">{rendimiento > 0 ? livePreview.fuel.toFixed(2) : '--'} L</p>
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
          <form className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-surface-low rounded-2xl p-7 shadow-elevation-1" onSubmit={handleStart}>
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

      {/* History */}
      <section className="space-y-4">
        <h2 className="font-headline text-xl font-black uppercase tracking-tight">{t('routes:history')}</h2>
        {completed.length === 0 && (
          <div className="bg-surface-lowest rounded-2xl p-10 flex flex-col items-center justify-center border border-outline-variant/30 text-center">
            <RouteIcon className="w-8 h-8 text-surface-variant mb-2" />
            <p className="font-headline text-lg font-bold text-surface-variant uppercase">{t('common:empty_state')}</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {completed.map((r, i) => (
            <div key={r.id} className={`group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl hover:bg-surface-high transition-colors ${i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface-low'}`}>
              <div className="flex items-center gap-5">
                <div className="flex flex-col">
                  <span className="font-label text-surface-variant text-[10px] font-bold uppercase">{t('routes:column_date')}</span>
                  <span className="font-headline font-bold text-base">
                    {new Date(r.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
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
                <button onClick={() => handleDelete(r.id!)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-surface-variant hover:text-error hover:bg-error-container/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Map modal */}
      {mapRoute && mapRoute.track && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-scrim animate-in fade-in duration-200">
          <div className="bg-surface-low rounded-2xl w-full max-w-2xl p-5 space-y-4 shadow-elevation-3">
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-lg font-black uppercase text-primary flex items-center gap-2">
                <MapIcon className="w-5 h-5" />
                {mapRoute.name || t('routes:map_title')}
              </h3>
              <button onClick={() => setMapRoute(null)} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-high transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <React.Suspense fallback={<div className="w-full h-[60vh] md:h-96 rounded-2xl bg-surface-container flex items-center justify-center"><Spinner className="w-6 h-6" /></div>}>
              <MapView track={mapRoute.track} className="w-full h-[60vh] md:h-96 rounded-2xl overflow-hidden" />
            </React.Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
