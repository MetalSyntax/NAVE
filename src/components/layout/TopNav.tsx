import React from 'react';
import { Bike, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { arrayBufferToUrl } from '../../utils/fileUtils';

interface TopNavProps {
  setActiveTab: (tab: string) => void;
}

export function TopNav({ setActiveTab }: TopNavProps) {
  const { i18n } = useTranslation();
  const { user, updateSettings } = useSettings();

  const toggleLanguage = async () => {
    const nextLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(nextLang);
    await updateSettings({ language: nextLang });
  };

  const avatarUrl = user?.avatar
    ? arrayBufferToUrl(user.avatar)
    : 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop';

  return (
    <>
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-surface-container shadow-elevation-1">
        {/* Logo — click goes to dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-surface-high transition-colors"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-primary-container rounded-xl">
            <Bike className="text-on-primary-container w-4 h-4" />
          </div>
          <h1 className="font-headline uppercase tracking-tighter font-black text-lg text-primary italic hidden sm:block">
            APEX VELOCITY
          </h1>
        </button>

        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-high hover:bg-surface-low border border-outline-variant text-[10px] font-bold tracking-widest uppercase rounded-full transition-colors"
          >
            <Globe className="w-3 h-3 text-secondary flex-shrink-0" />
            {i18n.language.startsWith('es') ? 'ES' : 'EN'}
          </button>

          {/* Avatar — click goes to settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className="w-9 h-9 bg-surface-high flex items-center justify-center overflow-hidden rounded-full border-2 border-primary/30 hover:border-primary transition-colors"
            aria-label="Settings"
          >
            <img
              alt="Profile Avatar"
              className="w-full h-full object-cover"
              src={avatarUrl}
            />
          </button>
        </div>
      </header>
      <div className="fixed top-16 left-0 w-full h-px z-40 bg-outline-variant/40" />
    </>
  );
}
