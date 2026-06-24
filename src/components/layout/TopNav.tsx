import React, { useMemo, useState } from 'react';
import { Bike, Globe, BellRing, X, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { useServiceSchedules } from '../../hooks/useServiceSchedules';
import { useVehicle } from '../../hooks/useVehicle';
import { computeServiceAlerts } from '../../utils/serviceAlerts';
import { arrayBufferToUrl } from '../../utils/fileUtils';

interface TopNavProps {
  setActiveTab: (tab: string) => void;
}

export function TopNav({ setActiveTab }: TopNavProps) {
  const { t, i18n } = useTranslation(['maintenance', 'common', 'vehicle']);
  const { user, updateSettings } = useSettings();
  const { schedules, removeSchedule } = useServiceSchedules();
  const { vehicle } = useVehicle();
  const [showBellModal, setShowBellModal] = useState(false);

  const alerts = useMemo(() => {
    const odo = vehicle?.kilometrajeActual ?? 0;
    return computeServiceAlerts(schedules, odo);
  }, [schedules, vehicle]);

  const pendingAlerts = useMemo(() => alerts.filter(a => a.level !== 'ok'), [alerts]);

  const vehicleServiceDue = useMemo(() => {
    if (!vehicle) return false;
    const odo = vehicle.kilometrajeActual ?? 0;
    const nextSvc = vehicle.kilometrajeProximoServicio ?? 0;
    return nextSvc > 0 && odo >= nextSvc * 0.95;
  }, [vehicle]);

  const alertCount = pendingAlerts.length + (vehicleServiceDue ? 1 : 0);

  const svcLabel = (type: string) => t(`maintenance:svc_${type}`, { defaultValue: type });

  const toggleLanguage = async () => {
    const nextLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(nextLang);
    await updateSettings({ language: nextLang });
  };

  const avatarUrl = user?.avatar
    ? arrayBufferToUrl(user.avatar)
    : 'https://api.dicebear.com/9.x/bottts/svg?seed=nave&backgroundColor=transparent';

  return (
    <>
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-surface-container shadow-elevation-1">
        {/* Logo */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-surface-high transition-colors"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-primary-container rounded-xl">
            <Bike className="text-on-primary-container w-4 h-4" />
          </div>
          <h1 className="font-headline uppercase tracking-tighter font-black text-lg text-primary italic hidden sm:block">
            NAVE
          </h1>
        </button>

        <div className="flex items-center gap-3">
          {/* Notifications bell */}
          <button
            onClick={() => setShowBellModal(true)}
            className="relative w-9 h-9 flex items-center justify-center rounded-full bg-surface-high hover:bg-surface-low transition-colors"
            aria-label="Notificaciones"
          >
            <BellRing className={`w-4 h-4 ${alertCount > 0 ? 'text-error' : 'text-surface-variant'}`} />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-error text-on-error text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-high hover:bg-surface-low border border-outline-variant text-[10px] font-bold tracking-widest uppercase rounded-full transition-colors"
          >
            <Globe className="w-3 h-3 text-secondary flex-shrink-0" />
            {i18n.language.startsWith('es') ? 'ES' : 'EN'}
          </button>

          {/* Avatar */}
          <button
            onClick={() => setActiveTab('settings')}
            className="w-9 h-9 bg-surface-high flex items-center justify-center overflow-hidden rounded-full border-2 border-primary/30 hover:border-primary transition-colors"
            aria-label="Settings"
          >
            <img alt="Profile Avatar" className="w-full h-full object-cover" src={avatarUrl} />
          </button>
        </div>
      </header>
      <div className="fixed top-16 left-0 w-full h-px z-40 bg-outline-variant/40" />

      {/* Bell notifications modal */}
      {showBellModal && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-end pt-[4.5rem] px-4"
          onClick={() => setShowBellModal(false)}
        >
          <div
            className="bg-surface-container rounded-xl shadow-elevation-3 w-full max-w-sm max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <BellRing className={`w-4 h-4 ${alertCount > 0 ? 'text-error' : 'text-primary'}`} />
                <h3 className="font-headline font-black text-sm uppercase tracking-tight">
                  {t('maintenance:schedules_title')}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowBellModal(false); setActiveTab('maintenance'); }}
                  className="text-[10px] font-headline font-black uppercase tracking-widest text-primary hover:underline"
                >
                  {i18n.language.startsWith('es') ? 'Ver todos' : 'View all'}
                </button>
                <button
                  onClick={() => setShowBellModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-high hover:bg-surface-low transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-surface-variant" />
                </button>
              </div>
            </div>

            {/* Alert list */}
            {!vehicleServiceDue && pendingAlerts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="font-headline font-bold text-sm uppercase text-surface-variant">
                  {t('maintenance:schedule_none')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/20">
                {vehicleServiceDue && (
                  <div className="flex items-start justify-between px-4 py-3 gap-3 hover:bg-surface-low transition-colors">
                    <div className="min-w-0 flex-1">
                      <span className="inline-block px-2 py-0.5 rounded-full font-label text-[9px] font-extrabold uppercase tracking-widest whitespace-nowrap mb-1.5 bg-error-container/30 text-error">
                        {t('maintenance:schedule_overdue')}
                      </span>
                      <p className="font-headline font-bold text-sm uppercase text-on-surface">
                        {t('vehicle:service_due_alert')}
                      </p>
                      {vehicle?.kilometrajeProximoServicio && (
                        <p className="text-[10px] text-surface-variant font-bold uppercase tracking-wider mt-0.5">
                          {t('maintenance:schedule_next')}: {vehicle.kilometrajeProximoServicio.toLocaleString()} km
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {pendingAlerts.map(({ schedule, nextKm, remaining, level }) => {
                  const chip = level === 'due'
                    ? { cls: 'bg-error-container/30 text-error', text: t('maintenance:schedule_overdue') }
                    : { cls: 'bg-secondary/20 text-secondary', text: t('maintenance:schedule_soon') };
                  return (
                    <div key={schedule.id} className="flex items-start justify-between px-4 py-3 gap-3 hover:bg-surface-low transition-colors">
                      <div className="min-w-0 flex-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-label text-[9px] font-extrabold uppercase tracking-widest whitespace-nowrap mb-1.5 ${chip.cls}`}>
                          {chip.text}
                        </span>
                        <p className="font-headline font-bold text-sm uppercase truncate text-on-surface">
                          {svcLabel(schedule.type)}
                        </p>
                        <p className="text-[10px] text-surface-variant font-bold uppercase tracking-wider mt-0.5">
                          {t('maintenance:schedule_next')}: {nextKm.toLocaleString()} km
                          {' · '}
                          {t('maintenance:schedule_remaining')}: {remaining.toLocaleString()} km
                        </p>
                      </div>
                      <button
                        onClick={() => removeSchedule(schedule.id!)}
                        className="mt-0.5 w-8 h-8 flex-shrink-0 rounded-full bg-surface-high flex items-center justify-center text-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                        title={i18n.language.startsWith('es') ? 'Eliminar recordatorio' : 'Delete reminder'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
