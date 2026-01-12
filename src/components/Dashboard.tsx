import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Wifi, WifiOff, 
  Pencil, Check, X, QrCode, Trash2, Cpu 
} from 'lucide-react';
import { SensorCardsGrid } from './SensorCardsGrid';
import { ActivePlantContext } from './ActivePlantContext';
import { useDevices } from '@/hooks/useDevices';
import { useDeviceControls } from '@/hooks/useDeviceControls';
import { DeviceControls } from '@/components/DeviceControls';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { calculatePhotoperiod, isWithinLightSchedule, formatTime } from '@/lib/utils';
import { getVPDAnalysis } from '@/lib/vpd';
import QRCode from 'react-qr-code';

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { devices, loading, deleteDevice, fetchDevices } = useDevices();

  // Get selected device from URL or first device
  const selectedDeviceId = searchParams.get('device');
  const selectedDevice = useMemo(() => {
    if (selectedDeviceId) {
      return devices.find(d => d.id === selectedDeviceId);
    }
    return null;
  }, [devices, selectedDeviceId]);

  const { settings } = useDeviceControls(selectedDevice?.device_id || null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Update edited name when device changes
  useEffect(() => {
    if (selectedDevice) {
      setEditedName(selectedDevice.name);
    }
  }, [selectedDevice]);

  const handleDeviceSelect = (deviceId: string) => {
    setSearchParams({ device: deviceId });
  };

  const handleDelete = async () => {
    if (selectedDevice) {
      await deleteDevice(selectedDevice.id);
      setDeleteDialogOpen(false);
      setSearchParams({});
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || !selectedDevice) return;
    try {
      const { error } = await supabase.from('devices').update({
        name: editedName.trim()
      }).eq('id', selectedDevice.id);
      if (error) throw error;
      toast({
        title: 'Успіх',
        description: 'Назву пристрою оновлено'
      });
      setIsEditingName(false);
      fetchDevices();
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedName(selectedDevice?.name || '');
    setIsEditingName(false);
  };

  // Calculate online status
  const isOnline = useMemo(() => {
    if (!selectedDevice?.last_seen_at) return false;
    return (Date.now() - new Date(selectedDevice.last_seen_at).getTime()) < 40000;
  }, [selectedDevice?.last_seen_at]);

  const getLastSeenText = () => {
    if (!selectedDevice?.last_seen_at) return 'Невідомо';
    const seconds = Math.floor((Date.now() - new Date(selectedDevice.last_seen_at).getTime()) / 1000);
    if (seconds < 60) return `${seconds} сек тому`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} хв тому`;
    const hours = Math.floor(minutes / 60);
    return `${hours} год тому`;
  };

  const getLightMode = () => {
    if (!settings) return null;
    const startH = (settings as any).light_start_h ?? 6;
    const startM = (settings as any).light_start_m ?? 0;
    const endH = (settings as any).light_end_h ?? 22;
    const endM = (settings as any).light_end_m ?? 0;
    const { dayHours, nightHours } = calculatePhotoperiod(startH, endH);
    const isDay = isWithinLightSchedule(startH, startM, endH, endM);
    return { isDay, dayHours, nightHours, startTime: formatTime(startH, startM), endTime: formatTime(endH, endM) };
  };

  const lightMode = getLightMode();
  const targetTemp = (settings as any)?.target_temp ?? null;
  const vpdAnalysis = selectedDevice ? getVPDAnalysis(selectedDevice.last_temp, selectedDevice.last_hum, targetTemp) : null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Empty state - no devices
  if (devices.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <Cpu className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('dashboard.noDevices')}</h2>
        <p className="text-muted-foreground text-center mb-4">{t('dashboard.noDevicesDescription')}</p>
        <Button onClick={() => navigate('/devices')} className="gradient-primary">
          Перейти до пристроїв
        </Button>
      </div>
    );
  }

  // Empty state - no device selected: Quick Access Grid
  if (!selectedDevice) {
    return (
      <div className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>

        {/* Quick Access Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Оберіть пристрій</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map(device => {
              const deviceIsOnline = device.last_seen_at && (Date.now() - new Date(device.last_seen_at).getTime()) < 40000;
              return (
                <Card 
                  key={device.id}
                  className="gradient-card border-border/50 cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02]"
                  onClick={() => handleDeviceSelect(device.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{device.name}</span>
                      </div>
                      <Badge variant={deviceIsOnline ? 'default' : 'destructive'} className="text-xs">
                        {deviceIsOnline ? (
                          <><Wifi className="h-3 w-3 mr-1" />Online</>
                        ) : (
                          <><WifiOff className="h-3 w-3 mr-1" />Offline</>
                        )}
                      </Badge>
                    </div>
                    
                    {device.location && (
                      <p className="text-xs text-muted-foreground">{device.location}</p>
                    )}

                    {/* Sensor Preview */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {device.last_temp !== null && (
                        <span className="flex items-center gap-1">
                          🌡️ {device.last_temp?.toFixed(1)}°C
                        </span>
                      )}
                      {device.last_hum !== null && (
                        <span className="flex items-center gap-1">
                          💧 {device.last_hum?.toFixed(0)}%
                        </span>
                      )}
                      {device.last_soil_moisture !== null && (
                        <span className="flex items-center gap-1">
                          🌱 {device.last_soil_moisture?.toFixed(0)}%
                        </span>
                      )}
                      {device.last_temp === null && device.last_hum === null && (
                        <span className="text-xs italic">Немає даних</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Device selected - show cockpit
  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 pb-20 lg:pb-6">
      {/* Header with Device Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('dashboard.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
          </div>
          <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center gap-1">
            {isOnline ? <><Wifi className="h-3 w-3" />Online</> : <><WifiOff className="h-3 w-3" />Offline</>}
          </Badge>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setQrDialogOpen(true)} className="min-h-[44px]">
            <QrCode className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">QR</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)} className="min-h-[44px]">
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Видалити</span>
          </Button>
        </div>
      </div>

      {/* SECTION 1: Sensor Grid (with VPD card included) */}
      <Card className="gradient-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <>
                <Input
                  value={editedName}
                  onChange={e => setEditedName(e.target.value)}
                  className="text-xl font-semibold max-w-md"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button size="sm" variant="ghost" onClick={handleSaveName}>
                  <Check className="h-4 w-4 text-success" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </>
            ) : (
              <>
                <CardTitle className="text-xl">{selectedDevice.name}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditedName(selectedDevice.name);
                    setIsEditingName(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          {selectedDevice.location && <p className="text-sm text-muted-foreground">{selectedDevice.location}</p>}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Draggable Sensors Grid (now includes VPD as 5th card) */}
          <SensorCardsGrid
            temperature={selectedDevice.last_temp}
            humidity={selectedDevice.last_hum}
            soilMoisture={selectedDevice.last_soil_moisture}
            lightMode={lightMode}
            vpdAnalysis={vpdAnalysis}
          />

          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              Востаннє онлайн: {getLastSeenText()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Active Plant Context (Master Plant, Alerts, My Plants button) */}
      <ActivePlantContext 
        deviceId={selectedDevice.id} 
        deviceStringId={selectedDevice.device_id} 
      />

      {/* SECTION 3: Device Controls (Lighting/Climate) */}
      <DeviceControls deviceId={selectedDevice.device_id} />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити пристрій?</AlertDialogTitle>
            <AlertDialogDescription>
              Цю дію неможливо скасувати. Пристрій "{selectedDevice.name}" буде видалено назавжди.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>QR-код для перепідключення</DialogTitle>
            <DialogDescription>
              Використовуйте цей QR-код для повторного підключення пристрою
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center p-6 bg-white rounded-lg">
              <QRCode value={`http://192.168.4.1/?token=${selectedDevice.device_id}`} size={200} />
            </div>
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                ID: <span className="font-mono font-semibold">{selectedDevice.device_id}</span>
              </p>
              <a 
                href={`http://192.168.4.1/?token=${selectedDevice.device_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-600 underline break-all block"
              >
                http://192.168.4.1/?token={selectedDevice.device_id}
              </a>
              <p className="text-xs text-muted-foreground">
                Підключіться до Wi-Fi мережі GrowBox-Setup, потім відскануйте QR
              </p>
            </div>
            <Button onClick={() => setQrDialogOpen(false)} className="w-full">
              Закрити
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
