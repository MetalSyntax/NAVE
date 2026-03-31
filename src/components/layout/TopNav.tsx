import React from 'react';
import { Bike, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { arrayBufferToUrl } from '../../utils/fileUtils';

export function TopNav() {
  const { i18n } = useTranslation();
  const { user } = useSettings();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(nextLang);
  };

  const avatarUrl = user?.avatar ? arrayBufferToUrl(user.avatar) : 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop';

  return (
    <>
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface shadow-md">
        <div className="flex items-center gap-3 relative z-10">
          <Bike className="text-primary w-6 h-6" />
          <h1 className="font-headline uppercase tracking-tighter font-black text-xl text-primary italic hidden sm:block">APEX VELOCITY</h1>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          {/* Language Selector */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1 border border-surface-variant hover:border-primary transition-colors text-[10px] font-bold tracking-widest uppercase bg-surface-low"
          >
            <Globe className="w-3 h-3 text-secondary" />
            {i18n.language.startsWith('es') ? 'ES' : 'EN'}
          </button>

          <div className="w-10 h-10 bg-surface-high flex items-center justify-center overflow-hidden border-2 border-primary/20">
            <img 
              alt="Profile Avatar" 
              className="w-full h-full object-cover" 
              src={avatarUrl} 
            />
          </div>
        </div>
      </header>
      <div className="fixed top-16 left-0 w-full bg-surface-container h-[2px] z-40 opacity-50"></div>
    </>
  );
}
