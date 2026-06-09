import React, { useMemo, useState } from 'react';
import { SlidersHorizontal, CalendarClock, PenTool, ImagePlus, Edit3, Trash2, X, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useMaintenance } from '../hooks/useMaintenance';
import { useLogs } from '../hooks/useLogs';
import { Toast, useToast } from '../components/ui/Toast';
import { LoadingScreen, Spinner } from '../components/ui/Spinner';
import { arrayBufferToUrl, toArrayBuffer } from '../utils/fileUtils';

export function MaintenanceScreen() {
  const { t } = useTranslation(['maintenance', 'seo', 'common']);
  const { maintenanceLogs, settings, isLoading: maintLoading, addMaintenance, updateMaintenance, removeMaintenance } = useMaintenance();
  const { logs, isLoading: logsLoading } = useLogs();
  const { toast, showToast, hideToast } = useToast();

  const [editingMaint, setEditingMaint] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formType, setFormType] = useState('Aceite');
  const [formCost, setFormCost] = useState('');
  const [formWorkshop, setFormWorkshop] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPhoto, setFormPhoto] = useState<ArrayBuffer | null>(null);
  const [showForm, setShowForm] = useState(false);

  const isLoading = maintLoading || logsLoading;

  const currentOdo = useMemo(() => {
    if (!logs || logs.length === 0) return 0;
    return Math.max(...logs.map(l => l.odo));
  }, [logs]);

  const currentFuel = useMemo(() => {
    if (!logs || logs.length === 0) return 0;
    return logs[logs.length - 1].fuel;
  }, [logs]);

  const stats = useMemo(() => {
    let lastServiceKm = 0;
    let lastServiceDate = '--';
    const interval = settings?.oilInterval || 3000;
    const oilRecords = maintenanceLogs.filter(m => m.type.toLowerCase().includes('aceite') || m.type.toLowerCase().includes('oil'));

    if (oilRecords.length > 0) {
      const sorted = [...oilRecords].sort((a, b) => b.km - a.km);
      lastServiceKm = sorted[0].km;
      lastServiceDate = new Date(sorted[0].date).toLocaleDateString();
    }

    const kmSinceService = currentOdo - lastServiceKm;
    const remainingKm = Math.max(0, interval - kmSinceService);
    let lifePercent = Math.max(0, Math.min(100, 100 - (kmSinceService / interval) * 100));
    const nextServiceKm = lastServiceKm + interval;

    return { lastServiceKm, lastServiceDate, interval, remainingKm, lifePercent, nextServiceKm };
  }, [maintenanceLogs, currentOdo, settings]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const buffer = await toArrayBuffer(file);
        setFormPhoto(buffer);
        showToast(t('maintenance:photo_success'), 'success');
      } catch {
        showToast(t('maintenance:photo_error'), 'error');
      }
    }
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentOdo === 0) { showToast(t('common:error_generic'), 'error'); return; }
    setIsSubmitting(true);
    try {
      await addMaintenance({
        type: formType,
        date: new Date().toISOString(),
        km: currentOdo,
        notes: formNotes,
        cost: parseFloat(formCost) || 0,
        workshop: formWorkshop,
        fuelAtService: currentFuel,
        proofPhoto: formPhoto || undefined
      });
      showToast(t('common:saved_success'), 'success');
      setShowForm(false);
      setFormCost(''); setFormWorkshop(''); setFormNotes(''); setFormPhoto(null);
    } catch {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaint) return;
    setIsSubmitting(true);
    try {
      await updateMaintenance(editingMaint);
      showToast(t('common:saved_success'), 'success');
      setEditingMaint(null);
    } catch {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('logs:confirm_delete'))) {
      try {
        await removeMaintenance(id);
        showToast(t('common:saved_success'), 'success');
      } catch {
        showToast(t('common:error_generic'), 'error');
      }
    }
  };

  if (isLoading && maintenanceLogs.length === 0) return <LoadingScreen />;

  const inputCls = "w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface uppercase font-bold transition-colors";
  const labelCls = "font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase block mb-1";

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <Helmet>
        <title>{t('seo:maintenance_title')}</title>
        <meta name="description" content={t('seo:maintenance_desc')} />
      </Helmet>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* MD3 Hero Card — Oil Life */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        <div className={`md:col-span-8 rounded-2xl p-8 shadow-elevation-2 ${stats.lifePercent > 20 ? 'bg-surface-low' : 'bg-error-container/20'}`}>
          <span className={`font-label text-[10px] font-bold tracking-[0.2em] uppercase mb-3 block ${stats.lifePercent > 20 ? 'text-secondary' : 'text-error'}`}>
            {t('maintenance:vitality_status')}
          </span>
          <h2 className="font-headline text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-5">
            {t('maintenance:oil_life')}{' '}
            <span className={stats.lifePercent > 20 ? 'text-primary' : 'text-error'}>
              {stats.lifePercent.toFixed(0)}%
            </span>
          </h2>
          <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${stats.lifePercent > 20 ? 'bg-primary' : 'bg-error'}`}
              style={{ width: `${stats.lifePercent}%` }}
            />
          </div>
        </div>
        <div className="md:col-span-4 bg-surface-container rounded-2xl p-8 flex flex-col justify-end shadow-elevation-1">
          <span className="font-label text-secondary text-[10px] font-bold tracking-[0.2em] uppercase mb-2 block">
            {t('maintenance:predicted_due')}
          </span>
          <div className="font-headline text-3xl font-bold tracking-tighter italic">
            {stats.remainingKm.toLocaleString()} KM
          </div>
        </div>
      </section>

      {/* MD3 Bento Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface-high rounded-2xl p-6 flex flex-col justify-between h-44 shadow-elevation-1">
          <div>
            <SlidersHorizontal className="text-secondary mb-3 w-5 h-5" />
            <h3 className="font-label text-[10px] font-bold tracking-[0.2em] text-tertiary uppercase">
              {t('maintenance:interval_configured')}
            </h3>
          </div>
          <div className="flex items-end justify-between">
            <div className="font-headline text-4xl font-black tracking-tighter">{stats.interval.toLocaleString()}</div>
            <div className="font-label text-xs font-bold text-secondary mb-1 uppercase">KM</div>
          </div>
        </div>
        <div className="bg-surface-lowest rounded-2xl p-6 flex flex-col justify-between h-44 border-r-4 border-primary shadow-elevation-1">
          <div>
            <CalendarClock className="text-primary mb-3 w-5 h-5" />
            <h3 className="font-label text-[10px] font-bold tracking-[0.2em] text-tertiary uppercase">
              {t('maintenance:predicted_due')}
            </h3>
          </div>
          <div className="font-headline text-xl text-secondary font-medium">
            {stats.nextServiceKm.toLocaleString()} KM
          </div>
        </div>
      </div>

      {/* MD3 Card — Log Service Form */}
      <div className="bg-surface-container rounded-2xl p-6 mb-6 shadow-elevation-1">
        <div className="flex justify-between items-center w-full mb-2">
          <h4 className="font-headline text-xl font-bold uppercase tracking-tight">
            {t('maintenance:log_service')}
          </h4>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-5 py-2 font-headline text-xs uppercase tracking-widest rounded-full transition-all ${
              showForm
                ? 'bg-surface-high text-on-surface hover:bg-surface-low'
                : 'bg-primary-container text-on-primary-container hover:bg-primary'
            }`}
          >
            {showForm ? t('common:btn_cancel') : t('maintenance:btn_new')}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmitService} className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 mt-4 border-t border-outline-variant/30">
            <div className="space-y-1">
              <label className={labelCls}>{t('maintenance:service_type')}</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value)} className={inputCls}>
                <option value="Aceite / Oil">{t('maintenance:service_oil')}</option>
                <option value="Frenos / Brakes">{t('maintenance:service_brakes')}</option>
                <option value="Llantas / Tires">{t('maintenance:service_tires')}</option>
                <option value="Revisión / Inspection">{t('maintenance:service_check')}</option>
                <option value="Otro / Other">{t('maintenance:service_other')}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>{t('maintenance:cost')}</label>
              <input value={formCost} onChange={(e) => setFormCost(e.target.value)} type="number" step="0.01" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>{t('maintenance:workshop')}</label>
              <input value={formWorkshop} onChange={(e) => setFormWorkshop(e.target.value)} type="text" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>{t('maintenance:notes_description')}</label>
              <input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} type="text" className={inputCls} />
            </div>

            <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-4 pt-2">
              <label className="relative cursor-pointer flex items-center gap-3 bg-surface-low hover:bg-surface-high transition-colors text-on-surface font-headline text-xs uppercase tracking-widest px-5 py-3 rounded-full">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <ImagePlus className="w-4 h-4" />
                {formPhoto ? t('maintenance:photo_loaded') : t('maintenance:proof_photo')}
              </label>
              <button
                disabled={isSubmitting || currentOdo === 0}
                type="submit"
                className="flex-1 flex items-center justify-center gap-3 px-8 py-3 bg-primary text-on-primary font-headline font-black uppercase tracking-widest text-sm hover:bg-primary/90 transition-all disabled:opacity-50 rounded-full shadow-elevation-1"
              >
                {isSubmitting ? <Spinner className="w-4 h-4" /> : <PenTool className="w-4 h-4" />}
                {t('common:btn_save')}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* MD3 List — History */}
      <div>
        <h5 className="font-label text-[10px] font-bold tracking-[0.3em] text-secondary uppercase mb-5">
          {t('maintenance:history_log_title')}
        </h5>
        <div className="space-y-2">
          {maintenanceLogs.length === 0 && (
            <div className="bg-surface-lowest rounded-2xl p-10 text-center border border-outline-variant/20">
              <p className="font-headline text-lg font-bold text-surface-variant uppercase">
                {t('maintenance:no_records')}
              </p>
            </div>
          )}
          {maintenanceLogs.map((log, index) => (
            <div
              key={log.id}
              className={`flex flex-col md:flex-row justify-between p-5 rounded-xl transition-colors hover:bg-surface-high ${index % 2 === 0 ? 'bg-surface-low' : 'bg-surface-container'}`}
            >
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center font-headline text-sm font-bold text-tertiary flex-shrink-0">
                  {String(maintenanceLogs.length - index).padStart(2, '0')}
                </span>
                <div>
                  <div className="font-headline font-bold uppercase text-on-surface">{log.type}</div>
                  <div className="text-[10px] text-tertiary uppercase tracking-widest mb-1">
                    {new Date(log.date).toLocaleDateString()} • {log.workshop || 'NA'}
                  </div>
                  {log.notes && <p className="text-sm text-surface-variant font-body">{log.notes}</p>}
                </div>
              </div>
              <div className="flex flex-col items-end mt-4 md:mt-0">
                <div className="font-headline font-bold text-lg">{log.km.toLocaleString()} KM</div>
                {log.cost ? <div className="text-secondary font-bold text-sm uppercase">${log.cost}</div> : null}
                {log.proofPhoto && (
                  <button
                    onClick={() => { const url = arrayBufferToUrl(log.proofPhoto as ArrayBuffer); window.open(url, '_blank'); }}
                    className="text-[10px] mt-2 underline text-surface-variant hover:text-primary uppercase rounded-none"
                    style={{ borderRadius: 0 }}
                  >
                    {t('maintenance:view_photo')}
                  </button>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setEditingMaint(log)}
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
      </div>

      {/* MD3 Modal — Edit */}
      {editingMaint && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-scrim animate-in fade-in duration-200">
          <div className="bg-surface-low rounded-2xl w-full max-w-lg p-7 space-y-6 shadow-elevation-3">
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-xl font-black uppercase text-primary">{t('common:btn_edit')}</h3>
              <button
                onClick={() => setEditingMaint(null)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-high transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="space-y-5" onSubmit={handleUpdateService}>
              <div className="space-y-1">
                <label className={labelCls}>{t('maintenance:service_type')}</label>
                <input
                  value={editingMaint.type}
                  onChange={e => setEditingMaint({...editingMaint, type: e.target.value})}
                  className={inputCls}
                  type="text"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>{t('maintenance:cost')}</label>
                  <input
                    value={editingMaint.cost}
                    onChange={e => setEditingMaint({...editingMaint, cost: parseFloat(e.target.value)})}
                    className={inputCls}
                    type="number"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>{t('maintenance:workshop')}</label>
                  <input
                    value={editingMaint.workshop}
                    onChange={e => setEditingMaint({...editingMaint, workshop: e.target.value})}
                    className={inputCls}
                    type="text"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>{t('maintenance:notes_description')}</label>
                <input
                  value={editingMaint.notes}
                  onChange={e => setEditingMaint({...editingMaint, notes: e.target.value})}
                  className="w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface font-body text-sm transition-colors"
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
