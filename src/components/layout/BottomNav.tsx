import React, { useMemo } from 'react';
import { Gauge, ClipboardList, Wrench, Bike } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useServiceSchedules } from '../../hooks/useServiceSchedules';
import { useVehicle } from '../../hooks/useVehicle';
import { useLogs } from '../../hooks/useLogs';
import { computeServiceAlerts } from '../../utils/serviceAlerts';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { t } = useTranslation('common');
  const { schedules } = useServiceSchedules();
  const { vehicle } = useVehicle();
  const { logs } = useLogs();

  const currentOdo = useMemo(() => {
    const maxLogOdo = logs.length > 0 ? Math.max(...logs.map(l => l.odo)) : 0;
    return Math.max(maxLogOdo, vehicle?.kilometrajeActual || 0);
  }, [logs, vehicle]);

  const hasAlerts = useMemo(() => {
    const alerts = computeServiceAlerts(schedules, currentOdo);
    return alerts.some(a => a.level !== 'ok');
  }, [schedules, currentOdo]);

  const tabs = [
    { id: 'dashboard',   icon: Gauge,          label: t('nav_dashboard'),    badge: false },
    { id: 'logs',        icon: ClipboardList,  label: t('nav_logs'),         badge: false },
    { id: 'maintenance', icon: Wrench,         label: t('nav_maintenance'),  badge: hasAlerts },
    { id: 'profile',     icon: Bike,           label: t('nav_profile'),      badge: false },
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
            <div className="relative">
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
              {tab.badge && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-error animate-pulse" />
              )}
            </div>
            <span
              className={`font-label text-[11px] font-bold tracking-[0.04rem] uppercase text-center leading-tight transition-colors duration-200 ${
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
