import React from 'react';
import { Gauge, ScrollText, Droplet, User, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { t } = useTranslation('common');

  const tabs = [
    { id: 'dashboard', icon: Gauge, label: t('nav_dashboard') },
    { id: 'logs', icon: ScrollText, label: t('nav_logs') },
    { id: 'maintenance', icon: Droplet, label: t('nav_maintenance') },
    { id: 'profile', icon: User, label: t('nav_profile') },
    { id: 'settings', icon: Settings, label: t('nav_settings') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 bg-surface/80 backdrop-blur-xl border-t border-surface-container pb-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center pt-2 transition-all ${
              isActive ? 'text-primary border-t-2 border-primary -mt-2' : 'text-surface-variant hover:text-secondary'
            }`}
            style={{ width: '20%' }}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="font-label text-[9px] font-bold tracking-[0.05rem] uppercase text-center leading-tight">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
