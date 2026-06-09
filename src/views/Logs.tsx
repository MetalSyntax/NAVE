import React, { useState, useMemo } from 'react';
import { Save, Trash2, Edit3, X } from 'lucide-react';
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
  const [odo, setOdo] = useState('');
  const [distance, setDistance] = useState('');
  const [fuel, setFuel] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!odo && !distance) { showToast(t('common:error_generic'), 'error'); return; }
    if (!fuel) { showToast(t('common:error_generic'), 'error'); return; }

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
      eff = Math.round((fuelNum / actualDist) * 1000) / 10;
    }

    setIsSubmitting(true);
    try {
      await addLog({ date: new Date().toISOString(), odo: finalOdo, fuel: fuelNum, eff, notes: notes || 'N/A', distance: actualDist });
      showToast(t('common:saved_success'), 'success');
      setOdo(''); setDistance(''); setFuel(''); setNotes('');
    } catch {
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
    } catch {
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
      } catch {
        showToast(t('common:error_generic'), 'error');
      }
    }
  };

  const stats = useMemo(() => {
    if (!logs || logs.length === 0) return { totalDist: 0, lastEff: 0 };
    const sorted = [...logs].sort((a, b) => b.odo - a.odo);
    let totalDist = sorted[0].odo - sorted[sorted.length - 1].odo || 0;
    if (totalDist === 0 && sorted.length === 1 && sorted[0].distance) totalDist = sorted[0].distance;
    return { totalDist, lastEff: sorted[0].eff };
  }, [logs]);

  if (isLoading && logs.length === 0) return <LoadingScreen />;

  const inputCls = "w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface font-headline text-2xl font-bold transition-colors";
  const labelCls = "font-label text-secondary text-[10px] font-bold tracking-[0.1rem] uppercase";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Helmet>
        <title>{t('seo:logs_title')}</title>
        <meta name="description" content={t('seo:logs_desc')} />
      </Helmet>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* MD3 Hero Stats — 2 cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container rounded-2xl p-7 border-l-4 border-secondary space-y-2 shadow-elevation-1">
          <p className={labelCls}>{t('logs:hero_distance')}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-5xl font-black tracking-tighter">{stats.totalDist.toLocaleString()}</span>
            <span className="font-headline text-xl text-surface-variant font-medium uppercase">KM</span>
          </div>
        </div>
        <div className="bg-surface-container rounded-2xl p-7 border-l-4 border-primary space-y-2 shadow-elevation-1">
          <p className="font-label text-primary text-[10px] font-bold tracking-[0.1rem] uppercase">{t('logs:hero_efficiency')}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-5xl font-black tracking-tighter">{stats.lastEff > 0 ? stats.lastEff.toFixed(1) : '--'}</span>
            <span className="font-headline text-xl text-surface-variant font-medium uppercase">L/100KM</span>
          </div>
        </div>
      </section>

      {/* MD3 Filled Card — Log Entry Form */}
      <section className="space-y-5">
        <h2 className="font-headline text-xl font-black uppercase tracking-tight flex items-center gap-3">
          <span className="w-6 h-[2px] bg-primary rounded-full"></span>
          {t('logs:form_title')}
        </h2>
        <form className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-surface-low rounded-2xl p-7 shadow-elevation-1" onSubmit={handleSubmit}>
          <div className="md:col-span-4 space-y-1">
            <label className={labelCls}>{t('logs:label_odo')}</label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300 rounded-full"></div>
              <input value={odo} onChange={(e) => setOdo(e.target.value)} className={inputCls} type="number" />
            </div>
          </div>
          <div className="md:col-span-4 space-y-1">
            <label className={labelCls}>{t('logs:label_distance')}</label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300 rounded-full"></div>
              <input value={distance} onChange={(e) => setDistance(e.target.value)} className={inputCls} type="number" />
            </div>
          </div>
          <div className="md:col-span-4 space-y-1">
            <label className={labelCls}>{t('logs:label_fuel')}</label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300 rounded-full"></div>
              <input value={fuel} onChange={(e) => setFuel(e.target.value)} className={inputCls} step="0.01" type="number" required />
            </div>
          </div>
          <div className="md:col-span-12 space-y-1">
            <label className="font-label text-surface-variant text-[10px] font-bold tracking-[0.1rem] uppercase">{t('logs:label_notes')}</label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-focus-within:scale-y-100 transition-transform duration-300 rounded-full"></div>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface font-body text-sm transition-colors"
                type="text"
              />
            </div>
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

      {/* MD3 List — Entry History */}
      <section className="space-y-4">
        <h2 className="font-headline text-xl font-black uppercase tracking-tight">{t('logs:recent_history')}</h2>
        {logs.length === 0 && (
          <div className="bg-surface-lowest rounded-2xl p-10 flex flex-col items-center justify-center border border-outline-variant/30 text-center">
            <p className="font-headline text-lg font-bold text-surface-variant uppercase">{t('common:empty_state')}</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {logs.slice(0, 5).map((log, i) => (
            <div
              key={log.id}
              className={`group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl hover:bg-surface-high transition-colors ${i % 2 === 0 ? 'bg-surface-lowest' : 'bg-surface-low'}`}
            >
              <div className="flex items-center gap-5">
                <div className="flex flex-col">
                  <span className="font-label text-surface-variant text-[10px] font-bold uppercase">{t('logs:column_date')}</span>
                  <span className="font-headline font-bold text-base">
                    {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
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
                    onClick={() => handleDelete(log.id!)}
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

      {/* MD3 Modal — Edit */}
      {editingLog && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-scrim animate-in fade-in duration-200">
          <div className="bg-surface-low rounded-2xl w-full max-w-lg p-7 space-y-6 shadow-elevation-3">
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-xl font-black uppercase text-primary">{t('common:btn_edit')}</h3>
              <button
                onClick={() => setEditingLog(null)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-high transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="space-y-5" onSubmit={handleUpdate}>
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
    </div>
  );
}
