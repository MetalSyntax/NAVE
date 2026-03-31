import React, { useMemo, useState } from 'react';
import { History, SlidersHorizontal, CalendarClock, PenTool, ImagePlus, Edit3, Trash2, X, Save } from 'lucide-react';
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
    return logs[logs.length - 1].fuel; // Approximate level based on last log amount
  }, [logs]);

  const stats = useMemo(() => {
    let lastServiceKm = 0;
    let lastServiceDate = '--';
    const interval = settings?.oilInterval || 3000;

    const oilRecords = maintenanceLogs.filter(m => m.type.toLowerCase().includes('aceite') || m.type.toLowerCase().includes('oil'));

    if (oilRecords && oilRecords.length > 0) {
      const sorted = [...oilRecords].sort((a, b) => b.km - a.km);
      lastServiceKm = sorted[0].km;
      lastServiceDate = new Date(sorted[0].date).toLocaleDateString();
    }

    const kmSinceService = currentOdo - lastServiceKm;
    const remainingKm = Math.max(0, interval - kmSinceService);
    let lifePercent = 100 - (kmSinceService / interval) * 100;
    if (lifePercent < 0) lifePercent = 0;
    if (lifePercent > 100) lifePercent = 100;

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
      } catch (err) {
        showToast(t('maintenance:photo_error'), 'error');
      }
    }
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentOdo === 0) {
      showToast(t('common:error_generic'), 'error');
      return;
    }
    
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
      setFormCost('');
      setFormWorkshop('');
      setFormNotes('');
      setFormPhoto(null);
    } catch (error) {
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
    } catch (error) {
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
      } catch (error) {
        showToast(t('common:error_generic'), 'error');
      }
    }
  };

  if (isLoading && maintenanceLogs.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <Helmet>
        <title>{t('seo:maintenance_title')}</title>
        <meta name="description" content={t('seo:maintenance_desc')} />
      </Helmet>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      {/* Hero Telemetry Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-0 mb-12">
        <div className={`md:col-span-8 bg-surface-lowest p-8 border-l-4 ${stats.lifePercent > 20 ? 'border-primary-container' : 'border-error'}`}>
          <span className={`font-label text-[10px] font-bold tracking-[0.2em] uppercase mb-4 block ${stats.lifePercent > 20 ? 'text-secondary' : 'text-error'}`}>{t('maintenance:vitality_status')}</span>
          <h2 className="font-headline text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6">
            {t('maintenance:oil_life')} <span className={stats.lifePercent > 20 ? 'text-primary-container' : 'text-error'}>{stats.lifePercent.toFixed(0)}%</span>
          </h2>
          <div className="h-2 w-full bg-surface-high relative overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-1000 ${stats.lifePercent > 20 ? 'bg-primary-container' : 'bg-error'}`} 
              style={{ width: `${stats.lifePercent}%` }}
            ></div>
          </div>
        </div>
        <div className="md:col-span-4 bg-surface-container p-8 flex flex-col justify-end">
          <span className="font-label text-secondary text-[10px] font-bold tracking-[0.2em] uppercase mb-2 block">{t('maintenance:predicted_due')}</span>
          <div className="font-headline text-4xl font-bold tracking-tighter italic">{stats.remainingKm.toLocaleString()} KM</div>
        </div>
      </section>

      {/* Bento Layout for Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-surface-high p-6 flex flex-col justify-between h-48 border-t-2 border-secondary/30">
          <div>
            <SlidersHorizontal className="text-secondary mb-4 w-6 h-6" />
            <h3 className="font-label text-[10px] font-bold tracking-[0.2em] text-tertiary uppercase">{t('maintenance:interval_configured')}</h3>
          </div>
          <div className="flex items-end justify-between">
            <div className="font-headline text-5xl font-black tracking-tighter">{stats.interval.toLocaleString()}</div>
            <div className="font-label text-xs font-bold text-secondary mb-2 uppercase">KM</div>
          </div>
        </div>
        <div className="bg-surface-lowest p-6 flex flex-col justify-between h-48 border-r-4 border-primary">
          <div>
            <CalendarClock className="text-primary mb-4 w-6 h-6" />
            <h3 className="font-label text-[10px] font-bold tracking-[0.2em] text-tertiary uppercase">{t('maintenance:predicted_due')}</h3>
          </div>
          <div>
            <div className="font-headline text-xl text-secondary font-medium">{stats.nextServiceKm.toLocaleString()} KM</div>
          </div>
        </div>
      </div>

      {/* Action / Form Area */}
      <div className="flex flex-col items-start gap-8 bg-surface-container p-8 mb-12">
        <div className="flex justify-between items-center w-full">
          <h4 className="font-headline text-2xl font-bold uppercase tracking-tight">{t('maintenance:log_service')}</h4>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="px-6 py-2 bg-primary-container text-on-primary-container font-headline text-sm uppercase tracking-widest hover:bg-primary"
          >
            {showForm ? t('common:btn_cancel') : t('maintenance:btn_new')}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmitService} className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-surface-variant/20">
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('maintenance:service_type')}</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full bg-surface-high border-0 px-4 py-3 text-white uppercase font-bold focus:outline-none">
                <option value="Aceite / Oil">{t('maintenance:service_oil')}</option>
                <option value="Frenos / Brakes">{t('maintenance:service_brakes')}</option>
                <option value="Llantas / Tires">{t('maintenance:service_tires')}</option>
                <option value="Revisión / Inspection">{t('maintenance:service_check')}</option>
                <option value="Otro / Other">{t('maintenance:service_other')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('maintenance:cost')}</label>
              <input value={formCost} onChange={(e) => setFormCost(e.target.value)} type="number" step="0.01" className="w-full bg-surface-high border-0 px-4 py-3 text-white uppercase font-bold focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('maintenance:workshop')}</label>
              <input value={formWorkshop} onChange={(e) => setFormWorkshop(e.target.value)} type="text" className="w-full bg-surface-high border-0 px-4 py-3 text-white uppercase font-bold focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('maintenance:notes_description')}</label>
              <input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} type="text" className="w-full bg-surface-high border-0 px-4 py-3 text-white font-body focus:outline-none" />
            </div>
            
            <div className="space-y-2 md:col-span-2 flex flex-col md:flex-row items-center gap-6">
              <label className="relative cursor-pointer w-full md:w-auto flex items-center gap-3 bg-surface-low px-6 py-4 hover:bg-surface-high transition-colors text-white font-headline text-sm uppercase tracking-widest">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <ImagePlus className="w-5 h-5" />
                {formPhoto ? t('maintenance:photo_loaded') : t('maintenance:proof_photo')}
              </label>
              <button disabled={isSubmitting || currentOdo === 0} type="submit" className="w-full md:w-1/2 flex items-center justify-center gap-3 px-10 py-4 bg-primary-container text-on-primary-container font-headline font-black uppercase tracking-widest text-sm hover:bg-primary transition-all active:scale-95 duration-75 disabled:opacity-50">
                {isSubmitting ? <Spinner className="w-5 h-5 border-white" /> : <PenTool className="w-5 h-5" />}
                {t('common:btn_save')}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* History List */}
      <div className="mt-12">
        <h5 className="font-label text-[10px] font-bold tracking-[0.3em] text-secondary uppercase mb-8">{t('maintenance:history_log_title')}</h5>
        <div className="space-y-2">
          {maintenanceLogs.length === 0 && (
            <div className="bg-surface-lowest p-12 text-center border-t border-surface-variant/20">
              <p className="font-headline text-xl font-bold text-surface-variant uppercase mb-2">{t('maintenance:no_records')}</p>
            </div>
          )}

          {maintenanceLogs.map((log, index) => (
            <div key={log.id} className={`flex flex-col md:flex-row justify-between p-6 ${index % 2 === 0 ? 'bg-surface-low' : 'bg-surface-high'}`}>
              <div className="flex items-start gap-6">
                <span className="font-headline text-lg font-bold text-tertiary">
                  {String(maintenanceLogs.length - index).padStart(2, '0')}
                </span>
                <div>
                  <div className="font-headline font-bold uppercase">{log.type}</div>
                  <div className="text-[10px] text-tertiary uppercase tracking-widest mb-1">
                    {new Date(log.date).toLocaleDateString()} • {log.workshop || 'NA'}
                  </div>
                  {log.notes && <p className="text-sm text-surface-variant font-body">{log.notes}</p>}
                </div>
              </div>
              <div className="flex flex-col items-end mt-4 md:mt-0">
                <div className="font-headline font-bold text-xl">{log.km.toLocaleString()} KM</div>
                {log.cost ? <div className="text-secondary font-bold text-sm uppercase">${log.cost}</div> : null}
                {log.proofPhoto && (
                  <button 
                    onClick={() => {
                      const url = arrayBufferToUrl(log.proofPhoto as ArrayBuffer);
                      window.open(url, '_blank');
                    }}
                    className="text-[10px] mt-2 underline text-surface-variant hover:text-primary uppercase"
                  >
                    {t('maintenance:view_photo')}
                  </button>
                )}
                <div className="flex items-center gap-2 mt-4">
                  <button onClick={() => setEditingMaint(log)} className="text-surface-variant hover:text-primary transition-colors">
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
      </div>

      {/* Edit Modal */}
      {editingMaint && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface-lowest/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-low border border-surface-variant w-full max-w-xl p-8 space-y-8 shadow-3xl">
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-2xl font-black uppercase italic text-primary">{t('common:btn_edit')}</h3>
              <button onClick={() => setEditingMaint(null)} className="p-2 hover:bg-surface-high transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <form className="space-y-6" onSubmit={handleUpdateService}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-secondary">{t('maintenance:service_type')}</label>
                <input 
                  value={editingMaint.type} 
                  onChange={e => setEditingMaint({...editingMaint, type: e.target.value})}
                  className="w-full bg-surface-high p-4 font-headline text-xl font-bold border-0 focus:ring-1 focus:ring-primary outline-none" 
                  type="text" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-secondary">{t('maintenance:cost')}</label>
                  <input 
                    value={editingMaint.cost} 
                    onChange={e => setEditingMaint({...editingMaint, cost: parseFloat(e.target.value)})}
                    className="w-full bg-surface-high p-4 font-headline text-xl font-bold border-0 focus:ring-1 focus:ring-primary outline-none" 
                    type="number" 
                  />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase text-secondary">{t('maintenance:workshop')}</label>
                  <input 
                    value={editingMaint.workshop} 
                    onChange={e => setEditingMaint({...editingMaint, workshop: e.target.value})}
                    className="w-full bg-surface-high p-4 font-headline text-xl font-bold border-0 focus:ring-1 focus:ring-primary outline-none" 
                    type="text" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-surface-variant">{t('maintenance:notes_description')}</label>
                <input 
                  value={editingMaint.notes} 
                  onChange={e => setEditingMaint({...editingMaint, notes: e.target.value})}
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
