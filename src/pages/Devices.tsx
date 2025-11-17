import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Plus, Thermometer, Droplets } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QRCode from 'react-qr-code';

interface Device {
  id: string;
  device_id: string;
  name: string;
  last_temp?: number | null;
  last_hum?: number | null;
  last_seen: string | null;
  status: string;
  user_id: string;
  created_at: string;
}

const Devices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState<{ token: string; url: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchDevices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити пристрої",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const isDeviceOnline = (device: Device): boolean => {
    return device.status === 'online' && 
      device.last_seen !== null &&
      new Date(device.last_seen).getTime() > Date.now() - 5 * 60 * 1000;
  };

  useEffect(() => {
    if (!user) return;

    fetchDevices();

    // Realtime subscription for devices
    const devicesChannel = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Device update:', payload);
          if (payload.eventType === 'INSERT') {
            setDevices(prev => [...prev, payload.new as Device]);
          } else if (payload.eventType === 'UPDATE') {
            setDevices(prev => prev.map(d => d.id === payload.new.id ? payload.new as Device : d));
          } else if (payload.eventType === 'DELETE') {
            setDevices(prev => prev.filter(d => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(devicesChannel);
    };
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDevices();
  };

  const handleAddDevice = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-qr', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      if (data?.device_token) {
        const qrUrl = `http://192.168.4.1/?token=${data.device_token}`;
        setQrData({ token: data.device_token, url: qrUrl });
        setShowQRModal(true);
        
        toast({
          title: "QR-код створено",
          description: "Скануйте код на вашому пристрої ESP8266",
        });
      }
    } catch (error) {
      console.error('Add device error:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося створити код для підключення",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Будь ласка, увійдіть в систему для перегляду пристроїв
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Мої пристрої
          </h1>
          <p className="text-muted-foreground">
            Керуйте своїми ESP8266 GrowBox пристроями в реальному часі
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleAddDevice} disabled={isGenerating}>
            <Plus className="mr-2 h-4 w-4" />
            Додати пристрій
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : devices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">У вас ще немає підключених пристроїв</p>
            <Button onClick={handleAddDevice} disabled={isGenerating}>
              <Plus className="mr-2 h-4 w-4" />
              Додати перший пристрій
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => {
            const online = isDeviceOnline(device);
            
            return (
              <Card 
                key={device.id} 
                className={`transition-all duration-300 cursor-pointer hover:shadow-xl ${
                  online ? 'border-primary/50' : 'border-border'
                }`}
                onClick={() => navigate(`/device/${device.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">
                        {device.name || device.device_id}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        ID: {device.device_id}
                      </p>
                    </div>
                    <Badge
                      variant={online ? 'default' : 'destructive'}
                      className={online ? 'animate-pulse' : ''}
                    >
                      {online ? '🟢 Online' : '🔴 Offline'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sensor readings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <Thermometer className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Температура</p>
                        <p className="text-lg font-bold">
                          {device.last_temp !== null && device.last_temp !== undefined 
                            ? `${device.last_temp}°C` 
                            : '--'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <Droplets className="h-5 w-5 text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground">Вологість</p>
                        <p className="text-lg font-bold">
                          {device.last_hum !== null && device.last_hum !== undefined 
                            ? `${device.last_hum}%` 
                            : '--'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/device/${device.id}`);
                  }}>
                    Відкрити панель керування
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR-код для підключення пристрою</DialogTitle>
            <DialogDescription>
              Скануйте цей QR-код на вашому ESP8266 пристрої для реєстрації
            </DialogDescription>
          </DialogHeader>
          {qrData && (
            <div className="flex flex-col items-center gap-4 p-4">
              <div className="p-4 bg-white rounded-lg">
                <QRCode value={qrData.url} size={256} />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Або введіть токен вручну:</p>
                <code className="text-xs bg-muted p-2 rounded block break-all">
                  {qrData.token}
                </code>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Devices;
