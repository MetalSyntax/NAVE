import React, { useMemo, useEffect, useRef } from 'react';
import { TrendingUp, PlusCircle, Droplet, BellRing, Bike, Route, Wrench, BookOpen, Fuel, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
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

export function DashboardScreen({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { t } = useTranslation(['seo', 'common', 'vehicle', 'dashboard', 'maintenance']);
  const { logs, isLoading: logsLoading } = useLogs();
  const { maintenanceLogs, settings, isLoading: maintLoading } = useMaintenance();
  const { schedules } = useServiceSchedules();
  const { vehicle } = useVehicle();
  const { routes } = useRoutes();
  const { manuals } = useManuals();
  const { sendNotification } = useNotifications();
  const { toast, showToast, hideToast } = useToast();
  const notifiedRef = useRef(false);

  const isLoading = logsLoading || maintLoading;

  const stats = useMemo(() => {
    let totalDist = 0;
    let distThisWeek = 0;
    let oilRemaining = '--';
    let oilLifePercent = 100;

    if (logs && logs.length > 0) {
      const sortedOdo = [...logs].sort((a, b) => b.odo - a.odo);
      totalDist = sortedOdo[0].odo;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const recentLogs = logs.filter(l => new Date(l.date) >= oneWeekAgo).sort((a, b) => b.odo - a.odo);
      if (recentLogs.length > 0) {
        const oldestRecent = logs.filter(l => new Date(l.date) < oneWeekAgo).sort((a, b) => b.odo - a.odo)[0];
        if (oldestRecent) {
          distThisWeek = totalDist - oldestRecent.odo;
        } else {
          distThisWeek = totalDist - recentLogs[recentLogs.length - 1].odo;
        }
      }
    }

    if (maintenanceLogs && settings) {
      const sortedMaint = [...maintenanceLogs].sort((a, b) => b.km - a.km);
      const lastServiceKm = sortedMaint.length > 0 ? sortedMaint[0].km : 0;
      const kmSinceService = totalDist - lastServiceKm;
      const remainingKm = Math.max(0, settings.oilInterval - kmSinceService);

      oilRemaining = remainingKm.toLocaleString();
      let life = 100 - (kmSinceService / settings.oilInterval) * 100;
      oilLifePercent = Math.max(0, Math.min(100, life));
    }

    return { totalDist, distThisWeek, oilRemaining, oilLifePercent };
  }, [logs, maintenanceLogs, settings]);

  const recentActivity = useMemo(() => {
    const l = logs.map(x => ({ id: `L-${x.id}`, title: `${t('dashboard:fuel_refill')} - ${x.fuel}L`, date: new Date(x.date), type: 'log' }));
    const m = maintenanceLogs.map(x => ({ id: `M-${x.id}`, title: x.type, date: new Date(x.date), type: 'maint' }));

    return [...l, ...m]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 3)
      .map((item, index) => ({
        id: `0${index + 1}`,
        title: item.title,
        sub: `${item.type === 'maint' ? t('dashboard:maint_label') : t('dashboard:telemetry_label')} • ${item.date.toLocaleDateString()}`,
        type: item.type
      }));
  }, [logs, maintenanceLogs]);

  const currentOdo = Math.max(stats.totalDist, vehicle?.kilometrajeActual || 0);
  const alerts = useMemo(() => computeServiceAlerts(schedules, currentOdo), [schedules, currentOdo]);
  const activeAlerts = useMemo(() => alerts.filter(a => a.level !== 'ok'), [alerts]);
  const svcLabel = (type: string) => t(`maintenance:svc_${type}`, { defaultValue: type });

  // Notificación única por sesión cuando hay servicios vencidos/próximos.
  useEffect(() => {
    if (notifiedRef.current || activeAlerts.length === 0) return;
    notifiedRef.current = true;
    const top = activeAlerts[0];
    const detail = top.level === 'due'
      ? t('dashboard:alert_due')
      : t('dashboard:alert_in', { km: top.remaining.toLocaleString() });
    sendNotification(t('dashboard:alerts_title'), `${svcLabel(top.schedule.type)} — ${detail}`, 'service-alerts');
  }, [activeAlerts]);

  const lastEff = useMemo(() => {
    if (!logs || logs.length === 0) return 0;
    return [...logs].sort((a, b) => b.odo - a.odo)[0].eff || 0;
  }, [logs]);
  const completedRoutes = useMemo(() => routes.filter(r => r.status === 'completed'), [routes]);
  const lastRoute = completedRoutes[0];
  const nextService = activeAlerts[0]?.nextKm ?? (vehicle?.kilometrajeProximoServicio || 0);

  if (isLoading && (!logs || logs.length === 0)) return <LoadingScreen />;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <Helmet>
        <title>{t('seo:home_title')}</title>
        <meta name="description" content={t('seo:home_desc')} />
      </Helmet>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* MD3 Card — Service Alerts banner */}
        {activeAlerts.length > 0 && (
          <button
            onClick={() => setActiveTab('maintenance')}
            className="md:col-span-12 text-left bg-error-container/20 rounded-2xl p-5 flex items-center gap-4 shadow-elevation-1 hover:bg-error-container/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center flex-shrink-0">
              <BellRing className="w-5 h-5 text-error" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-label text-[10px] font-bold tracking-[0.15rem] uppercase text-error mb-1">
                {t('dashboard:alerts_title')}
              </p>
              <div className="flex flex-wrap gap-2">
                {activeAlerts.slice(0, 3).map(a => (
                  <span key={a.schedule.id} className="font-headline text-xs font-bold uppercase text-on-surface">
                    {svcLabel(a.schedule.type)} ·{' '}
                    <span className={a.level === 'due' ? 'text-error' : 'text-secondary'}>
                      {a.level === 'due' ? t('dashboard:alert_due') : t('dashboard:alert_in', { km: a.remaining.toLocaleString() })}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </button>
        )}

        {/* MD3 Elevated Card — Total Distance */}
        <section className="md:col-span-8 bg-surface-low rounded-2xl p-8 relative overflow-hidden shadow-elevation-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-container rounded-l-2xl"></div>
          <label className="text-secondary font-label text-[10px] font-bold tracking-[0.15rem] uppercase mb-4 block pl-3">
            {t('dashboard:label_total_distance')}
          </label>
          <div className="flex items-baseline gap-2 pl-3">
            <span className="font-headline font-black text-7xl md:text-8xl tracking-tighter italic">
              {stats.totalDist.toLocaleString()}
            </span>
            <span className="font-headline font-bold text-2xl text-surface-variant">KM</span>
          </div>
          <div className="mt-6 flex gap-3 pl-3">
            <div className="bg-surface-container rounded-xl px-4 py-2 flex items-center gap-2">
              <TrendingUp className="text-secondary w-4 h-4" />
              <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                +{stats.distThisWeek} {t('dashboard:this_week')}
              </span>
            </div>
          </div>
        </section>

        {/* MD3 Tonal Button — Quick Add (compact) */}
        <div className="md:col-span-4 flex items-start">
          <button
            onClick={() => setActiveTab('logs')}
            className="w-full bg-primary-container hover:bg-primary text-on-primary-container rounded-2xl px-6 py-5 flex items-center gap-4 shadow-elevation-1 transition-all duration-150 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="font-headline font-black text-base tracking-tight uppercase leading-tight text-left">
              {t('dashboard:quick_add')}
            </span>
          </button>
        </div>

        {/* MD3 Card — Oil / Service Life */}
        <section
          className={`md:col-span-12 rounded-2xl p-8 shadow-elevation-1 ${
            stats.oilLifePercent > 20 ? 'bg-surface-low' : 'bg-error-container/20'
          }`}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <label className={`font-label text-[10px] font-bold tracking-[0.15rem] uppercase block mb-1 ${stats.oilLifePercent > 20 ? 'text-primary' : 'text-error'}`}>
                {t('dashboard:oil_service')}
              </label>
              <span className="font-headline font-black text-5xl italic tracking-tighter">
                {stats.oilRemaining}{' '}
                <span className="text-2xl text-surface-variant">KM</span>
              </span>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.oilLifePercent > 20 ? 'bg-primary/10' : 'bg-error/10'}`}>
              <Droplet className={`${stats.oilLifePercent > 20 ? 'text-primary' : 'text-error'} w-6 h-6`} />
            </div>
          </div>
          <div className="relative w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ${stats.oilLifePercent > 20 ? 'bg-primary' : 'bg-error'}`}
              style={{ width: `${stats.oilLifePercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-surface-variant font-bold uppercase tracking-wide">
            <span>0 KM</span>
            <span>{stats.oilLifePercent.toFixed(0)}%</span>
          </div>
        </section>

        {/* MD3 — General Summary (data from every view) */}
        <section className="md:col-span-12 mt-4">
          <h2 className="font-headline font-black text-xl tracking-tighter uppercase mb-4 flex items-center gap-3">
            <span className="w-6 h-[2px] bg-secondary rounded-full inline-block"></span>
            {t('dashboard:summary_title')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Vehículo */}
            <button onClick={() => setActiveTab('profile')} className="text-left bg-surface-container rounded-2xl p-5 shadow-elevation-1 hover:bg-surface-high transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <Bike className="w-5 h-5 text-primary" />
                <ChevronRight className="w-4 h-4 text-surface-variant group-hover:text-primary" />
              </div>
              <p className="font-label text-[9px] font-bold tracking-widest uppercase text-surface-variant mb-1">{t('dashboard:summary_vehicle')}</p>
              <p className="font-headline font-black text-base uppercase tracking-tight truncate">
                {vehicle ? `${vehicle.marca} ${vehicle.modelo}` : t('dashboard:summary_no_vehicle')}
              </p>
              {vehicle && (
                <p className="text-[10px] text-surface-variant font-bold uppercase tracking-wider mt-1">
                  {vehicle.nivelGasolina}/5 · {vehicle.rendimientoKmL} KM/L
                </p>
              )}
            </button>

            {/* Rutas */}
            <button onClick={() => setActiveTab('routes')} className="text-left bg-surface-container rounded-2xl p-5 shadow-elevation-1 hover:bg-surface-high transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <Route className="w-5 h-5 text-secondary" />
                <ChevronRight className="w-4 h-4 text-surface-variant group-hover:text-primary" />
              </div>
              <p className="font-label text-[9px] font-bold tracking-widest uppercase text-surface-variant mb-1">{t('dashboard:summary_routes')}</p>
              <p className="font-headline font-black text-2xl tracking-tighter">{completedRoutes.length}</p>
              <p className="text-[10px] text-surface-variant font-bold uppercase tracking-wider mt-1">
                {lastRoute ? `${t('dashboard:summary_last_route')}: ${(lastRoute.distance || 0).toLocaleString()} KM` : t('dashboard:summary_no_routes')}
              </p>
            </button>

            {/* Próximo servicio */}
            <button onClick={() => setActiveTab('maintenance')} className="text-left bg-surface-container rounded-2xl p-5 shadow-elevation-1 hover:bg-surface-high transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <Wrench className="w-5 h-5 text-primary" />
                <ChevronRight className="w-4 h-4 text-surface-variant group-hover:text-primary" />
              </div>
              <p className="font-label text-[9px] font-bold tracking-widest uppercase text-surface-variant mb-1">{t('dashboard:summary_maintenance')}</p>
              <p className="font-headline font-black text-2xl tracking-tighter">{nextService.toLocaleString()}<span className="text-sm text-surface-variant"> KM</span></p>
              <p className="text-[10px] text-surface-variant font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                <Fuel className="w-3 h-3" /> {t('dashboard:summary_efficiency')}: {lastEff > 0 ? `${lastEff.toFixed(1)} L/100` : '--'}
              </p>
            </button>

            {/* Manuales */}
            <button onClick={() => setActiveTab('manuals')} className="text-left bg-surface-container rounded-2xl p-5 shadow-elevation-1 hover:bg-surface-high transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <BookOpen className="w-5 h-5 text-secondary" />
                <ChevronRight className="w-4 h-4 text-surface-variant group-hover:text-primary" />
              </div>
              <p className="font-label text-[9px] font-bold tracking-widest uppercase text-surface-variant mb-1">{t('dashboard:summary_manuals')}</p>
              <p className="font-headline font-black text-2xl tracking-tighter">{manuals.length}</p>
            </button>
          </div>
        </section>

        {/* MD3 List — Recent Activity */}
        <section className="md:col-span-12 mt-4">
          <h2 className="font-headline font-black text-xl tracking-tighter uppercase mb-4 flex items-center gap-3">
            <span className="w-6 h-[2px] bg-primary rounded-full inline-block"></span>
            {t('dashboard:recent_telemetry')}
          </h2>

          {recentActivity.length === 0 && (
            <div className="bg-surface-low rounded-2xl p-8 text-center border border-outline-variant/30">
              <p className="font-headline text-lg font-bold text-surface-variant uppercase">
                {t('dashboard:no_activity')}
              </p>
            </div>
          )}

          {/* MD3 List Items */}
          <div className="flex flex-col gap-2">
            {recentActivity.map((item, idx) => (
              <div
                key={item.id}
                className="bg-surface-container rounded-2xl p-5 flex justify-between items-center hover:bg-surface-high transition-colors duration-150"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-headline font-black ${item.type === 'maint' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                    {item.id}
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
      </div>
    </div>
  );
}
