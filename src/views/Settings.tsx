import React, { useState, useEffect } from 'react';
import { User, Moon, Sun, Save, Camera, Bell, Shield, Gauge } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../hooks/useSettings';
import { Toast, useToast } from '../components/ui/Toast';
import { Spinner, LoadingScreen } from '../components/ui/Spinner';
import { toArrayBuffer, arrayBufferToUrl } from '../utils/fileUtils';

export function SettingsScreen() {
  const { t } = useTranslation(['common', 'maintenance', 'seo']);
  const { settings, user, isLoading, updateSettings, updateUser } = useSettings();
  const { toast, showToast, hideToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    oilInterval: '3000'
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, name: user.name, email: user.email || '' }));
      if (user.avatar) {
        setAvatarPreview(arrayBufferToUrl(user.avatar));
      }
    }
    if (settings) {
      setFormData(prev => ({ ...prev, oilInterval: settings.oilInterval.toString() }));
    }
  }, [user, settings]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const buffer = await toArrayBuffer(file);
        await updateUser({ avatar: buffer });
        setAvatarPreview(URL.createObjectURL(file));
        showToast(t('common:saved_success'), 'success');
      } catch (err) {
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
    } catch (err) {
      showToast(t('common:error_generic'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !settings) return <LoadingScreen />;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      <Helmet>
        <title>{t('common:nav_settings')} | Apex Velocity</title>
      </Helmet>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <header className="space-y-2">
        <h2 className="font-headline text-4xl font-black uppercase tracking-tighter italic">{t('common:nav_settings')}</h2>
        <p className="text-surface-variant font-medium uppercase tracking-widest text-[10px]">{t('common:settings_desc')}</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-low p-8 border-t-4 border-primary flex flex-col items-center text-center">
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-none bg-surface-high border-2 border-primary/20 p-1">
                <img 
                  src={avatarPreview || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop'} 
                  className="w-full h-full object-cover"
                  alt="User Avatar"
                />
              </div>
              <label className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="text-white w-8 h-8" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            <h3 className="font-headline text-xl font-bold uppercase">{user?.name || t('common:settings_rider')}</h3>
            <p className="text-[10px] text-surface-variant font-bold tracking-widest uppercase mb-4">{user?.email || '---'}</p>
          </div>

          <div className="bg-surface-container p-6 space-y-4">
            <h4 className="font-label text-[10px] font-black uppercase tracking-[0.2em] text-secondary">{t('common:settings_quick_actions')}</h4>
            <div className="space-y-2">
               <button 
                onClick={() => updateSettings({ theme: settings?.theme === 'dark' ? 'light' : 'dark' })}
                className="w-full flex items-center justify-between p-4 bg-surface-low hover:bg-surface-high transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {settings?.theme === 'dark' ? <Sun className="w-4 h-4 text-secondary" /> : <Moon className="w-4 h-4 text-primary" />}
                  <span className="font-headline text-sm font-bold uppercase">{settings?.theme === 'dark' ? t('common:theme_light') : t('common:theme_dark')}</span>
                </div>
                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings?.theme === 'dark' ? 'bg-secondary' : 'bg-surface-variant'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings?.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="lg:col-span-8 space-y-8">
          <div className="bg-surface-low p-8 space-y-8 border-l-2 border-surface-variant/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="font-label text-[10px] font-black uppercase tracking-widest text-secondary">{t('common:settings_profile')}</label>
                <input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-surface-high border-0 p-4 font-headline text-lg font-bold focus:ring-1 focus:ring-primary outline-none" 
                  type="text" 
                  placeholder={t('common:settings_name_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-[10px] font-black uppercase tracking-widest text-secondary">{t('common:settings_contact_email')}</label>
                <input 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-surface-high border-0 p-4 font-headline text-lg font-bold focus:ring-1 focus:ring-primary outline-none" 
                  type="email" 
                  placeholder={t('common:settings_email_placeholder')}
                />
              </div>
            </div>

            <div className="pt-8 border-t border-surface-variant/20">
               <div className="space-y-2 max-w-xs">
                <label className="font-label text-[10px] font-black uppercase tracking-widest text-secondary">{t('maintenance:interval_configured')} (KM)</label>
                <div className="relative">
                  <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-variant" />
                  <input 
                    value={formData.oilInterval} 
                    onChange={e => setFormData({...formData, oilInterval: e.target.value})}
                    className="w-full bg-surface-high border-0 pl-12 pr-4 py-4 font-headline text-2xl font-black focus:ring-1 focus:ring-secondary outline-none" 
                    type="number" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                disabled={isSubmitting}
                className="w-full md:w-auto bg-primary-container text-on-primary-container px-12 py-4 font-headline font-black uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                type="submit"
              >
                {isSubmitting ? <Spinner className="w-5 h-5 border-white" /> : <Save className="w-5 h-5" />}
                {t('common:btn_save')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container p-6 border-b-2 border-surface-variant/20">
              <Bell className="w-5 h-5 text-secondary mb-4" />
              <h5 className="font-headline font-bold text-sm uppercase">{t('common:settings_notifications')}</h5>
              <p className="text-[10px] text-surface-variant mt-1">{t('common:settings_alerts_enabled')}</p>
            </div>
            <div className="bg-surface-container p-6 border-b-2 border-surface-variant/20">
              <Shield className="w-5 h-5 text-secondary mb-4" />
              <h5 className="font-headline font-bold text-sm uppercase">{t('common:settings_privacy')}</h5>
              <p className="text-[10px] text-surface-variant mt-1">{t('common:settings_local_store')}</p>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
