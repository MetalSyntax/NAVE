import React, { useMemo } from 'react';
import { TrendingUp, PlusCircle, Sun, Fuel, Droplet, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useLogs } from '../hooks/useLogs';
import { useMaintenance } from '../hooks/useMaintenance';
import { Toast, useToast } from '../components/ui/Toast';
import { LoadingScreen } from '../components/ui/Spinner';

export function DashboardScreen({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { t } = useTranslation(['seo', 'common', 'vehicle', 'dashboard']);
  const { logs, isLoading: logsLoading } = useLogs();
  const { maintenanceLogs, settings, isLoading: maintLoading } = useMaintenance();
  const { toast, showToast, hideToast } = useToast();

  const isLoading = logsLoading || maintLoading;

  const stats = useMemo(() => {
    let totalDist = 0;
    let distThisWeek = 0;
    let oilRemaining = '--';
    let oilLifePercent = 100;
    let fuelPercent = 72;

    if (logs && logs.length > 0) {
      const sortedOdo = [...logs].sort((a, b) => b.odo - a.odo);
      totalDist = sortedOdo[0].odo;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentLogs = logs.filter(l => new Date(l.date) >= oneWeekAgo).sort((a,b) => b.odo - a.odo);
      if (recentLogs.length > 0) {
        const oldestRecent = logs.filter(l => new Date(l.date) < oneWeekAgo).sort((a,b) => b.odo - a.odo)[0];
        if (oldestRecent) {
          distThisWeek = totalDist - oldestRecent.odo;
        } else {
          distThisWeek = totalDist - recentLogs[recentLogs.length - 1].odo;
        }
      }

      const sortedByDate = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastLog = sortedByDate[0];
      const distSinceLog = totalDist - lastLog.odo;
      const estimatedRangeLost = (distSinceLog / 250) * 100;
      fuelPercent = Math.max(0, 100 - estimatedRangeLost);
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

    return { totalDist, distThisWeek, oilRemaining, oilLifePercent, fuelPercent };
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
        bg: index % 2 === 0 ? 'bg-surface-low' : 'bg-surface-high',
        hover: index % 2 === 0 ? 'hover:bg-surface-high' : 'hover:bg-surface-container'
      }));
  }, [logs, maintenanceLogs]);

  if (isLoading && (!logs || logs.length === 0)) return <LoadingScreen />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Helmet>
        <title>{t('seo:home_title')}</title>
        <meta name="description" content={t('seo:home_desc')} />
      </Helmet>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <section className="md:col-span-8 bg-surface-lowest p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>
          <label className="text-secondary font-label text-[10px] font-bold tracking-[0.15rem] uppercase mb-4 block">{t('dashboard:label_total_distance')}</label>
          <div className="flex items-baseline gap-2">
            <span className="font-headline font-black text-7xl md:text-8xl tracking-tighter italic">{stats.totalDist.toLocaleString()}</span>
            <span className="font-headline font-bold text-2xl text-surface-variant">KM</span>
          </div>
          <div className="mt-8 flex gap-4">
            <div className="bg-surface-high px-4 py-2 flex items-center gap-2">
              <TrendingUp className="text-secondary w-4 h-4" />
              <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">+{stats.distThisWeek} {t('dashboard:this_week')}</span>
            </div>
          </div>
        </section>

        <div className="md:col-span-4 flex flex-col gap-6">
          <button 
            onClick={() => setActiveTab('logs')}
            className="flex-1 bg-primary-container hover:bg-primary text-on-primary-container p-6 flex flex-col justify-between active:scale-95 transition-all duration-75"
          >
            <PlusCircle className="w-10 h-10" />
            <span className="font-headline font-black text-2xl tracking-tighter text-left uppercase leading-none mt-4">{t('dashboard:quick_add')}</span>
          </button>
        </div>

        <section className={`md:col-span-12 bg-surface-low p-8 border-l-4 ${stats.oilLifePercent > 20 ? 'border-primary' : 'border-error'}`}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <label className={`${stats.oilLifePercent > 20 ? 'text-primary' : 'text-error'} font-label text-[10px] font-bold tracking-[0.15rem] uppercase block`}>{t('dashboard:oil_service')}</label>
              <span className="font-headline font-black text-5xl italic tracking-tighter">{stats.oilRemaining} <span className="text-2xl text-surface-variant">KM</span></span>
            </div>
            <Droplet className={`${stats.oilLifePercent > 20 ? 'text-primary' : 'text-error'} w-10 h-10`} />
          </div>
          <div className="relative w-full h-2 bg-surface-lowest">
            <div className={`absolute top-0 left-0 h-full ${stats.oilLifePercent > 20 ? 'bg-primary' : 'bg-error'}`} style={{ width: `${stats.oilLifePercent}%` }}></div>
          </div>
        </section>

        <section className="md:col-span-12 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline font-black text-2xl tracking-tighter uppercase">{t('dashboard:recent_telemetry')}</h2>
          </div>
          
          {recentActivity.length === 0 && (
            <div className="bg-surface-low p-8 text-center border-2 border-dashed border-surface-variant/30">
              <p className="font-headline text-lg font-bold text-surface-variant uppercase mb-2">{t('dashboard:no_activity')}</p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {recentActivity.map((item) => (
              <div key={item.id} className={`${item.bg} p-6 flex justify-between items-center group transition-colors`}>
                <div className="flex items-center gap-6">
                  <span className="text-surface-variant font-headline font-bold text-xl">{item.id}</span>
                  <div>
                    <h3 className="font-headline font-bold text-lg uppercase">{item.title}</h3>
                    <p className="text-[10px] text-surface-variant font-bold uppercase tracking-widest">{item.sub}</p>
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
