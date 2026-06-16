import React, { useMemo, useEffect, useRef } from 'react';
import { TrendingUp, PlusCircle, Droplet, BellRing, Bike, Route, Wrench, BookOpen, Fuel, ChevronRight, AlertTriangle } from 'lucide-react';
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
  const hasLogs = logs.length > 0;
  const hasMaintenanceData = maintenanceLogs.length > 0;

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

  // Contextual oil status — tells the user what to DO, not just what the number is
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

  const recentActivity = useMemo(() => {
    const l = logs.map(x => ({ id: `L-${x.id}`, title: `${t('dashboard:fuel_refill')} — ${x.fuel}L`, date: new Date(x.date), type: 'log' }));
    const m = maintenanceLogs.map(x => ({ id: `M-${x.id}`, title: x.type, date: new Date(x.date), type: 'maint' }));

    return [...l, ...m]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 3)
      .map((item, index) => ({
        id: `0${index + 1}`,
        title: item.title,
        sub: `${item.type === 'maint' ? t('dashboard:maint_label') : t('dashboard:telemetry_label')} · ${item.date.toLocaleDateString()}`,
        type: item.type,
      }));
  }, [logs, maintenanceLogs, t]);

  const currentOdo = Math.max(stats.totalDist, vehicle?.kilometrajeActual || 0);
  const alerts = useMemo(() => computeServiceAlerts(schedules, currentOdo), [schedules, currentOdo]);
  const activeAlerts = useMemo(() => alerts.filter(a => a.level !== 'ok'), [alerts]);
  const svcLabel = (type: string) => t(`maintenance:svc_${type}`, { defaultValue: type });

  // Notificación única por sesión cuando hay servicios vencidos/próximos
  useEffect(() => {
    if (notifiedRef.current || activeAlerts.length === 0) return;
    notifiedRef.current = true;
    const top = activeAlerts[0];
    const detail = top.level === 'due'
      ? t('dashboard:alert_due')
      : t('dashboard:alert_in', { km: top.remaining.toLocaleString() });
    sendNotification(t('dashboard:alerts_title'), `${svcLabel(top.schedule.type)} — ${detail}`, 'service-alerts');
  }, [activeAlerts]);

  const completedRoutes = useMemo(() => routes.filter(r => r.status === 'completed'), [routes]);
  const lastRoute = completedRoutes[0];
  const nextService = activeAlerts[0]?.nextKm ?? (vehicle?.kilometrajeProximoServicio || 0);

  if (isLoading && (!logs || logs.length === 0)) return <LoadingScreen />;

  const isOilCritical = oilStatus.urgency === 'critical' || oilStatus.urgency === 'overdue';
  const isOilWarn = oilStatus.urgency === 'warn';
  const fuelLabel = vehicle ? (FUEL_LEVEL_LABELS[vehicle.nivelGasolina] ?? `${vehicle.nivelGasolina}/5`) : null;

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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* ── Alertas de servicio ─────────────────────────────────────────── */}
        {activeAlerts.length > 0 && (
          <button
            onClick={() => setActiveTab('maintenance')}
            className="md:col-span-12 text-left bg-error-container/20 rounded-xl p-5 flex items-center gap-4 shadow-elevation-1 hover:bg-error-container/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center flex-shrink-0">
              <BellRing className="w-5 h-5 text-error" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-label text-[10px] font-bold tracking-[0.15rem] uppercase text-error mb-1">
                {t('dashboard:alerts_title')}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {activeAlerts.slice(0, 3).map(a => (
                  <span key={a.schedule.id} className="font-headline text-xs font-bold uppercase text-on-surface">
                    {svcLabel(a.schedule.type)}
                    {' · '}
                    <span className={a.level === 'due' ? 'text-error' : 'text-secondary'}>
                      {a.level === 'due' ? t('dashboard:alert_due') : t('dashboard:alert_in', { km: a.remaining.toLocaleString() })}
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-error flex-shrink-0" />
          </button>
        )}

        {/* ── Distancia total ─────────────────────────────────────────────── */}
        <section className="md:col-span-8 bg-surface-low rounded-xl p-8 relative overflow-hidden shadow-elevation-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-container rounded-l-xl" />
          <label className="text-secondary font-label text-[10px] font-bold tracking-[0.15rem] uppercase mb-4 block pl-3">
            {t('dashboard:label_total_distance')}
          </label>

          {hasLogs ? (
            <>
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
                    +{stats.distThisWeek.toLocaleString()} {t('dashboard:this_week')}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="pl-3 space-y-3 pt-2">
              <p className="font-headline font-bold text-xl text-surface-variant">{t('dashboard:no_logs_title')}</p>
              <p className="text-sm text-surface-variant/70">{t('dashboard:no_logs_sub')}</p>
              <button
                onClick={() => setActiveTab('logs')}
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full font-headline font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                {t('dashboard:no_logs_cta')}
              </button>
            </div>
          )}
        </section>

        {/* ── Botón registro rápido ───────────────────────────────────────── */}
        <div className="md:col-span-4 flex items-start">
          <button
            onClick={() => setActiveTab('logs')}
            className="w-full bg-primary-container hover:bg-primary text-on-primary-container rounded-xl px-6 py-5 flex items-center gap-4 shadow-elevation-1 transition-all duration-150 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="font-headline font-black text-base tracking-tight uppercase leading-tight text-left">
              {t('dashboard:quick_add')}
            </span>
          </button>
        </div>

        {/* ── Estado del aceite ───────────────────────────────────────────── */}
        <section
          className={`md:col-span-12 rounded-xl p-8 shadow-elevation-1 transition-colors ${
            isOilCritical ? 'bg-error-container/20' : isOilWarn ? 'bg-secondary/5' : 'bg-surface-low'
          }`}
        >
          <div className="flex justify-between items-start mb-5">
            <div className="min-w-0 flex-1">
              <label className={`font-label text-[10px] font-bold tracking-[0.15rem] uppercase block mb-1 ${isOilCritical ? 'text-error' : 'text-primary'}`}>
                {t('dashboard:oil_service')}
              </label>
              {hasMaintenanceData && (
                <span className="font-headline font-black text-5xl italic tracking-tighter">
                  {stats.oilRemaining}{' '}
                  <span className="text-2xl text-surface-variant">KM</span>
                </span>
              )}
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

          {/* Mensaje de acción contextual */}
          <div className={`flex items-center gap-2 ${hasMaintenanceData ? '' : 'mt-2'}`}>
            <p className={`text-sm font-bold ${oilStatus.color}`}>{oilStatus.msg}</p>
            {!hasMaintenanceData && (
              <button
                onClick={() => setActiveTab('maintenance')}
                className="ml-2 text-[11px] font-headline font-black uppercase tracking-widest text-primary hover:underline flex-shrink-0"
              >
                {t('dashboard:oil_no_data_cta')} →
              </button>
            )}
          </div>
        </section>

        {/* ── Resumen general ─────────────────────────────────────────────── */}
        <section className="md:col-span-12 mt-4">
          <h2 className="font-headline font-black text-xl tracking-tighter uppercase mb-4 flex items-center gap-3">
            <span className="w-6 h-[2px] bg-secondary rounded-full inline-block" />
            {t('dashboard:summary_title')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {/* Mi Moto */}
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

            {/* Rutas */}
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

            {/* Próximo servicio */}
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

            {/* Manuales */}
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

        {/* ── Actividad reciente — solo visible cuando hay registros ────── */}
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
                      item.type === 'maint' ? 'bg-primary/10' : 'bg-secondary/10'
                    }`}>
                      {item.type === 'maint'
                        ? <Wrench className="w-4 h-4 text-primary" />
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
