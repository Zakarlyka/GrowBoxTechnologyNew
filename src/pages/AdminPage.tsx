import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Library, FileText, Users, Server, Activity, Database } from 'lucide-react';
import { LibraryStrainManager } from '@/components/admin/LibraryStrainManager';
import { ArticleManager } from '@/components/admin/ArticleManager';
import { UserManager } from '@/components/admin/UserManager';

// System Status Component
function SystemStatus() {
  return (
    <div className="space-y-6">
      {/* Server Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Статус Серверів
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                <span>API Server</span>
              </div>
              <Badge variant="outline" className="text-success border-success">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                <span>MQTT Broker</span>
              </div>
              <Badge variant="outline" className="text-success border-success">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                <span>Database</span>
              </div>
              <Badge variant="outline" className="text-success border-success">Online</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MQTT Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            MQTT Конфігурація
          </CardTitle>
          <CardDescription>
            Налаштування брокера повідомлень для пристроїв
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Broker Host</label>
              <div className="p-3 bg-muted rounded-md font-mono text-sm">mqtt.agrohogwards.com</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Port</label>
              <div className="p-3 bg-muted rounded-md font-mono text-sm">8883 (SSL)</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Topic Prefix</label>
              <div className="p-3 bg-muted rounded-md font-mono text-sm">agro/devices/</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">QoS Level</label>
              <div className="p-3 bg-muted rounded-md font-mono text-sm">1 (At least once)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Logs Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Системні Логи
          </CardTitle>
          <CardDescription>
            Останні події системи
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-xs">
            <div className="p-2 bg-muted rounded flex gap-2">
              <span className="text-muted-foreground">[2024-01-28 14:32:15]</span>
              <Badge variant="outline" className="text-xs">INFO</Badge>
              <span>Device ESP8266-001 connected</span>
            </div>
            <div className="p-2 bg-muted rounded flex gap-2">
              <span className="text-muted-foreground">[2024-01-28 14:31:42]</span>
              <Badge variant="outline" className="text-xs">INFO</Badge>
              <span>Sensor data received from device ESP8266-002</span>
            </div>
            <div className="p-2 bg-muted rounded flex gap-2">
              <span className="text-muted-foreground">[2024-01-28 14:30:18]</span>
              <Badge variant="outline" className="text-warning border-warning text-xs">WARN</Badge>
              <span>High temperature alert triggered</span>
            </div>
            <div className="p-2 bg-muted rounded flex gap-2">
              <span className="text-muted-foreground">[2024-01-28 14:28:55]</span>
              <Badge variant="outline" className="text-xs">INFO</Badge>
              <span>User authentication successful</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  const { role, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read tab from URL, default to 'users'
  const currentTab = searchParams.get('tab') || 'users';
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (role !== 'admin' && role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Доступ заборонено. Ця сторінка доступна лише для адміністраторів.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Адмін-панель
            </CardTitle>
            <CardDescription>
              Керування системою Agro Hogwards
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Користувачі</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">Система</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-2">
              <Library className="h-4 w-4" />
              <span className="hidden sm:inline">Бібліотека</span>
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Статті</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UserManager />
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <SystemStatus />
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <LibraryStrainManager />
          </TabsContent>

          <TabsContent value="articles" className="mt-6">
            <ArticleManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
