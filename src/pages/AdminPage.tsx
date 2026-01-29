import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDevices } from '@/hooks/useDevices';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Library, FileText, Users, BarChart3, Database, Sprout, Cpu, CheckCircle2, Server } from 'lucide-react';
import { LibraryStrainManager } from '@/components/admin/LibraryStrainManager';
import { ArticleManager } from '@/components/admin/ArticleManager';
import { UserManager } from '@/components/admin/UserManager';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Business Metrics Component
function BusinessMetrics() {
  // Fetch total users count
  const { data: usersCount = 0 } = useQuery({
    queryKey: ['admin-users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch devices data
  const { devices } = useDevices();
  const onlineDevices = devices.filter(d => 
    d.last_seen_at && Date.now() - new Date(d.last_seen_at).getTime() < 60000
  ).length;

  // Fetch active grows count
  const { data: activeGrows = 0 } = useQuery({
    queryKey: ['admin-active-grows'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('plants')
        .select('*', { count: 'exact', head: true })
        .neq('current_stage', 'harvested');
      if (error) throw error;
      return count || 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Business Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Огляд Платформи
          </CardTitle>
          <CardDescription>
            Ключові метрики системи Agro Hogwards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Users */}
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{usersCount}</p>
                  <p className="text-sm text-muted-foreground">Користувачів</p>
                </div>
              </div>
            </div>

            {/* Total Devices */}
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-accent/10">
                  <Cpu className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{devices.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Пристроїв ({onlineDevices} онлайн)
                  </p>
                </div>
              </div>
            </div>

            {/* Active Grows */}
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/10">
                  <Sprout className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeGrows}</p>
                  <p className="text-sm text-muted-foreground">Активних вирощувань</p>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <Badge className="bg-success/20 text-success border-success hover:bg-success/30">
                    Працює справно
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">Стан системи</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Logs */}
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
            <div className="p-2 bg-muted rounded flex gap-2 flex-wrap">
              <span className="text-muted-foreground">[2026-01-29 14:32:15]</span>
              <Badge variant="outline" className="text-xs">INFO</Badge>
              <span>Device ESP8266-001 connected</span>
            </div>
            <div className="p-2 bg-muted rounded flex gap-2 flex-wrap">
              <span className="text-muted-foreground">[2026-01-29 14:31:42]</span>
              <Badge variant="outline" className="text-xs">INFO</Badge>
              <span>Sensor data received from device ESP8266-002</span>
            </div>
            <div className="p-2 bg-muted rounded flex gap-2 flex-wrap">
              <span className="text-muted-foreground">[2026-01-29 14:30:18]</span>
              <Badge variant="outline" className="text-warning border-warning text-xs">WARN</Badge>
              <span>High temperature alert triggered</span>
            </div>
            <div className="p-2 bg-muted rounded flex gap-2 flex-wrap">
              <span className="text-muted-foreground">[2026-01-29 14:28:55]</span>
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
            <BusinessMetrics />
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
