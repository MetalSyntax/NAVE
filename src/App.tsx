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
import { ProfileScreen } from './views/Profile';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardScreen />;
      case 'logs': return <LogsScreen />;
      case 'maintenance': return <MaintenanceScreen />;
      case 'profile': return <ProfileScreen />;
      default: return <DashboardScreen />;
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
