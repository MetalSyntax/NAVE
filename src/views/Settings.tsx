import React, { useState, useEffect } from 'react';
import { Moon, Sun, Save, Camera, Bell, Shield, Gauge, Database, BellOff, ChevronRight, Download, Trash2, FileText, Zap, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../hooks/useSettings';
import { useNotifications } from '../hooks/useNotifications';
import { Toast, useToast } from '../components/ui/Toast';
import { Spinner, LoadingScreen } from '../components/ui/Spinner';
import { toArrayBuffer, arrayBufferToUrl } from '../utils/fileUtils';
import { getAll, clear } from '../db/database';

interface SettingsScreenProps {
  setActiveTab: (tab: string) => void;
}

export function SettingsScreen({ setActiveTab }: SettingsScreenProps) {
  const { t } = useTranslation(['common', 'maintenance', 'seo']);
  const { settings, user, isLoading, updateSettings, updateUser } = useSettings();
  const { permission, isSupported, requestPermission } = useNotifications();
  const { toast, showToast, hideToast } = useToast();

  const [formData, setFormData] = useState({ name: '', email: '', oilInterval: '3000' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ used: number; quota: number } | null>(null);
  const [requestingNotif, setRequestingNotif] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, name: user.name, email: user.email || '' }));
      if (user.avatar) setAvatarPreview(arrayBufferToUrl(user.avatar));
    }
    if (settings) setFormData(prev => ({ ...prev, oilInterval: settings.oilInterval.toString() }));
  }, [user, settings]);

  useEffect(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then(({ usage, quota }) => {
        setStorageInfo({ used: usage || 0, quota: quota || 1 });
      });
    }
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const buffer = await toArrayBuffer(file);
        await updateUser({ avatar: buffer });
        setAvatarPreview(URL.createObjectURL(file));
        showToast(t('common:saved_success'), 'success');
      } catch {
        showToast(t('common:error_generic'), 'error');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateUser({ name: formData.name, email: formData.email });
      await updateSettings({ oilInterval: parseInt(formData.oilInterval) || 3000 });
      showToast(t('common:saved_success'), 'success');
    } catch {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestNotifications = async () => {
    setRequestingNotif(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        showToast('Notificaciones activadas', 'success');
        // Test notification
        new Notification('NAVE', {
          body: 'Las notificaciones de mantenimiento están activas.',
          tag: 'apex-welcome',
        });
      } else {
        showToast('Notificaciones denegadas por el sistema', 'error');
      }
    } finally {
      setRequestingNotif(false);
    }
  };

  const handleExportData = async () => {
    try {
      const [logs, maintenance, vehicles, settingsAll, users] = await Promise.all([
        getAll('logs'),
        getAll('maintenance'),
        getAll('vehicle'),
        getAll('settings'),
        getAll('user'),
      ]);

      const sanitize = (obj: unknown): unknown => {
        if (obj instanceof ArrayBuffer) {
          return btoa(String.fromCharCode(...Array.from(new Uint8Array(obj))));
        }
        if (Array.isArray(obj)) return obj.map(sanitize);
        if (obj && typeof obj === 'object') {
          return Object.fromEntries(Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, sanitize(v)]));
        }
        return obj;
      };

      const payload = {
        exportDate: new Date().toISOString(),
        app: 'NAVE',
        version: '1.0',
        data: {
          vehicles: sanitize(vehicles),
          logs: sanitize(logs),
          maintenance: sanitize(maintenance),
          settings: sanitize(settingsAll),
          users: sanitize(users),
        },
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `nave-backup-${new Date().toISOString().split('T')[0]}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      showToast('Datos exportados correctamente', 'success');
    } catch {
      showToast(t('common:error_generic'), 'error');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('¿Borrar TODOS los datos? Esta acción es irreversible y eliminará vehículos, registros y configuraciones.')) return;
    if (!confirm('Segunda confirmación: ¿seguro que deseas continuar? No se puede deshacer.')) return;
    try {
      await Promise.all(['logs', 'maintenance', 'vehicle', 'settings', 'user'].map(s => clear(s)));
      showToast('Datos eliminados. Reiniciando...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      showToast(t('common:error_generic'), 'error');
    }
  };

  if (isLoading && !settings) return <LoadingScreen />;

  const storagePercent = storageInfo ? Math.min(100, (storageInfo.used / storageInfo.quota) * 100) : 0;
  const storageMB = storageInfo ? (storageInfo.used / 1024 / 1024).toFixed(1) : '0';
  const quotaGB = storageInfo ? (storageInfo.quota / 1024 / 1024 / 1024).toFixed(1) : '?';

  const inputCls = "w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-primary focus:outline-none px-4 py-3 font-headline text-base font-bold transition-colors";
  const labelCls = "font-label text-[10px] font-black uppercase tracking-widest text-secondary block mb-1";

  const notifStatus = !isSupported
    ? { label: 'No soportado', color: 'text-surface-variant', icon: BellOff }
    : permission === 'granted'
    ? { label: 'Activas', color: 'text-primary', icon: Bell }
    : permission === 'denied'
    ? { label: 'Bloqueadas', color: 'text-error', icon: BellOff }
    : { label: 'Sin configurar', color: 'text-secondary', icon: Bell };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <Helmet>
        <title>{t('common:nav_settings')} | NAVE</title>
      </Helmet>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <header className="space-y-1">
        <h2 className="font-headline text-4xl font-black uppercase tracking-tighter italic">{t('common:nav_settings')}</h2>
        <p className="text-surface-variant font-medium uppercase tracking-widest text-[10px]">{t('common:settings_desc')}</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-4">
          {/* Profile Card */}
          <div className="bg-surface-low rounded-2xl p-7 shadow-elevation-1 flex flex-col items-center text-center border-t-4 border-primary">
            <div className="relative group mb-5">
              <div className="w-28 h-28 bg-surface-high rounded-full overflow-hidden border-2 border-primary/20">
                <img
                  src={avatarPreview || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop'}
                  className="w-full h-full object-cover"
                  alt="User Avatar"
                />
              </div>
              <label className="absolute inset-0 bg-primary/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="text-white w-7 h-7" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            <h3 className="font-headline text-lg font-bold uppercase">{user?.name || t('common:settings_rider')}</h3>
            <p className="text-[10px] text-surface-variant font-bold tracking-widest uppercase mb-3">{user?.email || '---'}</p>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface-container rounded-2xl p-5 shadow-elevation-1 space-y-3">
            <h4 className="font-label text-[10px] font-black uppercase tracking-[0.2em] text-secondary flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" />
              {t('common:settings_quick_actions')}
            </h4>
            <button
              onClick={() => updateSettings({ theme: settings?.theme === 'dark' ? 'light' : 'dark' })}
              className="w-full flex items-center justify-between p-3 bg-surface-low rounded-2xl hover:bg-surface-high transition-colors"
            >
              <div className="flex items-center gap-3">
                {settings?.theme === 'dark'
                  ? <Sun className="w-4 h-4 text-secondary" />
                  : <Moon className="w-4 h-4 text-primary" />}
                <span className="font-headline text-sm font-bold uppercase">
                  {settings?.theme === 'dark' ? t('common:theme_light') : t('common:theme_dark')}
                </span>
              </div>
              <div className={`relative w-12 h-6 rounded-full p-1 transition-colors duration-200 ${settings?.theme === 'dark' ? 'bg-primary' : 'bg-outline'}`}>
                <div className={`w-4 h-4 bg-on-primary rounded-full transition-transform duration-200 shadow-elevation-1 ${settings?.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>

          {/* Storage Indicator */}
          {storageInfo && (
            <div className="bg-surface-container rounded-2xl p-5 shadow-elevation-1">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-secondary" />
                <h4 className="font-label text-[10px] font-black uppercase tracking-widest text-secondary">
                  {t('common:settings_storage')}
                </h4>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase text-surface-variant mb-2">
                <span>{storageMB} MB</span>
                <span>{t('common:settings_storage_of')} {quotaGB} GB</span>
              </div>
              <div className="h-2 bg-surface-high rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${storagePercent > 80 ? 'bg-error' : storagePercent > 60 ? 'bg-secondary' : 'bg-primary'}`}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <p className="text-[9px] text-surface-variant mt-2 uppercase tracking-wide">IndexedDB — {storagePercent.toFixed(1)}%</p>
            </div>
          )}
        </div>

        {/* Right Column — Form */}
        <form onSubmit={handleSave} className="lg:col-span-8 space-y-5">
          <div className="bg-surface-low rounded-2xl p-7 shadow-elevation-1 space-y-6">
            <h4 className="font-headline text-lg font-black uppercase tracking-tight flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              {t('common:settings_profile')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={labelCls}>{t('common:settings_name_label')}</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className={inputCls}
                  type="text"
                  placeholder={t('common:settings_name_placeholder')}
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>{t('common:settings_contact_email')}</label>
                <input
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className={inputCls}
                  type="email"
                  placeholder={t('common:settings_email_placeholder')}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/30">
              <div className="space-y-1 max-w-xs">
                <label className={labelCls}>{t('maintenance:interval_configured')} (KM)</label>
                <div className="relative">
                  <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-variant" />
                  <input
                    value={formData.oilInterval}
                    onChange={e => setFormData({...formData, oilInterval: e.target.value})}
                    className="w-full bg-surface-high border-0 border-b-2 border-outline-variant focus:border-secondary focus:outline-none pl-11 pr-4 py-3 font-headline text-2xl font-black transition-colors"
                    type="number"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                disabled={isSubmitting}
                className="w-full md:w-auto bg-primary text-on-primary px-10 py-4 font-headline font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-3 rounded-full shadow-elevation-1"
                type="submit"
              >
                {isSubmitting ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {t('common:btn_save')}
              </button>
            </div>
          </div>

          {/* Notifications + Datos y Privacidad — mismo estilo de card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Notifications */}
            <div className="bg-surface-container rounded-2xl p-5 shadow-elevation-1 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <notifStatus.icon className={`w-4 h-4 ${notifStatus.color}`} />
                  <h5 className="font-headline font-bold text-sm uppercase">{t('common:settings_notifications')}</h5>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${notifStatus.color}`}>
                  {notifStatus.label}
                </span>
              </div>
              <p className="text-[10px] text-surface-variant leading-relaxed">
                {permission === 'granted'
                  ? 'Recibirás alertas cuando el mantenimiento esté próximo.'
                  : permission === 'denied'
                  ? 'Actívalas en la configuración de tu navegador.'
                  : 'Activa las notificaciones para recibir recordatorios de servicio.'}
              </p>
              {permission !== 'granted' && permission !== 'denied' && isSupported && (
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  disabled={requestingNotif}
                  className="mt-auto flex items-center justify-center gap-2 bg-primary-container text-on-primary-container py-2 px-4 rounded-2xl text-[10px] font-bold uppercase tracking-wider hover:bg-primary transition-colors disabled:opacity-50"
                >
                  {requestingNotif ? <Spinner className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                  Activar
                </button>
              )}
            </div>

            {/* Datos y Privacidad */}
            <div className="bg-surface-container rounded-2xl p-5 shadow-elevation-1 flex flex-col gap-0">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-secondary" />
                <h5 className="font-headline font-bold text-sm uppercase">Datos y Privacidad</h5>
              </div>

              {/* Política de Privacidad */}
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className="flex items-center justify-between py-2.5 text-left hover:text-primary transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-surface-variant group-hover:text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Política de Privacidad</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-surface-variant group-hover:text-primary flex-shrink-0" />
              </button>

              <div className="h-px bg-outline-variant/25 mx-0" />

              {/* Términos y Condiciones */}
              <button
                type="button"
                onClick={() => setActiveTab('terms')}
                className="flex items-center justify-between py-2.5 text-left hover:text-primary transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-surface-variant group-hover:text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Términos y Condiciones</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-surface-variant group-hover:text-primary flex-shrink-0" />
              </button>

              <div className="h-px bg-outline-variant/25 mt-1 mb-3" />

              {/* Export / Delete */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-surface-low rounded-2xl text-[10px] font-bold uppercase tracking-wider hover:bg-primary-container hover:text-on-primary-container transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Exportar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-surface-low rounded-2xl text-[10px] font-bold uppercase tracking-wider text-error hover:bg-error-container hover:text-on-error-container transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Borrar todo
                </button>
              </div>
            </div>

          </div>
        </form>
      </section>
    </div>
  );
}
