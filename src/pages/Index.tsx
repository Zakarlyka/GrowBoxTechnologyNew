import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from '@/components/Dashboard';
import { Devices } from '@/components/Devices';
import { RemoteControlPage } from '@/pages/RemoteControlPage';
import { AdvancedCharts } from '@/components/AdvancedCharts';
import { Settings } from '@/pages/Settings';
import DeveloperCabinet from '@/components/DeveloperCabinet';

const Index = () => {
  const [activeTab, setActiveTab] = useState('devices');
  const { profile } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'devices':
        return <Devices />;
      case 'dashboard':
        return <Dashboard />;
      case 'remote-control':
        return <RemoteControlPage />;
      case 'analytics':
        return <AdvancedCharts />;
      case 'settings':
        return <Settings />;
      case 'developer':
        return profile?.role === 'developer' || profile?.role === 'admin' ? 
          <DeveloperCabinet /> : <Settings />;
      default:
        return <Devices />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSettingsClick={() => setActiveTab('settings')} />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
