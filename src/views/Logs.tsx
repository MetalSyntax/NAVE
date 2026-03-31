import React, { useState, useMemo } from 'react';
import { Save, Trash2, ArrowRight, Edit3, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useLogs } from '../hooks/useLogs';
import { Toast, useToast } from '../components/ui/Toast';
import { LoadingScreen, Spinner } from '../components/ui/Spinner';

export function LogsScreen() {
  const { t } = useTranslation(['seo', 'common', 'logs']);
  const { logs, isLoading, addLog, updateLog, removeLog } = useLogs();
  const { toast, showToast, hideToast } = useToast();
  
  const [editingLog, setEditingLog] = useState<any>(null);
  const [odo, setOdo] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [fuel, setFuel] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!odo && !distance) {
      showToast(t('common:error_generic'), 'error');
      return;
    }
    if (!fuel) {
      showToast(t('common:error_generic'), 'error');
      return;
    }

    const odoNumRaw = parseFloat(odo);
    const fuelNum = parseFloat(fuel);
    const distNumRaw = parseFloat(distance);
    
    if (isNaN(fuelNum)) return;
    
    const sortedLogs = [...logs].sort((a, b) => b.odo - a.odo);
    const lastOdo = sortedLogs.length > 0 ? sortedLogs[0].odo : 0;
    
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
      eff = (fuelNum / actualDist) * 100;
      eff = Math.round(eff * 10) / 10;
    }

    setIsSubmitting(true);
    try {
      await addLog({
        date: new Date().toISOString(),
        odo: finalOdo,
        fuel: fuelNum,
        eff: eff,
        notes: notes || 'N/A',
        distance: actualDist
      });
      showToast(t('common:saved_success'), 'success');
      setOdo('');
      setDistance('');
      setFuel('');
      setNotes('');

    } catch (error) {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    setIsSubmitting(true);
    try {
      await updateLog(editingLog);
      showToast(t('common:saved_success'), 'success');
      setEditingLog(null);
    } catch (error) {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('logs:confirm_delete'))) {
      try {
        await removeLog(id);
        showToast(t('common:saved_success'), 'success');
      } catch (error) {
        showToast(t('common:error_generic'), 'error');
      }
    }
  };

  const stats = useMemo(() => {
    if (!logs || logs.length === 0) return { totalDist: 0, lastEff: 0 };
    const sorted = [...logs].sort((a, b) => b.odo - a.odo);
    
    let totalDist = sorted[0].odo - sorted[sorted.length - 1].odo || 0;
    if (totalDist === 0 && sorted.length === 1 && sorted[0].distance) {
      totalDist = sorted[0].distance;
    }
    
    const lastEff = sorted[0].eff;
    return { totalDist, lastEff };
  }, [logs]);

  if (isLoading && logs.length === 0) return <LoadingScreen />;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <Helmet>
        <title>{t('seo:logs_title')}</title>
        <meta name="description" content={t('seo:logs_desc')} />
      </Helmet>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      {/* Hero Telemetry Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container p-8 border-l-4 border-secondary space-y-2">
          <p className="font-label text-secondary text-[10px] font-bold tracking-[0.1rem] uppercase">{t('logs:hero_distance')}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-5xl font-black tracking-tighter">
              {stats.totalDist.toLocaleString()}
            </span>
            <span className="font-headline text-xl text-surface-variant font-medium uppercase">KM</span>
          </div>
        </div>
        <div className="bg-surface-container p-8 border-l-4 border-primary space-y-2">
          <p className="font-label text-primary text-[10px] font-bold tracking-[0.1rem] uppercase">{t('logs:hero_efficiency')}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-5xl font-black tracking-tighter">
              {stats.lastEff > 0 ? stats.lastEff.toFixed(1) : '--'}
            </span>
            <span className="font-headline text-xl text-surface-variant font-medium uppercase">L/100KM</span>
          </div>
        </div>
      </section>

      {/* Log Entry Form */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-[2px] w-12 bg-primary"></div>
          <h2 className="font-headline text-2xl font-black uppercase tracking-tight">{t('logs:form_title')}</h2>
        </div>
        <form className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-surface-low p-8 shadow-2xl" onSubmit={handleSubmit}>
          <div className="md:col-span-4 space-y-2">
            <label className="font-label text-secondary text-[10px] font-bold tracking-[0.1rem] uppercase">{t('logs:label_odo')}</label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300"></div>
              <input value={odo} onChange={(e) => setOdo(e.target.value)} className="w-full bg-surface-high border-none p-4 font-headline text-3xl font-bold focus:ring-0 focus:outline-none text-white" type="number" />
            </div>
          </div>
          <div className="md:col-span-4 space-y-2">
            <label className="font-label text-secondary text-[10px] font-bold tracking-[0.1rem] uppercase">{t('logs:label_distance')}</label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300"></div>
              <input value={distance} onChange={(e) => setDistance(e.target.value)} className="w-full bg-surface-high border-none p-4 font-headline text-3xl font-bold focus:ring-0 focus:outline-none text-white" type="number" />
            </div>
          </div>
          <div className="md:col-span-4 space-y-2">
            <label className="font-label text-secondary text-[10px] font-bold tracking-[0.1rem] uppercase">{t('logs:label_fuel')}</label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300"></div>
              <input value={fuel} onChange={(e) => setFuel(e.target.value)} className="w-full bg-surface-high border-none p-4 font-headline text-3xl font-bold focus:ring-0 focus:outline-none text-white" step="0.01" type="number" required />
            </div>
          </div>
          <div className="md:col-span-12 space-y-2">
            <label className="font-label text-surface-variant text-[10px] font-bold tracking-[0.1rem] uppercase">{t('logs:label_notes')}</label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300"></div>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-surface-high border-none p-4 font-body text-sm focus:ring-0 focus:outline-none text-white" type="text" />
            </div>
          </div>
          <div className="md:col-span-12 pt-4">
            <button disabled={isSubmitting} className="w-full md:w-auto bg-primary-container text-on-primary-container font-headline font-black text-lg py-5 px-12 uppercase tracking-widest active:scale-95 transition-all hover:bg-primary duration-150 flex items-center justify-center gap-3 disabled:opacity-50" type="submit">
              {isSubmitting ? <Spinner className="w-6 h-6 border-white" /> : <Save className="w-6 h-6" />}
              {t('common:btn_save')}
            </button>
          </div>
        </form>
      </section>

      {/* Entry History */}
      <section className="space-y-8">
        <h2 className="font-headline text-2xl font-black uppercase tracking-tight">{t('logs:recent_history')}</h2>
        {logs.length === 0 && (
          <div className="bg-surface-lowest p-12 flex flex-col items-center justify-center border-2 border-dashed border-surface-variant/30 text-center">
             <p className="font-headline text-xl font-bold text-surface-variant uppercase mb-2">{t('common:empty_state')}</p>
          </div>
        )}
        <div className="flex flex-col">
          {logs.slice(0, 5).map((log, i) => (
            <div key={log.id} className={`group flex flex-col md:flex-row md:items-center justify-between p-6 ${i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface-low'}`}>
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="font-label text-surface-variant text-[10px] font-bold uppercase">{t('logs:column_date')}</span>
                  <span className="font-headline font-bold text-lg">
                    {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-surface-variant/30 hidden md:block"></div>
                <div className="flex flex-col">
                  <span className="font-label text-surface-variant text-[10px] font-bold uppercase">{t('logs:column_odo')}</span>
                  <span className="font-headline font-bold text-lg">{log.odo.toLocaleString()} KM</span>
                </div>
              </div>
              <div className="flex items-center gap-8 mt-4 md:mt-0">
                <div className="flex flex-col items-end">
                  <span className="font-label text-secondary text-[10px] font-bold uppercase">{t('logs:column_fuel')}</span>
                  <span className="font-headline font-black text-xl text-secondary">{log.fuel} L</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingLog(log)} className="text-surface-variant hover:text-primary transition-colors">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(log.id!)} className="text-surface-variant hover:text-error transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Edit Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface-lowest/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-low border border-surface-variant w-full max-w-xl p-8 space-y-8 shadow-3xl">
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-2xl font-black uppercase italic text-primary">{t('common:btn_edit')}</h3>
              <button onClick={() => setEditingLog(null)} className="p-2 hover:bg-surface-high transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <form className="space-y-6" onSubmit={handleUpdate}>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-secondary">{t('logs:label_odo')}</label>
                  <input 
                    value={editingLog.odo} 
                    onChange={e => setEditingLog({...editingLog, odo: parseFloat(e.target.value)})}
                    className="w-full bg-surface-high p-4 font-headline text-xl font-bold border-0 focus:ring-1 focus:ring-primary outline-none" 
                    type="number" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-secondary">{t('logs:label_distance')}</label>
                  <input 
                    value={editingLog.distance || ''} 
                    onChange={e => setEditingLog({...editingLog, distance: parseFloat(e.target.value)})}
                    className="w-full bg-surface-high p-4 font-headline text-xl font-bold border-0 focus:ring-1 focus:ring-primary outline-none" 
                    type="number" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-secondary">{t('logs:label_fuel')}</label>
                  <input 
                    value={editingLog.fuel} 
                    onChange={e => setEditingLog({...editingLog, fuel: parseFloat(e.target.value)})}
                    className="w-full bg-surface-high p-4 font-headline text-xl font-bold border-0 focus:ring-1 focus:ring-primary outline-none" 
                    type="number" 
                    step="0.01"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-surface-variant">{t('logs:label_notes')}</label>
                <input 
                  value={editingLog.notes} 
                  onChange={e => setEditingLog({...editingLog, notes: e.target.value})}
                  className="w-full bg-surface-high p-4 font-body text-sm border-0 focus:ring-1 focus:ring-primary outline-none" 
                  type="text" 
                />
              </div>
              <button disabled={isSubmitting} className="w-full bg-primary-container text-on-primary-container py-4 font-headline font-black uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-3">
                {isSubmitting ? <Spinner className="w-5 h-5 border-white" /> : <Save className="w-5 h-5" />}
                {t('common:btn_save')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
