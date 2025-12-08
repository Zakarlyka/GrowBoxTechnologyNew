import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Thermometer, Droplets, Sprout, Sun, Moon, Wifi, WifiOff, Trash2, Pencil, Check, X, QrCode, Wind } from 'lucide-react';
import { useDevices } from '@/hooks/useDevices';
import { useDeviceControls } from '@/hooks/useDeviceControls';
import { DeviceControls } from '@/components/DeviceControls';
import { PlantHeader } from '@/components/PlantHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { calculatePhotoperiod, isWithinLightSchedule, formatTime } from '@/lib/utils';
import { getVPDAnalysis } from '@/lib/vpd';
import QRCode from 'react-qr-code';

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { devices, loading, deleteDevice } = useDevices();
  const device = devices.find(d => d.id === id);
  const { settings } = useDeviceControls(device?.device_id || null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(device?.name || '');

  const handleDelete = async () => {
    if (id) {
      await deleteDevice(id);
      navigate('/');
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || !device) return;
    try {
      const { error } = await supabase.from('devices').update({
        name: editedName.trim()
      }).eq('id', device.id);
      if (error) throw error;
      toast({
        title: 'Успіх',
        description: 'Назву пристрою оновлено'
      });
      setIsEditingName(false);
      window.location.reload();
    } catch (error: any) {
      console.error('Rename error:', error);
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedName(device?.name || '');
    setIsEditingName(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <p className="text-xl text-muted-foreground mb-4">Пристрій не знайдено</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Повернутися
        </Button>
      </div>
    );
  }

  const isOnline = device.last_seen_at 
    ? (new Date().getTime() - new Date(device.last_seen_at).getTime()) < 60000
    : false;

  const getLastSeenText = () => {
    if (!device.last_seen_at) return 'Невідомо';
    const seconds = Math.floor((new Date().getTime() - new Date(device.last_seen_at).getTime()) / 1000);
    if (seconds < 60) return `${seconds} сек тому`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} хв тому`;
    const hours = Math.floor(minutes / 60);
    return `${hours} год тому`;
  };

  const getLightMode = () => {
    if (!settings) return null;
    
    const lightMode = (settings as any).light_mode ?? 1;
    const startH = (settings as any).light_start_h ?? 6;
    const startM = (settings as any).light_start_m ?? 0;
    const endH = (settings as any).light_end_h ?? 22;
    const endM = (settings as any).light_end_m ?? 0;

    const { dayHours, nightHours } = calculatePhotoperiod(startH, endH);
    const isDay = isWithinLightSchedule(startH, startM, endH, endM);

    return {
      isDay,
      dayHours,
      nightHours,
      startTime: formatTime(startH, startM),
      endTime: formatTime(endH, endM),
    };
  };

  const lightMode = getLightMode();
  const targetTemp = (settings as any)?.target_temp ?? null;
  const vpdAnalysis = getVPDAnalysis(device.last_temp, device.last_hum, targetTemp);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Панель керування
            </h1>
            <p className="text-muted-foreground">Моніторинг та керування пристроєм</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center gap-1">
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Offline
              </>
            )}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setQrDialogOpen(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            Показати QR / Перепідключити
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Видалити
          </Button>
        </div>
      </div>

      {/* Plant Header - Active Plant Card */}
      <PlantHeader
        deviceId={id || ''}
        deviceUuid={device.device_id}
        currentSettings={settings}
        onSettingsOptimized={() => window.location.reload()}
      />

      {/* Device Info Card */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
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
                <CardTitle className="text-xl">{device.name}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditedName(device.name);
                    setIsEditingName(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          {device.location && <p className="text-sm text-muted-foreground">{device.location}</p>}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-center space-x-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Температура</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {device.last_temp ? `${device.last_temp.toFixed(1)}°C` : '-- °C'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center space-x-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Вологість</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {device.last_hum ? `${device.last_hum.toFixed(0)}%` : '-- %'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center space-x-2">
                <Sprout className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Ґрунт</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {device.last_soil_moisture !== null && device.last_soil_moisture !== undefined ? `${device.last_soil_moisture.toFixed(0)}%` : '-- %'}
              </span>
            </div>

            <div
              className={`flex flex-col gap-2 p-3 rounded-lg border border-border/30 transition-colors ${
                lightMode?.isDay ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-blue-500/10 border-blue-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {lightMode?.isDay ? (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="text-sm text-muted-foreground">Світло</span>
                </div>
                {lightMode && (
                  <span className="text-lg font-semibold text-foreground flex items-center gap-1">
                    {lightMode.isDay ? '☀️ День' : '🌙 Ніч'}
                  </span>
                )}
              </div>
              {lightMode ? (
                <div className="text-sm text-muted-foreground">
                  День {lightMode.dayHours}год / Ніч {lightMode.nightHours}год
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">--</span>
              )}
            </div>
          </div>

          {/* VPD Analysis Section */}
          <div className={`mt-4 p-4 rounded-lg border ${vpdAnalysis.borderColor} ${vpdAnalysis.bgColor}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wind className={`h-5 w-5 ${vpdAnalysis.color}`} />
                <span className="font-medium text-foreground">VPD (Дефіцит Тиску Пари)</span>
              </div>
              <Badge className={`${vpdAnalysis.bgColor} ${vpdAnalysis.color} border ${vpdAnalysis.borderColor}`}>
                {vpdAnalysis.isOffline ? '-- kPa' : `${vpdAnalysis.vpd?.toFixed(2)} kPa`}
              </Badge>
            </div>
            {!vpdAnalysis.isOffline && vpdAnalysis.advice && (
              <p className={`text-sm ${vpdAnalysis.color}`}>
                💡 AI Tip: {vpdAnalysis.advice}
              </p>
            )}
            {vpdAnalysis.isOffline && (
              <p className="text-sm text-muted-foreground">
                Немає даних з сенсорів
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              Востаннє онлайн: {getLastSeenText()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Device Controls - Clean and focused */}
      <DeviceControls deviceId={device.device_id} />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити пристрій?</AlertDialogTitle>
            <AlertDialogDescription>
              Цю дію неможливо скасувати. Пристрій "{device.name}" буде видалено назавжди разом з усіма даними.
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
              Використовуйте цей QR-код для повторного підключення пристрою до мережі
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center p-6 bg-white rounded-lg">
              <QRCode value={`http://192.168.4.1/?token=${device.device_id}`} size={200} />
            </div>
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                ID пристрою: <span className="font-mono font-semibold">{device.device_id}</span>
              </p>
              <div className="space-y-1">
                <a 
                  href={`http://192.168.4.1/?token=${device.device_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:text-blue-600 underline break-all"
                >
                  http://192.168.4.1/?token={device.device_id}
                </a>
                <p className="text-xs text-muted-foreground">
                  Натисніть на посилання після підключення до Wi-Fi мережі GrowBox-Setup
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Або відскануйте QR-код через додаток або камеру
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