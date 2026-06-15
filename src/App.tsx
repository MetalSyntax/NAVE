/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TopNav } from './components/layout/TopNav';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardScreen } from './views/Dashboard';
import { LogsScreen } from './views/Logs';
import { RoutesScreen } from './views/Routes';
import { MaintenanceScreen } from './views/Maintenance';
import { VehicleScreen } from './views/Vehicle';
import { ManualsScreen } from './views/Manuals';
import { SettingsScreen } from './views/Settings';
import { TermsScreen } from './views/Terms';
import { PrivacyScreen } from './views/Privacy';
import { useSettings } from './hooks/useSettings';
import { LoadingScreen } from './components/ui/Spinner';
import { useTranslation } from 'react-i18next';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { settings, isLoading } = useSettings();
  const { i18n } = useTranslation();

  React.useEffect(() => {
    if (settings?.language && i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings?.language]);

  if (isLoading && !settings) return <LoadingScreen />;

  const isLegalTab = activeTab === 'terms' || activeTab === 'privacy';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardScreen setActiveTab={setActiveTab} />;
      case 'logs': return <LogsScreen />;
      case 'routes': return <RoutesScreen />;
      case 'maintenance': return <MaintenanceScreen />;
      case 'profile': return <VehicleScreen setActiveTab={setActiveTab} />;
      case 'manuals': return <ManualsScreen setActiveTab={setActiveTab} />;
      case 'settings': return <SettingsScreen setActiveTab={setActiveTab} />;
      case 'terms': return <TermsScreen setActiveTab={setActiveTab} />;
      case 'privacy': return <PrivacyScreen setActiveTab={setActiveTab} />;
      default: return <DashboardScreen setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary selection:text-on-primary pb-28">
      <TopNav setActiveTab={setActiveTab} />

      <main className="pt-20 px-4 md:px-6 max-w-5xl mx-auto">
        {renderContent()}
      </main>

      {!isLegalTab && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}
