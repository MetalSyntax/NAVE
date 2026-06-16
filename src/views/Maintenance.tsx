import React, { useMemo, useState } from 'react';
import { SlidersHorizontal, CalendarClock, PenTool, ImagePlus, Edit3, Trash2, X, Save, BellRing, CheckCircle2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO } from '../components/ui/SEO';
import { useMaintenance } from '../hooks/useMaintenance';
import { useLogs } from '../hooks/useLogs';
import { useServiceSchedules } from '../hooks/useServiceSchedules';
import { computeServiceAlerts } from '../utils/serviceAlerts';
import { Toast, useToast } from '../components/ui/Toast';
import { LoadingScreen, Spinner } from '../components/ui/Spinner';
import { arrayBufferToUrl, toArrayBuffer } from '../utils/fileUtils';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export function MaintenanceScreen() {
  const { t } = useTranslation(['maintenance', 'seo', 'common']);
  const { maintenanceLogs, settings, isLoading: maintLoading, addMaintenance, updateMaintenance, removeMaintenance } = useMaintenance();
  const { logs, isLoading: logsLoading } = useLogs();
  const { schedules, updateSchedule, removeSchedule, addSchedule, markServiced } = useServiceSchedules();
  const { toast, showToast, hideToast } = useToast();

  const [showSchedForm, setShowSchedForm] = useState(false);
  const [newSchedType, setNewSchedType] = useState('');
  const [newSchedInterval, setNewSchedInterval] = useState('');
  const [showMaintEdu, setShowMaintEdu] = useState(() => {
    return localStorage.getItem('nave_maint_onboarding_shown') !== 'true';
  });

  const handleCloseMaintEdu = () => {
    localStorage.setItem('nave_maint_onboarding_shown', 'true');
    setShowMaintEdu(false);
  };

  const [editingMaint, setEditingMaint] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formType, setFormType] = useState('');
  const [customFormType, setCustomFormType] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formWorkshop, setFormWorkshop] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPhoto, setFormPhoto] = useState<ArrayBuffer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formKm, setFormKm] = useState('');

  // Custom integrated confirm modal states
  const [deleteMaintId, setDeleteMaintId] = useState<number | null>(null);
  const [markSchedTarget, setMarkSchedTarget] = useState<any>(null);
  const [deleteSchedId, setDeleteSchedId] = useState<number | null>(null);

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
    const serviceKm = parseInt(formKm, 10);
    if (isNaN(serviceKm) || serviceKm < 0) {
      showToast(t('common:error_generic'), 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      let finalType = formType;
      let selectedSched: any = null;
      if (formType.startsWith('sched:')) {
        const schedId = parseInt(formType.split(':')[1], 10);
        selectedSched = schedules.find(s => s.id === schedId);
        if (selectedSched) {
          finalType = svcLabel(selectedSched.type);
        }
      } else if (formType === 'Otro / Other') {
        finalType = customFormType || t('maintenance:service_other');
      }

      await addMaintenance({
        type: finalType,
        date: new Date(formDate + 'T12:00:00').toISOString(),
        km: serviceKm,
        notes: formNotes,
        cost: parseFloat(formCost) || 0,
        workshop: formWorkshop,
        fuelAtService: currentFuel,
        proofPhoto: formPhoto || undefined
      });

      if (selectedSched) {
        await markServiced(selectedSched, serviceKm);
      }

      showToast(t('common:saved_success'), 'success');
      setShowForm(false);
      setFormCost('');
      setFormWorkshop('');
      setFormNotes('');
      setFormPhoto(null);
      setCustomFormType('');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormKm(String(currentOdo || ''));
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

  const handleConfirmDeleteMaint = async () => {
    if (deleteMaintId !== null) {
      try {
        await removeMaintenance(deleteMaintId);
        showToast(t('common:saved_success'), 'success');
      } catch {
        showToast(t('common:error_generic'), 'error');
      } finally {
        setDeleteMaintId(null);
      }
    }
  };

  const alerts = useMemo(() => computeServiceAlerts(schedules, currentOdo), [schedules, currentOdo]);

  const svcLabel = (type: string) => t(`maintenance:svc_${type}`, { defaultValue: type });

  React.useEffect(() => {
    if (schedules.length > 0 && !formType) {
      setFormType(`sched:${schedules[0].id}`);
    } else if (schedules.length === 0 && !formType) {
      setFormType('Aceite / Oil');
    }
  }, [schedules, formType]);

  React.useEffect(() => {
    if (currentOdo > 0 && !formKm) {
      setFormKm(String(currentOdo));
    }
  }, [currentOdo, formKm]);

  const isFormInitialized = React.useRef(false);

  React.useEffect(() => {
    if (!maintLoading && maintenanceLogs.length === 0 && !isFormInitialized.current) {
      setShowForm(true);
      isFormInitialized.current = true;
    }
  }, [maintLoading, maintenanceLogs]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const interval = parseInt(newSchedInterval, 10);
    if (!newSchedType.trim() || isNaN(interval) || interval <= 0) { showToast(t('common:error_generic'), 'error'); return; }
    try {
      await addSchedule({ type: newSchedType.trim(), intervalKm: interval, lastServiceKm: currentOdo, enabled: true });
      showToast(t('common:saved_success'), 'success');
      setNewSchedType(''); setNewSchedInterval(''); setShowSchedForm(false);
    } catch {
      showToast(t('common:error_generic'), 'error');
    }
  };

  const handleConfirmMarkServiced = async () => {
    if (markSchedTarget) {
      try {
        await markServiced(markSchedTarget, currentOdo);
        showToast(t('common:saved_success'), 'success');
      } catch {
        showToast(t('common:error_generic'), 'error');
      } finally {
        setMarkSchedTarget(null);
      }
    }
  };

  const handleConfirmDeleteSchedule = async () => {
    if (deleteSchedId !== null) {
      try {
        await removeSchedule(deleteSchedId);
        showToast(t('common:saved_success'), 'success');
      } catch {
        showToast(t('common:error_generic'), 'error');
      } finally {
        setDeleteSchedId(null);
      }
    }
  };

  if (isLoading && maintenanceLogs.length === 0) return <LoadingScreen />;

  const inputCls = "w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 text-on-surface uppercase font-bold transition-colors";
  const labelCls = "font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase block mb-1";

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <SEO titleKey="maintenance_title" descKey="maintenance_desc" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Bento Grid — Optimized Oil Status & Service */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Vida del Aceite */}
        <div className={`sm:col-span-2 rounded-xl p-6 shadow-elevation-2 flex flex-col justify-between min-h-[170px] ${stats.lifePercent > 20 ? 'bg-surface-low' : 'bg-error-container/20'}`}>
          <div>
            <span className={`font-label text-[9px] font-black tracking-widest uppercase mb-1 block ${stats.lifePercent > 20 ? 'text-secondary' : 'text-error'}`}>
              {t('maintenance:vitality_status')}
            </span>
            <h2 className="font-headline text-4xl font-black uppercase tracking-tight">
              {t('maintenance:oil_life')}{' '}
              <span className={stats.lifePercent > 20 ? 'text-primary' : 'text-error'}>
                {stats.lifePercent.toFixed(0)}%
              </span>
            </h2>
          </div>
          <div className="mt-4">
            <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${stats.lifePercent > 20 ? 'bg-primary' : 'bg-error'}`}
                style={{ width: `${stats.lifePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-surface-variant font-bold uppercase tracking-wider">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* KM Restantes */}
        <div className="bg-surface-container rounded-xl p-6 flex flex-col justify-between min-h-[170px] shadow-elevation-1">
          <div>
            <CalendarClock className="text-secondary mb-3 w-5 h-5" />
            <span className="font-label text-secondary text-[9px] font-black tracking-widest uppercase mb-1 block">
              KM Restantes
            </span>
          </div>
          <div className="font-headline text-3xl font-black tracking-tight italic">
            {stats.remainingKm.toLocaleString()} <span className="text-base font-bold text-surface-variant">KM</span>
          </div>
        </div>

        {/* Info Cambio (Intervalo y Próximo Cambio) */}
        <div className="bg-surface-high rounded-xl p-6 flex flex-col justify-between min-h-[170px] border-r-4 border-primary shadow-elevation-1">
          <div>
            <SlidersHorizontal className="text-primary mb-3 w-5 h-5" />
            <span className="font-label text-tertiary text-[9px] font-black tracking-widest uppercase mb-1 block">
              {t('maintenance:interval_configured')} / Próximo
            </span>
          </div>
          <div>
            <div className="font-headline text-2xl font-black tracking-tight mb-1">
              {stats.interval.toLocaleString()} <span className="text-sm font-bold text-surface-variant">KM</span>
            </div>
            <div className="text-[10px] text-surface-variant font-bold uppercase tracking-wide">
              Fija en: {stats.nextServiceKm.toLocaleString()} KM
            </div>
          </div>
        </div>
      </section>

      {/* MD3 Card — Service Schedules / Predictive Alerts */}
      <div className="bg-surface-container rounded-xl p-6 mb-6 shadow-elevation-1">
        <div className="flex justify-between items-center w-full mb-1">
          <div>
            <h4 className="font-headline text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              <BellRing className="w-5 h-5 text-primary" />
              {t('maintenance:schedules_title')}
            </h4>
            <p className="font-label text-[10px] text-tertiary uppercase tracking-widest mt-0.5">
              {t('maintenance:schedules_subtitle')}
            </p>
          </div>
          <button
            onClick={() => setShowSchedForm(!showSchedForm)}
            className={`px-5 py-2 font-headline text-xs uppercase tracking-widest rounded-full transition-all ${
              showSchedForm ? 'bg-surface-high text-on-surface hover:bg-surface-low' : 'bg-primary-container text-on-primary-container hover:bg-primary'
            }`}
          >
            {showSchedForm ? t('common:btn_cancel') : t('maintenance:schedule_add')}
          </button>
        </div>

        {showSchedForm && (
          <form onSubmit={handleAddSchedule} className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-5 mt-4 border-t border-outline-variant/30">
            <div className="md:col-span-7 space-y-1">
              <label className={labelCls}>{t('maintenance:schedule_custom_ph')}</label>
              <input value={newSchedType} onChange={e => setNewSchedType(e.target.value)} type="text" className={inputCls} placeholder={t('maintenance:schedule_custom_ph')} />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className={labelCls}>{t('maintenance:schedule_interval')}</label>
              <input value={newSchedInterval} onChange={e => setNewSchedInterval(e.target.value)} type="number" className={inputCls} />
              <p className="text-[11px] text-surface-variant mt-1 leading-snug">{t('maintenance:hint_interval')}</p>
            </div>
            <div className="md:col-span-2 flex items-end">
              <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary font-headline font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all rounded-full shadow-elevation-1">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 overflow-x-auto">
          {alerts.length === 0 ? (
            <p className="font-headline text-sm font-bold text-surface-variant uppercase py-4 text-center">
              {t('maintenance:schedule_none')}
            </p>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  <th className="pb-3 pt-2 font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('maintenance:schedule_status') || 'Estado'}</th>
                  <th className="pb-3 pt-2 font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('maintenance:service_type')}</th>
                  <th className="pb-3 pt-2 font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('maintenance:schedule_next') || 'Próximo'}</th>
                  <th className="pb-3 pt-2 font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase">{t('maintenance:schedule_interval')}</th>
                  <th className="pb-3 pt-2 font-label text-[10px] font-extrabold text-secondary tracking-[0.15em] uppercase text-right">{t('common:actions') || 'Acciones'}</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(({ schedule, nextKm, remaining, level }) => {
                  const chip = level === 'due'
                    ? { cls: 'bg-error-container/30 text-error', text: t('maintenance:schedule_overdue') }
                    : level === 'soon'
                      ? { cls: 'bg-secondary/20 text-secondary', text: t('maintenance:schedule_soon') }
                      : { cls: 'bg-primary/10 text-primary', text: t('maintenance:schedule_ok') };
                  return (
                    <tr key={schedule.id} className="border-b border-outline-variant/10 hover:bg-surface-low/50 transition-colors">
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full font-label text-[9px] font-extrabold uppercase tracking-widest ${chip.cls}`}>
                          {chip.text}
                        </span>
                      </td>
                      <td className="py-4 font-headline font-bold uppercase text-on-surface">
                        {svcLabel(schedule.type)}
                      </td>
                      <td className="py-4 font-body text-xs text-on-surface">
                        <div className="font-bold">{nextKm.toLocaleString()} KM</div>
                        <div className="text-[10px] text-tertiary uppercase tracking-widest">{t('maintenance:schedule_remaining')}: {remaining.toLocaleString()} KM</div>
                      </td>
                      <td className="py-4">
                        <input
                          type="number"
                          value={schedule.intervalKm}
                          onChange={e => updateSchedule({ ...schedule, intervalKm: parseInt(e.target.value, 10) || 0 })}
                          className="w-24 bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-2 py-1 font-headline text-sm font-bold transition-colors"
                        />
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setMarkSchedTarget(schedule)}
                            title={t('maintenance:schedule_mark')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container text-surface-variant hover:text-primary hover:bg-surface-high transition-colors text-[11px] font-headline font-black uppercase tracking-wide"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{t('maintenance:schedule_mark')}</span>
                          </button>
                          <button
                            onClick={() => setDeleteSchedId(schedule.id!)}
                            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MD3 Card — Log Service Form */}
      <div className="bg-surface-container rounded-xl p-6 mb-6 shadow-elevation-1">
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
                {schedules.map(s => (
                  <option key={s.id} value={`sched:${s.id}`}>
                    {svcLabel(s.type)} ({s.intervalKm.toLocaleString()} KM)
                  </option>
                ))}
                <option value="Aceite / Oil">{t('maintenance:service_oil')}</option>
                <option value="Frenos / Brakes">{t('maintenance:service_brakes')}</option>
                <option value="Llantas / Tires">{t('maintenance:service_tires')}</option>
                <option value="Revisión / Inspection">{t('maintenance:service_check')}</option>
                <option value="Otro / Other">{t('maintenance:service_other')}</option>
              </select>
            </div>

            {formType === 'Otro / Other' && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                <label className={labelCls}>{t('maintenance:schedule_custom_ph') || 'Nombre de Servicio'}</label>
                <input value={customFormType} onChange={(e) => setCustomFormType(e.target.value)} type="text" className={inputCls} required />
              </div>
            )}

            <div className="space-y-1">
              <label className={labelCls}>{t('maintenance:date') || 'Fecha'}</label>
              <input value={formDate} onChange={(e) => setFormDate(e.target.value)} type="date" className={inputCls} required />
            </div>

            <div className="space-y-1">
              <label className={labelCls}>{t('maintenance:mileage_at_service') || 'Kilometraje'}</label>
              <input value={formKm} onChange={(e) => setFormKm(e.target.value)} type="number" className={inputCls} required />
              <p className="text-[11px] text-surface-variant mt-1 leading-snug">{t('maintenance:hint_km_service')}</p>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>{t('maintenance:cost')}</label>
              <input value={formCost} onChange={(e) => setFormCost(e.target.value)} type="number" step="0.01" className={inputCls} />
            </div>
            
            <div className="space-y-1">
              <label className={labelCls}>{t('maintenance:workshop')}</label>
              <input value={formWorkshop} onChange={(e) => setFormWorkshop(e.target.value)} type="text" className={inputCls} />
            </div>
            
            <div className="space-y-1 md:col-span-2">
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
                disabled={isSubmitting}
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
            <div className="bg-surface-lowest rounded-xl p-10 text-center border border-outline-variant/20">
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
                    onClick={() => setDeleteMaintId(log.id!)}
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
          <div className="bg-surface-low rounded-xl w-full max-w-lg p-7 space-y-6 shadow-elevation-3">
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

      {/* Integrated Custom Confirm Modals */}
      <ConfirmModal
        isOpen={deleteMaintId !== null}
        title={t('logs:confirm_delete')}
        message={t('logs:confirm_delete')}
        onConfirm={handleConfirmDeleteMaint}
        onCancel={() => setDeleteMaintId(null)}
        confirmText={t('common:btn_delete')}
        cancelText={t('common:btn_cancel')}
      />

      <ConfirmModal
        isOpen={markSchedTarget !== null}
        title={t('maintenance:schedules_title')}
        message={t('maintenance:schedule_confirm_mark')}
        onConfirm={handleConfirmMarkServiced}
        onCancel={() => setMarkSchedTarget(null)}
        confirmText={t('common:btn_save')}
        cancelText={t('common:btn_cancel')}
      />

      <ConfirmModal
        isOpen={deleteSchedId !== null}
        title={t('maintenance:schedules_title')}
        message={t('maintenance:schedule_confirm_delete')}
        onConfirm={handleConfirmDeleteSchedule}
        onCancel={() => setDeleteSchedId(null)}
        confirmText={t('common:btn_delete')}
        cancelText={t('common:btn_cancel')}
      />

      {showMaintEdu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-low border border-outline-variant/30 rounded-2xl w-full max-w-md p-8 space-y-6 shadow-elevation-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <span className="text-3xl">📋</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-headline text-2xl font-black uppercase text-primary tracking-tight">
                {t('maintenance:edu_title')}
              </h3>
              <p className="font-body text-sm text-surface-variant leading-relaxed">
                {t('maintenance:edu_desc')}
              </p>
            </div>
            <button
              onClick={handleCloseMaintEdu}
              className="w-full bg-primary text-on-primary py-4 font-headline font-black uppercase tracking-widest hover:bg-primary/90 transition-all rounded-full shadow-elevation-1"
            >
              {t('maintenance:edu_btn_close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
