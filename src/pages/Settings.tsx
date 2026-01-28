import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeviceSettings } from '@/components/DeviceSettings';
import UserCabinet from '@/components/UserCabinet';
import { Settings as SettingsIcon, Cpu, User } from 'lucide-react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('devices');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <SettingsIcon className="w-8 h-8" />
            Системні Налаштування
          </h1>
          <p className="text-muted-foreground mt-2">
            Керуйте пристроями та загальними параметрами системи
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span className="hidden sm:inline">Пристрої</span>
            </TabsTrigger>
            <TabsTrigger value="cabinet" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Кабінет</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="mt-6">
            <DeviceSettings />
          </TabsContent>

          <TabsContent value="cabinet" className="mt-6">
            <UserCabinet />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}