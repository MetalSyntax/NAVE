import React from 'react';
import { Gauge, ScrollText, Route, Droplet, User, Settings } from 'lucide-react';
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
    { id: 'routes', icon: Route, label: t('nav_routes') },
    { id: 'maintenance', icon: Droplet, label: t('nav_maintenance') },
    { id: 'profile', icon: User, label: t('nav_profile') },
    { id: 'settings', icon: Settings, label: t('nav_settings') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-stretch px-2 h-20 bg-surface-container/95 backdrop-blur-xl shadow-elevation-3 pb-2 pt-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
            aria-current={isActive ? 'page' : undefined}
          >
            {/* MD3 Active Indicator pill */}
            <div
              className={`flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'bg-secondary-container rounded-full w-16 h-8'
                  : 'w-8 h-8'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors duration-200 ${
                  isActive ? 'text-on-secondary-container' : 'text-surface-variant'
                }`}
              />
            </div>
            <span
              className={`font-label text-[9px] font-bold tracking-[0.04rem] uppercase text-center leading-tight transition-colors duration-200 ${
                isActive ? 'text-on-surface' : 'text-surface-variant'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
