/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TopNav } from './components/layout/TopNav';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardScreen } from './views/Dashboard';
import { LogsScreen } from './views/Logs';
import { MaintenanceScreen } from './views/Maintenance';
import { VehicleScreen } from './views/Vehicle';
import { SettingsScreen } from './views/Settings';
import { useSettings } from './hooks/useSettings';
import { LoadingScreen } from './components/ui/Spinner';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { settings, isLoading } = useSettings();

  // Apply theme to document
  React.useEffect(() => {
    if (settings?.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings?.theme]);

  if (isLoading && !settings) return <LoadingScreen />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardScreen setActiveTab={setActiveTab} />;
      case 'logs': return <LogsScreen />;
      case 'maintenance': return <MaintenanceScreen />;
      case 'profile': return <VehicleScreen />;
      case 'settings': return <SettingsScreen />;
      default: return <DashboardScreen setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary selection:text-white pb-24">
      <TopNav />

      {/* Main Content Area */}
      <main className="pt-24 px-4 md:px-6 max-w-5xl mx-auto">
        {renderContent()}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
