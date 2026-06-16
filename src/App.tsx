/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { TopNav } from './components/layout/TopNav';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardScreen } from './views/Dashboard';
import { LogsScreen } from './views/Logs';
import { MaintenanceScreen } from './views/Maintenance';
import { OnboardingScreen } from './views/Onboarding';
import { VehicleScreen } from './views/Vehicle';
import { ManualsScreen } from './views/Manuals';
import { SettingsScreen } from './views/Settings';
import { TermsScreen } from './views/Terms';
import { PrivacyScreen } from './views/Privacy';
import { useSettings } from './hooks/useSettings';
import { usePwaUpdate } from './hooks/usePwaUpdate';
import { UpdatePrompt } from './components/ui/UpdatePrompt';
import { LoadingScreen } from './components/ui/Spinner';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { settings, isLoading, refresh } = useSettings();
  const { i18n } = useTranslation();
  const { needsUpdate, isChecking, justChecked, acceptUpdate, dismissUpdate, checkForUpdate } = usePwaUpdate();

  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (settings?.language && i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings?.language]);

  if (isLoading && !settings) return <LoadingScreen />;

  // Mostrar onboarding en la primera ejecución hasta que se complete.
  if (settings && !settings.onboardingComplete) {
    return (
      <OnboardingScreen
        onComplete={async (initialTab?: string) => {
          await refresh();
          if (initialTab) navigate(`/${initialTab}`);
        }}
      />
    );
  }

  // Determinar activeTab basado en el pathname actual
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path === '/logs') return 'logs';
    if (path === '/routes') return 'routes';
    if (path === '/maintenance') return 'maintenance';
    if (path === '/vehicle' || path === '/profile') return 'profile';
    if (path === '/manuals') return 'manuals';
    if (path === '/settings') return 'settings';
    if (path === '/terms') return 'terms';
    if (path === '/privacy') return 'privacy';
    return 'dashboard';
  };

  const activeTab = getActiveTab();
  const isLegalTab = activeTab === 'terms' || activeTab === 'privacy';

  const setActiveTab = (tab: string) => {
    if (tab === 'dashboard') navigate('/');
    else if (tab === 'profile') navigate('/vehicle');
    else navigate(`/${tab}`);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary selection:text-on-primary pb-28">
      <TopNav setActiveTab={setActiveTab} />

      <main className="pt-20 px-4 md:px-6 max-w-5xl mx-auto">
        <Routes>
          <Route path="/" element={<DashboardScreen setActiveTab={setActiveTab} />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/logs" element={<LogsScreen />} />
          <Route path="/routes" element={<LogsScreen initialTab="routes" />} />
          <Route path="/maintenance" element={<MaintenanceScreen />} />
          <Route path="/vehicle" element={<VehicleScreen setActiveTab={setActiveTab} />} />
          <Route path="/profile" element={<Navigate to="/vehicle" replace />} />
          <Route path="/manuals" element={<ManualsScreen setActiveTab={setActiveTab} />} />
          <Route path="/settings" element={<SettingsScreen setActiveTab={setActiveTab} onCheckUpdate={checkForUpdate} isCheckingUpdate={isChecking} justChecked={justChecked} />} />
          <Route path="/terms" element={<TermsScreen setActiveTab={setActiveTab} />} />
          <Route path="/privacy" element={<PrivacyScreen setActiveTab={setActiveTab} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isLegalTab && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
      {needsUpdate && <UpdatePrompt onAccept={acceptUpdate} onDismiss={dismissUpdate} />}
    </div>
  );
}

