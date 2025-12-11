import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Thermometer, Droplets, Sprout, Sun, Moon, Wifi, WifiOff, 
  Pencil, Check, X, QrCode, Trash2, Wind, Cpu, ChevronDown 
} from 'lucide-react';
import { useDevices } from '@/hooks/useDevices';
import { useDeviceControls } from '@/hooks/useDeviceControls';
import { DeviceControls } from '@/components/DeviceControls';
import { PlantHeader } from '@/components/PlantHeader';
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

  // Empty state - no device selected
  if (!selectedDevice) {
    return (
      <div className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Header with Device Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('dashboard.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
          </div>
          <Select onValueChange={handleDeviceSelect}>
            <SelectTrigger className="w-full sm:w-[280px] min-h-[44px]">
              <SelectValue placeholder={t('devices.selectDevice')} />
            </SelectTrigger>
            <SelectContent>
              {devices.map(device => (
                <SelectItem key={device.id} value={device.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      device.last_seen_at && (Date.now() - new Date(device.last_seen_at).getTime()) < 40000
                        ? 'bg-success' : 'bg-destructive'
                    }`} />
                    {device.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Select Device Prompt */}
        <Card className="gradient-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ChevronDown className="h-12 w-12 text-muted-foreground/50 mb-4 animate-bounce" />
            <h2 className="text-xl font-semibold mb-2">{t('devices.selectDevice')}</h2>
            <p className="text-muted-foreground text-center max-w-md">
              {t('devices.selectDeviceDescription')}
            </p>
          </CardContent>
        </Card>
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
          {/* Device Selector */}
          <Select value={selectedDevice.id} onValueChange={handleDeviceSelect}>
            <SelectTrigger className="w-[200px] sm:w-[280px] min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {devices.map(device => (
                <SelectItem key={device.id} value={device.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      device.last_seen_at && (Date.now() - new Date(device.last_seen_at).getTime()) < 40000
                        ? 'bg-success' : 'bg-destructive'
                    }`} />
                    {device.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

      {/* Plant Header */}
      <PlantHeader
        deviceId={selectedDevice.id}
        deviceUuid={selectedDevice.device_id}
        currentSettings={settings}
        onSettingsOptimized={() => fetchDevices()}
      />

      {/* Device Info Card */}
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
          {/* Sensors Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-center space-x-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Температура</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {selectedDevice.last_temp ? `${selectedDevice.last_temp.toFixed(1)}°C` : '-- °C'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center space-x-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Вологість</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {selectedDevice.last_hum ? `${selectedDevice.last_hum.toFixed(0)}%` : '-- %'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center space-x-2">
                <Sprout className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Ґрунт</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {selectedDevice.last_soil_moisture !== null && selectedDevice.last_soil_moisture !== undefined 
                  ? `${selectedDevice.last_soil_moisture.toFixed(0)}%` : '-- %'}
              </span>
            </div>

            <div className={`flex flex-col gap-1 p-3 rounded-lg border transition-colors ${
              lightMode?.isDay ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {lightMode?.isDay ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-blue-500" />}
                  <span className="text-sm text-muted-foreground">Світло</span>
                </div>
                {lightMode && (
                  <span className="text-lg font-semibold text-foreground">
                    {lightMode.isDay ? '☀️ День' : '🌙 Ніч'}
                  </span>
                )}
              </div>
              {lightMode && (
                <div className="text-xs text-muted-foreground">
                  День {lightMode.dayHours}год / Ніч {lightMode.nightHours}год
                </div>
              )}
            </div>
          </div>

          {/* VPD Analysis */}
          {vpdAnalysis && (
            <div className={`p-4 rounded-lg border ${vpdAnalysis.borderColor} ${vpdAnalysis.bgColor}`}>
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
                <p className={`text-sm ${vpdAnalysis.color}`}>💡 AI Tip: {vpdAnalysis.advice}</p>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              Востаннє онлайн: {getLastSeenText()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Device Controls */}
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
