import React from 'react';
import { Gauge, ScrollText, Droplet, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', icon: Gauge, label: 'DASHBOARD' },
    { id: 'logs', icon: ScrollText, label: 'LOGS' },
    { id: 'maintenance', icon: Droplet, label: 'MAINTENANCE' },
    { id: 'profile', icon: User, label: 'PROFILE' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 bg-surface/80 backdrop-blur-xl border-t border-surface-container">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center pt-2 transition-all ${
              isActive ? 'text-primary border-t-2 border-primary' : 'text-surface-variant hover:text-secondary'
            }`}
            style={{ width: '25%' }}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="font-label text-[10px] font-bold tracking-[0.05rem] uppercase">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
